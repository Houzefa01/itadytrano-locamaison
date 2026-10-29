import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LogementService } from '../../core/services/logement.service';
import { FavorisService } from '../../core/services/favoris.service';
import { AuthService } from '../../core/services/auth.service';
import { Logement } from '../../core/models';
import { LogementCard } from '../../shared/components/logement-card/logement-card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LogementCard],
  template: `
  <!-- HERO -->
  <section class="relative overflow-hidden text-white" style="background:radial-gradient(120% 120% at 80% 0%, #3B2A6B, #241B3A 55%, #170F2B)">
    <div class="absolute -right-24 -top-24 w-96 h-96 rounded-full blur-3xl opacity-30" style="background:#8B5CF6"></div>
    <div class="absolute right-1/4 bottom-0 w-72 h-72 rounded-full blur-3xl opacity-20" style="background:#F59E0B"></div>
    <div class="it-page relative py-16 md:py-24 grid lg:grid-cols-[1.4fr_1fr] gap-12 items-center">
      <div>
        <span class="it-eyebrow !text-secondary-fixed-dim mb-5"><span class="w-1.5 h-1.5 rounded-full bg-secondary-container"></span> Antsiranana · tiers de confiance</span>
        <h1 class="font-display text-4xl md:text-6xl font-extrabold leading-[1.02] tracking-tight mb-5">
          Se loger à Diego,<br><span style="color:#F59E0B">sans mauvaise surprise.</span>
        </h1>
        <p class="text-white/70 text-lg max-w-xl mb-8">LocaMaison sécurise chaque étape — de la visite au paiement du loyer. Annonces vérifiées, contrats numériques, fonds protégés.</p>

        <div class="flex flex-col sm:flex-row gap-2 bg-white rounded-2xl p-2 max-w-xl shadow-2xl">
          <div class="flex items-center gap-2 px-3 flex-1 rounded-xl bg-surface-container-low">
            <span class="material-symbols-outlined text-primary">location_on</span>
            <select [(ngModel)]="loc" class="bg-transparent py-3 w-full outline-none text-on-surface font-medium text-sm">
              <option value="">Tous les quartiers</option>
              @for (q of quartiers; track q) { <option [value]="q">{{ q }}</option> }
            </select>
          </div>
          <a [routerLink]="['/logements']" [queryParams]="{ location: loc }" class="it-btn-accent justify-center px-6 py-3">
            <span class="material-symbols-outlined">search</span> Chercher
          </a>
        </div>

        <div class="flex flex-wrap items-center gap-2 mt-7 text-white/80">
          @for (s of cycle; track s.l; let last = $last) {
            <span class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-white/15 bg-white/5">
              <span class="material-symbols-outlined text-[15px]" [style.color]="last ? '#F59E0B' : '#8B5CF6'">{{ s.i }}</span>{{ s.l }}
            </span>
            @if (!last) { <span class="material-symbols-outlined text-white/25 text-[18px]">chevron_right</span> }
          }
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2 rounded-2xl p-5 bg-white/5 border border-white/10 backdrop-blur">
          <span class="material-symbols-outlined text-3xl" style="color:#8B5CF6">verified</span>
          <p class="font-bold mt-2">Annonces vérifiées</p>
          <p class="text-sm text-white/60">Chaque logement est contrôlé avant publication.</p>
        </div>
        <div class="rounded-2xl p-5 bg-white/5 border border-white/10 backdrop-blur">
          <span class="material-symbols-outlined text-3xl" style="color:#8B5CF6">draw</span>
          <p class="font-bold mt-2 text-sm">Bail numérique</p>
        </div>
        <div class="rounded-2xl p-5 border backdrop-blur" style="background:rgba(245,158,11,.15);border-color:rgba(245,158,11,.3)">
          <span class="material-symbols-outlined text-3xl" style="color:#F59E0B">shield</span>
          <p class="font-bold mt-2 text-sm">Paiement protégé</p>
        </div>
      </div>
    </div>
  </section>

  <!-- FEATURED -->
  <section class="it-page py-14">
    <div class="flex items-end justify-between mb-8">
      <div>
        <span class="it-eyebrow">Sélection</span>
        <h2 class="font-display text-3xl font-extrabold mt-1">Logements à la une</h2>
      </div>
      <a routerLink="/logements" class="it-btn-ghost">Tout voir <span class="material-symbols-outlined">arrow_forward</span></a>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      @for (l of featured; track l.id) {
        <app-logement-card [logement]="l" [favori]="favoris.has(l.id)" baseLink="/logements" (favorisChange)="toggleFav($event)" />
      } @empty {
        @for (i of [1,2,3,4]; track i) { <div class="it-skel aspect-[3/4]"></div> }
      }
    </div>
  </section>

  <!-- COMMENT ÇA MARCHE -->
  <section class="it-page pb-16">
    <div class="rounded-3xl p-8 md:p-12 text-white" style="background:radial-gradient(110% 130% at 85% 0%, #3B2A6B, #241B3A 55%, #170F2B)">
      <span class="it-eyebrow !text-secondary-container">Le tiers de confiance</span>
      <h2 class="font-display text-3xl font-extrabold mt-2 mb-10">Une location, du début à la fin.</h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        @for (s of steps; track s.t) {
          <div class="rounded-2xl p-5 bg-white/5 border border-white/10">
            <span class="w-12 h-12 rounded-xl grid place-items-center mb-3" style="background:linear-gradient(135deg,#8B5CF6,#F59E0B)"><span class="material-symbols-outlined">{{ s.i }}</span></span>
            <h3 class="font-bold mb-1">{{ s.t }}</h3>
            <p class="text-sm text-white/60">{{ s.d }}</p>
          </div>
        }
      </div>
    </div>
  </section>

  <!-- CTA bailleur -->
  <section class="it-page pb-20">
    <div class="it-card p-8 md:p-12 grid md:grid-cols-[1.2fr_1fr] gap-8 items-center bg-primary text-on-primary border-0">
      <div>
        <span class="it-eyebrow !text-secondary-fixed-dim">Propriétaires</span>
        <h2 class="font-display text-3xl font-extrabold mt-2 mb-3">Louez en confiance.</h2>
        <p class="text-on-primary/80 mb-6 max-w-md">Publiez gratuitement, choisissez vos locataires, recevez vos paiements suivis.</p>
        <a routerLink="/auth/register" class="it-btn-accent">Publier une annonce</a>
      </div>
      <div class="hidden md:flex justify-end"><span class="material-symbols-outlined text-[160px] opacity-20">apartment</span></div>
    </div>
  </section>
  `,
})
export class Home implements OnInit {
  private logementSvc = inject(LogementService);
  private favSvc = inject(FavorisService);
  private auth = inject(AuthService);

  featured: Logement[] = [];
  favoris = new Set<number>();
  loc = '';

  quartiers = ['Centre-Ville', 'Tanambao', 'Beau Séjour', 'Ankorrikika', 'Lazaret', 'SCAMA', 'Ambalavola', 'Colline Nord'];
  cycle = [
    { i: 'search', l: 'Chercher' }, { i: 'calendar_month', l: 'Visiter' },
    { i: 'event_available', l: 'Réserver' }, { i: 'draw', l: 'Signer' }, { i: 'verified_user', l: 'Payer' },
  ];
  steps = [
    { i: 'search', t: 'Chercher', d: 'Filtrez par quartier, budget, distance à votre école.' },
    { i: 'calendar_month', t: 'Visiter', d: 'Réservez un créneau de visite à votre convenance.' },
    { i: 'event_available', t: 'Réserver', d: "Bloquez le logement avec une avance sécurisée." },
    { i: 'verified_user', t: 'Payer', d: 'Caution et loyer réglés en toute sécurité, reçus archivés.' },
  ];

  ngOnInit(): void {
    this.logementSvc.getPublishedLogements(0, 4).subscribe({
      next: (p) => { this.featured = p.data ?? []; },
      error: () => {},
    });
    if (this.auth.getToken()) {
      this.favSvc.getMesFavoris().subscribe({
        next: (f) => this.favoris = new Set(f.map(x => x.id)),
        error: () => {},
      });
    }
  }

  toggleFav(id: number): void {
    if (!this.auth.getToken()) return;
    const had = this.favoris.has(id);
    had ? this.favoris.delete(id) : this.favoris.add(id);
    this.favSvc.toggleFavori(id).subscribe({
      next: (r: any) => { if (r?.ajout) this.favoris.add(id); else this.favoris.delete(id); },
      error: () => { had ? this.favoris.add(id) : this.favoris.delete(id); },
    });
  }
}
