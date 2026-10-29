import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-etudiant-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <div class="max-w-5xl">
    <h1 class="font-display text-3xl font-extrabold mb-1">Bonjour {{ auth.currentUser()?.prenom }} 👋</h1>
    <p class="text-on-surface-variant mb-8">Trouvez et gérez votre logement, en toute confiance.</p>

    <a routerLink="/etudiant/explorer" class="it-card p-6 flex items-center gap-4 bg-primary text-on-primary border-0 mb-6 hover:brightness-110 transition">
      <span class="material-symbols-outlined text-4xl">search</span>
      <div><p class="font-display text-xl font-bold">Explorer les logements</p><p class="text-on-primary/80 text-sm">Filtrez par quartier, budget et commodités.</p></div>
      <span class="material-symbols-outlined ml-auto">arrow_forward</span>
    </a>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      @for (t of tiles; track t.link) {
        <a [routerLink]="t.link" class="it-card p-5 hover:-translate-y-1 transition-transform">
          <span class="material-symbols-outlined text-3xl text-primary">{{ t.i }}</span>
          <p class="font-bold mt-2">{{ t.t }}</p>
          <p class="text-sm text-on-surface-variant">{{ t.d }}</p>
        </a>
      }
    </div>
  </div>
  `,
})
export class EtudiantDashboard {
  auth = inject(AuthService);
  tiles = [
    { i: 'favorite', t: 'Mes favoris', d: 'Vos logements sauvegardés', link: '/etudiant/favoris' },
    { i: 'event_available', t: 'Mes réservations', d: 'Visites et réservations', link: '/etudiant/reservations' },
    { i: 'payments', t: 'Mes paiements', d: 'Historique & reçus', link: '/etudiant/paiements' },
    { i: 'description', t: 'Mes contrats', d: 'Baux signés', link: '/etudiant/contrats' },
    { i: 'chat', t: 'Messages', d: 'Échanges avec les bailleurs', link: '/etudiant/messages' },
    { i: 'person', t: 'Profil', d: 'Vos informations', link: '/etudiant/profil' },
  ];
}
