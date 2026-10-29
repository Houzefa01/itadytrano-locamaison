import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="min-h-screen grid place-items-center p-6 auth-bg">
    <div class="w-full max-w-md it-card p-8 it-fade">
      <h1 class="font-display text-2xl font-extrabold mb-1">Mot de passe oublié</h1>
      <p class="text-on-surface-variant text-sm mb-6">On vous envoie un code de réinitialisation par SMS.</p>

      @if (!sent) {
        <label class="it-label">Téléphone</label>
        <input [(ngModel)]="telephone" type="tel" class="it-field mb-5" placeholder="+261 …" (keyup.enter)="submit()">
        <button (click)="submit()" [disabled]="loading || !telephone" class="it-btn-primary w-full disabled:opacity-60">
          {{ loading ? 'Envoi…' : 'Envoyer le code' }}
        </button>
      } @else {
        <div class="text-center py-3">
          <span class="material-symbols-outlined text-5xl text-primary mb-2">sms</span>
          <p class="text-on-surface-variant mb-6">Si un compte existe pour ce numéro, un code a été envoyé par SMS.</p>
          <a [routerLink]="['/auth/reset-password']" [queryParams]="{ telephone }" class="it-btn-primary w-full">J'ai reçu le code</a>
        </div>
      }
      <p class="text-center text-sm text-on-surface-variant mt-6"><a routerLink="/auth/login" class="text-primary font-bold hover:underline">Retour à la connexion</a></p>
    </div>
  </div>
  `,
})
export class ForgotPassword {
  private auth = inject(AuthService);
  telephone = '';
  loading = false;
  sent = false;

  submit(): void {
    if (!this.telephone) return;
    this.loading = true;
    this.auth.forgotPassword(this.telephone.trim()).subscribe({
      next: () => { this.loading = false; this.sent = true; },
      error: () => { this.loading = false; this.sent = true; },
    });
  }
}
