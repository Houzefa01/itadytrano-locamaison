import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
  <div class="min-h-screen grid place-items-center p-6 text-center">
    <div>
      <p class="font-display text-7xl font-extrabold text-primary">404</p>
      <p class="text-on-surface-variant mt-2 mb-6">Cette page n'existe pas (ou plus).</p>
      <a routerLink="/" class="it-btn-primary">Retour à l'accueil</a>
    </div>
  </div>
  `,
})
export class NotFound {}
