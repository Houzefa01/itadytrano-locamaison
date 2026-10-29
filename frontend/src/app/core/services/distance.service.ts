import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface DistanceResult {
  distanceKm: number;
  dureeMinutes: number;
  source: string;
  etablissement: string;
}

@Injectable({ providedIn: 'root' })
export class DistanceService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/logements`;

  between(logementId: number, etablissementId: number) {
    return this.http.get<DistanceResult>(`${this.base}/${logementId}/distance`, { params: { etablissementId } });
  }
}
