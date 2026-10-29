import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Logement } from '../models';
import { environment } from '../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class FavorisService {

  private readonly apiUrl = `${environment.apiUrl}/favoris`;

  constructor(private http: HttpClient) {}

  // ✅ logementId: number (Long Java)
  toggleFavori(logementId: number): Observable<{ ajout: boolean }> {
    return this.http.post<{ ajout: boolean }>(
      `${this.apiUrl}/toggle/${logementId}`,
      {}
    );
  }

  // Le backend renvoie directement les logements favoris (LogementResponse[]).
  getMesFavoris(): Observable<Logement[]> {
    return this.http.get<Logement[]>(this.apiUrl);
  }

  // ✅ logementId: number
  isFavori(logementId: number): Observable<{ favori: boolean }> {
    return this.http.get<{ favori: boolean }>(
      `${this.apiUrl}/${logementId}/statut`
    );
  }
}