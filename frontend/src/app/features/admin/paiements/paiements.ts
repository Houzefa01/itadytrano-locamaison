import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaiementService } from '../../../core/services/paiement.service';
import { PaiementResponse, StatutPaiement } from '../../../core/models';
import { PrixAriaryPipe } from '../../../shared/pipes/prix-ariary.pipe';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-paiements',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, PrixAriaryPipe],
  template: `
  <div class="flex items-center justify-between mb-6 gap-4 flex-wrap">
    <h1 class="font-display text-2xl font-extrabold">Paiements</h1>
    <select [ngModel]="filter" (ngModelChange)="filter=$event; load()" class="it-field !w-auto" aria-label="Filtrer par statut">
      <option value="">Tous</option>
      <option value="EN_ATTENTE">En attente</option><option value="SEQUESTRE">En séquestre</option>
      <option value="VALIDE">Validés</option><option value="REFUSE">Refusés</option>
    </select>
  </div>
  @if (loading) {
    <div class="space-y-2">@for (i of [1,2,3]; track i) { <div class="it-skel h-14"></div> }</div>
  } @else if (error) {
    <div class="it-card p-12 text-center text-on-surface-variant">
      <span class="material-symbols-outlined text-5xl text-error/60 mb-2">cloud_off</span>
      <p class="mb-4">Impossible de charger les paiements.</p>
      <button (click)="load()" class="it-btn-primary">Réessayer</button>
    </div>
  } @else {
    <div class="it-card overflow-x-auto">
      <table class="w-full text-left min-w-[980px]">
        <thead class="text-[11px] uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/40">
          <tr><th class="p-4">Réf.</th><th class="p-4">Origine (locataire)</th><th class="p-4">Destination (bailleur)</th><th class="p-4">Logement</th><th class="p-4">Motif</th><th class="p-4">Mode</th><th class="p-4">Montant</th><th class="p-4">Date &amp; heure</th><th class="p-4">Statut</th></tr>
        </thead>
        <tbody class="divide-y divide-outline-variant/30">
          @for (p of items; track p.id) {
            <tr>
              <td class="p-4 font-mono text-xs text-primary">{{ p.referenceTransaction }}</td>
              <td class="p-4 text-sm">{{ p.etudiant?.prenom }} {{ p.etudiant?.nom }}<span class="block text-[11px] text-on-surface-variant">{{ p.etudiant?.telephone }}</span></td>
              <td class="p-4 text-sm">{{ p.bailleur ? (p.bailleur.prenom + ' ' + p.bailleur.nom) : '—' }}<span class="block text-[11px] text-on-surface-variant">{{ p.bailleur?.telephone }}</span></td>
              <td class="p-4 text-sm text-on-surface-variant truncate max-w-[140px]">{{ p.logementTitre }}</td>
              <td class="p-4 text-sm">{{ typeLabel(p.typePaiement) }}</td>
              <td class="p-4 text-sm text-on-surface-variant">{{ modeLabel(p.mode) }}</td>
              <td class="p-4 font-bold">{{ p.montant | prixAriary }}</td>
              <td class="p-4 text-sm text-on-surface-variant whitespace-nowrap">{{ (p.createdAt || p.datePaiement) | date:'d MMM y, HH:mm' }}</td>
              <td class="p-4"><span class="it-badge" [ngClass]="badge(p.statut)">{{ statutLabel(p.statut) }}</span></td>
            </tr>
          } @empty { <tr><td colspan="9" class="p-10 text-center text-on-surface-variant italic">Aucun paiement.</td></tr> }
        </tbody>
      </table>
    </div>
  }
  `,
})
export class AdminPaiements implements OnInit {
  private svc = inject(PaiementService);
  private toast = inject(ToastService);
  items: PaiementResponse[] = [];
  loading = true;
  error = false;
  filter = '';

  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true; this.error = false;
    this.svc.getAllPaiements((this.filter || undefined) as StatutPaiement | undefined).subscribe({ next: p => { this.items = p; this.loading = false; }, error: () => { this.loading = false; this.error = true; } });
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
