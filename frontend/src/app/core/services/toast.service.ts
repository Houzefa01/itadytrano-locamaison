import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';
export interface AppToast { id: number; type: ToastType; message: string; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<AppToast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(message: string): void { this.push('success', message); }
  error(message: string): void { this.push('error', message); }
  info(message: string): void { this.push('info', message); }

  dismiss(id: number): void { this._toasts.update(t => t.filter(x => x.id !== id)); }

  private push(type: ToastType, message: string): void {
    const id = Date.now() + Math.random();
    this._toasts.update(t => [{ id, type, message }, ...t].slice(0, 5));
    setTimeout(() => this.dismiss(id), type === 'error' ? 6000 : 4000);
  }
}
