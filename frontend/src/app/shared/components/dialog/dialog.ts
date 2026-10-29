import { Component, HostListener, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-dialog-host',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  @if (dialog.current(); as d) {
    <div class="fixed inset-0 z-[2100] grid place-items-center p-4 bg-black/50 it-fade" (click)="cancel()">
      <div class="it-card w-full max-w-sm p-6" role="dialog" aria-modal="true" [attr.aria-label]="d.title" (click)="$event.stopPropagation()">
        <h2 class="font-display text-lg font-extrabold mb-1">{{ d.title }}</h2>
        @if (d.message) { <p class="text-on-surface-variant text-sm mb-4">{{ d.message }}</p> }
        @if (d.kind === 'prompt') {
          <textarea [(ngModel)]="d.value" rows="3" class="it-field mb-4" [placeholder]="d.placeholder ?? ''"></textarea>
        }
        <div class="flex gap-2 justify-end">
          <button (click)="cancel()" class="it-btn-outline">{{ d.cancelLabel ?? 'Annuler' }}</button>
          <button (click)="confirm()" class="it-btn-primary" [class.!bg-error]="d.danger" [class.!text-on-error]="d.danger">{{ d.confirmLabel }}</button>
        </div>
      </div>
    </div>
  }
  `,
})
export class DialogHost {
  dialog = inject(DialogService);

  constructor() {
    effect(() => {
      if (this.dialog.current() && typeof document !== 'undefined') {
        setTimeout(() => {
          const el = document.querySelector('[role=dialog] textarea, [role=dialog] .it-btn-primary') as HTMLElement | null;
          el?.focus();
        }, 30);
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEsc(): void { if (this.dialog.current()) this.cancel(); }

  confirm(): void { const d = this.dialog.current(); if (!d) return; this.dialog.answer(d.kind === 'prompt' ? (d.value || null) : true); }
  cancel(): void { const d = this.dialog.current(); if (!d) return; this.dialog.answer(d.kind === 'prompt' ? null : false); }
}
