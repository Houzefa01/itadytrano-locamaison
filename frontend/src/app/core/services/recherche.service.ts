import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface RechercheHistorique {
  id: number;
  criteres: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class RechercheService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/historique-recherches`;

  list() {
    return this.http.get<RechercheHistorique[]>(this.url);
  }
  record(criteres: string) {
    return this.http.post(this.url, { criteres });
  }
}
