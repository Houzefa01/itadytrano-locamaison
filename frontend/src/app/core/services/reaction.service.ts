import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface ReactionInfo { likes: number; dislikes: number; maReaction?: string; }

@Injectable({ providedIn: 'root' })
export class ReactionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/logements`;

  get(logementId: number) {
    return this.http.get<ReactionInfo>(`${this.base}/${logementId}/reactions`);
  }

  react(logementId: number, type: 'LIKE' | 'DISLIKE') {
    return this.http.post<ReactionInfo>(`${this.base}/${logementId}/reactions`, { type });
  }
}
