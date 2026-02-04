import {Injectable} from '@angular/core';
import {ToastService} from './toast.service';
import {HttpClient , HttpErrorResponse} from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import {firstValueFrom, lastValueFrom, throwError} from 'rxjs';
import {environment} from '../../../../environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.baseUrl ;

  constructor(private  http: HttpClient , private toast: ToastService) { }

  async get<T>(endpoint: string): Promise<T> {
    return this.handleRequest(this.http.get<T>(`${this.baseUrl}${endpoint}`));
  }
  async post<T>(endpoint: string, body: any): Promise<T> {
    return this.handleRequest(this.http.post<T>(`${this.baseUrl}${endpoint}`, body));
  }
  async put<T>(endpoint: string, body: any): Promise<T> {
    return this.handleRequest(this.http.put<T>(`${this.baseUrl}${endpoint}`, body));
  }
  async delete<T>(endpoint: string): Promise<T> {
    return this.handleRequest(this.http.delete<T>(`${this.baseUrl}${endpoint}`));
  }
  private async handleRequest<T>(request : any): Promise<T> {
    try {
      return await firstValueFrom(request.pipe(catchError(this.handleError.bind(this))));
    }catch(err){
      throw err;
    }
  }
  async getAuth<T>(endpoint: string): Promise<T> {
    console.log(`📡 GET -> ${this.baseUrl}${endpoint}`);
    try {
      const response$ = this.http.get<T>(`${this.baseUrl}${endpoint}`).pipe(
        catchError((error) => {
          console.error('❌ Erreur GET :', error);
          return throwError(() => error);
        })
      );
      return await lastValueFrom(response$);
    } catch (err) {
      throw err;
    }
  }

  private handleError(error: HttpErrorResponse) {
    let message = 'Une erreur est survenue. Veuillez réessayer';

    if (error.status === 0) {
      message = "Le serveur est injoignable. Vérifiez votre connexion internet.";
    } else if (error.status === 401) {
      message = "Email ou mot de passe incorrect.";
    } else if (error.status === 403) {
      message = "Vous n'avez pas l'autorisation d'effectuer cette action.";
    } else if (error.status === 404) {
      message = "La ressource demandée est introuvable.";
    } else if (error.error?.message) {
      message = error.error.message;
    }

    this.toast.error(message);

    // ✅ renvoie un objet contenant à la fois le status et le message
    return throwError(() => ({
      status: error.status,
      message
    }));
  }

}


