import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { RechercheService, RechercheHistorique } from '../../../core/services/recherche.service';

@Component({
  selector: 'app-historique',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
  <h1 class="font-display text-2xl font-extrabold mb-6">Historique de recherche</h1>
  @if (loading) {
    <div class="space-y-2">@for (i of [1,2,3]; track i) { <div class="it-skel h-16"></div> }</div>
  } @else if (items.length) {
    <div class="space-y-2">
      @for (h of items; track h.id) {
        <button (click)="rejouer(h)" class="it-card p-4 w-full text-left flex items-start gap-3 hover:bg-surface-container transition">
          <span class="material-symbols-outlined text-primary mt-0.5">history</span>
          <div class="flex-1 min-w-0">
            @if (parts(h.criteres).length) {
              <div class="flex flex-wrap gap-1.5">
                @for (p of parts(h.criteres); track p) { <span class="it-chip">{{ p }}</span> }
              </div>
            } @else {
              <span class="text-sm text-on-surface-variant">Recherche sans filtre</span>
            }
          </div>
          <span class="text-xs text-on-surface-variant whitespace-nowrap">{{ h.createdAt | date:'short' }}</span>
        </button>
      }
    </div>
  } @else {
    <div class="it-card p-10 text-center text-on-surface-variant">
      <span class="material-symbols-outlined text-4xl opacity-30 mb-2">history</span>
      <p>Aucune recherche enregistrée.</p>
    </div>
  }
  `,
})
export class Historique implements OnInit {
  private svc = inject(RechercheService);
  private router = inject(Router);
  items: RechercheHistorique[] = [];
  loading = true;

  ngOnInit(): void {
    this.svc.list().subscribe({ next: h => { this.items = h; this.loading = false; }, error: () => this.loading = false });
  }

  parts(criteres: string): string[] {
    if (!criteres) return [];
    return criteres.split('&').filter(Boolean).map(seg => {
      const [k, v = ''] = seg.split('=');
      switch (k) {
        case 'quartier': return 'Quartier : ' + v;
        case 'prixMin': return 'À partir de ' + this.num(v) + ' Ar';
        case 'prixMax': return "Jusqu'à " + this.num(v) + ' Ar';
        case 'type': return 'Type : ' + this.cap(v);
        case 'amenities': return 'Commodités : ' + v.split(',').map(a => this.cap(a)).join(', ');
        default: return this.cap(k) + ' : ' + v;
      }
    });
  }

  rejouer(h: RechercheHistorique): void {
    const q: any = {};
    (h.criteres || '').split('&').filter(Boolean).forEach(seg => { const [k, v] = seg.split('='); if (k === 'quartier') q.location = v; });
    this.router.navigate(['/etudiant/explorer'], { queryParams: q });
  }

  private num(v: string): string { const n = Number(v); return isNaN(n) ? v : n.toLocaleString('fr-FR'); }
  private cap(v: string): string { return v ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() : v; }
}
