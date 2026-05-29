import { Injectable, inject } from '@angular/core';
import * as XLSX from 'xlsx';
import { UserConfigService } from './user-config.service';
import { InstrumentSortService } from './instrument-sort.service';

export interface GroupUser {
  name: string;
  nickname?: string;
}

export interface InstrumentGroup {
  instrument: string;
  users: GroupUser[];
}

export interface WorksheetResult {
  sheetName: string;
  groups: InstrumentGroup[];
}

@Injectable({
  providedIn: 'root'
})
export class XlsxProcessingService {
  private userConfigService = inject(UserConfigService);
  private instrumentSortService = inject(InstrumentSortService);

  /**
   * Processes the entire XLSX file and returns a grouped list by instrument for each worksheet.
   */
  async processFile(file: File | Blob): Promise<WorksheetResult[]> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    const result: WorksheetResult[] = [];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      
      // Using a Map to group users by instrument, and another map per instrument to prevent duplicates by name
      const instrumentMap = new Map<string, Map<string, GroupUser>>();
      
      this.processWorksheet(worksheet, instrumentMap);
      
      if (instrumentMap.size === 0) {
        continue; // Skip sheets that have no valid data
      }
      
      // Convert the Map into the desired array format
      const groups: InstrumentGroup[] = [];
      for (const [instrument, userMap] of instrumentMap.entries()) {
        groups.push({
          instrument,
          users: Array.from(userMap.values())
        });
      }
      const sortedGroups = this.instrumentSortService.sortGroups(groups);
      result.push({ sheetName, groups: sortedGroups });
    }

    return result;
  }

  /**
   * Processes an individual worksheet row by row.
   */
  private processWorksheet(worksheet: XLSX.WorkSheet, instrumentMap: Map<string, Map<string, GroupUser>>): void {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });
    
    // Get the current list of users from the UserConfigService signal
    const users = this.userConfigService.users();

    for (const row of rows) {
      if (!Array.isArray(row) || row.length < 2) continue;

      const firstCol = String(row[0] || '').trim().toUpperCase();
      const secondCol = String(row[1] || '').trim();

      // Check if the first column is "SI"
      if (firstCol === 'SI') {
        // Search the second column in users.name (case-insensitive for better matching)
        const matchingUser = users.find(
          u => u.name.toLowerCase() === secondCol.toLowerCase()
        );
        
        if (matchingUser) {
          const instrument = matchingUser.instrument;
          
          if (!instrumentMap.has(instrument)) {
            instrumentMap.set(instrument, new Map<string, GroupUser>());
          }
          
          instrumentMap.get(instrument)!.set(matchingUser.name, {
            name: matchingUser.name,
            nickname: matchingUser.nickname
          });
        }
      }
    }
  }
}
