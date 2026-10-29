import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Message, Utilisateur } from '../models';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private readonly apiUrl = `${environment.apiUrl}/messages`;

  constructor(private http: HttpClient) {}

  envoyer(destinataireId: number, contenu: string, logementId?: number, attachmentUrl?: string): Observable<Message> {
    return this.http.post<Message>(this.apiUrl, { destinataireId, contenu, logementId, attachmentUrl });
  }

  uploadFile(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${environment.apiUrl}/upload`, formData);
  }

  getConversation(autreUserId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/conversation/${autreUserId}`);
  }

  getInbox(): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/inbox`);
  }

  getNonLus(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/non-lus`);
  }
}
