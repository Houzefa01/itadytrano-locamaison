import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { ThemeService } from '../../../core/services/theme.service';
import { NotificationBell } from '../notification-bell/notification-bell';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ClickOutsideDirective, NotificationBell],
  template: `
  <header class="sticky top-0 z-[1100] bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30">
    <nav class="it-page flex items-center justify-between h-16">
      <a routerLink="/" class="flex items-center gap-2.5">
        <span class="w-9 h-9 rounded-xl bg-primary text-on-primary grid place-items-center shadow-card">
          <span class="material-symbols-outlined">cottage</span>
        </span>
        <span class="font-display text-xl font-extrabold tracking-tight text-on-surface">LocaMaison</span>
      </a>

      <div class="hidden md:flex items-center gap-1">
        <a routerLink="/logements" routerLinkActive="text-primary bg-surface-container"
           class="px-4 py-2 rounded-xl font-medium text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors">Logements</a>
        <a routerLink="/carte" routerLinkActive="text-primary bg-surface-container"
           class="px-4 py-2 rounded-xl font-medium text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors">Carte</a>
      </div>

      <div class="flex items-center gap-2">
        <button (click)="theme.toggle()" class="it-btn-ghost !px-2.5" [attr.aria-label]="theme.dark() ? 'Activer le thème clair' : 'Activer le thème sombre'">
          <span class="material-symbols-outlined">{{ theme.dark() ? 'light_mode' : 'dark_mode' }}</span>
        </button>
        @if (auth.isLoggedIn()) {
          <app-notification-bell />
          <div class="relative" (clickOutside)="menu = false">
            <button (click)="menu = !menu" class="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-surface-container transition-colors">
              <span class="w-8 h-8 rounded-full bg-primary-container text-on-primary-container grid place-items-center font-bold text-sm overflow-hidden">
                @if (auth.currentUser()?.avatarUrl) {
                  <img [src]="auth.getFullUrl(auth.currentUser()?.avatarUrl)" class="w-full h-full object-cover" alt="">
                } @else { {{ initials() }} }
              </span>
              <span class="material-symbols-outlined text-[20px] text-on-surface-variant">expand_more</span>
            </button>
            @if (menu) {
              <div class="absolute right-0 mt-2 w-60 it-card p-2 it-fade">
                <div class="px-3 py-2 border-b border-outline-variant/40 mb-1">
                  <p class="font-bold text-on-surface text-sm truncate">{{ auth.currentUser()?.prenom }} {{ auth.currentUser()?.nom }}</p>
                  <p class="text-[11px] font-bold uppercase tracking-wider text-primary/70">{{ auth.currentUser()?.role }}</p>
                </div>
                <a [routerLink]="dashLink()" (click)="menu=false" class="it-sidelink"><span class="material-symbols-outlined">dashboard</span> Mon espace</a>
                <button (click)="auth.logout(); menu=false" class="it-sidelink w-full text-error hover:!bg-error-container/20"><span class="material-symbols-outlined">logout</span> Déconnexion</button>
              </div>
            }
          </div>
        } @else {
          <a routerLink="/auth/login" class="hidden sm:inline-flex it-btn-ghost">Connexion</a>
          <a routerLink="/auth/register" class="it-btn-primary">Créer un compte</a>
        }
        <button (click)="mobile = !mobile" class="md:hidden it-btn-ghost !px-2.5" aria-label="Menu">
          <span class="material-symbols-outlined">{{ mobile ? 'close' : 'menu' }}</span>
        </button>
      </div>
    </nav>

    @if (mobile) {
      <div class="md:hidden border-t border-outline-variant/30 px-4 py-3 flex flex-col gap-1 it-fade">
        <a routerLink="/logements" (click)="mobile=false" class="it-sidelink"><span class="material-symbols-outlined">search</span> Logements</a>
        <a routerLink="/carte" (click)="mobile=false" class="it-sidelink"><span class="material-symbols-outlined">map</span> Carte</a>
        @if (!auth.isLoggedIn()) {
          <a routerLink="/auth/login" (click)="mobile=false" class="it-sidelink"><span class="material-symbols-outlined">login</span> Connexion</a>
        }
      </div>
    }
  </header>
  `,
})
export class Navbar {
  auth = inject(AuthService);
  notif = inject(NotificationService);
  theme = inject(ThemeService);
  menu = false;
  mobile = false;

  initials(): string {
    const u = this.auth.currentUser();
    return u ? `${u.prenom?.[0] ?? ''}${u.nom?.[0] ?? ''}`.toUpperCase() : '';
  }

  dashLink(): string {
    if (this.auth.isProprietaire()) return '/proprietaire';
    if (this.auth.isAdmin()) return '/admin';
    return '/etudiant';
  }
}
