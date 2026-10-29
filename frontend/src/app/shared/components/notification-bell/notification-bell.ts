import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService, NotificationItem } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, DatePipe, ClickOutsideDirective],
  template: `
  <div class="relative" (clickOutside)="open = false">
    <button (click)="toggle()" class="relative it-btn-ghost !px-2.5" aria-label="Notifications" [attr.aria-expanded]="open">
      <span class="material-symbols-outlined">notifications</span>
      @if (notif.unreadCount() > 0) {
        <span class="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold grid place-items-center">{{ notif.unreadCount() }}</span>
      }
    </button>

    @if (open) {
      <div class="absolute right-0 mt-2 w-80 max-w-[92vw] it-card p-0 it-fade overflow-hidden z-[1300]">
        <div class="flex items-center justify-between p-3 border-b border-outline-variant/40">
          <span class="font-bold text-sm">Notifications</span>
          @if (notif.unreadCount() > 0) {
            <button (click)="notif.markAllAsRead()" class="text-xs text-primary font-semibold hover:underline">Tout marquer lu</button>
          }
        </div>
        <div class="max-h-96 overflow-y-auto">
          @for (n of notif.notifications().slice(0, 20); track n.id) {
            <button type="button" (click)="onClick(n)"
                    class="w-full text-left flex items-start gap-3 p-3 border-b border-outline-variant/20 hover:bg-surface-container transition-colors"
                    [class.bg-surface-container-low]="!n.read">
              <span class="material-symbols-outlined text-[20px] mt-0.5" [ngClass]="color(n.type)">{{ icon(n.type) }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-on-surface leading-snug">{{ n.message }}</p>
                <p class="text-[11px] text-on-surface-variant mt-0.5">{{ n.date | date:'short' }}</p>
              </div>
              @if (!n.read) { <span class="w-2 h-2 rounded-full bg-secondary-container mt-1.5 shrink-0"></span> }
            </button>
          } @empty {
            <div class="p-8 text-center text-on-surface-variant">
              <span class="material-symbols-outlined text-4xl opacity-30">notifications_off</span>
              <p class="text-sm mt-1">Aucune notification.</p>
            </div>
          }
        </div>
      </div>
    }
  </div>
  `,
})
export class NotificationBell {
  notif = inject(NotificationService);
  private router = inject(Router);
  private auth = inject(AuthService);
  open = false;

  /** Clic sur une notification : on navigue vers la page concernée et on marque lue. */
  onClick(n: NotificationItem): void {
    this.open = false;
    this.notif.markAllAsRead();
    const base = this.auth.isProprietaire() ? '/proprietaire'
      : this.auth.isAdmin() ? '/admin' : '/etudiant';
    const t = (n.type || '').toUpperCase();
    let target = base;
    if (t.includes('MESSAGE')) target = base + '/messages';
    else if (t.includes('PAIEMENT')) target = base + '/paiements';
    else if (t.includes('RESERV')) target = base + '/reservations';
    else if (t.includes('CONTRAT')) target = base + '/contrats';
    else if (t.includes('SIGNAL')) target = base + '/signalements';
    else if (t.includes('LOGEMENT') || t.includes('STATUT')) target = this.auth.isProprietaire() ? base + '/logements' : base + '/reservations';
    this.router.navigate([target]);
  }

  toggle(): void {
    this.open = !this.open;
    if (this.open && this.notif.unreadCount() > 0) {
      // marque comme lues à l'ouverture (léger délai pour laisser voir le surlignage)
      setTimeout(() => this.notif.markAllAsRead(), 1500);
    }
  }

  icon(t: string): string {
    if (!t) return 'notifications';
    if (t.includes('PAIEMENT')) return 'payments';
    if (t.includes('RESERV')) return 'event_available';
    if (t.includes('MESSAGE')) return 'chat';
    if (t.includes('RAPPEL')) return 'schedule';
    if (t.includes('RETARD')) return 'warning';
    if (t.includes('STATUT') || t.includes('LOGEMENT')) return 'home_work';
    return 'notifications';
  }
  color(t: string): string {
    if (!t) return 'text-primary';
    if (t.includes('RETARD')) return 'text-error';
    if (t.includes('PAIEMENT') || t.includes('RAPPEL')) return 'text-secondary';
    return 'text-primary';
  }
}
