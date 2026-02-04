import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {environment} from '../../../../environment';

@Injectable({ providedIn: 'root' })
export class GoogleCalendarClientService {
  private readonly baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) {}

  // Cette méthode va déclencher la redirection vers Google OAuth côté backend
  syncAppointments() {
    return this.http.get(`${this.baseUrl}auth/google`, { observe: 'response' });
    // On récupère la réponse complète pour accéder au header Location si besoin
  }
}
