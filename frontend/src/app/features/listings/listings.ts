import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LogementService } from '../../core/services/logement.service';
import { FavorisService } from '../../core/services/favoris.service';
import { AuthService } from '../../core/services/auth.service';
import { RechercheService } from '../../core/services/recherche.service';
import { Logement, PagedResult, LogementFilters, LogementType, AmenityCode, LOGEMENT_TYPE_LABELS } from '../../core/models';
import { LogementCard } from '../../shared/components/logement-card/logement-card';

@Component({
  selector: 'app-listings',
  standalone: true,
  imports: [CommonModule, FormsModule, LogementCard],
  template: `
  <div class="it-page py-8">
    <div class="flex items-end justify-between gap-4 flex-wrap mb-6">
      <div>
        <h1 class="font-display text-3xl font-extrabold mb-1">Logements à Antsiranana</h1>
        <p class="text-on-surface-variant">{{ result?.total ?? 0 }} logement(s) trouvé(s)</p>
      </div>
      <select [(ngModel)]="sortBy" (ngModelChange)="applySort()" class="it-field !w-auto" aria-label="Trier les résultats">
        <option value="">Trier : pertinence</option>
        <option value="price_asc">Prix croissant</option>
        <option value="price_desc">Prix décroissant</option>
        <option value="note">Mieux notés</option>
      </select>
    </div>

    <div class="grid lg:grid-cols-[260px_1fr] gap-6 items-start">
      <!-- Filtres -->
      <aside class="it-card p-5 lg:sticky lg:top-20 space-y-4">
        <h2 class="font-bold">Filtres</h2>
        <div>
          <label class="it-label">Quartier</label>
          <select [(ngModel)]="f.quartier" (ngModelChange)="reset()" class="it-field">
            <option value="">Tous</option>
            @for (q of quartiers; track q) { <option [value]="q">{{ q }}</option> }
          </select>
        </div>
        <div>
          <label class="it-label">Budget (Ar)</label>
          <div class="flex gap-2">
            <input [(ngModel)]="f.prixMin" (change)="reset()" type="number" class="it-field" placeholder="Min">
            <input [(ngModel)]="f.prixMax" (change)="reset()" type="number" class="it-field" placeholder="Max">
          </div>
        </div>
        <div>
          <label class="it-label">Type</label>
          <select [(ngModel)]="f.type" (ngModelChange)="reset()" class="it-field">
            <option value="">Tous</option>
            @for (t of types; track t.v) { <option [value]="t.v">{{ t.l }}</option> }
          </select>
        </div>
        <div>
          <label class="it-label">Commodités</label>
          <div class="space-y-1.5">
            @for (a of amenityOptions; track a.v) {
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" [checked]="selected.has(a.v)" (change)="toggleAmenity(a.v)" class="accent-primary"> {{ a.l }}
              </label>
            }
          </div>
        </div>
      </aside>

      <!-- Résultats -->
      <section>
        @if (loading) {
          <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            @for (i of [1,2,3,4,5,6]; track i) { <div class="it-skel aspect-[3/4]"></div> }
          </div>
        } @else if (result && result.data.length) {
          <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            @for (l of result.data; track l.id) {
              <app-logement-card [logement]="l" [favori]="favoris.has(l.id)" baseLink="/logements" (favorisChange)="toggleFav($event)" />
            }
          </div>
          @if (totalPages() > 1) {
            <div class="flex justify-center gap-2 mt-8">
              <button (click)="go(page-1)" [disabled]="page===0" class="it-btn-outline !px-3 disabled:opacity-40"><span class="material-symbols-outlined">chevron_left</span></button>
              <span class="it-btn-ghost pointer-events-none">{{ page+1 }} / {{ totalPages() }}</span>
              <button (click)="go(page+1)" [disabled]="page+1>=totalPages()" class="it-btn-outline !px-3 disabled:opacity-40"><span class="material-symbols-outlined">chevron_right</span></button>
            </div>
          }
        } @else {
          <div class="it-card p-12 text-center text-on-surface-variant">
            <span class="material-symbols-outlined text-5xl opacity-30 mb-2">search_off</span>
            <p>Aucun logement ne correspond à vos critères.</p>
          </div>
        }
      </section>
    </div>
  </div>
  `,
})
export class Listings implements OnInit {
  private svc = inject(LogementService);
  private favSvc = inject(FavorisService);
  private auth = inject(AuthService);
  private recherche = inject(RechercheService);
  private route = inject(ActivatedRoute);

  result: PagedResult<Logement> | null = null;
  loading = true;
  page = 0;
  size = 12;
  sortBy = '';
  favoris = new Set<number>();
  selected = new Set<AmenityCode>();

  f = { quartier: '', prixMin: null as number | null, prixMax: null as number | null, type: '' as '' | LogementType };

  quartiers = ['Centre-Ville', 'Tanambao', 'Beau Séjour', 'Ankorrikika', 'Lazaret', 'SCAMA', 'Ambalavola', 'Colline Nord', 'Grand Pavois', 'Boulevard'];
  types = [
    { v: LogementType.STUDIO, l: LOGEMENT_TYPE_LABELS[LogementType.STUDIO] },
    { v: LogementType.CHAMBRE, l: LOGEMENT_TYPE_LABELS[LogementType.CHAMBRE] },
    { v: LogementType.APPARTEMENT, l: LOGEMENT_TYPE_LABELS[LogementType.APPARTEMENT] },
    { v: LogementType.MAISON, l: LOGEMENT_TYPE_LABELS[LogementType.MAISON] },
  ];
  amenityOptions = [
    { v: AmenityCode.EAU, l: 'Eau' }, { v: AmenityCode.ELECTRICITE, l: 'Électricité' },
    { v: AmenityCode.DOUCHE, l: 'Douche' }, { v: AmenityCode.MEUBLE, l: 'Meublé' },
  ];

  ngOnInit(): void {
    const loc = this.route.snapshot.queryParamMap.get('location');
    if (loc) this.f.quartier = loc;
    this.load();
    if (this.auth.getToken()) {
      this.favSvc.getMesFavoris().subscribe({ next: f => this.favoris = new Set(f.map(x => x.id)), error: () => {} });
    }
  }

  totalPages(): number { return Math.ceil((this.result?.total ?? 0) / this.size); }

  load(): void {
    this.loading = true;
    const filters: LogementFilters = {
      quartier: this.f.quartier || undefined,
      prixMin: this.f.prixMin ?? undefined,
      prixMax: this.f.prixMax ?? undefined,
      type: this.f.type || undefined,
      amenities: this.selected.size ? [...this.selected] : undefined,
    };
    this.svc.getPublishedLogements(this.page, this.size, filters).subscribe({
      next: r => { this.result = r; this.applySort(); this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  applySort(): void {
    if (!this.result) return;
    const d = [...this.result.data];
    if (this.sortBy === 'price_asc') d.sort((a, b) => a.prix - b.prix);
    else if (this.sortBy === 'price_desc') d.sort((a, b) => b.prix - a.prix);
    else if (this.sortBy === 'note') d.sort((a, b) => (b.noteMoyenne ?? 0) - (a.noteMoyenne ?? 0));
    this.result = { ...this.result, data: d };
  }

  reset(): void { this.page = 0; this.load(); this.recordSearch(); }

  private recordSearch(): void {
    if (!this.auth.getToken()) return;
    const parts: string[] = [];
    if (this.f.quartier) parts.push('quartier=' + this.f.quartier);
    if (this.f.prixMin) parts.push('prixMin=' + this.f.prixMin);
    if (this.f.prixMax) parts.push('prixMax=' + this.f.prixMax);
    if (this.f.type) parts.push('type=' + this.f.type);
    if (this.selected.size) parts.push('amenities=' + [...this.selected].join(','));
    if (parts.length) this.recherche.record(parts.join('&')).subscribe({ error: () => {} });
  }
  go(p: number): void { if (p < 0 || p >= this.totalPages()) return; this.page = p; this.load(); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  toggleAmenity(a: AmenityCode): void {
    this.selected.has(a) ? this.selected.delete(a) : this.selected.add(a);
    this.reset();
  }

  toggleFav(id: number): void {
    if (!this.auth.getToken()) return;
    const had = this.favoris.has(id);
    had ? this.favoris.delete(id) : this.favoris.add(id);
    this.favSvc.toggleFavori(id).subscribe({ next: (r: any) => { r?.ajout ? this.favoris.add(id) : this.favoris.delete(id); }, error: () => { had ? this.favoris.add(id) : this.favoris.delete(id); } });
  }
}
