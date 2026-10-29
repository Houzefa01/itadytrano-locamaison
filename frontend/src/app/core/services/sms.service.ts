import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SmsRequest {
  phoneNumber: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class SmsService {
  private apiUrl = `${environment.apiUrl}/sms`;

  constructor(private http: HttpClient) { }

  sendSms(smsRequest: SmsRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/send`, smsRequest);
  }
}
