import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserConfigService } from './services/user-config.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private userConfigService = inject(UserConfigService);

  protected readonly title = signal('Scripts para salidas');
  protected readonly isConfigLoading = signal(false);
  protected readonly successMessage = signal<string | null>(null);

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
}
