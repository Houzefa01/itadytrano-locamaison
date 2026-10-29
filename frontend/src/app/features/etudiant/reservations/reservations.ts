import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ReservationService } from '../../../core/services/reservation.service';
import { PaiementService } from '../../../core/services/paiement.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogService } from '../../../core/services/dialog.service';
import { Reservation, ReservationStatut, TypePaiement, ModePaiement } from '../../../core/models';
import { PrixAriaryPipe } from '../../../shared/pipes/prix-ariary.pipe';

@Component({
  selector: 'app-etudiant-reservations',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterLink, PrixAriaryPipe],
  template: `
  <div class="flex items-center justify-between flex-wrap gap-3 mb-6">
    <h1 class="font-display text-2xl font-extrabold">Mes visites et réservations</h1>
    <div class="inline-flex p-1 bg-surface-container rounded-xl" role="tablist">
      <button (click)="tab='visite'" [class]="segCls('visite')" role="tab" [attr.aria-selected]="tab==='visite'">Visites ({{ countVisite }})</button>
      <button (click)="tab='reservation'" [class]="segCls('reservation')" role="tab" [attr.aria-selected]="tab==='reservation'">Réservations ({{ countResa }})</button>
    </div>
  </div>
  <p class="text-on-surface-variant text-sm -mt-3 mb-5">
    {{ tab === 'visite' ? 'Une visite est un simple rendez-vous pour aller voir le logement.' : 'Une réservation bloque le logement après le versement d\\'une avance.' }}
  </p>
  @if (loading) {
    <div class="space-y-3">@for (i of [1,2,3]; track i) { <div class="it-skel h-24"></div> }</div>
  } @else if (errored) {
    <div class="it-card p-12 text-center text-on-surface-variant">
      <span class="material-symbols-outlined text-5xl text-error/60 mb-2">cloud_off</span>
      <p class="mb-4">Impossible de charger vos réservations.</p>
      <button (click)="load()" class="it-btn-primary">Réessayer</button>
    </div>
  } @else if (filtered.length) {
    <div class="space-y-3">
      @for (r of filtered; track r.id) {
        <div class="it-card p-4 flex flex-wrap items-center gap-4">
          <div class="flex-1 min-w-[180px]">
            <a [routerLink]="['/logements', r.logementId]" class="font-bold hover:text-primary">{{ r.logement?.titre ?? 'Logement #' + r.logementId }}</a>
            <p class="text-sm text-on-surface-variant flex items-center gap-1">
              <span class="material-symbols-outlined text-[15px]">{{ r.typeReservation === 'VISITE' ? 'calendar_month' : 'event_available' }}</span>
              {{ r.typeReservation === 'VISITE' ? 'Visite' : 'Réservation' }} · @if (r.typeReservation === 'VISITE') { {{ r.dateVisite | date:'mediumDate' }}{{ r.heureVisite ? ' à ' + r.heureVisite : '' }} } @else { {{ r.createdAt | date:'d MMM y, HH:mm' }} }
            </p>
          </div>
          <div class="w-full sm:w-auto sm:ml-auto flex flex-col items-end gap-1">
            <span class="it-badge" [ngClass]="badgeClass(r.statut)">{{ label(r.statut) }}</span>
            @if (r.typeReservation !== 'VISITE' && r.montantTotal) {
              <span class="text-xs text-on-surface-variant">Payé {{ (r.montantPaye ?? 0) | prixAriary }} / {{ r.montantTotal | prixAriary }}</span>
            }
            @if (r.dateExpiration && r.statut === 'logement_reserve' && reste(r) > 0) {
              <span class="text-xs text-on-surface-variant">Blocage jusqu'au {{ r.dateExpiration | date:'short' }}</span>
            }
          </div>
          @if (r.logement?.proprietaire?.id) {
            <a [routerLink]="['/etudiant/messages']"
               [queryParams]="{ to: r.logement!.proprietaire!.id, name: (r.logement!.proprietaire!.prenom || '') + ' ' + (r.logement!.proprietaire!.nom || ''), logement: r.logementId }"
               class="it-btn-ghost !py-2" aria-label="Contacter le propriétaire"><span class="material-symbols-outlined">chat</span> Contacter</a>
          }
          @if (canPay(r.statut)) {
            <button (click)="openPay(r)" class="it-btn-accent !py-2"><span class="material-symbols-outlined">payments</span> Payer l'avance</button>
          }
          @if (canComplete(r)) {
            <button (click)="openComplete(r)" class="it-btn-primary !py-2"><span class="material-symbols-outlined">key</span> Compléter (louer)</button>
          }
          @if (canLouer(r)) {
            <button (click)="louer(r)" class="it-btn-primary !py-2"><span class="material-symbols-outlined">how_to_reg</span> Louer la maison</button>
          }
          @if (canCancel(r)) {
            <button (click)="cancel(r)" class="it-btn-ghost text-error"><span class="material-symbols-outlined">close</span> Annuler</button>
          }
        </div>
      }
    </div>
  } @else {
    <div class="it-card p-12 text-center text-on-surface-variant">
      <span class="material-symbols-outlined text-5xl opacity-30 mb-2">event_busy</span>
      <p class="mb-4">{{ tab === 'visite' ? 'Aucune visite.' : 'Aucune réservation.' }}</p>
      <a routerLink="/etudiant/explorer" class="it-btn-primary">Trouver un logement</a>
    </div>
  }

  <!-- Modale paiement -->
  @if (payTarget(); as r) {
    <div class="fixed inset-0 z-[2100] grid place-items-center p-4 bg-black/50 it-fade" (click)="closePay()">
      <div class="it-card w-full max-w-sm p-6" role="dialog" aria-modal="true" aria-label="Payer l'avance" (click)="$event.stopPropagation()">
        <h2 class="font-display text-lg font-extrabold mb-1">Payer l'avance</h2>
        <p class="text-on-surface-variant text-sm mb-4">Montant à régler : <b class="text-on-surface">{{ (r.montantTotal ?? r.logement?.prix ?? 0) | prixAriary }}</b></p>
        <label class="it-label">Moyen de paiement</label>
        <select [(ngModel)]="payMode" class="it-field mb-4">@for (m of modesFor(r); track m.v) { <option [ngValue]="m.v">{{ m.l }}</option> }</select>
        <div class="flex gap-2 justify-end">
          <button (click)="closePay()" class="it-btn-outline">Annuler</button>
          <button (click)="confirmPay()" [disabled]="paying" class="it-btn-primary disabled:opacity-60">{{ paying ? '…' : 'Payer' }}</button>
        </div>
      </div>
    </div>
  }

  <!-- Modale : compléter la réservation (loyer + caution) pour louer -->
  @if (completeTarget(); as r) {
    <div class="fixed inset-0 z-[2100] grid place-items-center p-4 bg-black/50 it-fade" (click)="closeComplete()">
      <div class="it-card w-full max-w-sm p-6" role="dialog" aria-modal="true" aria-label="Compléter la réservation" (click)="$event.stopPropagation()">
        <h2 class="font-display text-lg font-extrabold mb-1">Louer ce logement</h2>
        <p class="text-on-surface-variant text-sm mb-3">Réglez la caution et le(s) premier(s) mois de loyer pour démarrer la location.</p>

        <label class="it-label">Mois de loyer à régler maintenant</label>
        <div class="flex items-center gap-3 mb-3">
          <button (click)="changeMoisLouer(-1)" class="it-btn-outline !px-3 !py-1" [disabled]="moisLouer<=1">−</button>
          <span class="font-bold text-lg w-8 text-center">{{ moisLouer }}</span>
          <button (click)="changeMoisLouer(1)" class="it-btn-outline !px-3 !py-1">+</button>
          <span class="text-sm text-on-surface-variant ml-auto">{{ moisLouer === 1 ? '1er mois' : moisLouer + ' mois d\\'avance' }}</span>
        </div>

        <div class="text-sm mb-4 space-y-1 border-t border-outline-variant/40 pt-3">
          <div class="flex justify-between"><span class="text-on-surface-variant">Caution</span><b>{{ caution(r) | prixAriary }}</b></div>
          <div class="flex justify-between"><span class="text-on-surface-variant">Loyer × {{ moisLouer }}</span><b>{{ loyer(r) * moisLouer | prixAriary }}</b></div>
          @if ((r.montantPaye ?? 0) > 0) {
            <div class="flex justify-between text-on-surface-variant"><span>Acompte déjà versé</span><span>– {{ (r.montantPaye ?? 0) | prixAriary }}</span></div>
          }
          <div class="flex justify-between text-primary text-base pt-1"><span>À payer maintenant</span><b>{{ totalLouer(r) | prixAriary }}</b></div>
        </div>

        <label class="it-label">Moyen de paiement</label>
        <select [(ngModel)]="payMode" class="it-field mb-4">@for (m of modesFor(r); track m.v) { <option [ngValue]="m.v">{{ m.l }}</option> }</select>
        <div class="flex gap-2 justify-end">
          <button (click)="closeComplete()" class="it-btn-outline">Annuler</button>
          <button (click)="confirmComplete()" [disabled]="paying" class="it-btn-primary disabled:opacity-60">{{ paying ? '…' : 'Payer et louer' }}</button>
        </div>
      </div>
    </div>
  }
  `,
})
export class EtudiantReservations implements OnInit {
  private svc = inject(ReservationService);
  private paiementSvc = inject(PaiementService);
  private toast = inject(ToastService);
  private dialog = inject(DialogService);

  items: Reservation[] = [];
  loading = true;
  errored = false;
  tab: 'visite' | 'reservation' = 'visite';

  get filtered(): Reservation[] {
    return this.items
      .filter(r => this.tab === 'visite' ? r.typeReservation === 'VISITE' : r.typeReservation !== 'VISITE')
      // Plus récent en haut (date de création, repli sur l'id).
      .sort((a, b) => (b.createdAt ? Date.parse(b.createdAt) : 0) - (a.createdAt ? Date.parse(a.createdAt) : 0) || (b.id - a.id));
  }
  get countVisite(): number { return this.items.filter(r => r.typeReservation === 'VISITE').length; }
  get countResa(): number { return this.items.filter(r => r.typeReservation !== 'VISITE').length; }
  segCls(t: string): string {
    const base = 'px-4 py-2 rounded-lg font-bold text-sm transition-all';
    return this.tab === t ? `${base} bg-surface-container-lowest text-primary shadow-card` : `${base} text-on-surface-variant`;
  }

  payTarget = signal<Reservation | null>(null);
  completeTarget = signal<Reservation | null>(null);
  moisLouer = 1;
  payMode: ModePaiement = ModePaiement.MOBILE_MONEY;
  paying = false;
  today = new Date().toISOString().split('T')[0];
  modes = [
    { v: ModePaiement.MOBILE_MONEY, l: 'Mobile Money' }, { v: ModePaiement.VIREMENT, l: 'Virement' },
    { v: ModePaiement.ESPECES, l: 'Espèces' }, { v: ModePaiement.CARTE, l: 'Carte' },
  ];

  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true; this.errored = false;
    this.svc.getMyReservations().subscribe({ next: r => { this.items = r; this.loading = false; }, error: () => { this.loading = false; this.errored = true; } });
  }

  canCancel(r: Reservation): boolean {
    // Une réservation finalisée (confirmée par les deux parties → contrat en cours)
    // n'est plus annulable : le logement est réellement occupé.
    if (r.confirmeParEtudiant && r.confirmeParProprietaire) return false;
    return [ReservationStatut.EN_ATTENTE, ReservationStatut.VISITE_PLANIFIEE, ReservationStatut.ATTENTE_PAIEMENT, ReservationStatut.LOGEMENT_RESERVE, ReservationStatut.EN_ATTENTE_VALIDATION_PROPRIO].includes(r.statut);
  }
  /** Réservation ACCEPTÉE par le bailleur (logement_reserve, pas encore finalisée),
   *  sans caution et déjà soldée à 100% (reste = 0) : « Louer la maison » l'envoie en
   *  validation du bailleur (rien de plus à payer). */
  canLouer(r: Reservation): boolean {
    return r.typeReservation !== 'VISITE'
        && r.statut === ReservationStatut.LOGEMENT_RESERVE
        && !r.confirmeParProprietaire
        && this.reste(r) === 0
        && (r.logement?.caution == null || r.logement.caution === 0);
  }
  canPay(s: ReservationStatut): boolean { return s === ReservationStatut.ATTENTE_PAIEMENT; }

  /** Solde restant pour transformer une réservation en location (loyer + caution − déjà payé). */
  reste(r: Reservation): number { return Math.max(0, (r.montantTotal ?? 0) - (r.montantPaye ?? 0)); }
  /** Complétable tant qu'il reste un solde à régler (loyer + caution), y compris
   *  APRÈS validation du propriétaire. Une fois entièrement soldée (reste = 0), le
   *  bouton disparaît. */
  canComplete(r: Reservation): boolean {
    return r.typeReservation !== 'VISITE'
      && r.statut === ReservationStatut.LOGEMENT_RESERVE
      && !r.confirmeParProprietaire
      && this.reste(r) > 0;
  }
  /** Modes acceptés par le propriétaire pour ce logement (sinon tous). */
  modesFor(r: Reservation): { v: ModePaiement; l: string }[] {
    const accepted = r.logement?.modesPaiement;
    if (!accepted || !accepted.length) return this.modes;
    return this.modes.filter(m => accepted.includes(m.v));
  }

  // ── Étape « Louer » : caution + 1er (ou plusieurs) mois de loyer ────────────
  loyer(r: Reservation): number { return r.logement?.prix ?? 0; }
  caution(r: Reservation): number {
    if (r.logement?.caution != null) return r.logement.caution;
    return Math.max(0, (r.montantTotal ?? 0) - this.loyer(r)); // repli : total − 1 mois
  }
  /** Montant à régler maintenant : caution + N mois − acompte déjà versé. */
  totalLouer(r: Reservation): number {
    return Math.max(0, this.caution(r) + this.loyer(r) * this.moisLouer - (r.montantPaye ?? 0));
  }
  changeMoisLouer(d: number): void { this.moisLouer = Math.max(1, Math.min(this.moisLouer + d, 12)); }

  openComplete(r: Reservation): void {
    this.payMode = this.modesFor(r)[0]?.v ?? ModePaiement.MOBILE_MONEY;
    this.moisLouer = 1;
    this.completeTarget.set(r);
  }
  closeComplete(): void { this.completeTarget.set(null); }

  private moisIso(offset: number): string {
    const n = new Date();
    const idx = n.getFullYear() * 12 + n.getMonth() + offset;
    return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, '0')}-01`;
  }

  confirmComplete(): void {
    const r = this.completeTarget();
    if (!r) return;
    this.paying = true;
    const calls = [];
    // Loyer(s) du démarrage : enregistré(s) avec période -> apparaissent dans l'échéancier.
    // On DÉDUIT l'acompte déjà versé à la réservation (il compte pour le loyer) afin de
    // ne pas facturer deux fois : le locataire ne règle que le solde restant.
    const montantLoyer = Math.max(0, this.loyer(r) * this.moisLouer - (r.montantPaye ?? 0));
    if (montantLoyer > 0) {
      calls.push(this.paiementSvc.creerPaiement({
        logementId: r.logementId, reservationId: r.id, montant: montantLoyer,
        typePaiement: TypePaiement.LOYER_MENSUEL, mode: this.payMode, datePaiement: this.today,
        periodeDebut: this.moisIso(0), periodeFin: this.moisIso(this.moisLouer - 1),
      }));
    }
    // Caution (seulement si le propriétaire en demande une).
    if (this.caution(r) > 0) {
      calls.push(this.paiementSvc.creerPaiement({
        logementId: r.logementId, reservationId: r.id, montant: this.caution(r),
        typePaiement: TypePaiement.DEPOT_GARANTIE, mode: this.payMode, datePaiement: this.today,
      }));
    }
    if (calls.length === 0) { // aucun montant à régler -> on complète directement
      this.svc.completerReservation(r.id, this.reste(r)).subscribe({
        next: () => { this.paying = false; this.closeComplete(); this.toast.success('Location confirmée. En attente de validation du bailleur.'); this.load(); },
        error: (e) => { this.paying = false; this.toast.error(e?.error?.message ?? 'Action impossible.'); },
      });
      return;
    }
    forkJoin(calls).subscribe({
      next: () => {
        // Marque la réservation complétée -> validation bailleur -> contrat.
        this.svc.completerReservation(r.id, this.reste(r)).subscribe({
          next: () => { this.paying = false; this.closeComplete(); this.toast.success('Caution et loyer réglés. En attente de validation du bailleur.'); this.load(); },
          error: () => { this.paying = false; this.closeComplete(); this.toast.info('Paiements enregistrés.'); this.load(); },
        });
      },
      error: (e) => { this.paying = false; this.toast.error(e?.error?.message ?? 'Paiement impossible.'); },
    });
  }

  async cancel(r: Reservation): Promise<void> {
    const estVisite = r.typeReservation === 'VISITE';
    const mot = estVisite ? 'visite' : 'réservation';
    const ok = await this.dialog.confirm(`Annuler la ${mot} ?`, 'Cette action est irréversible.', { confirmLabel: `Annuler la ${mot}`, danger: true });
    if (!ok) return;
    this.svc.updateStatut(r.id, ReservationStatut.ANNULE).subscribe({
      next: () => { this.toast.success(estVisite ? 'Visite annulée.' : 'Réservation annulée.'); this.load(); },
      error: () => this.toast.error('Annulation impossible.'),
    });
  }
  /** Réservation soldée à 100% sans caution : rien de plus à payer. On l'envoie en
   *  validation du bailleur (EN_ATTENTE_VALIDATION_PROPRIO). Dès que le bailleur
   *  confirme, un contrat est créé et le loyer apparaît dans « Paiements & loyer ». */
  louer(r: Reservation): void {
    this.svc.completerReservation(r.id, 0).subscribe({
      next: () => { this.toast.success('Demande de location envoyée. En attente de validation du bailleur.'); this.load(); },
      error: (e) => this.toast.error(e?.error?.message ?? 'Action impossible.'),
    });
  }

  openPay(r: Reservation): void { this.payMode = ModePaiement.MOBILE_MONEY; this.payTarget.set(r); }
  closePay(): void { this.payTarget.set(null); }
  confirmPay(): void {
    const r = this.payTarget();
    if (!r) return;
    this.paying = true;
    const montant = r.montantTotal ?? r.logement?.prix ?? 0;
    this.paiementSvc.creerPaiement({
      logementId: r.logementId, reservationId: r.id, montant,
      typePaiement: TypePaiement.DEPOT_GARANTIE, mode: this.payMode, datePaiement: this.today,
    }).subscribe({
      next: () => { this.paying = false; this.closePay(); this.toast.success('Paiement enregistré, en attente de validation.'); this.load(); },
      error: (e) => { this.paying = false; this.toast.error(e?.error?.message ?? 'Paiement impossible.'); },
    });
  }

  label(s: ReservationStatut): string {
    const m: Record<string, string> = {
      en_attente: 'En attente', visite_planifiee: 'Visite planifiée', attente_paiement: 'Paiement attendu',
      en_attente_validation_proprio: 'Validation bailleur', logement_reserve: 'Réservé', annule: 'Annulé', annule_refuse: 'Refusé',
    };
    return m[s] ?? s;
  }
  badgeClass(s: ReservationStatut): string {
    if (s === ReservationStatut.LOGEMENT_RESERVE) return 'bg-primary-container text-on-primary-container';
    if (s === ReservationStatut.ANNULE || s === ReservationStatut.ANNULE_REFUSE) return 'bg-error-container text-on-error-container';
    return 'bg-secondary-container text-on-secondary-container';
  }
}
