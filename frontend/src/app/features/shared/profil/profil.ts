import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="max-w-xl">
    <h1 class="font-display text-2xl font-extrabold mb-6">Mon profil</h1>
    <div class="it-card p-6">
      <div class="flex items-center gap-4 mb-6">
        <span class="w-16 h-16 rounded-full bg-primary-container text-on-primary-container grid place-items-center font-bold text-xl">{{ initials() }}</span>
        <div>
          <p class="font-bold text-lg">{{ auth.currentUser()?.prenom }} {{ auth.currentUser()?.nom }}</p>
          <p class="it-badge bg-surface-container text-on-surface-variant">{{ auth.currentUser()?.role }}</p>
        </div>
      </div>

      <label class="it-label" for="pf-email">Email</label>
      <input id="pf-email" [value]="auth.currentUser()?.email" disabled class="it-field mb-4 opacity-70">
      <div class="grid grid-cols-2 gap-3">
        <div><label class="it-label" for="pf-prenom">Prénom</label><input id="pf-prenom" [(ngModel)]="form.prenom" class="it-field"></div>
        <div><label class="it-label" for="pf-nom">Nom</label><input id="pf-nom" [(ngModel)]="form.nom" class="it-field"></div>
      </div>
      <div class="flex items-center gap-3 mt-5">
        <button (click)="save()" [disabled]="saving" class="it-btn-primary disabled:opacity-60">{{ saving ? '…' : 'Enregistrer' }}</button>
        @if (saved) { <span class="text-primary text-sm flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">check_circle</span> Enregistré</span> }
      </div>
    </div>

    <!-- Numéro de téléphone : changement protégé par vérification SMS -->
    <div class="it-card p-6 mt-6">
      <h2 class="font-bold mb-1">Numéro de téléphone</h2>
      <p class="text-sm text-on-surface-variant mb-4">Le numéro sert à vous connecter. Tout changement doit être confirmé par un code reçu par SMS sur le nouveau numéro.</p>

      @if (!phoneEditing) {
        <div class="flex items-center gap-3">
          <input [value]="auth.currentUser()?.telephone" disabled class="it-field opacity-70 flex-1">
          <button (click)="startPhoneChange()" class="it-btn-outline whitespace-nowrap"><span class="material-symbols-outlined">edit</span> Modifier</button>
        </div>
      } @else if (!codeSent) {
        <label class="it-label" for="pf-newtel">Nouveau numéro</label>
        <input id="pf-newtel" [(ngModel)]="newPhone" placeholder="ex. 032 00 000 00" class="it-field mb-3">
        <div class="flex items-center gap-3">
          <button (click)="sendCode()" [disabled]="phoneBusy" class="it-btn-primary disabled:opacity-60">{{ phoneBusy ? '…' : 'Envoyer le code par SMS' }}</button>
          <button (click)="cancelPhoneChange()" class="it-btn-ghost">Annuler</button>
        </div>
      } @else {
        <p class="text-sm mb-3 flex items-center gap-1"><span class="material-symbols-outlined text-[18px] text-primary">sms</span> Code envoyé au <b>{{ newPhone }}</b>.</p>
        <label class="it-label" for="pf-code">Code de vérification</label>
        <input id="pf-code" [(ngModel)]="phoneCode" inputmode="numeric" placeholder="Code reçu par SMS" class="it-field mb-3">
        <div class="flex items-center gap-3">
          <button (click)="confirmCode()" [disabled]="phoneBusy" class="it-btn-primary disabled:opacity-60">{{ phoneBusy ? '…' : 'Confirmer le nouveau numéro' }}</button>
          <button (click)="sendCode()" [disabled]="phoneBusy" class="it-btn-ghost">Renvoyer</button>
          <button (click)="cancelPhoneChange()" class="it-btn-ghost">Annuler</button>
        </div>
      }
    </div>

    <!-- Zone de danger (RGPD) -->
    <div class="it-card p-6 mt-6 border border-error/30">
      <h2 class="font-bold text-error mb-1">Supprimer mon compte</h2>
      <p class="text-sm text-on-surface-variant mb-4">Vos données personnelles seront anonymisées et votre compte désactivé. Cette action est définitive.</p>
      <button (click)="supprimerCompte()" [disabled]="deleting" class="it-btn-outline text-error disabled:opacity-60">
        <span class="material-symbols-outlined">delete_forever</span> {{ deleting ? '…' : 'Supprimer définitivement mon compte' }}
      </button>
    </div>
  </div>
  `,
})
export class Profil {
  auth = inject(AuthService);
  private userSvc = inject(UserService);
  private toast = inject(ToastService);
  private dialog = inject(DialogService);
  private router = inject(Router);
  form = { nom: '', prenom: '' };
  saving = false; saved = false; deleting = false;

  // Changement de numéro (vérifié par SMS)
  phoneEditing = false; codeSent = false; phoneBusy = false;
  newPhone = ''; phoneCode = '';

  constructor() {
    const u = this.auth.currentUser();
    if (u) this.form = { nom: u.nom, prenom: u.prenom };
  }

  startPhoneChange(): void {
    this.phoneEditing = true; this.codeSent = false;
    this.newPhone = ''; this.phoneCode = '';
  }
  cancelPhoneChange(): void {
    this.phoneEditing = false; this.codeSent = false;
    this.newPhone = ''; this.phoneCode = '';
  }
  sendCode(): void {
    const tel = this.newPhone.trim();
    if (!tel) { this.toast.error('Entrez un numéro.'); return; }
    this.phoneBusy = true;
    this.auth.requestTelephoneChange(tel).subscribe({
      next: () => { this.phoneBusy = false; this.codeSent = true; this.toast.success('Code envoyé par SMS au nouveau numéro.'); },
      error: (e) => { this.phoneBusy = false; this.toast.error(e?.error?.error ?? 'Envoi impossible.'); },
    });
  }
  confirmCode(): void {
    const tel = this.newPhone.trim();
    const code = this.phoneCode.trim();
    if (!code) { this.toast.error('Entrez le code reçu.'); return; }
    this.phoneBusy = true;
    this.auth.confirmTelephoneChange(tel, code).subscribe({
      next: () => { this.phoneBusy = false; this.cancelPhoneChange(); this.toast.success('Numéro mis à jour.'); },
      error: (e) => { this.phoneBusy = false; this.toast.error(e?.error?.error ?? 'Code invalide ou expiré.'); },
    });
  }

  initials(): string {
    const u = this.auth.currentUser();
    return u ? `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase() : '';
  }

  save(): void {
    const u = this.auth.currentUser();
    if (!u) return;
    this.saving = true; this.saved = false;
    this.userSvc.updateUser(u.id, this.form).subscribe({
      next: () => { this.saving = false; this.saved = true; this.toast.success('Profil enregistré.'); },
      error: () => { this.saving = false; this.toast.error('Enregistrement impossible.'); },
    });
  }

  async supprimerCompte(): Promise<void> {
    const ok = await this.dialog.confirm('Supprimer votre compte ?',
      'Vos données personnelles seront anonymisées et vous serez déconnecté. Cette action est définitive.',
      { confirmLabel: 'Supprimer mon compte', danger: true });
    if (!ok) return;
    this.deleting = true;
    this.userSvc.deleteOwnAccount().subscribe({
      next: () => { this.deleting = false; this.toast.success('Compte supprimé.'); this.auth.logout(); this.router.navigate(['/']); },
      error: () => { this.deleting = false; this.toast.error('Suppression impossible.'); },
    });
  }
}
