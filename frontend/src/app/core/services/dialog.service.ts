import { Injectable, signal } from '@angular/core';

export interface DialogReq {
  kind: 'confirm' | 'prompt';
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  placeholder?: string;
  value?: string;
  resolve: (v: any) => void;
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  readonly current = signal<DialogReq | null>(null);

  confirm(title: string, message?: string, opts?: { confirmLabel?: string; danger?: boolean }): Promise<boolean> {
    return new Promise(resolve => this.current.set({
      kind: 'confirm', title, message, confirmLabel: opts?.confirmLabel ?? 'Confirmer', danger: opts?.danger, resolve,
    }));
  }

  prompt(title: string, message?: string, opts?: { placeholder?: string; confirmLabel?: string }): Promise<string | null> {
    return new Promise(resolve => this.current.set({
      kind: 'prompt', title, message, placeholder: opts?.placeholder, value: '', confirmLabel: opts?.confirmLabel ?? 'Envoyer', resolve,
    }));
  }

  answer(value: any): void {
    const c = this.current();
    if (c) { c.resolve(value); this.current.set(null); }
  }
}
