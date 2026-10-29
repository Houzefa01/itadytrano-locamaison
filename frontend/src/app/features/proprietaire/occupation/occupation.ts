import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { LogementService } from '../../../core/services/logement.service';
import { ContratService } from '../../../core/services/contrat.service';
import { PaiementService } from '../../../core/services/paiement.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogService } from '../../../core/services/dialog.service';
import { Logement, ContratResponse, PaiementResponse, StatutPaiement, StatutContrat } from '../../../core/models';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { PrixAriaryPipe } from '../../../shared/pipes/prix-ariary.pipe';

@Component({
  selector: 'app-occupation',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, ImageUrlPipe, PrixAriaryPipe],
  template: `
  <h1 class="font-display text-2xl font-extrabold mb-1">Occupation & occupants</h1>
  <p class="text-on-surface-variant mb-6">Gérez vos logements occupés et leurs locataires.</p>

  @if (loading) {
    <div class="space-y-3">@for (i of [1,2,3]; track i) { <div class="it-skel h-28"></div> }</div>
  } @else if (error) {
    <div class="it-card p-12 text-center text-on-surface-variant">
      <span class="material-symbols-outlined text-5xl text-error/60 mb-2">cloud_off</span>
      <p class="mb-4">Impossible de charger l'occupation.</p>
      <button (click)="load()" class="it-btn-primary">Réessayer</button>
    </div>
  } @else if (logements.length) {
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="it-card p-4"><p class="font-display text-2xl font-extrabold text-primary">{{ libres() }}</p><p class="text-xs text-on-surface-variant">Disponibles</p></div>
      <div class="it-card p-4"><p class="font-display text-2xl font-extrabold text-secondary">{{ occupes() }}</p><p class="text-xs text-on-surface-variant">Occupés / réservés</p></div>
      <div class="it-card p-4"><p class="font-display text-2xl font-extrabold text-primary">{{ contrats.length }}</p><p class="text-xs text-on-surface-variant">Baux actifs</p></div>
      <div class="it-card p-4"><p class="font-display text-2xl font-extrabold text-primary">{{ logements.length }}</p><p class="text-xs text-on-surface-variant">Total</p></div>
    </div>

    <div class="space-y-3">
      @for (l of logements; track l.id) {
        <div class="it-card p-3 flex flex-wrap items-center gap-4">
          <img [src]="photo(l) | imageUrl" class="w-20 h-16 rounded-xl object-cover bg-surface-container" alt="">
          <div class="flex-1 min-w-[160px]">
            <a [routerLink]="['/logements', l.id]" class="font-bold hover:text-primary">{{ l.titre }}</a>
            <p class="text-sm text-on-surface-variant">{{ l.quartier }} · {{ l.prix | prixAriary }}/mois</p>
            @if (!l.disponible && occupant(l); as c) {
              <p class="text-sm text-on-surface mt-0.5">
                <span class="material-symbols-outlined text-[15px] text-primary">person</span>
                {{ c.etudiantNom }} · occupé jusqu'au {{ c.dateFin ? (c.dateFin | date:'mediumDate') : 'durée indéterminée' }}
              </p>
              <p class="mt-1">
                @if (loyerPayeCeMois(l)) {
                  <span class="it-badge bg-primary-container text-on-primary-container"><span class="material-symbols-outlined text-[13px] fill-1">check</span> Loyer payé ce mois</span>
                } @else {
                  <span class="it-badge bg-secondary-container text-on-secondary-container">Loyer en attente ce mois</span>
                }
              </p>
            }
          </div>
          @if (l.disponible) {
            <span class="it-badge bg-primary-container text-on-primary-container">Disponible</span>
          } @else {
            <span class="it-badge bg-secondary-container text-on-secondary-container">{{ occupant(l) ? 'Occupé' : 'Réservé' }}</span>
            <button (click)="liberer(l)" class="it-btn-outline !py-2"><span class="material-symbols-outlined">lock_open</span> Libérer</button>
          }
        </div>
      }
    </div>
  } @else {
    <div class="it-card p-12 text-center text-on-surface-variant">
      <span class="material-symbols-outlined text-5xl opacity-30 mb-2">home_work</span>
      <p class="mb-4">Aucun logement.</p>
      <a routerLink="/proprietaire/logements/new" class="it-btn-primary">Publier une annonce</a>
    </div>
  }
  `,
})
export class OccupationProprietaire implements OnInit {
  private logementSvc = inject(LogementService);
  private contratSvc = inject(ContratService);
  private paiementSvc = inject(PaiementService);
  private toast = inject(ToastService);
  private dialog = inject(DialogService);
  logements: Logement[] = [];
  contrats: ContratResponse[] = [];
  payments: PaiementResponse[] = [];
  loading = true;
  error = false;

  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true; this.error = false;
    forkJoin({
      logements: this.logementSvc.getMyLogements(0, 100),
      contrats: this.contratSvc.getMesContratsProprietaire(),
      paiements: this.paiementSvc.getPaiementsRecus(),
    }).subscribe({
      next: ({ logements, contrats, paiements }) => { this.logements = logements.data; this.contrats = contrats; this.payments = paiements; this.loading = false; },
      error: () => { this.loading = false; this.error = true; },
    });
  }

  photo(l: Logement): string | undefined { return l.photos?.find(p => p.principale)?.url ?? l.photos?.[0]?.url; }
  occupant(l: Logement): ContratResponse | undefined {
    return this.contrats.find(c => c.logementId === l.id && c.statut === StatutContrat.ACTIF);
  }
  loyerPayeCeMois(l: Logement): boolean {
    const now = new Date();
    return this.payments.some(p => p.logementTitre === l.titre && p.statut === StatutPaiement.VALIDE
      && p.typePaiement === 'loyer_mensuel'
      && new Date(p.datePaiement).getMonth() === now.getMonth()
      && new Date(p.datePaiement).getFullYear() === now.getFullYear());
  }
  libres(): number { return this.logements.filter(l => l.disponible).length; }
  occupes(): number { return this.logements.filter(l => !l.disponible).length; }

  async liberer(l: Logement): Promise<void> {
    const bail = this.occupant(l);
    if (bail) {
      // Logement occupé : on met fin au bail (libère + clôture la réservation côté locataire).
      const ok = await this.dialog.confirm('Mettre fin au bail ?',
        `Le bail de « ${l.titre} » sera terminé, le logement redeviendra disponible et le locataire ne paiera plus de loyer.`,
        { confirmLabel: 'Mettre fin au bail', danger: true });
      if (!ok) return;
      this.contratSvc.terminerBail(bail.id).subscribe({
        next: () => { this.toast.success('Bail terminé — logement de nouveau disponible.'); this.load(); },
        error: (e) => this.toast.error(e?.error?.message ?? 'Action impossible.'),
      });
      return;
    }
    // Logement seulement réservé (sans bail) : on le rend disponible.
    const ok = await this.dialog.confirm('Libérer ce logement ?', `« ${l.titre} » redeviendra visible dans les annonces.`, { confirmLabel: 'Libérer' });
    if (!ok) return;
    this.logementSvc.updateAvailability(l.id, true).subscribe({
      next: () => { this.toast.success('Logement libéré — de nouveau disponible.'); this.load(); },
      error: () => this.toast.error('Action impossible.'),
    });
  }
}
