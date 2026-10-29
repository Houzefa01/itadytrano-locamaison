import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ContratService } from '../../../core/services/contrat.service';
import { ContratResponse } from '../../../core/models';
import { PrixAriaryPipe } from '../../../shared/pipes/prix-ariary.pipe';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-proprietaire-contrats',
  standalone: true,
  imports: [CommonModule, DatePipe, PrixAriaryPipe],
  template: `
  <h1 class="font-display text-2xl font-extrabold mb-6">Contrats</h1>
  @if (loading) {
    <div class="grid md:grid-cols-2 gap-4">@for (i of [1,2]; track i) { <div class="it-skel h-36"></div> }</div>
  } @else if (error) {
    <div class="it-card p-12 text-center text-on-surface-variant">
      <span class="material-symbols-outlined text-5xl text-error/60 mb-2">cloud_off</span>
      <p class="mb-4">Impossible de charger les contrats.</p>
      <button (click)="load()" class="it-btn-primary">Réessayer</button>
    </div>
  } @else if (items.length) {
    <div class="grid md:grid-cols-2 gap-4">
      @for (c of items; track c.id) {
        <div class="it-card p-5">
          <div class="flex items-start justify-between gap-2">
            <p class="font-bold">{{ c.logementTitre }}</p>
            <span class="it-badge whitespace-nowrap"
                  [class.bg-primary-container]="c.statut === 'actif'" [class.text-on-primary-container]="c.statut === 'actif'"
                  [class.bg-surface-container]="c.statut !== 'actif'" [class.text-on-surface-variant]="c.statut !== 'actif'">
              {{ c.statut === 'actif' ? 'Bail actif' : (c.statut === 'termine' ? 'Terminé' : 'Résilié') }}
            </span>
          </div>
          <p class="text-sm text-on-surface-variant mb-3">{{ c.etudiantNom }} · du {{ c.dateDebut | date:'mediumDate' }}@if (c.dateFin) {<span> au {{ c.dateFin | date:'mediumDate' }}</span>}</p>
          <div class="flex items-center justify-between gap-2">
            <span class="font-bold text-primary">{{ c.loyerMensuel | prixAriary }}/mois</span>
            <div class="flex items-center gap-1">
              <button (click)="pdf(c.id)" class="it-btn-ghost" aria-label="Télécharger le contrat en PDF"><span class="material-symbols-outlined">download</span> PDF</button>
              @if (c.statut === 'actif') {
                <button (click)="terminer(c)" class="it-btn-ghost text-error"><span class="material-symbols-outlined">event_busy</span> Fin de bail</button>
              }
            </div>
          </div>
        </div>
      }
    </div>
  } @else {
    <div class="it-card p-12 text-center text-on-surface-variant"><span class="material-symbols-outlined text-5xl opacity-30 mb-2">description</span><p>Aucun contrat.</p></div>
  }
  `,
})
export class ProprietaireContrats implements OnInit {
  private svc = inject(ContratService);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private dialog = inject(DialogService);
  private api = environment.apiUrl;
  items: ContratResponse[] = [];
  loading = true;
  error = false;

  ngOnInit(): void { this.load(); }

  async terminer(c: ContratResponse): Promise<void> {
    const ok = await this.dialog.confirm('Mettre fin au bail ?',
      `Le bail de « ${c.logementTitre} » (${c.etudiantNom}) sera terminé et le logement redeviendra disponible.`,
      { confirmLabel: 'Mettre fin au bail', danger: true });
    if (!ok) return;
    this.svc.terminerBail(c.id).subscribe({
      next: () => { this.toast.success('Bail terminé.'); this.load(); },
      error: (e) => this.toast.error(e?.error?.message ?? 'Action impossible.'),
    });
  }
  load(): void {
    this.loading = true; this.error = false;
    this.svc.getMesContratsProprietaire().subscribe({ next: c => { this.items = c; this.loading = false; }, error: () => { this.loading = false; this.error = true; } });
  }
  pdf(id: number): void {
    this.http.get(`${this.api}/contrats/${id}/pdf`, { responseType: 'blob' }).subscribe({
      next: b => { const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `contrat-${id}.pdf`; a.click(); URL.revokeObjectURL(u); },
      error: () => this.toast.error('Contrat indisponible.'),
    });
  }
}
