import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="min-h-screen grid place-items-center p-6 auth-bg">
    <div class="w-full max-w-md it-card p-8 it-fade">
      <a routerLink="/" class="flex items-center justify-center gap-2.5 mb-6">
        <span class="w-9 h-9 rounded-xl bg-primary text-on-primary grid place-items-center"><span class="material-symbols-outlined">cottage</span></span>
        <span class="font-display text-xl font-extrabold">LocaMaison</span>
      </a>
      <h1 class="font-display text-2xl font-extrabold text-center mb-1">Content de vous revoir</h1>
      <p class="text-center text-on-surface-variant text-sm mb-7">Connectez-vous à votre espace.</p>

      <label class="it-label">Téléphone</label>
      <input [(ngModel)]="telephone" type="tel" class="it-field mb-4" placeholder="+261 …" (keyup.enter)="submit()">

      <div class="flex items-center justify-between">
        <label class="it-label">Mot de passe</label>
        <a routerLink="/auth/forgot-password" class="text-xs font-semibold text-primary hover:underline mb-1.5">Oublié ?</a>
      </div>
      <div class="relative">
        <input [(ngModel)]="password" [type]="showPw ? 'text' : 'password'" class="it-field pr-11" placeholder="••••••••" (keyup.enter)="submit()">
        <button type="button" (click)="showPw=!showPw" class="absolute right-1.5 top-1/2 -translate-y-1/2 it-btn-ghost !p-1.5" [attr.aria-label]="showPw ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
          <span class="material-symbols-outlined text-[18px]">{{ showPw ? 'visibility_off' : 'visibility' }}</span>
        </button>
      </div>

      @if (error) { <p class="text-error text-sm font-medium mt-3">{{ error }}</p> }

      <button (click)="submit()" [disabled]="loading" class="it-btn-primary w-full mt-5 disabled:opacity-60">
        {{ loading ? 'Connexion…' : 'Se connecter' }}
      </button>

      <p class="text-center text-sm text-on-surface-variant mt-6">
        Pas encore de compte ? <a routerLink="/auth/register" class="text-primary font-bold hover:underline">Créer un compte</a>
      </p>
    </div>
  </div>
  `,
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  telephone = '';
  password = '';
  loading = false;
  error = '';
  showPw = false;

  submit(): void {
    if (!this.telephone || !this.password) { this.error = 'Renseignez votre téléphone et votre mot de passe.'; return; }
    this.loading = true; this.error = '';
    this.auth.login({ telephone: this.telephone.trim(), password: this.password }).subscribe({
      next: () => { this.loading = false; this.router.navigate([this.dash()]); },
      error: (e) => {
        this.loading = false;
        this.error = e?.status === 401 || e?.status === 403
          ? 'Téléphone ou mot de passe incorrect — ou compte non activé.'
          : 'Connexion impossible pour le moment.';
      },
    });
  }

  private dash(): string {
    if (this.auth.isProprietaire()) return '/proprietaire';
    if (this.auth.isAdmin()) return '/admin';
    return '/etudiant';
  }
}
