import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { Utilisateur, UserRole, UserStatus } from '../../../core/models';
import { ToastService } from '../../../core/services/toast.service';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-admin-utilisateurs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <h1 class="font-display text-2xl font-extrabold mb-6">Utilisateurs</h1>
  @if (loading) {
    <div class="space-y-2">@for (i of [1,2,3,4]; track i) { <div class="it-skel h-14"></div> }</div>
  } @else if (error) {
    <div class="it-card p-12 text-center text-on-surface-variant">
      <span class="material-symbols-outlined text-5xl text-error/60 mb-2">cloud_off</span>
      <p class="mb-4">Impossible de charger les utilisateurs.</p>
      <button (click)="load()" class="it-btn-primary">Réessayer</button>
    </div>
  } @else {
    <div class="it-card overflow-x-auto">
      <table class="w-full text-left min-w-[720px]">
        <thead class="text-[11px] uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/40">
          <tr><th class="p-4">Utilisateur</th><th class="p-4">Rôle</th><th class="p-4">Statut</th><th class="p-4 text-right">Actions</th></tr>
        </thead>
        <tbody class="divide-y divide-outline-variant/30">
          @for (u of users; track u.id) {
            <tr>
              <td class="p-4"><p class="font-bold text-sm">{{ u.nom }} {{ u.prenom }}</p><p class="text-xs text-on-surface-variant">{{ u.email }}</p></td>
              <td class="p-4"><label class="sr-only">Rôle de {{ u.prenom }}</label><select [ngModel]="u.role" (ngModelChange)="setRole(u,$event)" class="it-field !py-1.5 !w-auto text-sm">@for (r of roles; track r) { <option [ngValue]="r">{{ roleLabel(r) }}</option> }</select></td>
              <td class="p-4"><label class="sr-only">Statut de {{ u.prenom }}</label><select [ngModel]="u.status" (ngModelChange)="setStatus(u,$event)" class="it-field !py-1.5 !w-auto text-sm">@for (s of statuses; track s) { <option [ngValue]="s">{{ statutLabel(s) }}</option> }</select></td>
              <td class="p-4 text-right"><button (click)="remove(u)" class="it-btn-ghost text-error" aria-label="Supprimer l'utilisateur"><span class="material-symbols-outlined">delete</span></button></td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  }
  `,
})
export class AdminUtilisateurs implements OnInit {
  private svc = inject(UserService);
  private toast = inject(ToastService);
  private dialog = inject(DialogService);
  users: Utilisateur[] = [];
  loading = true;
  error = false;
  roles = [UserRole.ETUDIANT, UserRole.PROPRIETAIRE, UserRole.ADMIN];
  statuses = [UserStatus.PENDING, UserStatus.ACTIVE, UserStatus.SUSPENDED, UserStatus.DELETED];

  statutLabel(s: UserStatus): string {
    return ({ PENDING: 'En attente', ACTIVE: 'Actif', SUSPENDED: 'Suspendu', DELETED: 'Supprimé' } as Record<string, string>)[String(s)] ?? String(s);
  }
  roleLabel(r: UserRole): string {
    return ({ ETUDIANT: 'Étudiant', PROPRIETAIRE: 'Propriétaire', ADMIN: 'Admin' } as Record<string, string>)[String(r)] ?? String(r);
  }

  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true; this.error = false;
    this.svc.getAllUsers().subscribe({ next: u => { this.users = u; this.loading = false; }, error: () => { this.loading = false; this.error = true; } });
  }
  setRole(u: Utilisateur, role: UserRole): void { this.svc.updateRole(u.id, role).subscribe({ next: () => this.toast.success('Rôle mis à jour.'), error: () => this.toast.error('Échec de la mise à jour.') }); }
  setStatus(u: Utilisateur, status: UserStatus): void { this.svc.updateStatus(u.id, status).subscribe({ next: () => this.toast.success('Statut mis à jour.'), error: () => this.toast.error('Échec de la mise à jour.') }); }
  async remove(u: Utilisateur): Promise<void> {
    const ok = await this.dialog.confirm('Supprimer cet utilisateur ?', `${u.prenom} ${u.nom} sera supprimé.`, { confirmLabel: 'Supprimer', danger: true });
    if (!ok) return;
    this.svc.deleteUser(u.id).subscribe({ next: () => { this.toast.success('Utilisateur supprimé.'); this.load(); }, error: () => this.toast.error('Suppression impossible.') });
  }
}
