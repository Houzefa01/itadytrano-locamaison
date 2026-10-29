import { Component, AfterViewInit, OnDestroy, Input, Output, EventEmitter, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

const DIEGO: [number, number] = [-12.2787, 49.2917];

@Component({
  selector: 'app-map-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="space-y-2">
    <div class="flex gap-2">
      <input [(ngModel)]="query" (keyup.enter)="search($event)" class="it-field" placeholder="Rechercher une adresse / un quartier…">
      <button type="button" (click)="search($event)" class="it-btn-outline !px-3" title="Rechercher" aria-label="Rechercher l'adresse"><span class="material-symbols-outlined">search</span></button>
      <button type="button" (click)="locate()" class="it-btn-outline !px-3" title="Ma position" aria-label="Utiliser ma position"><span class="material-symbols-outlined">my_location</span></button>
    </div>
    <div id="it-map-picker" class="w-full h-72 rounded-2xl overflow-hidden border border-outline-variant/40 bg-surface-container z-0"></div>
    @if (lat && lng) {
      <p class="text-xs text-primary font-medium flex items-center gap-1"><span class="material-symbols-outlined text-[15px]">place</span> Emplacement défini ({{ lat | number:'1.4-4' }}, {{ lng | number:'1.4-4' }}) — déplacez le repère si besoin.</p>
    } @else {
      <p class="text-xs text-on-surface-variant flex items-center gap-1"><span class="material-symbols-outlined text-[15px]">touch_app</span> Cliquez sur la carte pour placer le logement.</p>
    }
  </div>
  `,
})
export class MapPicker implements AfterViewInit, OnDestroy {
  @Input() lat: number | null = null;
  @Input() lng: number | null = null;
  @Output() latChange = new EventEmitter<number>();
  @Output() lngChange = new EventEmitter<number>();

  query = '';
  private platformId = inject(PLATFORM_ID);
  private L: any; private map: any; private marker: any;

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    this.L = await import('leaflet');
    const start: [number, number] = (this.lat && this.lng) ? [this.lat, this.lng] : DIEGO;
    this.map = this.L.map('it-map-picker').setView(start, this.lat ? 16 : 13);
    // Plan + Satellite (sélecteur), avec maxNativeZoom pour éviter les tuiles grises au zoom max.
    const plan = this.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 22, maxNativeZoom: 20, attribution: '© OpenStreetMap, © CARTO' });
    const satellite = this.L.layerGroup([
      this.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 22, maxNativeZoom: 17, attribution: 'Imagery © Esri' }),
      this.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', { maxZoom: 22, maxNativeZoom: 20 }),
    ]);
    plan.addTo(this.map);
    this.L.control.layers({ 'Plan': plan, 'Satellite': satellite }, {}, { position: 'topright' }).addTo(this.map);
    const compass = this.L.control({ position: 'topleft' });
    compass.onAdd = () => {
      const div = this.L.DomUtil.create('div', 'it-compass');
      div.innerHTML = `<div style="width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.95);box-shadow:0 1px 6px rgba(0,0,0,.3);position:relative;display:grid;place-items:center" title="Nord">
        <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:15px solid #e53935;position:absolute;top:4px"></div>
        <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:15px solid #9e9e9e;position:absolute;bottom:5px"></div>
        <span style="position:absolute;top:1px;font-size:9px;font-weight:800;color:#e53935">N</span></div>`;
      return div;
    };
    compass.addTo(this.map);
    this.map.on('click', (e: any) => this.place(e.latlng.lat, e.latlng.lng));
    if (this.lat && this.lng) this.place(this.lat, this.lng, false);
    setTimeout(() => this.map.invalidateSize(), 200);
  }

  private place(lat: number, lng: number, fly = true): void {
    this.lat = lat; this.lng = lng;
    this.latChange.emit(lat); this.lngChange.emit(lng);
    const icon = this.L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41],
    });
    if (!this.marker) {
      this.marker = this.L.marker([lat, lng], { icon, draggable: true }).addTo(this.map);
      this.marker.on('dragend', () => { const p = this.marker.getLatLng(); this.lat = p.lat; this.lng = p.lng; this.latChange.emit(p.lat); this.lngChange.emit(p.lng); });
    } else {
      this.marker.setLatLng([lat, lng]);
    }
    if (fly) this.map.setView([lat, lng], Math.max(this.map.getZoom(), 16));
  }

  async search(e?: Event): Promise<void> {
    e?.preventDefault();
    if (!this.query.trim()) return;
    try {
      const q = encodeURIComponent(this.query + ', Antsiranana, Madagascar');
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`);
      const data = await res.json();
      if (data?.length) this.place(parseFloat(data[0].lat), parseFloat(data[0].lon));
    } catch { /* best-effort */ }
  }

  locate(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => this.place(pos.coords.latitude, pos.coords.longitude),
      () => { /* refusé/indisponible */ },
    );
  }

  ngOnDestroy(): void { if (this.map) { this.map.off(); this.map.remove(); } }
}
