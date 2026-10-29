import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MessageService } from '../../../core/services/message.service';
import { AuthService } from '../../../core/services/auth.service';
import { Message } from '../../../core/models';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
  <h1 class="font-display text-2xl font-extrabold mb-6">Messagerie</h1>
  <div class="it-card grid md:grid-cols-[280px_1fr] overflow-hidden h-[70vh]">
    <!-- Inbox -->
    <div class="border-r border-outline-variant/40 overflow-y-auto" [class.hidden]="activeUser && mobileConv">
      @if (loading) { <div class="p-4 space-y-2">@for (i of [1,2,3]; track i) { <div class="it-skel h-14"></div> }</div> }
      @for (m of inbox; track m.id) {
        <button (click)="open(m)" class="w-full text-left p-4 border-b border-outline-variant/30 hover:bg-surface-container transition"
                [class.bg-surface-container]="other(m)?.id === activeUser">
          <div class="flex justify-between items-center">
            <span class="font-bold text-sm">{{ other(m)?.prenom }} {{ other(m)?.nom }}</span>
            @if (!m.lu && !mine(m)) { <span class="w-2 h-2 rounded-full bg-secondary-container"></span> }
          </div>
          <p class="text-xs text-on-surface-variant truncate">{{ m.contenu }}</p>
        </button>
      } @empty { @if (!loading) { <p class="p-6 text-sm text-on-surface-variant text-center">Aucune conversation.</p> } }
    </div>

    <!-- Conversation -->
    <div class="flex flex-col" [class.hidden]="!activeUser && mobileConv">
      @if (activeUser) {
        <div class="p-3 border-b border-outline-variant/40 font-bold flex items-center gap-2">
          <button (click)="mobileConv=true; activeUser=null" class="md:hidden it-btn-ghost !px-2"><span class="material-symbols-outlined">arrow_back</span></button>
          {{ activeName }}
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-2 bg-surface-container-low">
          @for (m of conversation; track m.id) {
            <div class="max-w-[75%] px-3 py-2 rounded-2xl text-sm" [ngClass]="mine(m) ? 'ml-auto bg-primary text-on-primary' : 'bg-surface-container-lowest'">
              {{ m.contenu }}<div class="text-[10px] opacity-60 mt-0.5">{{ m.createdAt | date:'short' }}</div>
            </div>
          }
        </div>
        <div class="p-3 border-t border-outline-variant/40 flex gap-2">
          <input [(ngModel)]="draft" (keyup.enter)="send()" class="it-field" placeholder="Votre message…">
          <button (click)="send()" class="it-btn-primary !px-4"><span class="material-symbols-outlined">send</span></button>
        </div>
      } @else {
        <div class="hidden md:grid place-items-center h-full text-on-surface-variant">Sélectionnez une conversation</div>
      }
    </div>
  </div>
  `,
})
export class Messages implements OnInit {
  private svc = inject(MessageService);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);
  inbox: Message[] = [];
  conversation: Message[] = [];
  activeUser: number | null = null;
  activeName = '';
  draft = '';
  loading = true;
  mobileConv = false;
  // Logement lié à la conversation (joint au 1er message envoyé depuis une annonce).
  private logementId: number | null = null;

  ngOnInit(): void {
    this.svc.getInbox().subscribe({ next: m => { this.inbox = m; this.loading = false; }, error: () => this.loading = false });
    // Ouverture d'une conversation ciblée depuis une publication / un logement.
    this.route.queryParams.subscribe(q => {
      const to = Number(q['to']);
      if (to && !Number.isNaN(to)) {
        this.activeUser = to;
        this.activeName = q['name'] || 'Conversation';
        this.logementId = q['logement'] ? Number(q['logement']) : null;
        this.mobileConv = false;
        this.svc.getConversation(to).subscribe({ next: c => this.conversation = c, error: () => this.conversation = [] });
      }
    });
  }

  other(m: Message) {
    const me = this.auth.currentUser()?.id;
    return m.expediteurId === me ? m.destinataire : m.expediteur;
  }
  mine(m: Message): boolean { return m.expediteurId === this.auth.currentUser()?.id; }

  open(m: Message): void {
    const o = this.other(m);
    if (!o) return;
    this.activeUser = o.id; this.activeName = `${o.prenom} ${o.nom}`; this.mobileConv = false;
    this.logementId = null;
    this.svc.getConversation(o.id).subscribe({ next: c => this.conversation = c, error: () => {} });
  }

  send(): void {
    if (!this.draft.trim() || !this.activeUser) return;
    this.svc.envoyer(this.activeUser, this.draft.trim(), this.logementId ?? undefined).subscribe({
      next: () => {
        this.draft = '';
        this.logementId = null; // le logement n'est joint qu'au 1er message
        this.svc.getConversation(this.activeUser!).subscribe(c => this.conversation = c);
        this.svc.getInbox().subscribe(m => this.inbox = m);
      },
      error: () => {},
    });
  }
}
