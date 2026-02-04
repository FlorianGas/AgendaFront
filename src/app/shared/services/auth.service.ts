 import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { ToastService } from './toast.service';
import { Router } from '@angular/router';
import { AuthResponse } from '../models/auth.model';
import {jwtDecode} from 'jwt-decode';
import {UserModel} from '../models/user.model';
import {UserStore} from '../store/user.store';
import {log} from '@angular-devkit/build-angular/src/builders/ssr-dev-server';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'token';

  constructor(
    private api: ApiService,
    private router: Router,
    private toast: ToastService,
    private userStore: UserStore
  ) {}
  isInitialized = false;

  async initialize(): Promise<void> {
    const token = this.getToken();
    if (!token) {
      this.isInitialized = true;
      return;
    }

    try {
      const { user } = await this.api.get<{ user: UserModel }>('users/me');
      this.userStore.setUser(user);
    } catch (error) {
      this.removeToken();
      this.userStore.clearUser();
      console.warn('⚠️ Utilisateur non récupéré lors de l\'init');
    } finally {
      this.isInitialized = true;
    }
  }

  async login(email: string, password: string): Promise<void> {
    try {
      const response = await this.api.post<AuthResponse>('login/auth', { email, password });

      if (!response.token) {
        const msg = 'Le token est manquant dans la réponse.';
        this.toast.error(msg);
        throw new Error(msg); // ⬅️ Rejeter l'erreur
      }

      this.setToken(response.token);

      const user = await this.api.get<UserModel>('users/me');
      if (!user) {
        throw new Error('Impossible de récupérer les informations utilisateur.');
      }

      this.userStore.setUser(user);

      if (user.role === 'client') {
        this.router.navigate(['dashboard-client']);
      } else if (user.role === 'professional') {
        this.router.navigate(['dashboard-pro']);
      }

    }  catch (error: any) {
      const status = error?.status || error?.response?.status || error?.error?.status || 0;

      if (status === 401) {
        const msg = 'Email ou mot de passe incorrect.';
        this.toast.error(msg);
        throw { status, message: msg }; // bien définir status ici
      }

      const fallbackMsg =
        error?.error?.message ||
        error?.message ||
        'Une erreur est survenue, veuillez réessayer plus tard.';

      this.toast.error(fallbackMsg);
      throw { status, message: fallbackMsg }; // ⚠️ ici aussi, status doit être défini
    }

  }



  logout(): void {

    console.log("ffrr")
    this.removeToken();
    this.userStore.clearUser();
    this.router.navigate(['login']).then(() => {
      console.log('🔄 Redirection vers la page de connexion')});
    this.toast.info('Déconnecté');

  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    return token;
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }
  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) return false;

    try {
      const payload: any = jwtDecode(token);
      const now = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp > now;
    } catch (e) {
      return false;
    }
  }
}


