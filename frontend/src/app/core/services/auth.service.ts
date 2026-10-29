// ─── src/app/core/services/auth.service.ts ───────────────────────────────────
 
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, throwError, switchMap, of, map } from 'rxjs';
// ① Import — ajouter UserRole
import { AuthResponse, LoginRequest, RegisterRequest, UserRole, UserStatus, Utilisateur } from '../models';
 
// import { AuthResponse, LoginRequest, RegisterRequest, Utilisateur } from '../models';
import { environment } from '../../../environments/environment';
 
 
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = environment.apiUrl.replace(/\/api\/v1\/?$/, '');
  private readonly apiUrl = `${this.baseUrl}/api/auth`;
  private readonly profileUrl = `${this.baseUrl}/api/profile`;
 
  get apiBaseUrl(): string {
    return this.baseUrl;
  }

  // ── Signals réactifs ──────────────────────────────────────────────────────
  private _currentUser = signal<Utilisateur | null>(this.loadUserFromStorage());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn  = computed(() => !!this._currentUser());
  // readonly isEtudiant  = computed(() => this._currentUser()?.role === 'etudiant');
  // readonly isProprietaire = computed(() => this._currentUser()?.role === 'proprietaire');
  // readonly isAdmin     = computed(() => this._currentUser()?.role === 'admin');
 readonly isEtudiant     = computed(() => this._currentUser()?.role === UserRole.ETUDIANT);
 readonly isProprietaire = computed(() => this._currentUser()?.role === UserRole.PROPRIETAIRE);
 readonly isAdmin        = computed(() => this._currentUser()?.role === UserRole.ADMIN);

  constructor(private http: HttpClient, private router: Router) {
    // Synchronisation forcée sur le client pour éviter les problèmes SSR
    if (this.isBrowser()) {
      const user = this.loadUserFromStorage();
      if (user) this._currentUser.set(user);
    }
  }
 
  login(credentials: LoginRequest, roleHint?: Utilisateur['role']) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      switchMap(res => {
        const token = this.extractToken(res);
        if (token && this.isBrowser()) {
          localStorage.setItem('access_token', token);
        }
        return this.http.get<Utilisateur>(this.profileUrl).pipe(
          tap(user => this.saveUser(user)),
          catchError(() => {
            const fallback = roleHint
              ? this.buildFallbackUser(credentials.telephone, roleHint)
              : null;
            if (fallback) {
              this.saveUser(fallback);
            } else {
              this._currentUser.set(null);
            }
            return of(fallback);
          })
        );
      }),
      catchError(err => throwError(() => err))
    );
  }
 
  register(data: RegisterRequest) {
    const payload: RegisterPayload = {
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      password: data.password,
      telephone: data.telephone,
      role: data.role,
      ecoleId: data.ecoleId,
      adresse: data.adresse,
      moyenPaiement: data.moyenPaiement,
    };

    return this.http.post<{ message: string }>(`${this.apiUrl}/register`, payload).pipe(
      tap(() => {
        this._currentUser.set(null);
      })
    );
  }

  verifyAccount(telephone: string, code: string) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/verify`, { telephone, code });
  }

  forgotPassword(telephone: string) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/forgot-password`, { telephone });
  }

  resetPassword(telephone: string, code: string, newPassword: string) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/reset-password`, { telephone, code, newPassword });
  }

  // Changement de numéro — étape 1 : envoie un code de vérification par SMS au NOUVEAU numéro.
  requestTelephoneChange(telephone: string) {
    return this.http.post<{ message: string }>(`${this.profileUrl}/telephone/request`, { telephone });
  }

  // Changement de numéro — étape 2 : confirme le code. Au succès, le backend renvoie un
  // nouveau token (le téléphone est le sujet du JWT) qu'on stocke, puis on rafraîchit le profil.
  confirmTelephoneChange(telephone: string, code: string) {
    return this.http.post<{ message: string; token: string }>(`${this.profileUrl}/telephone/confirm`, { telephone, code }).pipe(
      switchMap(res => {
        if (res.token && this.isBrowser()) {
          localStorage.setItem('access_token', res.token);
        }
        return this.http.get<Utilisateur>(this.profileUrl).pipe(
          tap(user => this.saveUser(user)),
          map(() => res),
        );
      }),
    );
  }

  logout() {
    if (this.isBrowser()) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
    this._currentUser.set(null);
    this.router.navigate(['/']);
  }
 
  getToken(): string | null {
    if (!this.isBrowser()) {
      return null;
    }
    return localStorage.getItem('access_token');
  }
 
  private loadUserFromStorage(): Utilisateur | null {
    if (!this.isBrowser()) {
      return null;
    }
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private extractToken(res: LoginResponse): string | null {
    if (!res) {
      return null;
    }
    if ('accessToken' in res && typeof res.accessToken === 'string') {
      return res.accessToken;
    }
    if ('token' in res && typeof res.token === 'string') {
      return res.token;
    }
    return null;
  }

  private saveUser(user: Utilisateur): void {
    const normalized = this.normalizeUser(user);
    if (this.isBrowser()) {
      localStorage.setItem('user', JSON.stringify(normalized));
    }
    this._currentUser.set(normalized);
  }

 

  private buildFallbackUser(telephone: string, role: Utilisateur['role']): Utilisateur {
  const now = new Date().toISOString();       // ✅ string ISO
  return {
    id:        0,                             // ✅ number
    nom:       role === UserRole.PROPRIETAIRE ? 'Proprietaire' : 'Etudiant',
    prenom:    'Temp',
    telephone,
    role,
    status:    UserStatus.ACTIVE,             // ✅ default status
    verifie:   false,
    createdAt: now,                           // ✅ string
    updatedAt: now,                           // ✅ string
  };
}


  private normalizeUser(user: Utilisateur): Utilisateur {
    const normalizedRole = this.normalizeRole(String(user.role));
    return {
      ...user,
      role: normalizedRole ?? user.role,
    };
  }

 private normalizeRole(value: string): UserRole | null {
   const n = value.trim().toLowerCase();
   if (n === 'proprietaire' || n === 'owner' || n === 'landlord') return UserRole.PROPRIETAIRE;
   if (n === 'etudiant'     || n === 'student')                   return UserRole.ETUDIANT;
   if (n === 'admin')                                             return UserRole.ADMIN;
   return null;
 }

 getFullUrl(url: string | undefined): string {
   if (url) {
     if (url.startsWith('/uploads')) {
       return `${this.baseUrl}${url}`;
     }
     return url;
   }
   return 'assets/digokira_icon_512.png';
 }
 }

type LoginResponse = AuthResponse | { token: string };
type RegisterPayload = {
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  password: string;
  role: UserRole;
  ecoleId?: number | null;
  adresse?: string;
  moyenPaiement?: string;
};
 
