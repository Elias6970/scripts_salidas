import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

// Declare the Google Identity Services global object
declare const google: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleDriveService {
  private http = inject(HttpClient);
  
  // We use an Angular Signal to hold the token so the UI can reactively update when logged in
  accessToken = signal<string | null>(null);

  // You must create an OAuth 2.0 Client ID for "Web Application" in Google Cloud Console
  private readonly CLIENT_ID = '174624084816-p68u7eunj7aqinetl87pfhum2872r1ti.apps.googleusercontent.com';
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/spreadsheets.readonly'
  ];

  private tokenClient: any;

  constructor() {
    this.loadTokenFromStorage();
    this.loadGoogleIdentityServices();
  }

  private loadTokenFromStorage(): void {
    const token = localStorage.getItem('google_access_token');
    const expiry = localStorage.getItem('google_access_token_expiry');
    
    if (token) {
      if (expiry && new Date().getTime() > parseInt(expiry, 10)) {
        // Token expired
        this.clearTokenStorage();
      } else {
        this.accessToken.set(token);
      }
    }
  }

  private clearTokenStorage(): void {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_access_token_expiry');
  }

  /**
   * Dynamically loads the official Google Identity Services library.
   */
  private loadGoogleIdentityServices(): void {
    if (document.getElementById('google-gsi-script')) return;

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.CLIENT_ID,
        scope: this.SCOPES.join(' '), // Scopes require a space-delimited string
        callback: (tokenResponse: any) => {
          if (tokenResponse.error !== undefined) {
            console.error('Google Auth Error:', tokenResponse);
            throw tokenResponse;
          }
          // Save the token on successful authentication
          this.accessToken.set(tokenResponse.access_token);
          localStorage.setItem('google_access_token', tokenResponse.access_token);
          if (tokenResponse.expires_in) {
            // Calculate expiry time in milliseconds
            const expiry = new Date().getTime() + (tokenResponse.expires_in * 1000);
            localStorage.setItem('google_access_token_expiry', expiry.toString());
          }
        },
      });
    };
    document.body.appendChild(script);
  }

  /**
   * Triggers the Google popup to ask the user for Drive API permissions.
   */
  login(): void {
    if (!this.tokenClient) {
      console.error('Google Identity Services script is not loaded yet.');
      return;
    }
    // Requests the access token using the Implicit Flow
    this.tokenClient.requestAccessToken();
  }

  /**
   * Revokes the token and clears the local signal state.
   */
  logout(): void {
    const token = this.accessToken();
    if (token) {
      google.accounts.oauth2.revoke(token, () => {
        this.accessToken.set(null);
        this.clearTokenStorage();
      });
    } else {
      this.accessToken.set(null);
      this.clearTokenStorage();
    }
  }

  /**
   * Retrieves all Google Sheets and Directories inside a specific folder ID
   * @param folderId The ID extracted from the Google Drive URL
   */
  getFolderContents(folderId: string): Observable<DriveFile[]> {
    const token = this.accessToken();
    if (!token) {
      throw new Error('Not authenticated with Google. Please call check GoogleDriveService.accessToken() or call login().');
    }

    const url = 'https://www.googleapis.com/drive/v3/files';
    
    // Narrow down the search to just the parent folder, and specific mime types (folders + spreadsheets)
    const query = `'${folderId}' in parents and trashed=false and (mimeType='application/vnd.google-apps.folder' or mimeType='application/vnd.google-apps.spreadsheet')`;
    
    const params = new HttpParams()
      .set('q', query)
      .set('orderBy', 'name')
      .set('fields', 'files(id, name, mimeType)'); // Only request the fields we need

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}` // Use the OAuth 2.0 token!
    });

    return this.http.get<{files: DriveFile[]}>(url, { params, headers }).pipe(
      map(response => response.files || [])
    );
  }
}
