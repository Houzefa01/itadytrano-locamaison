import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Reservation } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reservations`;

  getMyReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/me`);
  }

  getReceivedReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/received`);
  }

  createReservation(reservation: any): Observable<Reservation> {
    return this.http.post<Reservation>(this.apiUrl, reservation);
  }

  updateStatut(id: number, statut: string): Observable<Reservation> {
    return this.http.patch<Reservation>(`${this.apiUrl}/${id}/statut`, { statut });
  }

  confirmerReservation(id: number, role: string): Observable<Reservation> {
    return this.http.patch<Reservation>(`${this.apiUrl}/${id}/confirmer`, null, {
      params: { role }
    });
  }

  validerReservationDirecte(id: number): Observable<Reservation> {
    return this.http.patch<Reservation>(`${this.apiUrl}/${id}/valider-directe`, null);
  }

  /** Le locataire complète sa réservation (loyer + caution) pour la transformer en location. */
  completerReservation(id: number, montant: number): Observable<Reservation> {
    return this.http.patch<Reservation>(`${this.apiUrl}/${id}/completer`, { montant });
  }

  /** Le propriétaire modifie la date et l'heure de la visite. */
  modifierVisite(id: number, dateVisite: string, heureVisite: string): Observable<Reservation> {
    return this.http.patch<Reservation>(`${this.apiUrl}/${id}/visite`, { dateVisite, heureVisite });
  }

  /** Confirmer que la visite a eu lieu (appelé par le propriétaire). */
  confirmerApresVisite(id: number): Observable<Reservation> {
    return this.http.patch<Reservation>(`${this.apiUrl}/${id}/confirmer-visite`, null);
  }
}
