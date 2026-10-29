import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type SignalementCible = 'LOGEMENT' | 'UTILISATEUR' | 'AVIS';
export type SignalementStatut = 'EN_ATTENTE' | 'TRAITE' | 'REJETE';

@Injectable({ providedIn: 'root' })
export class SignalementService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/signalements`;

  signaler(cible: SignalementCible, cibleId: number, motif: string) {
    return this.http.post(this.url, { cible, cibleId, motif });
  }

  all(statut?: SignalementStatut) {
    return this.http.get<any[]>(statut ? `${this.url}?statut=${statut}` : this.url);
  }

  updateStatut(id: number, statut: SignalementStatut) {
    return this.http.patch(`${this.url}/${id}/statut?statut=${statut}`, {});
  }
}
