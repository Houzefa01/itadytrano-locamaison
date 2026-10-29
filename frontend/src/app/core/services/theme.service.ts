import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private key = 'it-theme';
  readonly dark = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem(this.key);
      const prefers = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
      this.apply(saved ? saved === 'dark' : prefers);
    }
  }

  toggle(): void { this.apply(!this.dark()); }

  private apply(d: boolean): void {
    this.dark.set(d);
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.classList.toggle('dark', d);
      localStorage.setItem(this.key, d ? 'dark' : 'light');
    }
  }
}
