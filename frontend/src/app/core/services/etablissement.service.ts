import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Etablissement {
  id: number;
  nom: string;
  type: string;
  adresse?: string;
  ville?: string;
  latitude?: number;
  longitude?: number;
}

@Injectable({ providedIn: 'root' })
export class EtablissementService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/etablissements`;

  list() {
    return this.http.get<Etablissement[]>(this.url);
  }

  create(e: Partial<Etablissement>) {
    return this.http.post<Etablissement>(this.url, e);
  }

  update(id: number, e: Partial<Etablissement>) {
    return this.http.put<Etablissement>(`${this.url}/${id}`, e);
  }

  remove(id: number) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
