import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CreneauService, Creneau } from '../../../core/services/creneau.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-creneaux-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, RouterLink],
  template: `
  <a routerLink="/proprietaire/logements" class="it-btn-ghost mb-4 !px-2"><span class="material-symbols-outlined">arrow_back</span> Mes logements</a>
  <h1 class="font-display text-2xl font-extrabold mb-2">Créneaux de visite</h1>
  <p class="text-on-surface-variant mb-6">Proposez des dates de visite aux étudiants intéressés.</p>

  <div class="it-card p-4 mb-6 grid sm:grid-cols-5 gap-3 items-end">
    <div><label class="it-label">Du</label><input [(ngModel)]="n.dateCreneau" type="date" [min]="today" class="it-field"></div>
    <div><label class="it-label">Au</label><input [(ngModel)]="n.dateFin" type="date" [min]="n.dateCreneau || today" class="it-field"></div>
    <div><label class="it-label">De</label><input [(ngModel)]="n.heureDebut" type="time" class="it-field"></div>
    <div><label class="it-label">À</label><input [(ngModel)]="n.heureFin" type="time" class="it-field"></div>
    <button (click)="add()" [disabled]="!n.dateCreneau" class="it-btn-primary disabled:opacity-50">Ajouter</button>
  </div>
  <p class="text-xs text-on-surface-variant -mt-4 mb-6">Laissez « Au » vide pour un créneau d'une seule journée. Vous pouvez ajouter plusieurs créneaux.</p>

  @if (loading) {
    <div class="space-y-2">@for (i of [1,2,3]; track i) { <div class="it-skel h-12"></div> }</div>
  } @else if (items.length) {
    <div class="space-y-2">
      @for (c of items; track c.id) {
        <div class="it-card p-3 flex items-center gap-4">
          <span class="material-symbols-outlined text-primary">calendar_month</span>
          <span class="font-medium">
            {{ c.dateCreneau | date:'mediumDate' }}@if (c.dateFin && c.dateFin !== c.dateCreneau) { <span> → {{ c.dateFin | date:'mediumDate' }}</span> }
          </span>
          @if (c.heureDebut || c.heureFin) {
            <span class="text-on-surface-variant text-sm">{{ c.heureDebut }} – {{ c.heureFin }}</span>
          }
          <button (click)="del(c.id)" class="it-btn-ghost text-error ml-auto !px-2"><span class="material-symbols-outlined">delete</span></button>
        </div>
      }
    </div>
  } @else {
    <div class="it-card p-10 text-center text-on-surface-variant"><span class="material-symbols-outlined text-4xl opacity-30 mb-2">event</span><p>Aucun créneau proposé.</p></div>
  }
  `,
})
export class CreneauxManage implements OnInit {
  private svc = inject(CreneauService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  logementId!: number;
  items: Creneau[] = [];
  loading = true;
  today = new Date().toISOString().split('T')[0];
  n: any = { dateCreneau: '', dateFin: '', heureDebut: '10:00', heureFin: '11:00' };

  ngOnInit(): void { this.logementId = Number(this.route.snapshot.paramMap.get('id')); this.load(); }
  load(): void { this.loading = true; this.svc.list(this.logementId).subscribe({ next: c => { this.items = c; this.loading = false; }, error: () => this.loading = false }); }
  add(): void {
    if (!this.n.dateCreneau) return;
    // « Au » vide => créneau d'un seul jour (dateFin non envoyée).
    const payload: any = { dateCreneau: this.n.dateCreneau, heureDebut: this.n.heureDebut, heureFin: this.n.heureFin };
    if (this.n.dateFin) payload.dateFin = this.n.dateFin;
    this.svc.create(this.logementId, payload).subscribe({
      next: () => { this.n = { dateCreneau: '', dateFin: '', heureDebut: '10:00', heureFin: '11:00' }; this.load(); },
      error: (e) => this.toast.error(e?.error?.message ?? 'Ajout du créneau impossible.'),
    });
  }
  del(id: number): void { this.svc.remove(this.logementId, id).subscribe({ next: () => this.load(), error: () => {} }); }
}
