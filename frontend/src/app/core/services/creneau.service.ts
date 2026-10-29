import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Creneau {
  id: number;
  dateCreneau: string;   // date de début de l'intervalle
  dateFin?: string;      // date de fin (incluse) ; absente => un seul jour
  heureDebut?: string;
  heureFin?: string;
  disponible: boolean;
}

@Injectable({ providedIn: 'root' })
export class CreneauService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/logements`;

  list(logementId: number) {
    return this.http.get<Creneau[]>(`${this.base}/${logementId}/creneaux`);
  }
  create(logementId: number, c: Partial<Creneau>) {
    return this.http.post<Creneau>(`${this.base}/${logementId}/creneaux`, c);
  }
  remove(logementId: number, id: number) {
    return this.http.delete<void>(`${this.base}/${logementId}/creneaux/${id}`);
  }
}
