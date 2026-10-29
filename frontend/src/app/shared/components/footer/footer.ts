import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
  <footer class="mt-16 text-white" style="background:#170F2B">
    <div class="it-page py-12 grid gap-8 md:grid-cols-4">
      <div class="md:col-span-2">
        <div class="flex items-center gap-2.5 mb-3">
          <span class="w-9 h-9 rounded-xl bg-primary grid place-items-center"><span class="material-symbols-outlined">cottage</span></span>
          <span class="font-display text-xl font-extrabold">LocaMaison</span>
        </div>
        <p class="text-sm opacity-70 max-w-sm leading-relaxed">
          Le tiers de confiance du logement étudiant à Antsiranana — de la recherche au paiement, en toute sécurité.
        </p>
      </div>
      <div>
        <h4 class="font-bold text-sm mb-3 opacity-90">Explorer</h4>
        <ul class="space-y-2 text-sm opacity-70">
          <li><a routerLink="/logements" class="hover:opacity-100">Logements</a></li>
          <li><a routerLink="/carte" class="hover:opacity-100">Carte interactive</a></li>
          <li><a routerLink="/auth/register" class="hover:opacity-100">Devenir bailleur</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-bold text-sm mb-3 opacity-90">Compte</h4>
        <ul class="space-y-2 text-sm opacity-70">
          <li><a routerLink="/auth/login" class="hover:opacity-100">Connexion</a></li>
          <li><a routerLink="/auth/register" class="hover:opacity-100">Inscription</a></li>
        </ul>
      </div>
    </div>
    <div class="border-t border-white/10">
      <div class="it-page py-4 text-xs opacity-60">© 2026 LocaMaison · Antsiranana, Madagascar</div>
    </div>
  </footer>
  `,
})
export class Footer {}
