import {Injectable} from '@angular/core';
import {ApiService} from './api.service';
import {UserModel} from '../models/user.model';
import {ProfessionalModel} from '../models/professional.model';
import {ClientModel} from '../models/client.model';

@Injectable({providedIn: 'root'})
export class UserService {
  private readonly basePath = 'user';
  constructor(private api : ApiService) {}

  async createUser(user : Partial<UserModel>){
    return this.api.post<UserModel>(`${this.basePath}/create`, user);
  }
  getById(userId: string): Promise<UserModel> {
    return this.api.get<UserModel>(`${this.basePath}/${userId}`);
  }
  async getUserById(userId : string){
    return this.api.get<UserModel>(`${this.basePath}/${userId}`);
  }
  async getProfessionals(): Promise<ProfessionalModel[]> {
    return this.api.get<ProfessionalModel[]>('professionals');
  }
  getClients(): Promise<ClientModel[]> {
    return this.api.get<ClientModel[]>('clients');
  }
  getProfessionalByUserId(userId: string): Promise<ProfessionalModel> {
    return this.api.get<ProfessionalModel>(`${this.basePath}/professionals/user/${userId}`);
  }

  getProfessionalProfile(userId: string): Promise<ProfessionalModel> {
    return this.api
      .get<{ profile: ProfessionalModel }>(`professional/${userId}`)
      .then(res => res.profile);
  }

  getClientProfile(userId: string): Promise<ClientModel> {
    return this.api
      .get<{ profile: ClientModel }>(`client/${userId}`)
      .then(res => res.profile);
  }

  async getCurrentUser(userId :string): Promise<{user : UserModel , profile : ProfessionalModel | ClientModel}>{
    return this.api.get<{user: UserModel , profile : ProfessionalModel | ClientModel}>(`${this.basePath}/${userId}`)
  }
  async updateUser(userId: string, data: Partial<UserModel>): Promise<UserModel> {
    return this.api.put<UserModel>(`user/${userId}`, data);
  }

  updateProfessionalProfile(userId: string, data: Partial<ProfessionalModel>) {
    return this.api.put<ProfessionalModel>(`professional/${userId}`, data);
  }

  updateClientProfile(userId: string, data: Partial<ClientModel>) {
    return this.api.put<ClientModel>(`client/${userId}`, data);
  }
  async deleteUser(userId : string) : Promise<void> {
    return this.api.delete<void>(`${this.basePath}/${userId}`);
  }





}
