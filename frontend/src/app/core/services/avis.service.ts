import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Avis {
  id: number;
  etudiant?: { id: number; nom: string; prenom: string; avatarUrl?: string };
  note?: number;
  commentaire: string;
  parentId?: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AvisService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/avis`;

  getForLogement(logementId: number) {
    return this.http.get<Avis[]>(`${this.url}/logement/${logementId}`);
  }

  create(data: { logementId: number; note?: number; commentaire: string; parentId?: number }) {
    return this.http.post<Avis>(this.url, data);
  }
}
