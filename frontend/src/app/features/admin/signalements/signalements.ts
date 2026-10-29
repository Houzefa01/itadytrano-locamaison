import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SignalementService, SignalementStatut } from '../../../core/services/signalement.service';
import { LogementService } from '../../../core/services/logement.service';
import { Logement, LogementStatut } from '../../../core/models';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { PrixAriaryPipe } from '../../../shared/pipes/prix-ariary.pipe';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-signalements',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, ImageUrlPipe, PrixAriaryPipe],
  template: `
  <h1 class="font-display text-2xl font-extrabold mb-1">Publications signalées</h1>
  <p class="text-on-surface-variant mb-6">Examinez les contenus signalés par les utilisateurs et décidez de retirer la publication ou de classer le signalement.</p>

  <!-- Filtres -->
  <div class="flex gap-2 mb-5">
    @for (f of filtres; track f.value) {
      <button (click)="filtrer(f.value)" class="it-chip"
              [class.bg-primary-container]="filtre === f.value"
              [class.text-on-primary-container]="filtre === f.value">{{ f.label }}</button>
    }
  </div>

  @if (loading) {
    <div class="space-y-3">@for (i of [1,2,3]; track i) { <div class="it-skel h-28"></div> }</div>
  } @else if (items.length) {
    <div class="space-y-3">
      @for (s of items; track s.id) {
        <div class="it-card p-4">
          <div class="flex flex-wrap items-start gap-4">
            <!-- Aperçu de la publication signalée -->
            @if (s.cible === 'LOGEMENT' && logements[s.cibleId]; as l) {
              <img [src]="photo(l) | imageUrl" class="w-28 h-24 rounded-xl object-cover bg-surface-container">
              <div class="flex-1 min-w-[200px]">
                <div class="flex items-center gap-2 mb-1">
                  <span class="it-badge bg-secondary-container text-on-secondary-container">Annonce</span>
                  <span class="it-badge" [ngClass]="badge(s.statut)">{{ statutLabel(s.statut) }}</span>
                  @if (l.statut === 'INDISPONIBLE' || l.statut === 'REJETE') {
                    <span class="it-badge bg-error/10 text-error">Retirée</span>
                  }
                </div>
                <a [routerLink]="['/logements', l.id]" class="font-bold hover:text-primary">{{ l.titre }}</a>
                <p class="text-sm text-on-surface-variant">{{ l.quartier }} · {{ l.prix | prixAriary }}/mois</p>
                <p class="text-sm mt-1"><span class="font-semibold">Motif :</span> {{ s.motif || '—' }}</p>
                <p class="text-xs text-on-surface-variant mt-1">Signalé par {{ s.signaleur?.prenom }} {{ s.signaleur?.nom }} · {{ s.createdAt | date:'short' }}</p>
              </div>
            } @else {
              <div class="flex-1 min-w-[200px]">
                <div class="flex items-center gap-2 mb-1">
                  <span class="it-badge bg-surface-container text-on-surface-variant">{{ s.cible }} #{{ s.cibleId }}</span>
                  <span class="it-badge" [ngClass]="badge(s.statut)">{{ statutLabel(s.statut) }}</span>
                </div>
                <p class="text-sm"><span class="font-semibold">Motif :</span> {{ s.motif || '—' }}</p>
                <p class="text-xs text-on-surface-variant mt-1">Signalé par {{ s.signaleur?.prenom }} {{ s.signaleur?.nom }} · {{ s.createdAt | date:'short' }}</p>
              </div>
            }

            <!-- Actions d'examen -->
            <div class="flex flex-col gap-2 w-full sm:w-auto">
              @if (s.cible === 'LOGEMENT' && logements[s.cibleId] && logements[s.cibleId].statut !== 'INDISPONIBLE' && logements[s.cibleId].statut !== 'REJETE') {
                <button (click)="retirerPublication(s)" class="it-btn-primary !py-2 text-error">
                  <span class="material-symbols-outlined">block</span> Retirer la publication
                </button>
              }
              @if (s.statut === 'EN_ATTENTE') {
                <button (click)="set(s.id,'TRAITE')" class="it-btn-outline !py-2"><span class="material-symbols-outlined">check</span> Marquer traité</button>
                <button (click)="set(s.id,'REJETE')" class="it-btn-ghost !py-2 text-sm">Rejeter le signalement</button>
              }
            </div>
          </div>
        </div>
      }
    </div>
  } @else {
    <div class="it-card p-12 text-center text-on-surface-variant"><span class="material-symbols-outlined text-5xl opacity-30 mb-2">flag</span><p>Aucune publication signalée.</p></div>
  }
  `,
})
export class AdminSignalements implements OnInit {
  private svc = inject(SignalementService);
  private logementSvc = inject(LogementService);
  private toast = inject(ToastService);

  items: any[] = [];
  logements: Record<number, Logement> = {};
  loading = true;
  filtre: SignalementStatut | '' = '';
  filtres = [
    { label: 'Tous', value: '' as const },
    { label: 'En attente', value: 'EN_ATTENTE' as const },
    { label: 'Traités', value: 'TRAITE' as const },
    { label: 'Rejetés', value: 'REJETE' as const },
  ];

  ngOnInit(): void { this.load(); }

  filtrer(f: SignalementStatut | ''): void { this.filtre = f; this.load(); }

  load(): void {
    this.loading = true;
    this.svc.all(this.filtre || undefined).subscribe({
      next: s => {
        this.items = s;
        this.loading = false;
        // Charger l'aperçu des annonces signalées (volume faible côté admin).
        const ids = new Set<number>(s.filter(x => x.cible === 'LOGEMENT').map(x => x.cibleId));
        ids.forEach(id => {
          if (!this.logements[id]) {
            this.logementSvc.getLogement(id).subscribe({ next: l => this.logements[id] = l, error: () => {} });
          }
        });
      },
      error: () => this.loading = false,
    });
  }

  photo(l: Logement): string | undefined { return l.photos?.find(p => p.principale)?.url ?? l.photos?.[0]?.url; }

  set(id: number, statut: SignalementStatut): void {
    this.svc.updateStatut(id, statut).subscribe({
      next: () => { this.toast.success(statut === 'TRAITE' ? 'Signalement traité.' : 'Signalement rejeté.'); this.load(); },
      error: () => this.toast.error('Action impossible.'),
    });
  }

  retirerPublication(s: any): void {
    // Retire l'annonce de la plateforme puis marque le signalement comme traité.
    this.logementSvc.updateStatut(s.cibleId, LogementStatut.INDISPONIBLE).subscribe({
      next: () => {
        this.svc.updateStatut(s.id, 'TRAITE').subscribe({
          next: () => { this.toast.success('Publication retirée et signalement traité.'); this.load(); },
          error: () => this.toast.error('Annonce retirée mais signalement non mis à jour.'),
        });
      },
      error: () => this.toast.error('Impossible de retirer la publication.'),
    });
  }

  statutLabel(s: string): string {
    return s === 'TRAITE' ? 'Traité' : s === 'REJETE' ? 'Rejeté' : 'En attente';
  }

  badge(s: string): string {
    if (s === 'TRAITE') return 'bg-primary-container text-on-primary-container';
    if (s === 'REJETE') return 'bg-surface-container text-on-surface-variant';
    return 'bg-secondary-container text-on-secondary-container';
  }
}
