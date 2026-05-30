import { Component, ChangeDetectionStrategy, inject, signal, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleDriveService, DriveFile } from '../services/google-drive.service';
import { DriveConfigService } from '../services/drive-config.service';
import { GoogleSheetsService } from '../services/google-sheets.service';
import { WorksheetResult, GroupUser } from '../services/xlsx-processing.service';

@Component({
  selector: 'app-drive-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <details class="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden shadow-sm group mb-2" (toggle)="onToggle($event)">
      <summary class="bg-gray-100 dark:bg-gray-700 px-4 py-3 cursor-pointer select-none list-none text-lg font-bold text-gray-800 dark:text-gray-100 flex justify-between items-center group-open:border-b border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
        <div class="flex items-center gap-3 w-full pr-4">
          @if (isFolder()) {
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          <span class="truncate">{{ file().name }}</span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          @if (isLoading()) {
            <span class="text-sm text-gray-500 dark:text-gray-400">Cargando...</span>
          }
          <span class="transform group-open:rotate-180 transition-transform duration-200 text-gray-500 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
      </summary>
      
      <div class="p-4 bg-gray-50 dark:bg-gray-900">
        @if (error()) {
          <div class="text-red-500 text-sm mb-2">{{ error() }}</div>
        }
        
        @if (isFolder()) {
          @if (!isLoading() && children().length === 0 && hasLoaded()) {
            <p class="text-gray-500 dark:text-gray-400 italic text-sm">Carpeta vacía</p>
          }
          <div class="space-y-2">
            @for (child of children(); track child.id) {
              <app-drive-node [file]="child"></app-drive-node>
            }
          </div>
        } @else {
          <!-- Display spreadsheet results -->
          @if (!isLoading() && results().length === 0 && hasLoaded()) {
            <p class="text-gray-500 dark:text-gray-400 italic text-sm">Sin datos para mostrar</p>
          }
          
          <div class="max-h-[500px] overflow-y-auto space-y-3">
            @for (worksheet of results(); track worksheet.sheetName) {
              <details class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm group/sheet">
                <summary class="bg-white dark:bg-gray-800 px-4 py-3 cursor-pointer select-none list-none text-md font-semibold text-indigo-600 dark:text-indigo-400 flex justify-between items-center group-open/sheet:border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-md group-open/sheet:rounded-b-none">
                  <span class="truncate pr-4">{{ worksheet.sheetName }}</span>
                  <span class="transform group-open/sheet:rotate-180 transition-transform duration-200 text-gray-400 dark:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                
                <div class="p-4">
                  @if (worksheet.groups.length === 0) {
                    <p class="text-gray-500 dark:text-gray-400 italic text-sm">No hay músicos confirmados para esta obra.</p>
                  } @else {
                    <ul class="space-y-2">
                      @for (group of worksheet.groups; track group.instrument) {
                        <li class="text-gray-700 dark:text-gray-300 break-words">
                          <span class="font-bold border-b border-dashed border-gray-300 dark:border-gray-600 pb-0.5">{{ group.users.length }} - {{ group.instrument }}</span> 
                          <span class="text-gray-500 dark:text-gray-400 ml-1 block sm:inline mt-1 sm:mt-0">
                            ({{ formatNames(group.users) }})
                          </span>
                        </li>
                      }
                    </ul>
                  }
                </div>
              </details>
            }
          </div>
        }
      </div>
    </details>
  `
})
export class DriveNodeComponent {
  driveService = inject(GoogleDriveService);
  sheetsService = inject(GoogleSheetsService);

  file = input.required<DriveFile>();
  
  children = signal<DriveFile[]>([]);
  results = signal<WorksheetResult[]>([]);
  
  isLoading = signal(false);
  hasLoaded = signal(false);
  error = signal<string | null>(null);

  isFolder() {
    return this.file().mimeType === 'application/vnd.google-apps.folder';
  }

  onToggle(event: Event) {
    const details = event.target as HTMLDetailsElement;
    if (details.open && !this.hasLoaded()) {
      this.loadData();
    }
  }

  async loadData() {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      if (this.isFolder()) {
        this.driveService.getFolderContents(this.file().id).subscribe({
          next: (files) => {
            this.children.set(files);
            this.isLoading.set(false);
            this.hasLoaded.set(true);
          },
          error: (err) => {
            this.error.set(err.message || 'Error cargando carpeta');
            this.isLoading.set(false);
          }
        });
      } else {
        const worksheetResults = await this.sheetsService.processSpreadsheet(this.file().id);
        this.results.set(worksheetResults);
        this.isLoading.set(false);
        this.hasLoaded.set(true);
      }
    } catch (e: any) {
      this.error.set(e.message || 'Error procesando');
      this.isLoading.set(false);
    }
  }

  formatNames(users: GroupUser[]): string {
    return users.map(user => {
      if (user.nickname) {
        return user.nickname;
      }
      
      const parts = user.name.trim().split(/\s+/);
      if (parts.length === 4) {
        return `${parts[0]} ${parts[1]}`;
      }
      return parts[0] || user.name;
    }).join(', ');
  }
}

@Component({
  selector: 'app-people-that-come-automatic',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DriveNodeComponent],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Asistencia automática</h1>
      
      <!-- We use the signal state from the service to toggle UI -->
      @if (!driveService.accessToken()) {
        <button 
          (click)="driveService.login()" 
          class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors">
          Iniciar sesión con Google
        </button>
      } @else {
        <div class="flex gap-4 mb-6">
          <button 
            (click)="driveService.logout()" 
            class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors">
            Cerrar sesión
          </button>
          <button 
            (click)="fetchContents()" 
            [disabled]="isLoading()"
            class="bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors">
            {{ isLoading() ? 'Cargando...' : 'Actualizar' }}
          </button>
        </div>

        @if (error()) {
          <div class="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
            {{ error() }}
          </div>
        }

        @if (files().length > 0) {
          <div class="space-y-2">
            @for (file of files(); track file.id) {
              <app-drive-node [file]="file"></app-drive-node>
            }
          </div>
        } @else if (hasFetched()) {
          <p class="text-gray-500 dark:text-gray-400 italic">No se encontraron carpetas o archivos de cálculo en este directorio.</p>
        }
      }
    </div>
  `
})
export class PeopleThatComeAutomaticComponent implements OnInit {
  driveService = inject(GoogleDriveService);
  driveConfig = inject(DriveConfigService);
  
  files = signal<DriveFile[]>([]);
  isLoading = signal(false);
  hasFetched = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    if (this.driveConfig.folderId() && this.driveService.accessToken()) {
      this.fetchContents();
    }
  }

  fetchContents() {
    const folderId = this.driveConfig.folderId();
    if (!folderId || !folderId.trim()) {
      this.error.set('Por favor, ingresa el ID de la carpeta principal');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.hasFetched.set(false);
    this.files.set([]);

    this.driveService.getFolderContents(folderId.trim()).subscribe({
      next: (results) => {
        this.files.set(results);
        this.isLoading.set(false);
        this.hasFetched.set(true);
      },
      error: (err) => {
        console.error(err);
        this.error.set(err.message || 'Apareció un error al buscar los archivos.');
        this.isLoading.set(false);
        this.hasFetched.set(true);
      }
    });
  }
}
