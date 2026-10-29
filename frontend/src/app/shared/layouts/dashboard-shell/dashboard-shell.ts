import { Component, inject, signal, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MessageService } from '../../../core/services/message.service';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationBell } from '../../components/notification-bell/notification-bell';

interface MenuItem { label: string; icon: string; link: string; exact?: boolean; }

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ClickOutsideDirective, NotificationBell],
  template: `
  <div class="min-h-screen bg-background lg:grid lg:grid-cols-[260px_1fr]">
    <!-- Sidebar -->
    <aside class="hidden lg:flex flex-col bg-surface-container-lowest border-r border-outline-variant/40 h-screen sticky top-0 p-4">
      <a routerLink="/" class="flex items-center gap-2.5 px-2 mb-6">
        <span class="w-9 h-9 rounded-xl bg-primary text-on-primary grid place-items-center"><span class="material-symbols-outlined">cottage</span></span>
        <span class="font-display text-lg font-extrabold">LocaMaison</span>
      </a>
      <p class="it-eyebrow px-2 mb-3">{{ roleLabel() }}</p>
      <nav class="flex flex-col gap-1 flex-1 overflow-y-auto">
        @for (m of menu(); track m.link) {
          <a [routerLink]="m.link" routerLinkActive="it-sidelink-active" [routerLinkActiveOptions]="{ exact: !!m.exact }" class="it-sidelink">
            <span class="material-symbols-outlined">{{ m.icon }}</span> {{ m.label }}
            @if (m.icon === 'chat' && messagesNonLus() > 0) {
              <span class="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold grid place-items-center">{{ messagesNonLus() }}</span>
            }
          </a>
        }
      </nav>
      @if (role === 'proprietaire') {
        <a routerLink="/proprietaire/logements/new" class="it-btn-accent mt-3"><span class="material-symbols-outlined">add_home</span> Publier</a>
      }
      <a routerLink="/" class="it-sidelink mt-2"><span class="material-symbols-outlined">public</span> Voir le site</a>
    </aside>

    <!-- Contenu -->
    <div class="flex flex-col min-h-screen">
      <header class="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 px-4 md:px-6 h-16 flex items-center gap-3">
        <button (click)="sidebarOpen = true" class="lg:hidden it-btn-ghost !px-2.5" aria-label="Menu"><span class="material-symbols-outlined">menu</span></button>
        <h1 class="font-display font-bold text-on-surface">{{ roleLabel() }}</h1>
        <div class="ml-auto flex items-center gap-2">
          <button (click)="theme.toggle()" class="it-btn-ghost !px-2.5" [attr.aria-label]="theme.dark() ? 'Activer le thème clair' : 'Activer le thème sombre'">
            <span class="material-symbols-outlined">{{ theme.dark() ? 'light_mode' : 'dark_mode' }}</span>
          </button>
          <app-notification-bell />
          <div class="relative" (clickOutside)="userMenu = false">
            <button (click)="userMenu = !userMenu" class="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-surface-container">
              <span class="w-8 h-8 rounded-full bg-primary-container text-on-primary-container grid place-items-center font-bold text-sm">{{ initials() }}</span>
              <span class="material-symbols-outlined text-[20px] text-on-surface-variant">expand_more</span>
            </button>
            @if (userMenu) {
              <div class="absolute right-0 mt-2 w-56 it-card p-2 it-fade">
                <p class="px-3 py-2 text-sm font-bold border-b border-outline-variant/40 mb-1">{{ auth.currentUser()?.prenom }} {{ auth.currentUser()?.nom }}</p>
                <a [routerLink]="base + '/profil'" (click)="userMenu=false" class="it-sidelink"><span class="material-symbols-outlined">person</span> Profil</a>
                <button (click)="auth.logout()" class="it-sidelink w-full text-error"><span class="material-symbols-outlined">logout</span> Déconnexion</button>
              </div>
            }
          </div>
        </div>
      </header>

      <main class="flex-1 p-4 md:p-6"><router-outlet /></main>
    </div>

    <!-- Sidebar mobile -->
    @if (sidebarOpen) {
      <div class="lg:hidden fixed inset-0 z-[1200] bg-black/40 it-fade" (click)="sidebarOpen=false">
        <aside class="w-72 max-w-[82vw] h-full bg-surface-container-lowest p-4 flex flex-col" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between mb-5">
            <span class="font-display text-lg font-extrabold">LocaMaison</span>
            <button (click)="sidebarOpen=false" class="it-btn-ghost !px-2"><span class="material-symbols-outlined">close</span></button>
          </div>
          <nav class="flex flex-col gap-1">
            @for (m of menu(); track m.link) {
              <a [routerLink]="m.link" (click)="sidebarOpen=false" routerLinkActive="it-sidelink-active" [routerLinkActiveOptions]="{ exact: !!m.exact }" class="it-sidelink">
                <span class="material-symbols-outlined">{{ m.icon }}</span> {{ m.label }}
                @if (m.icon === 'chat' && messagesNonLus() > 0) {
                  <span class="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold grid place-items-center">{{ messagesNonLus() }}</span>
                }
              </a>
            }
          </nav>
        </aside>
      </div>
    }
  </div>
  `,
})
export class DashboardShell implements OnInit, OnDestroy {
  auth = inject(AuthService);
  notif = inject(NotificationService);
  theme = inject(ThemeService);
  private msgSvc = inject(MessageService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  sidebarOpen = false;
  userMenu = false;

  /** Messages non lus — badge « notification » sur le menu Messages. */
  messagesNonLus = signal(0);
  private pollId: any = null;
  private subs: Subscription[] = [];

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.refreshMessagesNonLus();
    // Rafraîchi périodiquement, à chaque navigation (lecture => marqués lus) et en
    // temps réel à l'arrivée d'un message (WebSocket via NotificationService).
    this.pollId = setInterval(() => this.refreshMessagesNonLus(), 25000);
    this.subs.push(this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) this.refreshMessagesNonLus();
    }));
    this.subs.push(this.notif.messages$.subscribe(() => this.refreshMessagesNonLus()));
  }

  ngOnDestroy(): void {
    if (this.pollId) clearInterval(this.pollId);
    this.subs.forEach(s => s.unsubscribe());
  }

  private refreshMessagesNonLus(): void {
    this.msgSvc.getNonLus().subscribe({
      next: r => this.messagesNonLus.set(r?.count ?? 0),
      error: () => {},
    });
  }

  get role(): 'etudiant' | 'proprietaire' | 'admin' {
    if (this.auth.isProprietaire()) return 'proprietaire';
    if (this.auth.isAdmin()) return 'admin';
    return 'etudiant';
  }
  get base(): string { return '/' + this.role; }

  initials(): string {
    const u = this.auth.currentUser();
    return u ? `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase() : '';
  }

  roleLabel(): string {
    return this.role === 'etudiant' ? 'Espace étudiant'
      : this.role === 'proprietaire' ? 'Espace bailleur' : 'Administration';
  }

  menu(): MenuItem[] {
    const b = this.base;
    if (this.role === 'etudiant') return [
      { label: 'Tableau de bord', icon: 'dashboard', link: b, exact: true },
      { label: 'Explorer', icon: 'search', link: b + '/explorer' },
      { label: 'Favoris', icon: 'favorite', link: b + '/favoris' },
      { label: 'Réservations', icon: 'event_available', link: b + '/reservations' },
      { label: 'Paiements', icon: 'payments', link: b + '/paiements' },
      { label: 'Contrats', icon: 'description', link: b + '/contrats' },
      { label: 'Messages', icon: 'chat', link: b + '/messages' },
      { label: 'Historique', icon: 'history', link: b + '/historique' },
    ];
    if (this.role === 'proprietaire') return [
      { label: 'Tableau de bord', icon: 'dashboard', link: b, exact: true },
      { label: 'Mes logements', icon: 'home_work', link: b + '/logements' },
      { label: 'Occupation', icon: 'meeting_room', link: b + '/occupation' },
      { label: 'Réservations', icon: 'event_available', link: b + '/reservations' },
      { label: 'Paiements', icon: 'payments', link: b + '/paiements' },
      { label: 'Contrats', icon: 'description', link: b + '/contrats' },
      { label: 'Messages', icon: 'chat', link: b + '/messages' },
    ];
    return [
      { label: 'Tableau de bord', icon: 'dashboard', link: b, exact: true },
      { label: 'Utilisateurs', icon: 'group', link: b + '/utilisateurs' },
      { label: 'Publications signalées', icon: 'flag', link: b + '/signalements' },
      { label: 'Établissements', icon: 'school', link: b + '/etablissements' },
      { label: 'Paiements', icon: 'payments', link: b + '/paiements' },
    ];
  }
}
