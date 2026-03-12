import { Injectable } from '@angular/core';

/**
 * Mock EgToastService - placeholder until @eg-apps/common is installed.
 * Real service shows toast notifications in a container component.
 */
@Injectable({ providedIn: 'root' })
export class EgToastService {
  createToast(message: string, duration = 3000, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    // In the mock, we just log. Real EG service renders a visual toast.
    console.log(`[EgToast] ${type}: ${message} (${duration}ms)`);
  }
}
