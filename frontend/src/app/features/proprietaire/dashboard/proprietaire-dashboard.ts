import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { LogementService } from '../../../core/services/logement.service';
import { PaiementService } from '../../../core/services/paiement.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { StatutPaiement, PaiementResponse, Reservation, ReservationStatut } from '../../../core/models';

@Component({
  selector: 'app-proprietaire-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <div class="max-w-5xl">
    <div class="flex items-center justify-between mb-8 gap-4 flex-wrap">
      <div>
        <h1 class="font-display text-3xl font-extrabold mb-1">Bonjour {{ auth.currentUser()?.prenom }} 👋</h1>
        <p class="text-on-surface-variant">Vos annonces et revenus en un coup d'œil.</p>
      </div>
      <a routerLink="/proprietaire/logements/new" class="it-btn-accent"><span class="material-symbols-outlined">add_home</span> Publier une annonce</a>
    </div>

    <!-- Alerte : mène directement à la dernière action requise (visite / réservation / paiement) -->
    @if (alertVisible) {
      <a [routerLink]="alertLink" [queryParams]="alertQuery" class="it-card p-4 mb-6 flex items-center gap-3 border border-secondary/40 hover:-translate-y-0.5 transition-transform bg-secondary-container/40">
        <span class="w-11 h-11 rounded-xl bg-secondary-container text-on-secondary-container grid place-items-center shrink-0"><span class="material-symbols-outlined">notifications_active</span></span>
        <div class="flex-1">
          <p class="font-bold text-on-surface">Action requise</p>
          <p class="text-sm text-on-surface-variant">{{ alertMsg }}</p>
        </div>
        <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
      </a>
    }

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="it-card p-5 flex items-center gap-3">
        <span class="w-11 h-11 rounded-xl bg-primary-container text-on-primary-container grid place-items-center shrink-0"><span class="material-symbols-outlined">home_work</span></span>
        <div><p class="font-display text-2xl font-extrabold">{{ stats?.totalListingsCount ?? '—' }}</p><p class="text-xs text-on-surface-variant">Annonces</p></div>
      </div>
      <div class="it-card p-5 flex items-center gap-3">
        <span class="w-11 h-11 rounded-xl bg-primary-container text-on-primary-container grid place-items-center shrink-0"><span class="material-symbols-outlined">verified</span></span>
        <div><p class="font-display text-2xl font-extrabold">{{ stats?.activeListingsCount ?? '—' }}</p><p class="text-xs text-on-surface-variant">Publiées</p></div>
      </div>
      <div class="it-card p-5 flex items-center gap-3">
        <span class="w-11 h-11 rounded-xl bg-secondary-container text-on-secondary-container grid place-items-center shrink-0"><span class="material-symbols-outlined">hourglass_top</span></span>
        <div><p class="font-display text-2xl font-extrabold">{{ stats?.pendingReservationsCount ?? '—' }}</p><p class="text-xs text-on-surface-variant">Réserv. en attente</p></div>
      </div>
      <div class="it-card p-5 flex items-center gap-3">
        <span class="w-11 h-11 rounded-xl bg-primary-container text-on-primary-container grid place-items-center shrink-0"><span class="material-symbols-outlined">visibility</span></span>
        <div><p class="font-display text-2xl font-extrabold">{{ stats?.totalViews ?? '—' }}</p><p class="text-xs text-on-surface-variant">Vues</p></div>
      </div>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      @for (t of tiles; track t.link) {
        <a [routerLink]="t.link" class="it-card p-5 hover:-translate-y-1 transition-transform">
          <span class="material-symbols-outlined text-3xl text-primary">{{ t.i }}</span>
          <p class="font-bold mt-2">{{ t.t }}</p>
        </a>
      }
    </div>
  </div>
  `,
})
export class ProprietaireDashboard implements OnInit {
  auth = inject(AuthService);
  private svc = inject(LogementService);
  private paiementSvc = inject(PaiementService);
  private reservationSvc = inject(ReservationService);
  stats: any = null;

  alertVisible = false;
  alertLink = '/proprietaire/reservations';
  alertQuery: Record<string, string> = {};
  alertMsg = '';

  ngOnInit(): void {
    this.svc.getStats().subscribe({ next: s => this.stats = s, error: () => {} });
    forkJoin({
      p: this.paiementSvc.getPaiementsRecus(),
      r: this.reservationSvc.getReceivedReservations(),
    }).subscribe({ next: ({ p, r }) => this.computeAlert(p, r), error: () => {} });
  }

  /** Bannière d'alerte : dirige vers la DERNIÈRE action requise (la plus récente) —
   *  onglet Visites, onglet Réservations, ou menu Paiements selon le cas. */
  private computeAlert(paiements: PaiementResponse[], resas: Reservation[]): void {
    const when = (x: { createdAt?: string }) => (x.createdAt ? Date.parse(x.createdAt) : 0);
    const visites = resas.filter(r => r.typeReservation === 'VISITE'
      && (r.statut === ReservationStatut.EN_ATTENTE || r.statut === ReservationStatut.VISITE_PLANIFIEE));
    const reservations = resas.filter(r => r.typeReservation !== 'VISITE'
      && (r.statut === ReservationStatut.EN_ATTENTE || r.statut === ReservationStatut.EN_ATTENTE_VALIDATION_PROPRIO));
    // Paiements de loyer courant (hors réservation : les paiements de réservation sont
    // validés via l'onglet Réservations).
    const paies = paiements.filter(p => !p.reservationId
      && (p.statut === StatutPaiement.EN_ATTENTE || p.statut === StatutPaiement.SEQUESTRE));

    const buckets = [
      { n: visites.length, when: Math.max(0, ...visites.map(when)), link: '/proprietaire/reservations', query: { tab: 'visite' }, label: `${visites.length} visite(s) à traiter` },
      { n: reservations.length, when: Math.max(0, ...reservations.map(when)), link: '/proprietaire/reservations', query: { tab: 'reservation' }, label: `${reservations.length} réservation(s) à valider` },
      { n: paies.length, when: Math.max(0, ...paies.map(when)), link: '/proprietaire/paiements', query: {} as Record<string, string>, label: `${paies.length} paiement(s) à valider` },
    ].filter(b => b.n > 0);

    if (!buckets.length) { this.alertVisible = false; return; }
    const cible = buckets.reduce((a, b) => (b.when >= a.when ? b : a));
    this.alertVisible = true;
    this.alertLink = cible.link;
    this.alertQuery = cible.query;
    this.alertMsg = buckets.map(b => b.label).join(' · ');
  }

  tiles = [
    { i: 'home_work', t: 'Mes logements', link: '/proprietaire/logements' },
    { i: 'event_available', t: 'Réservations reçues', link: '/proprietaire/reservations' },
    { i: 'payments', t: 'Paiements reçus', link: '/proprietaire/paiements' },
    { i: 'description', t: 'Contrats', link: '/proprietaire/contrats' },
    { i: 'chat', t: 'Messages', link: '/proprietaire/messages' },
  ];
}
