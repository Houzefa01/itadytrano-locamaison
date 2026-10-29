import { Component, OnInit, AfterViewInit, OnDestroy, PLATFORM_ID, NgZone, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LogementService } from '../../core/services/logement.service';
import { Logement } from '../../core/models';
import { PrixAriaryPipe } from '../../shared/pipes/prix-ariary.pipe';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-carte',
  standalone: true,
  imports: [CommonModule, FormsModule, PrixAriaryPipe],
  template: `
  <div class="carte-shell">
    <!-- ── Panneau liste + filtres (gauche) ─────────────────────────────── -->
    <aside class="carte-list" [ngClass]="mobileView==='map' ? 'hidden lg:flex' : 'flex'">
      <div class="carte-list-head">
        <div class="flex items-end justify-between gap-2 mb-3">
          <div>
            <h1 class="font-display text-xl font-extrabold leading-tight">Carte des logements</h1>
            <p class="text-xs text-on-surface-variant mt-0.5">
              <b class="text-on-surface">{{ visible.length }}</b> logement(s){{ boundsActive ? ' dans cette zone' : '' }}
            </p>
          </div>
          <button (click)="locate()" class="it-btn-ghost !px-2.5 shrink-0" title="Ma position" aria-label="Ma position"><span class="material-symbols-outlined">my_location</span></button>
        </div>

        <div class="relative mb-2">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">search</span>
          <input [(ngModel)]="q" (ngModelChange)="applyFilters()" placeholder="Quartier, titre…" class="it-field !pl-10 !py-2 text-sm">
        </div>
        <select [(ngModel)]="type" (ngModelChange)="applyFilters()" class="it-field !py-2 text-sm mb-2">
          <option [ngValue]="''">Tous types</option>
          @for (t of types; track t) { <option [ngValue]="t">{{ t }}</option> }
        </select>
        <label class="it-label !text-[11px] !mb-1">Budget (Ar/mois)</label>
        <div class="grid grid-cols-2 gap-2 mb-2">
          <input [(ngModel)]="prixMin" (ngModelChange)="applyFilters()" type="number" min="0" step="10000" inputmode="numeric" placeholder="Min" class="it-field !py-2 text-sm">
          <input [(ngModel)]="prixMax" (ngModelChange)="applyFilters()" type="number" min="0" step="10000" inputmode="numeric" placeholder="Max" class="it-field !py-2 text-sm">
        </div>
        @if (q || type || prixMin || prixMax) {
          <button (click)="resetFilters()" class="text-xs text-primary font-semibold hover:underline mb-1">Réinitialiser les filtres</button>
        }
      </div>

      <div class="carte-list-scroll" #list>
        @for (l of visible; track l.id) {
          <button type="button" [id]="'card-' + l.id"
                  (mouseenter)="hover(l.id, true)" (mouseleave)="hover(l.id, false)"
                  (click)="focus(l)"
                  class="carte-card" [class.carte-card--active]="selectedId === l.id">
            <div class="carte-card-img">
              @if (photo(l)) { <img [src]="photo(l)" alt="" loading="lazy"> }
              @else { <span class="material-symbols-outlined">apartment</span> }
              <span class="carte-card-price">{{ l.prix | prixAriary }}</span>
            </div>
            <div class="carte-card-body">
              <p class="carte-card-title">{{ l.titre }}</p>
              <p class="carte-card-sub"><span class="material-symbols-outlined text-[14px]">location_on</span>{{ l.quartier }}</p>
              <div class="carte-card-meta">
                <span>{{ l.type }}</span>
                @if (l.nbrMaxPersonne) { <span>· <span class="material-symbols-outlined text-[13px]">group</span> {{ l.nbrMaxPersonne }}</span> }
                @if (l.noteMoyenne) { <span class="ml-auto text-amber-500 font-semibold"><span class="material-symbols-outlined text-[13px]" style="font-variation-settings:'FILL' 1">star</span> {{ l.noteMoyenne }}</span> }
              </div>
            </div>
          </button>
        } @empty {
          <div class="p-8 text-center text-on-surface-variant">
            <span class="material-symbols-outlined text-4xl opacity-30">map_search</span>
            <p class="text-sm mt-1">Aucun logement {{ boundsActive ? 'dans cette zone' : 'ne correspond' }}.</p>
            @if (boundsActive) { <button (click)="fitAll()" class="text-xs text-primary font-semibold hover:underline mt-1">Voir toute la carte</button> }
          </div>
        }
      </div>
    </aside>

    <!-- ── Carte (droite) ───────────────────────────────────────────────── -->
    <div class="carte-map" [ngClass]="mobileView==='list' ? 'hidden lg:block' : 'block'">
      <div id="it-map" class="w-full h-full"></div>
    </div>

    <!-- Bascule Liste/Carte (mobile) -->
    <button (click)="toggleMobile()" class="carte-fab lg:hidden">
      <span class="material-symbols-outlined">{{ mobileView === 'map' ? 'view_list' : 'map' }}</span>
      {{ mobileView === 'map' ? 'Liste' : 'Carte' }}
    </button>
  </div>
  `,
  styles: [`
    :host { display:block; }
    .carte-shell { position:relative; display:grid; grid-template-columns:1fr; height:calc(100vh - 4rem); }
    @media (min-width:1024px){ .carte-shell { grid-template-columns:minmax(340px,400px) 1fr; } }
    .carte-list { flex-direction:column; min-height:0; border-right:1px solid rgb(0 0 0 / .06); background:var(--color-surface); }
    .carte-list-head { padding:16px 16px 8px; border-bottom:1px solid var(--color-outline-variant, rgb(0 0 0 /.08)); }
    .carte-list-scroll { flex:1; overflow-y:auto; padding:10px; display:flex; flex-direction:column; gap:8px; }
    .carte-card { display:flex; gap:10px; text-align:left; padding:8px; border-radius:16px; border:1.5px solid transparent; transition:background .12s, border-color .12s, transform .12s; cursor:pointer; }
    .carte-card:hover { background:var(--color-surface-container); }
    .carte-card--active { background:var(--color-surface-container); border-color:var(--color-primary); }
    .carte-card-img { position:relative; width:96px; height:78px; border-radius:12px; overflow:hidden; flex-shrink:0; background:var(--color-surface-container-high, #e5e5e5); display:grid; place-items:center; color:var(--color-primary); }
    .carte-card-img img { width:100%; height:100%; object-fit:cover; }
    .carte-card-price { position:absolute; left:5px; bottom:5px; background:rgba(0,0,0,.72); color:#fff; font-size:11px; font-weight:800; padding:2px 7px; border-radius:9999px; }
    .carte-card-body { min-width:0; flex:1; display:flex; flex-direction:column; gap:2px; }
    .carte-card-title { font-weight:700; font-size:14px; color:var(--color-on-surface); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .carte-card-sub { font-size:12px; color:var(--color-on-surface-variant); display:flex; align-items:center; gap:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .carte-card-meta { font-size:11.5px; color:var(--color-on-surface-variant); display:flex; align-items:center; gap:4px; margin-top:2px; }
    .carte-map { position:relative; min-height:0; }
    .carte-fab { position:absolute; left:50%; bottom:20px; transform:translateX(-50%); z-index:1000; display:inline-flex; align-items:center; gap:6px;
      background:var(--color-on-surface); color:var(--color-surface); font-weight:700; font-size:14px; padding:10px 18px; border-radius:9999px; box-shadow:0 4px 16px rgba(0,0,0,.35); border:0; cursor:pointer; }
    @media (min-width:1024px){ .carte-fab { display:none; } }
  `],
})
export class Carte implements OnInit, AfterViewInit, OnDestroy {
  private svc = inject(LogementService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private zone = inject(NgZone);
  private L: any; private map: any; private meMarker: any;
  private markers = new Map<number, any>();
  private apiBase = environment.apiUrl.replace(/\/api\/v1\/?$/, '');

  private logements: Logement[] = [];   // tous les géolocalisés
  filtered: Logement[] = [];            // après filtres
  visible: Logement[] = [];             // filtrés ∩ vue courante (liste affichée)
  types: string[] = [];

  // Filtres
  q = ''; type: string = ''; prixMin: number | null = null; prixMax: number | null = null;
  selectedId: number | null = null;
  boundsActive = false;
  mobileView: 'map' | 'list' = 'map';

  ngOnInit(): void {
    this.svc.getPublishedLogements(0, 400).subscribe({
      next: p => {
        this.logements = (p.data ?? []).filter(l => l.localisation?.latitude && l.localisation?.longitude);
        this.types = [...new Set(this.logements.map(l => String(l.type)).filter(Boolean))].sort();
        this.applyFilters();
      },
      error: () => {},
    });
  }

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    this.L = await import('leaflet');
    this.map = this.L.map('it-map', { zoomControl: true, scrollWheelZoom: true }).setView([-12.2787, 49.2917], 13);

    // Fond « Plan » (CARTO Voyager) + « Satellite » (Esri) hybride avec sélecteur.
    const plan = this.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      { maxZoom: 22, maxNativeZoom: 20, attribution: '© OpenStreetMap, © CARTO' });
    const satellite = this.L.layerGroup([
      this.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 22, maxNativeZoom: 17, attribution: 'Imagery © Esri' }),
      this.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
        { maxZoom: 22, maxNativeZoom: 20, attribution: '© CARTO' }),
    ]);
    plan.addTo(this.map);
    this.L.control.layers({ 'Plan': plan, 'Satellite': satellite }, {}, { position: 'topright' }).addTo(this.map);
    this.L.control.scale({ imperial: false }).addTo(this.map);
    this.addCompass();

    // La liste suit la vue : on recalcule les logements visibles à chaque déplacement.
    this.map.on('moveend zoomend', () => this.zone.run(() => this.updateVisible()));
    this.map.on('popupopen', (e: any) => {
      const btn = e.popup.getElement()?.querySelector('[data-go]');
      if (btn) btn.addEventListener('click', () => this.router.navigate(['/logements', btn.getAttribute('data-go')]));
    });

    this.replot();
    this.fitAll();
  }

  // ── Filtres ────────────────────────────────────────────────────────────
  applyFilters(): void {
    const q = this.q.trim().toLowerCase();
    const min = this.prixMin || 0, max = this.prixMax || 0;
    this.filtered = this.logements.filter(l =>
      (!q || (l.titre + ' ' + l.quartier).toLowerCase().includes(q)) &&
      (!this.type || String(l.type) === this.type) &&
      (!min || l.prix >= min) &&
      (!max || l.prix <= max));
    this.replot();
    this.updateVisible();
  }
  resetFilters(): void { this.q = ''; this.type = ''; this.prixMin = null; this.prixMax = null; this.applyFilters(); this.fitAll(); }

  /** La liste = logements filtrés situés dans la vue courante de la carte. */
  private updateVisible(): void {
    if (this.map && this.filtered.length) {
      const b = this.map.getBounds();
      this.visible = this.filtered.filter(l => b.contains([l.localisation!.latitude, l.localisation!.longitude]));
      this.boundsActive = true;
    } else {
      this.visible = this.filtered;
      this.boundsActive = false;
    }
  }

  // ── Marqueurs ──────────────────────────────────────────────────────────
  private replot(): void {
    if (!this.map || !this.L) return;
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers.clear();
    for (const l of this.filtered) {
      const lat = l.localisation!.latitude, lng = l.localisation!.longitude;
      const icon = this.L.divIcon({
        className: 'it-price-pin', html: `<span>${this.shortPrice(l.prix)}</span>`,
        iconSize: [64, 30], iconAnchor: [32, 34], popupAnchor: [0, -34],
      });
      const marker = this.L.marker([lat, lng], { icon }).addTo(this.map).bindPopup(this.popupHtml(l), { minWidth: 240, maxWidth: 240 });
      marker.on('click', () => this.zone.run(() => this.select(l.id, false)));
      this.markers.set(l.id, marker);
    }
  }

  fitAll(): void {
    if (!this.map) return;
    const pts = this.filtered.map(l => [l.localisation!.latitude, l.localisation!.longitude] as [number, number]);
    if (pts.length > 1) this.map.fitBounds(pts, { padding: [60, 60], maxZoom: 16 });
    else if (pts.length === 1) this.map.setView(pts[0], 15);
    setTimeout(() => this.updateVisible(), 300);
  }

  // ── Synchronisation liste ↔ carte ──────────────────────────────────────
  /** Survol d'une carte (liste) => surligne le marqueur correspondant. */
  hover(id: number, on: boolean): void {
    const el = this.markers.get(id)?.getElement();
    if (el) el.classList.toggle('is-active', on || this.selectedId === id);
  }

  /** Clic sur une carte de la liste => affiche la carte (mobile), centre + popup. */
  focus(l: Logement): void {
    this.select(l.id, true);
    const go = () => {
      const m = this.markers.get(l.id);
      if (!m || !this.map) return;
      this.map.setView([l.localisation!.latitude, l.localisation!.longitude], Math.max(this.map.getZoom(), 15), { animate: true });
      m.openPopup();
    };
    if (this.mobileView !== 'map') { this.mobileView = 'map'; setTimeout(() => { this.map?.invalidateSize(); go(); }, 140); }
    else go();
  }

  /** Sélection commune : met à jour l'état + le style ; défile la liste (si visible). */
  private select(id: number, fromList: boolean): void {
    this.markers.forEach((m, key) => m.getElement()?.classList.toggle('is-active', key === id));
    this.selectedId = id;
    if (!fromList) setTimeout(() => this.scrollToCard(id), 0);
  }
  private scrollToCard(id: number): void {
    document.getElementById('card-' + id)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  toggleMobile(): void {
    this.mobileView = this.mobileView === 'map' ? 'list' : 'map';
    if (this.mobileView === 'map') setTimeout(() => this.map?.invalidateSize(), 120);
  }

  // ── Rendu ──────────────────────────────────────────────────────────────
  private shortPrice(p: number): string {
    return (p >= 1000 ? Math.round(p / 1000) + 'k' : '' + p) + ' Ar';
  }
  photo(l: Logement): string | null {
    const u = l.photos?.find(p => p.principale)?.url ?? l.photos?.[0]?.url;
    if (!u) return null;
    return u.startsWith('http') ? u : this.apiBase + (u.startsWith('/') ? u : '/' + u);
  }
  private popupHtml(l: Logement): string {
    const img = this.photo(l);
    const note = l.noteMoyenne ? `<div class="it-popup-rating"><span class="it-star">★</span> ${l.noteMoyenne} <span style="opacity:.7">(${l.nombreAvis || 0})</span></div>` : '';
    return `<div class="it-popup">
      ${img ? `<img src="${img}" alt="">` : `<div class="it-popup-noimg"><span class="material-symbols-outlined">apartment</span></div>`}
      <div class="it-popup-body">
        <div class="it-popup-title">${this.esc(l.titre)}</div>
        <div class="it-popup-sub">📍 ${this.esc(l.quartier)} · ${l.type}</div>
        ${note}
        <div class="it-popup-price">${l.prix.toLocaleString('fr-FR')} Ar<span style="font-weight:500;font-size:12px;color:var(--color-on-surface-variant)"> /mois</span></div>
        <button data-go="${l.id}" class="it-popup-btn">Voir le logement</button>
      </div>
    </div>`;
  }
  private esc(s: string): string { return (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string)); }

  // ── Boussole & géoloc ──────────────────────────────────────────────────
  private addCompass(): void {
    const ctrl = this.L.control({ position: 'topleft' });
    ctrl.onAdd = () => {
      const div = this.L.DomUtil.create('div', 'it-compass');
      div.innerHTML = `<div style="width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.95);box-shadow:0 1px 6px rgba(0,0,0,.3);position:relative;display:grid;place-items:center" title="Nord">
        <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:15px solid #e53935;position:absolute;top:4px"></div>
        <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:15px solid #9e9e9e;position:absolute;bottom:5px"></div>
        <span style="position:absolute;top:1px;font-size:9px;font-weight:800;color:#e53935">N</span></div>`;
      return div;
    };
    ctrl.addTo(this.map);
  }

  locate(): void {
    if (!navigator.geolocation || !this.map) return;
    if (this.mobileView !== 'map') { this.mobileView = 'map'; setTimeout(() => this.map?.invalidateSize(), 120); }
    navigator.geolocation.getCurrentPosition(pos => {
      const ll: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      this.map.setView(ll, 15);
      const icon = this.L.divIcon({ className: 'it-me-pin', html: '<span></span>', iconSize: [18, 18], iconAnchor: [9, 9] });
      if (this.meMarker) this.meMarker.setLatLng(ll); else this.meMarker = this.L.marker(ll, { icon }).addTo(this.map).bindPopup('Vous êtes ici');
    }, () => {});
  }

  ngOnDestroy(): void { if (this.map) { this.map.off(); this.map.remove(); } }
}
