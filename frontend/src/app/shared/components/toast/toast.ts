import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastService, ToastType } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="fixed bottom-5 right-5 z-[2000] flex flex-col gap-2 w-[min(92vw,380px)]" aria-live="polite" aria-atomic="false">
    @for (t of toast.toasts(); track t.id) {
      <div class="it-card it-fade flex items-start gap-3 p-3.5 pr-2" role="status">
        <span class="material-symbols-outlined mt-0.5" [ngClass]="color(t.type)">{{ icon(t.type) }}</span>
        <p class="flex-1 text-sm text-on-surface leading-snug">{{ t.message }}</p>
        <button (click)="toast.dismiss(t.id)" class="it-btn-ghost !p-1 !rounded-lg" aria-label="Fermer la notification">
          <span class="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    }
  </div>
  `,
})
export class ToastHost implements OnInit, OnDestroy {
  toast = inject(ToastService);
  private notif = inject(NotificationService);
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.notif.messages$.subscribe((p: any) => this.toast.info(p?.message ?? 'Nouvelle notification'));
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  icon(t: ToastType): string { return t === 'success' ? 'check_circle' : t === 'error' ? 'error' : 'notifications'; }
  color(t: ToastType): string { return t === 'success' ? 'text-primary' : t === 'error' ? 'text-error' : 'text-secondary'; }
}
