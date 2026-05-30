import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DriveConfigService {
  private readonly STORAGE_KEY = 'drive_folder_id';

  // State to hold the folder ID reactively
  readonly folderId = signal<string>('');

  constructor() {
    this.loadFolderId();
  }

  /**
   * Load the folder ID from local storage and update the signal.
   */
  private loadFolderId(): void {
    const savedId = localStorage.getItem(this.STORAGE_KEY);
    if (savedId) {
      this.folderId.set(savedId);
    }
  }

  /**
   * Save a new folder ID to local storage and update the signal.
   * @param id The new Google Drive folder ID
   */
  saveFolderId(id: string): void {
    const trimmedId = id.trim();
    localStorage.setItem(this.STORAGE_KEY, trimmedId);
    this.folderId.set(trimmedId);
  }

  /**
   * Clear the folder ID from local storage and signal.
   */
  clearFolderId(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.folderId.set('');
  }
}
