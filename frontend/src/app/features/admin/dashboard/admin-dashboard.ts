import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <div class="max-w-5xl">
    <h1 class="font-display text-3xl font-extrabold mb-1">Administration</h1>
    <p class="text-on-surface-variant mb-8">Vue d'ensemble de la plateforme.</p>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="it-card p-5 flex items-center gap-3">
        <span class="w-11 h-11 rounded-xl bg-primary-container text-on-primary-container grid place-items-center shrink-0"><span class="material-symbols-outlined">group</span></span>
        <div><p class="font-display text-2xl font-extrabold">{{ stats?.utilisateurs ?? '—' }}</p><p class="text-xs text-on-surface-variant">Utilisateurs</p></div>
      </div>
      <div class="it-card p-5 flex items-center gap-3">
        <span class="w-11 h-11 rounded-xl bg-primary-container text-on-primary-container grid place-items-center shrink-0"><span class="material-symbols-outlined">home_work</span></span>
        <div><p class="font-display text-2xl font-extrabold">{{ stats?.logements ?? '—' }}</p><p class="text-xs text-on-surface-variant">Logements</p></div>
      </div>
      <div class="it-card p-5 flex items-center gap-3">
        <span class="w-11 h-11 rounded-xl bg-primary-container text-on-primary-container grid place-items-center shrink-0"><span class="material-symbols-outlined">event_available</span></span>
        <div><p class="font-display text-2xl font-extrabold">{{ stats?.reservations ?? '—' }}</p><p class="text-xs text-on-surface-variant">Réservations</p></div>
      </div>
      <div class="it-card p-5 flex items-center gap-3">
        <span class="w-11 h-11 rounded-xl bg-error-container text-on-error-container grid place-items-center shrink-0"><span class="material-symbols-outlined">flag</span></span>
        <div><p class="font-display text-2xl font-extrabold">{{ stats?.signalementsEnAttente ?? '—' }}</p><p class="text-xs text-on-surface-variant">Signalements</p></div>
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
export class AdminDashboard implements OnInit {
  private admin = inject(AdminService);
  stats: any = null;

  ngOnInit(): void { this.admin.stats().subscribe({ next: s => this.stats = s, error: () => {} }); }

  tiles = [
    { i: 'group', t: 'Utilisateurs', link: '/admin/utilisateurs' },
    { i: 'flag', t: 'Publications signalées', link: '/admin/signalements' },
    { i: 'school', t: 'Établissements', link: '/admin/etablissements' },
    { i: 'payments', t: 'Paiements', link: '/admin/paiements' },
  ];
}
