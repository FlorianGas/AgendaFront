import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { UserModel } from '../models/user.model';
import {AuthUser} from '../models/auth.model';
import {ProfessionalModel} from '../models/professional.model';

@Injectable({ providedIn: 'root' })
export class UserStore {
  private userSubject = new BehaviorSubject<UserModel | null>(null);
  user$ = this.userSubject.asObservable();

  setUser(user: UserModel): void {
    this.userSubject.next(user);
  }
  updateUserData(changes: Partial<UserModel>): void {
    const current = this.userSubject.value;
    if (!current) return;
    this.userSubject.next({ ...current, ...changes });
  }

  clearUser(): void {
    this.userSubject.next(null);
  }

  getCurrentUser(): UserModel | null {
    return this.userSubject.getValue();
  }

  getCurrentRole(): 'client' | 'professional' | null {
    return this.getCurrentUser()?.role ?? null;
  }
  private professionalSubject = new BehaviorSubject<ProfessionalModel | null>(null);

  setProfessional(pro: ProfessionalModel): void {
    this.professionalSubject.next(pro);
  }

  getCurrentProfessional(): ProfessionalModel | null {
    return this.professionalSubject.value;
  }
}
