import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation.service';
import { PaiementService } from '../../../core/services/paiement.service';
import { Reservation, ReservationStatut, PaiementResponse, StatutPaiement } from '../../../core/models';
import { PrixAriaryPipe } from '../../../shared/pipes/prix-ariary.pipe';
import { ToastService } from '../../../core/services/toast.service';


@Component({
  selector: 'app-reservations-recues',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, FormsModule, PrixAriaryPipe],
  template: `
  <div class="flex items-center justify-between flex-wrap gap-3 mb-6">
    <h1 class="font-display text-2xl font-extrabold">Visites &amp; réservations reçues</h1>
    <div class="inline-flex p-1 bg-surface-container rounded-xl" role="tablist">
      <button (click)="tab='visite'" [class]="segCls('visite')" role="tab" [attr.aria-selected]="tab==='visite'">Visites ({{ countVisite }})</button>
      <button (click)="tab='reservation'" [class]="segCls('reservation')" role="tab" [attr.aria-selected]="tab==='reservation'">Réservations ({{ countResa }})</button>
    </div>
  </div>
  <p class="text-on-surface-variant text-sm -mt-3 mb-5">
    {{ tab === 'visite' ? 'Demandes de visite : acceptez, refusez ou modifiez la date/heure.' : 'Réservations à valider pour transformer en location.' }}
  </p>
  @if (loading) {
    <div class="space-y-3">@for (i of [1,2,3]; track i) { <div class="it-skel h-24"></div> }</div>
  } @else if (error) {
    <div class="it-card p-12 text-center text-on-surface-variant">
      <span class="material-symbols-outlined text-5xl text-error/60 mb-2">cloud_off</span>
      <p class="mb-4">Impossible de charger les réservations.</p>
      <button (click)="load()" class="it-btn-primary">Réessayer</button>
    </div>
  } @else if (filtered.length) {
    <div class="space-y-3">
      @for (r of filtered; track r.id) {
        <div class="it-card p-4">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex-1 min-w-[180px]">
            <p class="font-bold">{{ r.etudiant?.prenom }} {{ r.etudiant?.nom }}</p>
            <p class="text-sm text-on-surface-variant">{{ r.logement?.titre ?? 'Logement #' + r.logementId }} · {{ r.typeReservation === 'VISITE' ? 'Visite' : 'Réservation' }} @if (r.typeReservation === 'VISITE') { {{ r.dateVisite | date:'mediumDate' }}{{ r.heureVisite ? ' à ' + r.heureVisite : '' }} } @else { {{ r.createdAt | date:'d MMM y, HH:mm' }} }</p>
          </div>
          <span class="it-badge" [ngClass]="badge(r.statut)">{{ label(r.statut) }}</span>
          <div class="flex gap-2 flex-wrap">
            @if (r.etudiant?.id) {
              <a [routerLink]="['/proprietaire/messages']"
                 [queryParams]="{ to: r.etudiant!.id, name: (r.etudiant!.prenom || '') + ' ' + (r.etudiant!.nom || ''), logement: r.logementId }"
                 class="it-btn-ghost !py-2" aria-label="Contacter le locataire"><span class="material-symbols-outlined">chat</span> Contacter</a>
            }
            @switch (r.statut) {
              @case ('en_attente') {
                @if (r.typeReservation === 'VISITE') {
                  <button (click)="action(r, 'visite_planifiee', 'Visite acceptée.')" class="it-btn-primary !py-2"><span class="material-symbols-outlined">event_available</span> Accepter la visite</button>
                } @else {
                  <button (click)="action(r, 'logement_reserve', 'Réservation acceptée. Le locataire peut compléter le paiement.')" class="it-btn-primary !py-2"><span class="material-symbols-outlined">event_available</span> Accepter la réservation</button>
                }
                <button (click)="refuser(r)" class="it-btn-outline !py-2 text-error"><span class="material-symbols-outlined">close</span> Refuser</button>
              }
              @case ('visite_planifiee') {
                @if (editingId === r.id) {
                  <div class="flex items-center gap-2 flex-wrap">
                    <input type="date" [(ngModel)]="editDate" [min]="today" class="it-field text-sm !py-1.5 w-auto" aria-label="Date de visite" />
                    <select [(ngModel)]="editH" class="it-field text-sm !py-1.5 w-auto" aria-label="Heure">
                      @for (h of heuresList; track h) { <option [value]="h">{{ h }} h</option> }
                    </select>
                    <select [(ngModel)]="editM" class="it-field text-sm !py-1.5 w-auto" aria-label="Minutes">
                      @for (m of minutesList; track m) { <option [value]="m">{{ m }} min</option> }
                    </select>
                    <button (click)="saveVisite(r)" class="it-btn-primary !py-1.5 !px-3 text-sm"><span class="material-symbols-outlined text-base">check</span></button>
                    <button (click)="annulerEdit()" class="it-btn-ghost !py-1.5 !px-2 text-sm text-on-surface-variant"><span class="material-symbols-outlined text-base">close</span></button>
                  </div>
                } @else {
                  <button (click)="editerVisite(r)" class="it-btn-outline !py-2"><span class="material-symbols-outlined">edit_calendar</span> Modifier la visite</button>
                  <button (click)="visiteEffectuee(r)" class="it-btn-accent !py-2"><span class="material-symbols-outlined">task_alt</span> Visite effectuée</button>
                  <button (click)="refuser(r)" class="it-btn-outline !py-2 text-error"><span class="material-symbols-outlined">close</span> Refuser</button>
                }
              }
              @case ('en_attente_validation_proprio') {
                @if (r.typeReservation === 'DIRECTE') {
                  <button (click)="validerDirecte(r)" class="it-btn-primary !py-2"><span class="material-symbols-outlined">verified</span> Valider la réservation</button>
                } @else if (tab !== 'visite') {
                  <button (click)="confirmerProprietaire(r)" class="it-btn-primary !py-2"><span class="material-symbols-outlined">how_to_reg</span> Confirmer la réservation</button>
                }
                <button (click)="refuser(r)" class="it-btn-outline !py-2 text-error"><span class="material-symbols-outlined">close</span> Refuser</button>
                @if (montantEnAttente(r) > 0) {
                  <span class="text-xs text-on-surface-variant self-center">Paiement à valider : {{ montantEnAttente(r) | prixAriary }}</span>
                }
              }
              @case ('logement_reserve') {
                @if (!r.confirmeParProprietaire) {
                  <span class="it-btn-ghost !py-2 text-on-surface-variant"><span class="material-symbols-outlined">hourglass_top</span> En attente du paiement du locataire</span>
                  <button (click)="refuser(r)" class="it-btn-outline !py-2 text-error"><span class="material-symbols-outlined">close</span> Refuser</button>
                } @else {
                  <span class="it-btn-ghost !py-2 text-on-surface-variant"><span class="material-symbols-outlined">check_circle</span> Contrat actif</span>
                }
              }
            }
          </div>
        </div>
        </div>
      }
    </div>
  } @else {
    <div class="it-card p-12 text-center text-on-surface-variant"><span class="material-symbols-outlined text-5xl opacity-30 mb-2">event_busy</span><p>{{ tab === 'visite' ? 'Aucune demande de visite.' : 'Aucune réservation.' }}</p></div>
  }
  `,
})
export class ReservationsRecues implements OnInit {
  private svc = inject(ReservationService);
  private paiementSvc = inject(PaiementService);
  private toast = inject(ToastService);
  items: Reservation[] = [];
  paiements: PaiementResponse[] = [];
  loading = true;
  error = false;
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

  editingId: number | null = null;
  editDate = '';
  editH = '07'; editM = '00';
  today = new Date().toISOString().split('T')[0];
  readonly heuresList = ['07','08','09','10','11','12','13','14','15','16','17','18','19'];
  readonly minutesList = ['00','15','30','45'];

  private route = inject(ActivatedRoute);
  ngOnInit(): void {
    // Ouverture directe sur le bon onglet depuis le dashboard (?tab=visite|reservation).
    const t = this.route.snapshot.queryParamMap.get('tab');
    if (t === 'visite' || t === 'reservation') this.tab = t;
    this.load();
  }
  load(): void {
    this.loading = true; this.error = false;
    this.svc.getReceivedReservations().subscribe({ next: r => { this.items = r; this.loading = false; }, error: () => { this.loading = false; this.error = true; } });
    this.paiementSvc.getPaiementsRecus().subscribe({ next: p => this.paiements = p, error: () => {} });
  }

  editerVisite(r: Reservation): void {
    this.editingId = r.id;
    this.editDate = r.dateVisite;
    // Heure choisie par menu (heure + minute) ; défaut 07h00 si absente.
    const hm = (r.heureVisite || '07:00').slice(0, 5).split(':');
    this.editH = hm[0] || '07';
    this.editM = hm[1] || '00';
  }

  annulerEdit(): void {
    this.editingId = null;
    this.editDate = '';
    this.editH = '07'; this.editM = '00';
  }

  saveVisite(r: Reservation): void {
    if (!this.editDate) { this.toast.error('Choisissez une date.'); return; }
    this.svc.modifierVisite(r.id, this.editDate, `${this.editH}:${this.editM}`).subscribe({
      next: () => { this.toast.success('Visite modifiée.'); this.annulerEdit(); this.load(); },
      error: (e) => this.toast.error(e?.error?.message ?? 'Erreur lors de la modification.'),
    });
  }

  action(r: Reservation, statut: string, msg: string): void {
    this.svc.updateStatut(r.id, statut).subscribe({
      next: () => { this.toast.success(msg); this.load(); },
      error: (e) => this.toast.error(e?.error?.message ?? 'Action impossible.'),
    });
  }
  visiteEffectuee(r: Reservation): void {
    this.svc.confirmerApresVisite(r.id).subscribe({
      next: () => { this.toast.success('Visite confirmée.'); this.load(); },
      error: (e) => this.toast.error(e?.error?.message ?? 'Erreur lors de la confirmation.'),
    });
  }
  validerDirecte(r: Reservation): void {
    this.svc.validerReservationDirecte(r.id).subscribe({
      next: () => { this.toast.success('Réservation validée.'); this.load(); },
      error: (e) => this.toast.error(e?.error?.message ?? 'Validation impossible.'),
    });
  }
  confirmerProprietaire(r: Reservation): void {
    this.svc.confirmerReservation(r.id, 'PROPRIETAIRE').subscribe({
      next: () => { this.toast.success('Réservation confirmée.'); this.load(); },
      error: (e) => this.toast.error(e?.error?.message ?? 'Confirmation impossible.'),
    });
  }
  pendingPayments(r: Reservation): PaiementResponse[] {
    return this.paiements.filter(p =>
      p.reservationId === r.id &&
      (p.statut === StatutPaiement.EN_ATTENTE || p.statut === StatutPaiement.SEQUESTRE)
    );
  }
  /** Total des paiements de la réservation encore à valider. Informatif : la validation
   *  se fait en une seule fois via « Valider la réservation » (plus de double validation). */
  montantEnAttente(r: Reservation): number {
    return this.pendingPayments(r).reduce((s, p) => s + (p.montant ?? 0), 0);
  }
  refuser(r: Reservation): void {
    const estVisite = r.typeReservation === 'VISITE';
    this.svc.updateStatut(r.id, ReservationStatut.ANNULE_REFUSE).subscribe({
      next: () => { this.toast.info(estVisite ? 'Visite refusée.' : 'Réservation refusée.'); this.load(); },
      error: () => this.toast.error('Action impossible.'),
    });
  }

  label(s: ReservationStatut): string {
    const m: Record<string, string> = { en_attente: 'Demande de visite', visite_planifiee: 'Visite planifiée', attente_paiement: 'Paiement attendu', en_attente_validation_proprio: 'À valider', logement_reserve: 'Réservé', annule: 'Annulé', annule_refuse: 'Refusé' };
    return m[s] ?? s;
  }
  badge(s: ReservationStatut): string {
    if (s === ReservationStatut.LOGEMENT_RESERVE) return 'bg-primary-container text-on-primary-container';
    if (s === ReservationStatut.ANNULE || s === ReservationStatut.ANNULE_REFUSE) return 'bg-error-container text-on-error-container';
    return 'bg-secondary-container text-on-secondary-container';
  }
}
