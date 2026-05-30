import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { UserConfigService } from './services/user-config.service';
import { DriveConfigService } from './services/drive-config.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private userConfigService = inject(UserConfigService);
  protected driveConfigService = inject(DriveConfigService);

  protected readonly title = signal('Scripts para salidas');
  protected readonly isConfigLoading = signal(false);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly isDriveModalOpen = signal(false);
  protected readonly tempFolderId = signal('');

  private successTimeout: ReturnType<typeof setTimeout> | null = null;

  async onConfigSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      this.isConfigLoading.set(true);
      try {
        await this.userConfigService.loadConfig(file);
        this.showSuccessMessage();
      } catch (e) {
        console.error('Error loading config file:', e);
      } finally {
        this.isConfigLoading.set(false);
        input.value = ''; // Reset input so the same file could be selected again if needed
      }
    }
  }

  private showSuccessMessage(): void {
    this.successMessage.set('Los usuarios se han guardado correctamente.');
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
    this.successTimeout = setTimeout(() => {
      this.successMessage.set(null);
    }, 5000);
  }

  openDriveModal(): void {
    // Populate the temporary signal with the existing saved ID
    this.tempFolderId.set(this.driveConfigService.folderId());
    this.isDriveModalOpen.set(true);
  }

  closeDriveModal(): void {
    this.isDriveModalOpen.set(false);
  }

  saveDriveFolderId(): void {
    this.driveConfigService.saveFolderId(this.tempFolderId());
    this.closeDriveModal();
  }
}
