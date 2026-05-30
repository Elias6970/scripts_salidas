import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { XlsxProcessingService, WorksheetResult, GroupUser } from '../services/xlsx-processing.service';

interface FileResult {
  fileName: string;
  results: WorksheetResult[];
}

@Component({
  selector: 'app-people-that-come-manual',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Asistencia manual</h1>
      
      <div class="mb-6">
        <label for="excel-upload" class="sr-only">Sube tus archivos Excel</label>
        <button 
          type="button"
          (click)="fileInput.click()"
          class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
        >
          Subir Archivos XLSX
        </button>
        <input 
          #fileInput
          id="excel-upload"
          type="file" 
          multiple 
          accept=".xlsx, .xls"
          (change)="onFilesSelected($event)"
          class="hidden"
        >
      </div>

      @if (files().length > 0) {
        <div class="mb-6">
          <ul class="space-y-2">
            @for (file of files(); track file.name; let i = $index) {
              <li class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded shadow-sm border border-gray-200 dark:border-gray-700">
                <span class="text-gray-800 dark:text-gray-200 truncate pr-4">{{ file.name }}</span>
                <button 
                  (click)="removeFile(i)" 
                  class="text-gray-400 hover:text-red-500 focus:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1"
                  aria-label="Eliminar archivo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </li>
            }
          </ul>
        </div>

        <button 
          (click)="processFiles()"
          [disabled]="isProcessing()"
          class="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 mb-8 transition-colors"
        >
          {{ isProcessing() ? 'Procesando...' : 'Revisar Asistencia' }}
        </button>
      }

      @if (processingResults().length > 0) {
        <div class="space-y-4">
          @for (fileResult of processingResults(); track fileResult.fileName) {
            <details class="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden shadow-sm group">
              <summary class="bg-gray-100 dark:bg-gray-700 px-4 py-3 cursor-pointer select-none list-none text-lg font-bold text-gray-800 dark:text-gray-100 flex justify-between items-center group-open:border-b border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <span class="truncate pr-4">{{ fileResult.fileName }}</span>
                <span class="transform group-open:rotate-180 transition-transform duration-200 text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              
              <div class="p-4 max-h-[500px] overflow-y-auto space-y-3 bg-gray-50 dark:bg-gray-900">
                @for (worksheet of fileResult.results; track worksheet.sheetName) {
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
            </details>
          }
        </div>
      }
    </div>
  `
})
export class PeopleThatComeManualComponent {
  private processingService = inject(XlsxProcessingService);

  readonly files = signal<File[]>([]);
  readonly processingResults = signal<FileResult[]>([]);
  readonly isProcessing = signal<boolean>(false);

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const newFiles = Array.from(input.files);
      const currentFiles = this.files();
      
      const uniqueNewFiles = newFiles.filter(newFile => 
        !currentFiles.some(existing => existing.name === newFile.name && existing.size === newFile.size)
      );

      this.files.update(f => [...f, ...uniqueNewFiles]);
      input.value = ''; 
    }
  }

  removeFile(index: number): void {
    this.files.update(f => f.filter((_, i) => i !== index));
    this.processingResults.update(r => r.filter((_, i) => i !== index));
  }

  async processFiles(): Promise<void> {
    const currentFiles = this.files();
    if (currentFiles.length === 0) return;

    this.isProcessing.set(true);
    
    try {
      const results: FileResult[] = [];
      for (const file of currentFiles) {
        const fileResults = await this.processingService.processFile(file);
        results.push({
          fileName: file.name,
          results: fileResults
        });
      }
      this.processingResults.set(results);
    } catch (error) {
      console.error('Error procesando archivos:', error);
    } finally {
      this.isProcessing.set(false);
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