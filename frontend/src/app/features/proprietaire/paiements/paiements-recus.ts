import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { PaiementService } from '../../../core/services/paiement.service';
import { PaiementResponse, StatutPaiement } from '../../../core/models';
import { PrixAriaryPipe } from '../../../shared/pipes/prix-ariary.pipe';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-paiements-recus',
  standalone: true,
  imports: [CommonModule, DatePipe, PrixAriaryPipe],
  template: `
  <h1 class="font-display text-2xl font-extrabold mb-4">Paiements reçus</h1>

  <!-- Portefeuille bailleur -->
  @if (solde) {
    <div class="grid grid-cols-3 gap-3 mb-6">
      <div class="it-card p-4"><p class="text-[10px] uppercase tracking-wider text-on-surface-variant">Disponible</p><p class="font-display text-xl font-extrabold text-primary">{{ solde.disponible | prixAriary }}</p></div>
      <div class="it-card p-4"><p class="text-[10px] uppercase tracking-wider text-on-surface-variant">En attente</p><p class="font-display text-xl font-extrabold text-secondary">{{ solde.enSequestre | prixAriary }}</p></div>
      <div class="it-card p-4"><p class="text-[10px] uppercase tracking-wider text-on-surface-variant">Remboursé</p><p class="font-display text-xl font-extrabold text-on-surface-variant">{{ solde.rembourse | prixAriary }}</p></div>
    </div>
  }

  @if (loading) {
    <div class="space-y-3">@for (i of [1,2,3]; track i) { <div class="it-skel h-16"></div> }</div>
  } @else if (error) {
    <div class="it-card p-12 text-center text-on-surface-variant">
      <span class="material-symbols-outlined text-5xl text-error/60 mb-2">cloud_off</span>
      <p class="mb-4">Impossible de charger les paiements.</p>
      <button (click)="load()" class="it-btn-primary">Réessayer</button>
    </div>
  } @else if (items.length) {
    <div class="it-card overflow-x-auto">
      <table class="w-full text-left min-w-[920px]">
        <thead class="text-[11px] uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/40">
          <tr><th class="p-4">Réf.</th><th class="p-4">Locataire (expéditeur)</th><th class="p-4">Logement</th><th class="p-4">Motif</th><th class="p-4">Mode</th><th class="p-4">Montant</th><th class="p-4">Date &amp; heure</th><th class="p-4">Statut</th><th class="p-4"></th></tr>
        </thead>
        <tbody class="divide-y divide-outline-variant/30">
          @for (p of items; track p.id) {
            <tr>
              <td class="p-4 font-mono text-xs text-primary">{{ p.referenceTransaction }}</td>
              <td class="p-4 text-sm font-bold">{{ p.etudiant?.prenom }} {{ p.etudiant?.nom }}<span class="block text-[11px] font-normal text-on-surface-variant">{{ p.etudiant?.telephone }}</span></td>
              <td class="p-4 text-sm text-on-surface-variant truncate max-w-[160px]">{{ p.logementTitre }}</td>
              <td class="p-4 text-sm">{{ typeLabel(p.typePaiement) }}</td>
              <td class="p-4 text-sm text-on-surface-variant">{{ modeLabel(p.mode) }}</td>
              <td class="p-4 font-bold">{{ p.montant | prixAriary }}</td>
              <td class="p-4 text-sm text-on-surface-variant whitespace-nowrap">{{ (p.createdAt || p.datePaiement) | date:'d MMM y, HH:mm' }}</td>
              <td class="p-4"><span class="it-badge" [ngClass]="badge(p.statut)">{{ statutLabel(p.statut) }}</span></td>
              <td class="p-4 text-right whitespace-nowrap">
                @if (p.reservationId) {
                  <!-- Paiement de réservation : validé en une fois depuis l'onglet Réservations -->
                  <span class="text-xs text-on-surface-variant italic">Géré via la réservation</span>
                } @else {
                  @if (p.statut === 'EN_ATTENTE' || p.statut === 'SEQUESTRE') {
                    <button (click)="set(p.id,'VALIDE')" class="it-btn-ghost text-primary" aria-label="Valider le paiement"><span class="material-symbols-outlined">check_circle</span></button>
                    <button (click)="set(p.id,'REFUSE')" class="it-btn-ghost text-error" aria-label="Refuser le paiement"><span class="material-symbols-outlined">cancel</span></button>
                  }
                  @if (p.statut === 'VALIDE' || p.statut === 'SEQUESTRE') {
                    <button (click)="rembourser(p.id)" class="it-btn-ghost text-on-surface-variant" aria-label="Rembourser"><span class="material-symbols-outlined">undo</span></button>
                  }
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  } @else {
    <div class="it-card p-12 text-center text-on-surface-variant"><span class="material-symbols-outlined text-5xl opacity-30 mb-2">payments</span><p>Aucun paiement reçu.</p></div>
  }
  `,
})
export class PaiementsRecus implements OnInit {
  private svc = inject(PaiementService);
  private toast = inject(ToastService);
  items: PaiementResponse[] = [];
  solde: { disponible: number; enSequestre: number; rembourse: number } | null = null;
  loading = true;
  error = false;

  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true; this.error = false;
    this.svc.getPaiementsRecus().subscribe({ next: p => { this.items = this.recentFirst(p); this.loading = false; }, error: () => { this.loading = false; this.error = true; } });
    this.svc.getSolde().subscribe({ next: s => this.solde = s, error: () => {} });
  }
  set(id: number, s: string): void {
    this.svc.updateStatut(id, s as StatutPaiement).subscribe({
      next: () => { this.toast.success(s === 'VALIDE' ? 'Paiement validé.' : 'Paiement refusé.'); this.load(); },
      error: () => this.toast.error('Action impossible.'),
    });
  }
  rembourser(id: number): void {
    this.svc.rembourser(id).subscribe({
      next: () => { this.toast.success('Paiement remboursé.'); this.load(); },
      error: (e) => this.toast.error(e?.error?.message ?? 'Remboursement impossible.'),
    });
  }
  /** Plus récent en haut (par date de création, repli sur la date de paiement). */
  private recentFirst(list: PaiementResponse[]): PaiementResponse[] {
    return [...list].sort((a, b) =>
      (b.createdAt || b.datePaiement || '').localeCompare(a.createdAt || a.datePaiement || ''));
  }
  statutLabel(s: StatutPaiement): string {
    return ({ EN_ATTENTE: 'En attente', SEQUESTRE: 'En attente', VALIDE: 'Validé', REFUSE: 'Refusé', REMBOURSE: 'Remboursé' } as any)[s] ?? s;
  }
  typeLabel(t: string): string { return ({ loyer_mensuel: 'Loyer mensuel', depot_garantie: 'Caution / dépôt', acompte_reservation: 'Acompte réservation', frais_visite: 'Frais de visite' } as any)[t] ?? t; }
  modeLabel(m: string): string { return ({ mobile_money: 'Mobile Money', virement: 'Virement', especes: 'Espèces', carte: 'Carte' } as any)[m] ?? m; }
  badge(s: StatutPaiement): string {
    if (s === StatutPaiement.VALIDE) return 'bg-primary-container text-on-primary-container';
    if (s === StatutPaiement.REFUSE) return 'bg-error-container text-on-error-container';
    return 'bg-secondary-container text-on-secondary-container';
  }
}
