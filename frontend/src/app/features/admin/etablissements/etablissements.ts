import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EtablissementService, Etablissement } from '../../../core/services/etablissement.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-admin-etablissements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <h1 class="font-display text-2xl font-extrabold mb-6">Établissements</h1>

  <div class="it-card p-4 mb-6 grid md:grid-cols-6 gap-3 items-end">
    <div class="md:col-span-2"><label class="it-label">Nom</label><input [(ngModel)]="n.nom" class="it-field" placeholder="Université…"></div>
    <div><label class="it-label">Type</label><select [(ngModel)]="n.type" class="it-field">@for (t of types; track t) { <option [value]="t">{{ t }}</option> }</select></div>
    <div><label class="it-label">Latitude</label><input [(ngModel)]="n.latitude" type="number" class="it-field"></div>
    <div><label class="it-label">Longitude</label><input [(ngModel)]="n.longitude" type="number" class="it-field"></div>
    <button (click)="add()" [disabled]="!n.nom" class="it-btn-primary disabled:opacity-50">Ajouter</button>
  </div>

  <div class="it-card overflow-x-auto">
    <table class="w-full text-left min-w-[640px]">
      <thead class="text-[11px] uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/40">
        <tr><th class="p-4">Nom</th><th class="p-4">Type</th><th class="p-4">Ville</th><th class="p-4">GPS</th><th class="p-4 text-right"></th></tr>
      </thead>
      <tbody class="divide-y divide-outline-variant/30">
        @for (e of list; track e.id) {
          <tr>
            <td class="p-4 font-bold text-sm">{{ e.nom }}</td><td class="p-4 text-sm">{{ e.type }}</td>
            <td class="p-4 text-sm">{{ e.ville }}</td><td class="p-4 text-xs text-on-surface-variant">{{ e.latitude }}, {{ e.longitude }}</td>
            <td class="p-4 text-right"><button (click)="del(e)" class="it-btn-ghost text-error" aria-label="Supprimer l'établissement"><span class="material-symbols-outlined">delete</span></button></td>
          </tr>
        } @empty { <tr><td colspan="5" class="p-10 text-center text-on-surface-variant italic">Aucun établissement.</td></tr> }
      </tbody>
    </table>
  </div>
  `,
})
export class AdminEtablissements implements OnInit {
  private svc = inject(EtablissementService);
  private toast = inject(ToastService);
  private dialog = inject(DialogService);
  list: Etablissement[] = [];
  types = ['ECOLE', 'COLLEGE', 'LYCEE', 'UNIVERSITE', 'FACULTE', 'INSTITUT', 'AUTRE'];
  n: any = { nom: '', type: 'UNIVERSITE', ville: 'Antsiranana', latitude: null, longitude: null };

  ngOnInit(): void { this.load(); }
  load(): void { this.svc.list().subscribe({ next: l => this.list = l, error: () => this.toast.error('Chargement impossible.') }); }
  add(): void {
    if (!this.n.nom) return;
    this.svc.create(this.n).subscribe({
      next: () => { this.toast.success('Établissement ajouté.'); this.n = { nom: '', type: 'UNIVERSITE', ville: 'Antsiranana', latitude: null, longitude: null }; this.load(); },
      error: () => this.toast.error("Échec de l'ajout."),
    });
  }
  async del(e: Etablissement): Promise<void> {
    const ok = await this.dialog.confirm('Supprimer cet établissement ?', `« ${e.nom} » sera supprimé.`, { confirmLabel: 'Supprimer', danger: true });
    if (!ok) return;
    this.svc.remove(e.id).subscribe({ next: () => { this.toast.success('Établissement supprimé.'); this.load(); }, error: () => this.toast.error('Suppression impossible.') });
  }
}
