import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AppointmentModel, AppointmentPayload } from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  constructor(private api: ApiService) {}

  getMyAppointments(): Promise<AppointmentModel[]> {
    return this.api.get<AppointmentModel[]>('appointments/me');
  }

  getMyAppointmentsPro(): Promise<AppointmentModel[]> {
    return this.api.get<AppointmentModel[]>('appointments/pro/me')
      .then(appointments => {
        console.log('📅 RDV (Pro) récupérés :', appointments);
        return appointments;
      });
  }

  getAppointmentsInRange(start: Date, end: Date): Promise<AppointmentModel[]> {
    const query = `start=${start.toISOString()}&end=${end.toISOString()}`;
    return this.api.get<AppointmentModel[]>(`appointment/range?${query}`);
  }

  getAppointmentById(id: string): Promise<AppointmentModel> {
    if (!id || id.length < 10) {
      console.warn('❌ ID de rendez-vous invalide :', id);
      return Promise.reject('ID invalide');
    }
    return this.api.get<AppointmentModel>(`appointments/${id}`);
  }

  createAppointment(data: Partial<AppointmentPayload>): Promise<AppointmentPayload> {
    console.log('📤 Création rendez-vous :', data);
    return this.api.post<AppointmentPayload>('appointment/create', data);
  }

  updateAppointment(id: string, data: Partial<AppointmentModel>): Promise<AppointmentModel> {
    return this.api.put<AppointmentModel>(`appointments/${id}`, data);
  }

  deleteAppointment(id: string): Promise<void> {
    return this.api.delete(`appointments/${id}`);
  }

  cancelAppointment(id: string): Promise<any> {
    return this.api.put(`appointment/${id}`, { status: 'canceled' });
  }
}
