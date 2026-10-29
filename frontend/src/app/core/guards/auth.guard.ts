import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models';
  
 
export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  
  if (auth.isLoggedIn()) return true;

  // Si on est sur le serveur, on ne redirige pas (car localStorage est absent)
  // On laisse le client gérer la redirection après hydratation
  if (!isPlatformBrowser(platformId)) return true;
  
  // Conserver l'URL demandée pour y revenir après connexion
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
};

export const adminAuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  
  if (auth.isLoggedIn()) return true;
  
  if (!isPlatformBrowser(platformId)) return true;

  return router.createUrlTree(['/admin/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
};
 
export const etudiantGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const user = auth.currentUser();
  
  if (user?.role === UserRole.ETUDIANT) return true;
  
  if (!isPlatformBrowser(platformId)) return true;

  return router.createUrlTree(['/']);
};
 
export const proprietaireGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const user = auth.currentUser();
  
  if (user?.role === UserRole.PROPRIETAIRE) return true;

  if (!isPlatformBrowser(platformId)) return true;

  return router.createUrlTree(['/']);
};
 
export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const user = auth.currentUser();
  
  if (user?.role === UserRole.ADMIN) return true;

  if (!isPlatformBrowser(platformId)) return true;

  return router.createUrlTree(['/']);
};
