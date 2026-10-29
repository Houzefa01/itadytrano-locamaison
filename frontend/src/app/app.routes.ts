import { Routes } from '@angular/router';
import { authGuard, etudiantGuard, proprietaireGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // ── Public ────────────────────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./shared/layouts/public-layout/public-layout').then(m => m.PublicLayout),
    children: [
      { path: '', loadComponent: () => import('./features/home/home').then(m => m.Home) },
      { path: 'logements', loadComponent: () => import('./features/listings/listings').then(m => m.Listings) },
      { path: 'logements/:id', loadComponent: () => import('./features/listing-detail/listing-detail').then(m => m.ListingDetail) },
      { path: 'carte', loadComponent: () => import('./features/carte/carte').then(m => m.Carte) },
      { path: 'cgu', data: { type: 'cgu' }, loadComponent: () => import('./features/legal/legal').then(m => m.Legal) },
      { path: 'confidentialite', data: { type: 'confidentialite' }, loadComponent: () => import('./features/legal/legal').then(m => m.Legal) },
    ],
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  {
    path: 'auth',
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.Login) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register').then(m => m.Register) },
      { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPassword) },
      { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password/reset-password').then(m => m.ResetPassword) },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // ── Espace étudiant ───────────────────────────────────────────────────────
  {
    path: 'etudiant',
    loadComponent: () => import('./shared/layouts/dashboard-shell/dashboard-shell').then(m => m.DashboardShell),
    canActivate: [authGuard, etudiantGuard],
    children: [
      { path: '', loadComponent: () => import('./features/etudiant/dashboard/etudiant-dashboard').then(m => m.EtudiantDashboard) },
      { path: 'explorer', loadComponent: () => import('./features/listings/listings').then(m => m.Listings) },
      { path: 'favoris', loadComponent: () => import('./features/etudiant/favoris/favoris').then(m => m.Favoris) },
      { path: 'reservations', loadComponent: () => import('./features/etudiant/reservations/reservations').then(m => m.EtudiantReservations) },
      { path: 'paiements', loadComponent: () => import('./features/etudiant/paiements/paiements').then(m => m.EtudiantPaiements) },
      { path: 'contrats', loadComponent: () => import('./features/etudiant/contrats/contrats').then(m => m.EtudiantContrats) },
      { path: 'historique', loadComponent: () => import('./features/etudiant/historique/historique').then(m => m.Historique) },
      { path: 'messages', loadComponent: () => import('./features/shared/messages/messages').then(m => m.Messages) },
      { path: 'profil', loadComponent: () => import('./features/shared/profil/profil').then(m => m.Profil) },
    ],
  },

  // ── Espace propriétaire ───────────────────────────────────────────────────
  {
    path: 'proprietaire',
    loadComponent: () => import('./shared/layouts/dashboard-shell/dashboard-shell').then(m => m.DashboardShell),
    canActivate: [authGuard, proprietaireGuard],
    children: [
      { path: '', loadComponent: () => import('./features/proprietaire/dashboard/proprietaire-dashboard').then(m => m.ProprietaireDashboard) },
      { path: 'logements', loadComponent: () => import('./features/proprietaire/mes-logements/mes-logements').then(m => m.MesLogements) },
      { path: 'logements/new', loadComponent: () => import('./features/proprietaire/add-listing/add-listing').then(m => m.AddListing) },
      { path: 'logements/:id/edit', loadComponent: () => import('./features/proprietaire/add-listing/add-listing').then(m => m.AddListing) },
      { path: 'logements/:id/creneaux', loadComponent: () => import('./features/proprietaire/creneaux/creneaux-manage').then(m => m.CreneauxManage) },
      { path: 'occupation', loadComponent: () => import('./features/proprietaire/occupation/occupation').then(m => m.OccupationProprietaire) },
      { path: 'reservations', loadComponent: () => import('./features/proprietaire/reservations/reservations-recues').then(m => m.ReservationsRecues) },
      { path: 'paiements', loadComponent: () => import('./features/proprietaire/paiements/paiements-recus').then(m => m.PaiementsRecus) },
      { path: 'contrats', loadComponent: () => import('./features/proprietaire/contrats/contrats-proprietaire').then(m => m.ProprietaireContrats) },
      { path: 'messages', loadComponent: () => import('./features/shared/messages/messages').then(m => m.Messages) },
      { path: 'profil', loadComponent: () => import('./features/shared/profil/profil').then(m => m.Profil) },
    ],
  },

  // ── Console admin ─────────────────────────────────────────────────────────
  {
    path: 'admin',
    loadComponent: () => import('./shared/layouts/dashboard-shell/dashboard-shell').then(m => m.DashboardShell),
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', loadComponent: () => import('./features/admin/dashboard/admin-dashboard').then(m => m.AdminDashboard) },
      { path: 'utilisateurs', loadComponent: () => import('./features/admin/utilisateurs/utilisateurs').then(m => m.AdminUtilisateurs) },
      { path: 'signalements', loadComponent: () => import('./features/admin/signalements/signalements').then(m => m.AdminSignalements) },
      { path: 'etablissements', loadComponent: () => import('./features/admin/etablissements/etablissements').then(m => m.AdminEtablissements) },
      { path: 'paiements', loadComponent: () => import('./features/admin/paiements/paiements').then(m => m.AdminPaiements) },
      { path: 'profil', loadComponent: () => import('./features/shared/profil/profil').then(m => m.Profil) },
    ],
  },

  // ── 404 ───────────────────────────────────────────────────────────────────
  { path: '**', loadComponent: () => import('./shared/components/not-found/not-found').then(m => m.NotFound) },
];
