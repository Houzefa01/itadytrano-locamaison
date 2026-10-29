import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StatutPaiement, ModePaiement, TypePaiement, PaiementResponse, Echeance } from '../models';
import { environment } from '../../../environments/environment';

export interface CreatePaiementRequest {
  logementId: number;
  reservationId?: number;
  montant: number;
  typePaiement: TypePaiement;
  mode: ModePaiement;
  datePaiement: string;
  periodeDebut?: string;
  periodeFin?: string;
  referenceTransaction?: string;   // info de paiement saisie (n° Mobile Money / réf virement)
}

@Injectable({
  providedIn: 'root',
})
export class PaiementService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/paiements`;

  creerPaiement(req: CreatePaiementRequest): Observable<PaiementResponse> {
    return this.http.post<PaiementResponse>(this.apiUrl, req);
  }

  getMesPaiements(): Observable<PaiementResponse[]> {
    return this.http.get<PaiementResponse[]>(`${this.apiUrl}/me`);
  }

  /** Échéancier de loyer (mois payés / à payer) pour un logement loué. */
  getEcheancier(logementId: number): Observable<Echeance[]> {
    return this.http.get<Echeance[]>(`${this.apiUrl}/echeancier/${logementId}`);
  }

  getPaiementsRecus(): Observable<PaiementResponse[]> {
    return this.http.get<PaiementResponse[]>(`${this.apiUrl}/received`);
  }

  getAllPaiements(statut?: StatutPaiement): Observable<PaiementResponse[]> {
    const params: any = {};
    if (statut) params.statut = statut;
    return this.http.get<PaiementResponse[]>(this.apiUrl, { params });
  }

  updateStatut(id: number, statut: StatutPaiement): Observable<PaiementResponse> {
    return this.http.patch<PaiementResponse>(`${this.apiUrl}/${id}/statut`, null, {
      params: { statut }
    });
  }

  /** Solde du bailleur : { disponible, enSequestre, rembourse }. */
  getSolde(): Observable<{ disponible: number; enSequestre: number; rembourse: number }> {
    return this.http.get<{ disponible: number; enSequestre: number; rembourse: number }>(`${this.apiUrl}/solde`);
  }

  /** Rembourse un paiement (bailleur/admin). */
  rembourser(id: number): Observable<PaiementResponse> {
    return this.http.patch<PaiementResponse>(`${this.apiUrl}/${id}/rembourser`, {});
  }
}
