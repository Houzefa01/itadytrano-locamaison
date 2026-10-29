import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FavorisService } from '../../../core/services/favoris.service';
import { Logement } from '../../../core/models';
import { LogementCard } from '../../../shared/components/logement-card/logement-card';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-favoris',
  standalone: true,
  imports: [CommonModule, RouterLink, LogementCard],
  template: `
  <h1 class="font-display text-2xl font-extrabold mb-6">Mes favoris</h1>
  @if (loading) {
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">@for (i of [1,2,3]; track i) { <div class="it-skel aspect-[3/4]"></div> }</div>
  } @else if (error) {
    <div class="it-card p-12 text-center text-on-surface-variant">
      <span class="material-symbols-outlined text-5xl text-error/60 mb-2">cloud_off</span>
      <p class="mb-4">Impossible de charger vos favoris.</p>
      <button (click)="load()" class="it-btn-primary">Réessayer</button>
    </div>
  } @else if (items.length) {
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      @for (l of items; track l.id) {
        <app-logement-card [logement]="l" [favori]="true" baseLink="/logements" (favorisChange)="remove($event)" />
      }
    </div>
  } @else {
    <div class="it-card p-12 text-center text-on-surface-variant">
      <span class="material-symbols-outlined text-5xl opacity-30 mb-2">favorite</span>
      <p class="mb-4">Aucun favori pour l'instant.</p>
      <a routerLink="/etudiant/explorer" class="it-btn-primary">Explorer les logements</a>
    </div>
  }
  `,
})
export class Favoris implements OnInit {
  private fav = inject(FavorisService);
  private toast = inject(ToastService);
  items: Logement[] = [];
  loading = true;
  error = false;

  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true; this.error = false;
    this.fav.getMesFavoris().subscribe({ next: f => { this.items = f; this.loading = false; }, error: () => { this.loading = false; this.error = true; } });
  }
  remove(id: number): void {
    this.fav.toggleFavori(id).subscribe({
      next: () => { this.items = this.items.filter(x => x.id !== id); this.toast.success('Retiré des favoris.'); },
      error: () => this.toast.error('Action impossible.'),
    });
  }
}
