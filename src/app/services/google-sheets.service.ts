import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, switchMap, firstValueFrom, of } from 'rxjs';
import { GoogleDriveService } from './google-drive.service';
import { WorksheetResult, GroupUser, InstrumentGroup } from './xlsx-processing.service';
import { UserConfigService } from './user-config.service';
import { InstrumentSortService } from './instrument-sort.service';

@Injectable({
  providedIn: 'root'
})
export class GoogleSheetsService {
  private http = inject(HttpClient);
  private googleDriveService = inject(GoogleDriveService);
  private userConfigService = inject(UserConfigService);
  private instrumentSortService = inject(InstrumentSortService);

  /**
   * Retrieves the content of a specific cell (defaults to A1) from a spreadsheet.
   * 
   * @param spreadsheetId The ID of the spreadsheet (extracted from the URL)
   * @param range The range to retrieve, defaults to 'A1'. You can pass 'SheetName!A1' for specific sheets.
   */
  getCellContent(spreadsheetId: string, range: string = 'A1'): Observable<string | null> {
    const token = this.googleDriveService.accessToken();
    if (!token) {
      throw new Error('Not authenticated with Google. Please log in first.');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(url, { headers }).pipe(
      map(response => {
        // response.values is an array of arrays representing rows and columns
        if (response.values && response.values.length > 0 && response.values[0].length > 0) {
          return response.values[0][0]; 
        }
        return null; // Empty cell or no content found
      })
    );
  }

  /**
   * Processes an entire Google Spreadsheet and returns a grouped list by instrument for each sheet.
   */
  async processSpreadsheet(spreadsheetId: string): Promise<WorksheetResult[]> {
    const token = this.googleDriveService.accessToken();
    if (!token) {
      throw new Error('Not authenticated with Google. Please log in first.');
    }

    const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // 1. Get spreadsheet metadata to retrieve all sheet names
    const metadata$ = this.http.get<any>(metadataUrl, { headers }).pipe(
      switchMap(metadata => {
        const sheets = metadata.sheets || [];
        const ranges = sheets.map((sheet: any) => sheet.properties.title);
        
        if (ranges.length === 0) {
          return of([]);
        }

        // 2. Fetch value ranges for all sheets using batchGet
        const rangesQuery = ranges.map((r: string) => `ranges=${encodeURIComponent(r)}`).join('&');
        const batchGetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangesQuery}`;

        return this.http.get<any>(batchGetUrl, { headers }).pipe(
          map(batchResponse => {
            const valueRanges = batchResponse.valueRanges || [];
            const result: WorksheetResult[] = [];

            for (let i = 0; i < valueRanges.length; i++) {
              const rangeData = valueRanges[i];
              // Extract the sheet name from the response range, which is typically "SheetName!..."
              const sheetName = ranges[i]; // Matching the requested ranges
              
              const rows = rangeData.values || [];
              const instrumentMap = new Map<string, Map<string, GroupUser>>();

              this.processRows(rows, instrumentMap);

              if (instrumentMap.size === 0) {
                continue;
              }

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
          })
        );
      })
    );

    return firstValueFrom(metadata$);
  }


  /**
   * Processes a 2D array of rows.
   */
  private processRows(rows: unknown[][], instrumentMap: Map<string, Map<string, GroupUser>>): void {
    const users = this.userConfigService.users();

    for (const row of rows) {
      if (!Array.isArray(row) || row.length < 2) continue;

      const firstCol = String(row[0] || '').trim().toUpperCase();
      const secondCol = String(row[1] || '').trim();

      if (firstCol === 'SI') {
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
