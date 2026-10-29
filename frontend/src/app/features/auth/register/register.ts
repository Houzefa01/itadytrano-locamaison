import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { EtablissementService, Etablissement } from '../../../core/services/etablissement.service';
import { ToastService } from '../../../core/services/toast.service';
import { RegisterRequest, UserRole } from '../../../core/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="min-h-screen grid place-items-center p-6 auth-bg">
    <div class="w-full max-w-lg it-card p-8 it-fade">
      <a routerLink="/" class="flex items-center justify-center gap-2.5 mb-5">
        <span class="w-9 h-9 rounded-xl bg-primary text-on-primary grid place-items-center"><span class="material-symbols-outlined">cottage</span></span>
        <span class="font-display text-xl font-extrabold">LocaMaison</span>
      </a>

      @if (step === 'form') {
        <h1 class="font-display text-2xl font-extrabold text-center mb-1">Créer un compte</h1>
        <p class="text-center text-on-surface-variant text-sm mb-6">Rejoignez la plateforme.</p>

        <div class="grid grid-cols-2 gap-2 p-1 bg-surface-container rounded-xl mb-6" role="tablist">
          <button (click)="role='student'" [class]="tab('student')" role="tab" [attr.aria-selected]="role==='student'">Étudiant</button>
          <button (click)="role='landlord'" [class]="tab('landlord')" role="tab" [attr.aria-selected]="role==='landlord'">Propriétaire</button>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="it-label" for="r-prenom">Prénom</label>
            <input id="r-prenom" [(ngModel)]="data.prenom" class="it-field" [class.!border-error]="invalid('prenom')">
            @if (invalid('prenom')) { <p class="text-error text-xs mt-1">Prénom requis.</p> }
          </div>
          <div>
            <label class="it-label" for="r-nom">Nom</label>
            <input id="r-nom" [(ngModel)]="data.nom" class="it-field" [class.!border-error]="invalid('nom')">
            @if (invalid('nom')) { <p class="text-error text-xs mt-1">Nom requis.</p> }
          </div>
        </div>

        <label class="it-label mt-3" for="r-tel">Téléphone</label>
        <input id="r-tel" [(ngModel)]="data.telephone" type="tel" class="it-field" [class.!border-error]="invalid('telephone')" placeholder="+261 …">
        @if (invalid('telephone')) { <p class="text-error text-xs mt-1">Numéro de téléphone requis.</p> }

        <label class="it-label mt-3" for="r-email">Email (facultatif)</label>
        <input id="r-email" [(ngModel)]="data.email" type="email" class="it-field" [class.!border-error]="invalid('email')" placeholder="vous@email.com">
        @if (invalid('email')) { <p class="text-error text-xs mt-1">Adresse email invalide.</p> }

        @if (role === 'student') {
          <label class="it-label mt-3" for="r-ecole">École / université</label>
          <select id="r-ecole" [(ngModel)]="data.ecoleId" class="it-field">
            <option [ngValue]="null">— Sélectionnez —</option>
            @for (e of etabs; track e.id) { <option [ngValue]="e.id">{{ e.nom }}</option> }
          </select>
        } @else {
          <label class="it-label mt-3" for="r-adr">Adresse</label>
          <input id="r-adr" [(ngModel)]="data.adresse" class="it-field" placeholder="Votre adresse">

          <label class="it-label mt-3" for="r-pay">Moyen de réception de paiement</label>
          <select id="r-pay" [(ngModel)]="payType" class="it-field">
            <option value="">Choisir…</option>
            <option value="MOBILE_MONEY">Mobile Money (Mvola / Airtel)</option>
            <option value="ORANGE_MONEY">Orange Money</option>
            <option value="VIREMENT">Virement bancaire</option>
            <option value="ESPECES">Espèces</option>
          </select>
          <!-- Information complémentaire selon le moyen choisi -->
          @if (payType === 'MOBILE_MONEY' || payType === 'ORANGE_MONEY') {
            <label class="it-label mt-3" for="r-payinfo">Numéro du compte {{ payType === 'ORANGE_MONEY' ? 'Orange Money' : 'Mobile Money' }}</label>
            <input id="r-payinfo" [(ngModel)]="payInfo" type="tel" class="it-field" placeholder="ex. 0341234567">
          } @else if (payType === 'VIREMENT') {
            <label class="it-label mt-3" for="r-payinfo">RIB / numéro de compte bancaire</label>
            <input id="r-payinfo" [(ngModel)]="payInfo" class="it-field" placeholder="ex. MG46 00005 …">
          } @else if (payType === 'ESPECES') {
            <p class="text-xs text-on-surface-variant mt-2">Paiement en espèces, en main propre. Aucune information supplémentaire requise.</p>
          }
        }

        <div class="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label class="it-label" for="r-pw">Mot de passe</label>
            <div class="relative">
              <input id="r-pw" [(ngModel)]="data.password" [type]="showPw ? 'text' : 'password'" class="it-field pr-11" [class.!border-error]="invalid('password')" placeholder="••••••••">
              <button type="button" (click)="showPw=!showPw" class="absolute right-1.5 top-1/2 -translate-y-1/2 it-btn-ghost !p-1.5" [attr.aria-label]="showPw ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
                <span class="material-symbols-outlined text-[18px]">{{ showPw ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
          </div>
          <div>
            <label class="it-label" for="r-cf">Confirmation</label>
            <input id="r-cf" [(ngModel)]="data.confirm" [type]="showPw ? 'text' : 'password'" class="it-field" [class.!border-error]="invalid('confirm')" placeholder="••••••••">
          </div>
        </div>

        @if (data.password) {
          <div class="mt-2">
            <div class="flex gap-1" aria-hidden="true">
              @for (i of [0,1,2,3]; track i) {
                <span class="h-1.5 flex-1 rounded-full transition-colors" [ngClass]="i < pwScore() ? pwColor() : 'bg-surface-container'"></span>
              }
            </div>
            <p class="text-[11px] mt-1 font-semibold" [ngClass]="pwTextColor()">Sécurité : {{ pwLabel() }}</p>
          </div>
        }
        @if (invalid('password')) { <p class="text-error text-xs mt-1">8 caractères minimum.</p> }
        @if (invalid('confirm')) { <p class="text-error text-xs mt-1">Les mots de passe ne correspondent pas.</p> }

        @if (error) { <p class="text-error text-sm font-medium mt-3">{{ error }}</p> }
        <button (click)="submit()" [disabled]="loading" class="it-btn-primary w-full mt-5 disabled:opacity-60">{{ loading ? '…' : 'Créer mon compte' }}</button>
        <p class="text-center text-sm text-on-surface-variant mt-6">Déjà un compte ? <a routerLink="/auth/login" class="text-primary font-bold hover:underline">Se connecter</a></p>
      } @else {
        <h1 class="font-display text-2xl font-extrabold text-center mb-1">Vérification</h1>
        <p class="text-center text-on-surface-variant text-sm mb-6">Code à 6 chiffres envoyé par SMS au <b>{{ data.telephone }}</b>.</p>
        <input [(ngModel)]="code" maxlength="6" inputmode="numeric" class="it-field text-center text-3xl font-extrabold tracking-[0.4em]" placeholder="000000" aria-label="Code de vérification">
        @if (error) { <p class="text-error text-sm font-medium mt-3">{{ error }}</p> }
        <button (click)="verify()" [disabled]="verifying || code.length !== 6" class="it-btn-primary w-full mt-5 disabled:opacity-60">{{ verifying ? '…' : 'Activer mon compte' }}</button>
      }
    </div>
  </div>
  `,
})
export class Register implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private etabSvc = inject(EtablissementService);
  private toast = inject(ToastService);

  role: 'student' | 'landlord' = 'student';
  data = { nom: '', prenom: '', email: '', telephone: '', password: '', confirm: '', ecoleId: null as number | null, adresse: '', moyenPaiement: '' };
  // Moyen de réception de paiement (propriétaire) : choix + information dépendante.
  payType = '';
  payInfo = '';
  private readonly payLabels: Record<string, string> = {
    MOBILE_MONEY: 'Mobile Money', ORANGE_MONEY: 'Orange Money', VIREMENT: 'Virement bancaire', ESPECES: 'Espèces',
  };
  private moyenPaiementValue(): string {
    if (!this.payType) return '';
    const label = this.payLabels[this.payType] ?? this.payType;
    return this.payInfo.trim() ? `${label} : ${this.payInfo.trim()}` : label;
  }
  etabs: Etablissement[] = [];
  loading = false; error = '';
  step: 'form' | 'verify' = 'form';
  code = ''; verifying = false;
  showPw = false;
  submitted = false;

  ngOnInit(): void { this.etabSvc.list().subscribe({ next: e => this.etabs = e, error: () => {} }); }

  tab(r: string): string {
    const base = 'py-2.5 rounded-lg font-bold text-sm transition-all';
    return this.role === r ? `${base} bg-surface-container-lowest text-primary shadow-card` : `${base} text-on-surface-variant`;
  }

  invalid(field: string): boolean {
    if (!this.submitted) return false;
    switch (field) {
      case 'prenom': return !this.data.prenom.trim();
      case 'nom': return !this.data.nom.trim();
      case 'telephone': return !this.data.telephone.trim();
      // L'email est facultatif : invalide seulement s'il est renseigné mais mal formé.
      case 'email': return this.data.email.trim().length > 0 && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.data.email.trim());
      case 'password': return this.data.password.length < 8;
      case 'confirm': return this.data.password !== this.data.confirm;
      default: return false;
    }
  }

  pwScore(): number {
    const p = this.data.password; if (!p) return 0;
    let s = 0; if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }
  pwLabel(): string { return ['Très faible', 'Faible', 'Moyen', 'Bon', 'Fort'][this.pwScore()]; }
  pwColor(): string { const s = this.pwScore(); return s <= 1 ? 'bg-error' : s === 2 ? 'bg-secondary-container' : s === 3 ? 'bg-amber-400' : 'bg-primary'; }
  pwTextColor(): string { const s = this.pwScore(); return s <= 1 ? 'text-error' : s <= 2 ? 'text-secondary' : 'text-primary'; }

  submit(): void {
    this.submitted = true; this.error = '';
    if (this.invalid('prenom') || this.invalid('nom') || this.invalid('telephone') || this.invalid('email') || this.invalid('password') || this.invalid('confirm')) return;
    const landlord = this.role === 'landlord';
    const payload: RegisterRequest = {
      nom: this.data.nom.trim(), prenom: this.data.prenom.trim(),
      telephone: this.data.telephone.trim(),
      email: this.data.email.trim() || undefined,
      password: this.data.password,
      role: landlord ? UserRole.PROPRIETAIRE : UserRole.ETUDIANT,
      ecoleId: !landlord && this.data.ecoleId ? this.data.ecoleId : undefined,
      adresse: landlord && this.data.adresse ? this.data.adresse.trim() : undefined,
      moyenPaiement: landlord ? (this.moyenPaiementValue() || undefined) : undefined,
    };
    this.loading = true;
    this.auth.register(payload).subscribe({
      next: () => { this.loading = false; this.step = 'verify'; this.toast.info('Code de vérification envoyé.'); },
      error: (e) => { this.loading = false; this.error = e?.error?.error ?? 'Inscription impossible.'; },
    });
  }

  verify(): void {
    if (this.code.length !== 6) return;
    this.verifying = true; this.error = '';
    this.auth.verifyAccount(this.data.telephone, this.code).subscribe({
      next: () => { this.verifying = false; this.toast.success('Compte activé ! Connectez-vous.'); this.router.navigate(['/auth/login']); },
      error: (e) => { this.verifying = false; this.error = e?.error?.error ?? 'Code invalide ou expiré.'; },
    });
  }
}
