import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Utilisateur, UserRole, UserStatus } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly base = environment.apiUrl.replace(/\/api\/v1\/?$/, '');
  private readonly apiUrl = `${this.base}/api/users`;

  constructor(private http: HttpClient) {}

  /** RGPD : suppression de son propre compte (anonymisation côté serveur). */
  deleteOwnAccount(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/api/profile`);
  }

  getAllUsers(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(this.apiUrl);
  }

  getUserById(id: number): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.apiUrl}/${id}`);
  }

  updateUser(id: number, user: Partial<Utilisateur>): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  updateRole(id: number, role: UserRole): Observable<Utilisateur> {
    return this.http.patch<Utilisateur>(`${this.apiUrl}/${id}/role`, null, {
      params: { role }
    });
  }

  updateStatus(id: number, status: UserStatus): Observable<Utilisateur> {
    return this.http.patch<Utilisateur>(`${this.apiUrl}/${id}/status`, null, {
      params: { status }
    });
  }

  getUsersByRole(role: UserRole): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.apiUrl}/role/${role}`);
  }
}
