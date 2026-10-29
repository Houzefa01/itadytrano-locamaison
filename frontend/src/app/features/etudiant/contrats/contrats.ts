import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ContratService } from '../../../core/services/contrat.service';
import { ContratResponse } from '../../../core/models';
import { PrixAriaryPipe } from '../../../shared/pipes/prix-ariary.pipe';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-etudiant-contrats',
  standalone: true,
  imports: [CommonModule, DatePipe, PrixAriaryPipe],
  template: `
  <h1 class="font-display text-2xl font-extrabold mb-6">Mes contrats</h1>
  @if (loading) {
    <div class="grid md:grid-cols-2 gap-4">@for (i of [1,2]; track i) { <div class="it-skel h-40"></div> }</div>
  } @else if (error) {
    <div class="it-card p-12 text-center text-on-surface-variant">
      <span class="material-symbols-outlined text-5xl text-error/60 mb-2">cloud_off</span>
      <p class="mb-4">Impossible de charger vos contrats.</p>
      <button (click)="load()" class="it-btn-primary">Réessayer</button>
    </div>
  } @else if (items.length) {
    <div class="grid md:grid-cols-2 gap-4">
      @for (c of items; track c.id) {
        <div class="it-card overflow-hidden">
          <div class="bg-primary text-on-primary p-4">
            <p class="font-bold">{{ c.logementTitre }}</p>
            <p class="text-on-primary/80 text-sm">Du {{ c.dateDebut | date:'mediumDate' }}{{ c.dateFin ? ' au ' + (c.dateFin | date:'mediumDate') : '' }}</p>
          </div>
          <div class="p-4 space-y-2">
            <div class="grid grid-cols-2 gap-2 text-center">
              <div><p class="text-[10px] uppercase text-on-surface-variant">Loyer / mois</p><p class="font-bold text-sm">{{ c.loyerMensuel | prixAriary }}</p></div>
              <div><p class="text-[10px] uppercase text-on-surface-variant">Caution</p><p class="font-bold text-sm">{{ c.depotGarantie | prixAriary }}</p></div>
            </div>
            <button (click)="pdf(c.id)" class="it-btn-primary w-full mt-2"><span class="material-symbols-outlined">download</span> Télécharger le bail (PDF)</button>
          </div>
        </div>
      }
    </div>
  } @else {
    <div class="it-card p-12 text-center text-on-surface-variant"><span class="material-symbols-outlined text-5xl opacity-30 mb-2">description</span><p>Aucun contrat actif.</p></div>
  }
  `,
})
export class EtudiantContrats implements OnInit {
  private svc = inject(ContratService);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private api = environment.apiUrl;
  items: ContratResponse[] = [];
  loading = true;
  error = false;

  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true; this.error = false;
    this.svc.getMesContratsEtudiant().subscribe({ next: c => { this.items = c; this.loading = false; }, error: () => { this.loading = false; this.error = true; } });
  }

  pdf(id: number): void {
    this.http.get(`${this.api}/contrats/${id}/pdf`, { responseType: 'blob' }).subscribe({
      next: b => { const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `contrat-${id}.pdf`; a.click(); URL.revokeObjectURL(u); },
      error: () => this.toast.error('Contrat indisponible.'),
    });
  }
}
