import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  AmenityCode,
  CreateLogementRequest,
  InterestedUser,
  LandlordStatsResponse,
  Logement,
  LogementFilters,
  LogementStatut,
  LogementType,
  PagedResult,
  UpdateLogementRequest
} from '../models';
import { environment } from '../../../environments/environment';

// ── Réponse paginée Spring Boot ───────────────────────────────────────────────
interface SpringPage<T> {
  content:       T[];
  totalElements: number;
  number:        number;
  size:          number;
}

@Injectable({ providedIn: 'root' })
export class LogementService {

  private readonly apiUrl = `${environment.apiUrl}/logements`;  // ✅ URL simplifiée

  constructor(private http: HttpClient) {}

  // ── Lecture ───────────────────────────────────────────────────────────────

  /** Logements publiés avec filtres optionnels */
  getPublishedLogements(
    page: number,
    size: number,
    filters?: LogementFilters    // ✅ LogementFilters typé (AmenityCode[], LogementType)
  ): Observable<PagedResult<Logement>> {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('statut', filters?.statut || LogementStatut.PUBLIE);   // ✅ Utilise le statut des filtres ou PUBLIE par défaut

    if (filters) {
      if (filters.quartier)              params = params.set('quartier',     filters.quartier);
      if (filters.prixMin   != null)     params = params.set('prixMin',      filters.prixMin);
      if (filters.prixMax   != null)     params = params.set('prixMax',      filters.prixMax);
      if (filters.type)                  params = params.set('type',         filters.type);        // LogementType enum
      if (filters.distanceMax != null)   params = params.set('distanceMax',  filters.distanceMax);
      if (filters.nbrPersonnes != null)  params = params.set('nbrPersonnes', filters.nbrPersonnes);

      // ✅ AmenityCode[] → liste de paramètres répétés (?amenities=eau&amenities=wc)
      filters.amenities?.forEach(code => {
        params = params.append('amenities', code);
      });
    }

    return this.http
      .get<SpringPage<Logement>>(this.apiUrl, { params })
      .pipe(map(this.mapPage));
  }

  /** Logements du propriétaire connecté */
  getMyLogements(page = 0, size = 12): Observable<PagedResult<Logement>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http
      .get<SpringPage<Logement>>(`${this.apiUrl}/me`, { params })
      .pipe(map(this.mapPage));
  }

  /** Détail d'un logement — ✅ id: number */
  getLogement(id: number): Observable<Logement> {
    return this.http.get<Logement>(`${this.apiUrl}/${id}`);
  }

  getStats(): Observable<LandlordStatsResponse> {
    return this.http.get<LandlordStatsResponse>(`${this.apiUrl}/stats`);
  }

  /** Récupérer les personnes intéressées par un logement */
  getInterestedUsers(id: number): Observable<InterestedUser[]> {
    return this.http.get<InterestedUser[]>(`${this.apiUrl}/${id}/interested-users`);
  }

  // ── Écriture ──────────────────────────────────────────────────────────────

  createLogement(payload: CreateLogementRequest): Observable<Logement> {
    return this.http.post<Logement>(this.apiUrl, payload);
  }

  /** Mise à jour partielle (PATCH) — ✅ id: number */
  updateLogement(id: number, payload: UpdateLogementRequest): Observable<Logement> {
    return this.http.patch<Logement>(`${this.apiUrl}/${id}`, payload);
  }

  /** Suppression — ✅ id: number, retourne void */
  deleteLogement(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** Changement de statut (modération) */
  updateStatut(id: number, statut: LogementStatut): Observable<Logement> {
    return this.http.patch<Logement>(`${this.apiUrl}/${id}/statut`, { statut });
  }

  updateAvailability(id: number, disponible: boolean): Observable<Logement> {
    return this.http.patch<Logement>(`${this.apiUrl}/${id}/disponibilite`, { disponible });
  }

  // ── Mapping Spring Page → PagedResult ─────────────────────────────────────

  private mapPage<T>(page: SpringPage<T>): PagedResult<T> {
    return {
      data:     page.content,
      total:    page.totalElements,
      page:     page.number,
      pageSize: page.size,
    };
  }

  uploadPhotos(logementId: number, formData: FormData): Observable<void> {
  return this.http.post<void>(
    `${this.apiUrl}/${logementId}/photos/upload`,
    formData
    // ⚠️ Ne pas setter Content-Type manuellement : Angular le fait automatiquement
    //    avec le bon boundary pour multipart/form-data
  );
}

}