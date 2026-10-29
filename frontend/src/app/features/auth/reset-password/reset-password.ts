import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="min-h-screen grid place-items-center p-6 auth-bg">
    <div class="w-full max-w-md it-card p-8 it-fade">
      <h1 class="font-display text-2xl font-extrabold mb-1">Réinitialisation</h1>
      <p class="text-on-surface-variant text-sm mb-6">Saisissez le code reçu et votre nouveau mot de passe.</p>

      @if (!done) {
        <label class="it-label">Téléphone</label>
        <input [(ngModel)]="telephone" type="tel" class="it-field mb-3" placeholder="+261 …">
        <label class="it-label">Code reçu</label>
        <input [(ngModel)]="code" maxlength="6" class="it-field mb-3 text-center tracking-[0.4em] font-bold" placeholder="000000">
        <label class="it-label">Nouveau mot de passe</label>
        <input [(ngModel)]="newPassword" type="password" class="it-field mb-3" placeholder="••••••••">
        <label class="it-label">Confirmation</label>
        <input [(ngModel)]="confirm" type="password" class="it-field" placeholder="••••••••">
        @if (error) { <p class="text-error text-sm font-medium mt-3">{{ error }}</p> }
        <button (click)="submit()" [disabled]="loading" class="it-btn-primary w-full mt-5 disabled:opacity-60">{{ loading ? '…' : 'Réinitialiser' }}</button>
      } @else {
        <div class="text-center py-4">
          <span class="material-symbols-outlined text-5xl text-primary mb-2">check_circle</span>
          <p class="text-on-surface-variant">Mot de passe réinitialisé. Redirection…</p>
        </div>
      }
      <p class="text-center text-sm text-on-surface-variant mt-6"><a routerLink="/auth/login" class="text-primary font-bold hover:underline">Retour à la connexion</a></p>
    </div>
  </div>
  `,
})
export class ResetPassword implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  telephone = ''; code = ''; newPassword = ''; confirm = '';
  loading = false; done = false; error = '';

  ngOnInit(): void { this.telephone = this.route.snapshot.queryParamMap.get('telephone') ?? ''; }

  submit(): void {
    this.error = '';
    if (this.newPassword !== this.confirm) { this.error = 'Les mots de passe ne correspondent pas.'; return; }
    if (this.newPassword.length < 8) { this.error = '8 caractères minimum.'; return; }
    this.loading = true;
    this.auth.resetPassword(this.telephone.trim(), this.code, this.newPassword).subscribe({
      next: () => { this.loading = false; this.done = true; setTimeout(() => this.router.navigate(['/auth/login']), 1500); },
      error: (e) => { this.loading = false; this.error = e?.error?.error ?? 'Code invalide ou expiré.'; },
    });
  }
}
