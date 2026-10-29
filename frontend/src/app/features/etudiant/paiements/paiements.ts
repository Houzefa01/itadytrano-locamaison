import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { PaiementService } from '../../../core/services/paiement.service';
import { ContratService } from '../../../core/services/contrat.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaiementResponse, StatutPaiement, ContratResponse, Reservation, TypePaiement, ModePaiement, Echeance, StatutContrat } from '../../../core/models';
import { PrixAriaryPipe } from '../../../shared/pipes/prix-ariary.pipe';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-etudiant-paiements',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterLink, PrixAriaryPipe],
  template: `
  <h1 class="font-display text-2xl font-extrabold mb-6">Loyers & paiements</h1>

  @if (loading) {
    <div class="space-y-3">@for (i of [1,2,3]; track i) { <div class="it-skel h-20"></div> }</div>
  } @else if (error) {
    <div class="it-card p-12 text-center text-on-surface-variant">
      <span class="material-symbols-outlined text-5xl text-error/60 mb-2">cloud_off</span>
      <p class="mb-4">Impossible de charger vos paiements.</p>
      <button (click)="load()" class="it-btn-primary">Réessayer</button>
    </div>
  } @else {
    <!-- Loyers à payer (baux actifs) -->
    @if (contratsActifs().length) {
      <h2 class="font-display text-lg font-bold mb-1">Mes loyers</h2>
      <p class="text-on-surface-variant text-sm mb-3">Réglez votre loyer mois par mois, ou plusieurs mois à l'avance.</p>
      <div class="grid md:grid-cols-2 gap-4 mb-8">
        @for (c of contratsActifs(); track c.id) {
          <div class="it-card p-5">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-bold">{{ c.logementTitre }}</p>
                <p class="text-sm text-on-surface-variant">Loyer + charges : <b class="text-on-surface">{{ total(c) | prixAriary }}</b> / mois</p>
              </div>
              @if (paidThisMonth(c)) {
                <span class="it-badge bg-primary-container text-on-primary-container whitespace-nowrap"><span class="material-symbols-outlined text-[13px] fill-1">check</span> Payé ce mois</span>
              } @else {
                <span class="it-badge bg-error-container text-on-error-container whitespace-nowrap">À payer</span>
              }
            </div>
            <div class="flex items-end justify-between mt-4 pt-3 border-t border-outline-variant/40">
              <div>
                <p class="text-[10px] uppercase tracking-wider text-on-surface-variant">Prochaine échéance</p>
                <p class="font-bold flex items-center gap-1 capitalize"><span class="material-symbols-outlined text-[16px] text-primary">event</span>{{ prochaineEcheanceLabel(c) }}</p>
                <p class="text-[11px] text-on-surface-variant mt-0.5">{{ paidCount(c) }} mois réglé(s)</p>
              </div>
              <button (click)="openPay(c)" class="it-btn-accent"><span class="material-symbols-outlined">payments</span> Payer le loyer</button>
            </div>
          </div>
        }
      </div>
    } @else {
      <div class="it-card p-6 mb-8 text-center text-on-surface-variant">
        <span class="material-symbols-outlined text-4xl opacity-30 mb-1">home</span>
        <p class="font-medium text-on-surface">Vous n'avez aucun bail actif.</p>
        <p class="text-sm mt-1">Pour louer un logement : réservez-le, puis « Compléter (louer) » dans <a routerLink="/etudiant/reservations" class="text-primary font-semibold">Mes réservations</a>. Une fois le bailleur ayant validé, votre loyer apparaîtra ici.</p>
      </div>
    }

    <!-- Historique -->
    <h2 class="font-display text-lg font-bold mb-3">Historique des paiements</h2>
    @if (filteredItems.length) {
      <div class="it-card overflow-x-auto">
        <table class="w-full text-left min-w-[860px]">
          <thead class="text-[11px] uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/40">
            <tr><th class="p-4">Référence</th><th class="p-4">Motif</th><th class="p-4">Mode</th><th class="p-4">Montant</th><th class="p-4">Destinataire</th><th class="p-4">Date &amp; heure</th><th class="p-4">Statut</th><th class="p-4"></th></tr>
          </thead>
          <tbody class="divide-y divide-outline-variant/30">
            @for (p of filteredItems; track p.id) {
              <tr>
                <td class="p-4 font-mono text-xs text-primary">{{ p.referenceTransaction }}</td>
                <td class="p-4 text-sm">{{ typeLabel(p.typePaiement) }}</td>
                <td class="p-4 text-sm text-on-surface-variant">{{ modeLabel(p.mode) }}</td>
                <td class="p-4 font-bold">{{ p.montant | prixAriary }}</td>
                <td class="p-4 text-sm text-on-surface-variant">{{ p.bailleur ? (p.bailleur.prenom + ' ' + p.bailleur.nom) : '—' }}</td>
                <td class="p-4 text-sm text-on-surface-variant whitespace-nowrap">{{ (p.createdAt || p.datePaiement) | date:'d MMM y, HH:mm' }}</td>
                <td class="p-4"><span class="it-badge" [ngClass]="badge(p.statut)">{{ statutLabel(p.statut) }}</span></td>
                <td class="p-4 text-right"><button (click)="recu(p.id)" class="it-btn-ghost" aria-label="Télécharger le reçu"><span class="material-symbols-outlined">download</span> Reçu</button></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <div class="it-card p-12 text-center text-on-surface-variant"><span class="material-symbols-outlined text-5xl opacity-30 mb-2">payments</span><p>Aucun paiement enregistré.</p></div>
    }
  }

  <!-- Modale paiement loyer -->
  @if (payTarget(); as c) {
    <div class="fixed inset-0 z-[2100] grid place-items-center p-4 bg-black/50 it-fade" (click)="closePay()">
      <div class="it-card w-full max-w-sm p-6" role="dialog" aria-modal="true" aria-label="Payer le loyer" (click)="$event.stopPropagation()">
        <h2 class="font-display text-lg font-extrabold mb-1">Payer le loyer</h2>
        <p class="text-on-surface-variant text-sm mb-3">{{ c.logementTitre }} · {{ total(c) | prixAriary }}/mois</p>

        <!-- Échéancier : mois déjà réglés / à payer -->
        @if (echeancier().length) {
          <div class="flex flex-wrap gap-1.5 mb-3 max-h-24 overflow-y-auto">
            @for (e of echeancier(); track e.mois) {
              <span class="it-badge text-[11px]"
                    [class.bg-primary-container]="e.paye" [class.text-on-primary-container]="e.paye"
                    [class.bg-surface-container]="!e.paye" [class.text-on-surface-variant]="!e.paye">
                {{ e.libelle }}{{ e.paye ? ' ✓' : '' }}
              </span>
            }
          </div>
        }

        <label class="it-label">Nombre de mois à régler (à l'avance possible)</label>
        <div class="flex items-center gap-3 mb-2">
          <button (click)="changeMois(-1)" class="it-btn-outline !px-3 !py-1" [disabled]="moisAPayer<=1">−</button>
          <span class="font-bold text-lg w-8 text-center">{{ moisAPayer }}</span>
          <button (click)="changeMois(1)" class="it-btn-outline !px-3 !py-1">+</button>
          <span class="text-sm text-on-surface-variant ml-auto">à partir de {{ prochainMoisLabel() }}</span>
        </div>
        <p class="text-sm mb-3">Total : <b class="text-primary">{{ total(c) * moisAPayer | prixAriary }}</b></p>

        <label class="it-label">Moyen de paiement</label>
        <select [(ngModel)]="payMode" class="it-field mb-3">@for (m of modes; track m.v) { <option [ngValue]="m.v">{{ m.l }}</option> }</select>
        <!-- Simulation : informations de paiement selon le moyen choisi -->
        @if (estMM) {
          <label class="it-label">Numéro Mobile Money (expéditeur)</label>
          <input [(ngModel)]="payRef" type="tel" inputmode="tel" placeholder="ex. 034 12 345 67" class="it-field mb-4">
        } @else if (estVirement) {
          <label class="it-label">Référence du virement / RIB</label>
          <input [(ngModel)]="payRef" placeholder="ex. MG46 00005 0123456789 12" class="it-field mb-4">
        }
        <div class="flex gap-2 justify-end">
          <button (click)="closePay()" class="it-btn-outline">Annuler</button>
          <button (click)="confirmPay()" [disabled]="paying" class="it-btn-primary disabled:opacity-60">{{ paying ? '…' : 'Payer' }}</button>
        </div>
      </div>
    </div>
  }
  `,
})
export class EtudiantPaiements implements OnInit {
  private svc = inject(PaiementService);
  private contratSvc = inject(ContratService);
  private reservationSvc = inject(ReservationService);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private api = environment.apiUrl;

  items: PaiementResponse[] = [];
  contrats: ContratResponse[] = [];
  reservations: Reservation[] = [];
  loading = true;
  error = false;

  payTarget = signal<ContratResponse | null>(null);
  echeancier = signal<Echeance[]>([]);
  echeanciers = signal<Record<number, Echeance[]>>({});
  moisAPayer = 1;
  payMode: ModePaiement = ModePaiement.MOBILE_MONEY;
  payRef = '';
  get estMM(): boolean { return this.payMode === ModePaiement.MOBILE_MONEY; }
  get estVirement(): boolean { return this.payMode === ModePaiement.VIREMENT; }
  paying = false;
  today = new Date().toISOString().split('T')[0];
  modes = [
    { v: ModePaiement.MOBILE_MONEY, l: 'Mobile Money' }, { v: ModePaiement.VIREMENT, l: 'Virement' },
    { v: ModePaiement.ESPECES, l: 'Espèces' }, { v: ModePaiement.CARTE, l: 'Carte' },
  ];

  ngOnInit(): void { this.load(); }
  /** Une réservation est éligible à l'affichage dans Paiements si le loyer
   *  est complété (montantPaye >= montantTotal) ET confirmé par le propriétaire. */
  private isEligible(r: Reservation): boolean {
    if (!r || r.montantPaye == null || r.montantTotal == null) return false;
    return r.montantPaye >= r.montantTotal && r.confirmeParProprietaire === true;
  }

  /** Historique : TOUS les paiements de l'étudiant, du plus récent au plus ancien,
   *  avec leur statut (validé / en attente / refusé). Aucun filtrage : le locataire
   *  doit voir ses paiements de réservation même avant validation par le bailleur. */
  get filteredItems(): PaiementResponse[] {
    return [...this.items].sort((a, b) =>
      (b.createdAt || b.datePaiement || '').localeCompare(a.createdAt || a.datePaiement || ''));
  }

  /** Seuls les baux actifs dont la réservation sous-jacente est éligible. */
  contratsActifs(): ContratResponse[] {
    return this.contrats.filter(c => {
      if (c.statut !== StatutContrat.ACTIF) return false;
      const resa = this.reservations.find(r => r.logementId === c.logementId);
      return resa ? this.isEligible(resa) : false;
    });
  }

  load(): void {
    this.loading = true; this.error = false;
    forkJoin({ p: this.svc.getMesPaiements(), c: this.contratSvc.getMesContratsEtudiant(), r: this.reservationSvc.getMyReservations() }).subscribe({
      next: ({ p, c, r }) => {
        this.items = p; this.contrats = c; this.reservations = r; this.loading = false;
        // Échéanciers (source de vérité unique) pour chaque bail actif :
        // les cartes ET la modale s'appuient dessus -> cohérence garantie.
        this.contratsActifs().forEach(ct => {
          this.svc.getEcheancier(ct.logementId).subscribe({
            next: e => this.echeanciers.update(m => ({ ...m, [ct.logementId]: e })),
            error: () => {},
          });
        });
      },
      error: () => { this.loading = false; this.error = true; },
    });
  }

  total(c: ContratResponse): number { return (c.loyerMensuel ?? 0) + (c.chargesMensuelles ?? 0); }

  private ech(c: ContratResponse): Echeance[] { return this.echeanciers()[c.logementId] ?? []; }
  /** Mois de loyer effectivement réglés (d'après l'échéancier serveur). */
  paidCount(c: ContratResponse): number { return this.ech(c).filter(e => e.paye).length; }
  /** Le mois courant (yyyy-MM) est-il réglé ? */
  paidThisMonth(c: ContratResponse): boolean {
    const m = this.moisCourant();
    return this.ech(c).some(e => e.mois === m && e.paye);
  }
  /** Libellé de la prochaine échéance non réglée. */
  prochaineEcheanceLabel(c: ContratResponse): string {
    const next = this.ech(c).find(e => !e.paye);
    return next ? next.libelle : 'à jour';
  }

  openPay(c: ContratResponse): void {
    this.payMode = ModePaiement.MOBILE_MONEY;
    this.payRef = '';
    this.moisAPayer = 1;
    this.payTarget.set(c);
    // Réutilise l'échéancier déjà chargé, et le rafraîchit.
    this.echeancier.set(this.ech(c));
    this.svc.getEcheancier(c.logementId).subscribe({
      next: e => { this.echeancier.set(e); this.echeanciers.update(m => ({ ...m, [c.logementId]: e })); },
      error: () => {},
    });
  }
  closePay(): void { this.payTarget.set(null); }

  changeMois(delta: number): void { this.moisAPayer = Math.max(1, Math.min(this.moisAPayer + delta, 12)); }

  private moisCourant(): string {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
  }
  /** Premier mois non réglé de l'échéancier (yyyy-MM), sinon le mois courant. */
  private prochainMoisStr(): string {
    return this.echeancier().find(e => !e.paye)?.mois ?? this.moisCourant();
  }
  /** Ajoute n mois à un mois yyyy-MM et renvoie le 1er jour au format yyyy-MM-01 (sans bug de fuseau). */
  private moisPlus(moisStr: string, n: number): string {
    const [y, m] = moisStr.split('-').map(Number);
    const idx = (y * 12 + (m - 1)) + n;
    const yy = Math.floor(idx / 12);
    const mm = (idx % 12) + 1;
    return `${yy}-${String(mm).padStart(2, '0')}-01`;
  }
  prochainMoisLabel(): string {
    const [y, m] = this.prochainMoisStr().split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  confirmPay(): void {
    const c = this.payTarget(); if (!c) return;
    this.paying = true;
    const debutMois = this.prochainMoisStr();
    const periodeDebut = this.moisPlus(debutMois, 0);             // yyyy-MM-01 du 1er mois dû
    const periodeFin = this.moisPlus(debutMois, this.moisAPayer - 1); // yyyy-MM-01 du dernier mois réglé
    this.svc.creerPaiement({
      logementId: c.logementId, montant: this.total(c) * this.moisAPayer,
      typePaiement: TypePaiement.LOYER_MENSUEL, mode: this.payMode, datePaiement: this.today,
      periodeDebut, periodeFin,
      referenceTransaction: this.payRef.trim() || undefined,
    }).subscribe({
      next: () => {
        this.paying = false; this.closePay();
        this.toast.success(this.moisAPayer > 1
          ? `${this.moisAPayer} mois de loyer réglés — en attente de validation du bailleur.`
          : 'Loyer payé — en attente de validation du bailleur.');
        this.load();
      },
      error: (e) => { this.paying = false; this.toast.error(e?.error?.message ?? 'Paiement impossible.'); },
    });
  }

  typeLabel(t: string): string { return ({ loyer_mensuel: 'Loyer mensuel', depot_garantie: 'Caution / dépôt', acompte_reservation: 'Acompte réservation', frais_visite: 'Frais de visite' } as any)[t] ?? t; }
  modeLabel(m: string): string { return ({ mobile_money: 'Mobile Money', virement: 'Virement', especes: 'Espèces', carte: 'Carte' } as any)[m] ?? m; }
  statutLabel(s: StatutPaiement): string { return ({ EN_ATTENTE: 'En attente', SEQUESTRE: 'En attente', VALIDE: 'Validé', REFUSE: 'Refusé', REMBOURSE: 'Remboursé' } as any)[s] ?? s; }
  badge(s: StatutPaiement): string {
    if (s === StatutPaiement.VALIDE) return 'bg-primary-container text-on-primary-container';
    if (s === StatutPaiement.REFUSE) return 'bg-error-container text-on-error-container';
    return 'bg-secondary-container text-on-secondary-container';
  }
  recu(id: number): void {
    this.http.get(`${this.api}/paiements/${id}/recu`, { responseType: 'blob' }).subscribe({
      next: b => { const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `recu-${id}.pdf`; a.click(); URL.revokeObjectURL(u); },
      error: () => this.toast.error('Reçu indisponible.'),
    });
  }
}
