import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ContratResponse, StatutContrat, TypeContrat } from '../models';
import { environment } from '../../../environments/environment';

export interface CreateContratRequest {
  etudiantId: number;
  logementId: number;
  dateDebut: string;
  dateFin?: string;
  dureeMois?: number;
  loyerMensuel: number;
  chargesMensuelles: number;
  depotGarantie: number;
  typeContrat: TypeContrat;
  clauses?: string;
  lieuSignature?: string;
  templateName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ContratService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/contrats`;

  creerContrat(req: CreateContratRequest): Observable<ContratResponse> {
    return this.http.post<ContratResponse>(this.apiUrl, req);
  }

  getMesContratsEtudiant(): Observable<ContratResponse[]> {
    return this.http.get<ContratResponse[]>(`${this.apiUrl}/etudiant/me`);
  }

  getMesContratsProprietaire(): Observable<ContratResponse[]> {
    return this.http.get<ContratResponse[]>(`${this.apiUrl}/proprietaire/me`);
  }

  /** Fin de bail : libère le logement et clôture la réservation associée. */
  terminerBail(id: number): Observable<ContratResponse> {
    return this.http.patch<ContratResponse>(`${this.apiUrl}/${id}/terminer`, {});
  }
}
