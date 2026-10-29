import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LogementService } from '../../../core/services/logement.service';
import { Logement, LogementStatut, LOGEMENT_STATUT_LABELS } from '../../../core/models';
import { ImageUrlPipe } from '../../../shared/pipes/image-url.pipe';
import { PrixAriaryPipe } from '../../../shared/pipes/prix-ariary.pipe';
import { ToastService } from '../../../core/services/toast.service';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-mes-logements',
  standalone: true,
  imports: [CommonModule, RouterLink, ImageUrlPipe, PrixAriaryPipe],
  template: `
  <div class="flex items-center justify-between mb-6 gap-4 flex-wrap">
    <h1 class="font-display text-2xl font-extrabold">Mes logements</h1>
    <a routerLink="/proprietaire/logements/new" class="it-btn-accent"><span class="material-symbols-outlined">add_home</span> Publier</a>
  </div>

  @if (loading) {
    <div class="space-y-3">@for (i of [1,2,3]; track i) { <div class="it-skel h-28"></div> }</div>
  } @else if (error) {
    <div class="it-card p-12 text-center text-on-surface-variant">
      <span class="material-symbols-outlined text-5xl text-error/60 mb-2">cloud_off</span>
      <p class="mb-4">Impossible de charger vos annonces.</p>
      <button (click)="load()" class="it-btn-primary">Réessayer</button>
    </div>
  } @else if (items.length) {
    <div class="space-y-3">
      @for (l of items; track l.id) {
        <div class="it-card p-3 flex flex-wrap items-center gap-4">
          <img [src]="photo(l) | imageUrl" class="w-24 h-20 rounded-xl object-cover bg-surface-container" alt="">
          <div class="flex-1 min-w-[160px]">
            <p class="font-bold">{{ l.titre }}</p>
            <p class="text-sm text-on-surface-variant">{{ l.quartier }} · {{ l.prix | prixAriary }}/mois</p>
          </div>
          <span class="it-badge" [ngClass]="badge(l.statut)">{{ STATUT[l.statut] }}</span>
          @if (verrouille(l)) {
            <span class="it-badge bg-secondary-container text-on-secondary-container flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">lock</span> Réservé / occupé</span>
          }
          <div class="flex gap-1">
            <a [routerLink]="['/logements', l.id]" class="it-btn-ghost !px-2" title="Voir" aria-label="Voir l'annonce"><span class="material-symbols-outlined">visibility</span></a>
            @if (verrouille(l)) {
              <span class="it-btn-ghost !px-2 opacity-40 cursor-not-allowed" title="Occupé ou réservé — modification impossible" aria-disabled="true"><span class="material-symbols-outlined">edit_off</span></span>
            } @else {
              <a [routerLink]="['/proprietaire/logements', l.id, 'edit']" class="it-btn-ghost !px-2" title="Éditer" aria-label="Éditer l'annonce"><span class="material-symbols-outlined">edit</span></a>
            }
            @if (verrouille(l)) {
              <span class="it-btn-ghost !px-2 opacity-40 cursor-not-allowed" title="Occupé ou réservé — créneaux indisponibles" aria-disabled="true"><span class="material-symbols-outlined">event_busy</span></span>
            } @else {
              <a [routerLink]="['/proprietaire/logements', l.id, 'creneaux']" class="it-btn-ghost !px-2" title="Créneaux de visite" aria-label="Gérer les créneaux"><span class="material-symbols-outlined">calendar_month</span></a>
            }
            @if (l.statut !== 'PUBLIE') {
              <button (click)="publier(l)" class="it-btn-ghost !px-2 text-primary" title="Publier" aria-label="Publier l'annonce"><span class="material-symbols-outlined">publish</span></button>
            }
            <button (click)="supprimer(l)" [disabled]="verrouille(l)" class="it-btn-ghost !px-2 text-error disabled:opacity-40 disabled:cursor-not-allowed" [title]="verrouille(l) ? 'Occupé ou réservé — suppression impossible' : 'Supprimer'" aria-label="Supprimer l'annonce"><span class="material-symbols-outlined">delete</span></button>
          </div>
        </div>
      }
    </div>
  } @else {
    <div class="it-card p-12 text-center text-on-surface-variant">
      <span class="material-symbols-outlined text-5xl opacity-30 mb-2">home_work</span>
      <p class="mb-4">Vous n'avez pas encore d'annonce.</p>
      <a routerLink="/proprietaire/logements/new" class="it-btn-primary">Publier ma première annonce</a>
    </div>
  }
  `,
})
export class MesLogements implements OnInit {
  private svc = inject(LogementService);
  private toast = inject(ToastService);
  private dialog = inject(DialogService);
  items: Logement[] = [];
  loading = true;
  error = false;
  readonly STATUT = LOGEMENT_STATUT_LABELS;

  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true; this.error = false;
    this.svc.getMyLogements(0, 50).subscribe({ next: p => { this.items = p.data; this.loading = false; }, error: () => { this.loading = false; this.error = true; } });
  }

  photo(l: Logement): string | undefined { return l.photos?.find(p => p.principale)?.url ?? l.photos?.[0]?.url; }
  // Occupé (contrat actif) ou réservé (proprio a accepté) => disponible=false : figé.
  verrouille(l: Logement): boolean { return l.disponible === false; }
  badge(s: LogementStatut): string {
    if (s === LogementStatut.PUBLIE) return 'bg-primary-container text-on-primary-container';
    if (s === LogementStatut.REJETE) return 'bg-error-container text-on-error-container';
    return 'bg-secondary-container text-on-secondary-container';
  }
  publier(l: Logement): void {
    this.svc.updateStatut(l.id, LogementStatut.PUBLIE).subscribe({
      next: () => { this.toast.success('Annonce publiée.'); this.load(); },
      error: () => this.toast.error('Publication impossible.'),
    });
  }
  async supprimer(l: Logement): Promise<void> {
    const ok = await this.dialog.confirm('Supprimer cette annonce ?', `« ${l.titre} » sera définitivement supprimée.`, { confirmLabel: 'Supprimer', danger: true });
    if (!ok) return;
    this.svc.deleteLogement(l.id).subscribe({
      next: () => { this.toast.success('Annonce supprimée.'); this.load(); },
      error: (e) => this.toast.error(e?.error?.message ?? 'Suppression impossible.'),
    });
  }
}
