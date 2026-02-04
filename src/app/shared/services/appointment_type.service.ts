import {Injectable} from '@angular/core';
import {AppointmentTypeModel} from '../models/appointment_types.model';
import {ApiService} from './api.service';
import {firstValueFrom} from 'rxjs';

@Injectable({providedIn: 'root'})
export class AppointmentTypeService {
  private readonly endpoint = 'types' ;

  constructor(private api :ApiService) {
  }
  getTypeById (typeId: string) : Promise<AppointmentTypeModel> {
    return this.api.get<AppointmentTypeModel>(`${this.endpoint}/${typeId}`)
  }
  getMyTypes(): Promise<AppointmentTypeModel[]> {
    console.log('📤 Requête GET envoyée vers /types/me');
    return this.api.get<AppointmentTypeModel[]>(`${this.endpoint}/me`);
  }
  getTypesByPro(proId: string): Promise<AppointmentTypeModel[]> {
    return this.api.get<AppointmentTypeModel[]>(`types/pro/${proId}`);
  }
  createType(data: Promise<AppointmentTypeModel>): Promise<AppointmentTypeModel> {
  return this.api.post<AppointmentTypeModel>(`${this.endpoint}`, data);
  }
  updateType(typeId: string, data: Partial<AppointmentTypeModel>): Promise<AppointmentTypeModel> {
    return this.api.put<AppointmentTypeModel>(`${this.endpoint}/${typeId}`, data);
  }
  deleteType(id: string): Promise<void> {
    return this.api.delete(`${this.endpoint}/${id}`);
  }
}
