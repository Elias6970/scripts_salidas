import { Injectable, signal } from '@angular/core';
import * as XLSX from 'xlsx';

export interface UserConfig {
  name: string;
  instrument: string;
  nickname?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserConfigService {
  // Signal to store the configuration in memory
  readonly users = signal<UserConfig[]>([]);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const savedConfig = localStorage.getItem('user-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig) as UserConfig[];
        this.users.set(parsed);
      } catch (e) {
        console.error('Failed to parse saved user config', e);
      }
    }
  }

  private saveToStorage(users: UserConfig[]): void {
    localStorage.setItem('user-config', JSON.stringify(users));
  }

  /**
   * Reads an XLSX file (e.g. from an <input type="file"> or a fetched Blob)
   * and parses it to save the users' configuration in memory.
   */
  async loadConfig(file: File | Blob): Promise<void> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    if (workbook.SheetNames.length === 0) {
      console.warn('The uploaded XLSX file contains no sheets.');
      return;
    }
    
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Read the sheet as an array of arrays to handle files with missing headers
    const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });
    
    if (rows.length === 0) {
      this.users.set([]);
      return;
    }

    // Determine if the first row is a header
    const firstRow = rows[0] || [];
    const firstRowStrings = Array.isArray(firstRow) 
      ? firstRow.map(c => String(c || '').toLowerCase().trim())
      : [];
    
    const nameAliases = ['name', 'nombre'];
    const instrumentAliases = ['instrument', 'instrumento'];
    const nicknameAliases = ['nickname', 'apodo', 'mote'];

    const foundNameIdx = firstRowStrings.findIndex(c => nameAliases.includes(c));
    const foundInstIdx = firstRowStrings.findIndex(c => instrumentAliases.includes(c));
    const foundNickIdx = firstRowStrings.findIndex(c => nicknameAliases.includes(c));

    let startIndex = 0;
    let nameIdx = 1;
    let instrumentIdx = 0;
    let nicknameIdx = 2; // Default to 3rd column

    // If we detected at least one header, use those indices
    if (foundNameIdx !== -1 || foundInstIdx !== -1 || foundNickIdx !== -1) {
      startIndex = 1; // Skip header row
      nameIdx = foundNameIdx !== -1 ? foundNameIdx : 0;
      instrumentIdx = foundInstIdx !== -1 ? foundInstIdx : 1;
      nicknameIdx = foundNickIdx !== -1 ? foundNickIdx : 2;
    } else {
      // No header detected. Using the first column as the instrument, second as name.
      instrumentIdx = 0;
      nameIdx = 1;
      nicknameIdx = 2;
    }

    const parsedUsers: UserConfig[] = [];
    
    // Map and normalize the rows to our UserConfig interface
    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i];
      if (!Array.isArray(row) || row.length === 0) continue;
      
      const name = String(row[nameIdx] || '').trim();
      const instrument = String(row[instrumentIdx] || '').trim();
      const nicknameStr = String(row[nicknameIdx] || '').trim();
      const nickname = nicknameStr ? nicknameStr : undefined;
      
      if (name || instrument) {
        parsedUsers.push({ name, instrument, nickname });
      }
    }

    // Update the signal with the loaded data
    this.users.set(parsedUsers);
    
    // Save permanently to local storage
    this.saveToStorage(parsedUsers);
  }
}
