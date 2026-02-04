// appointment.model.ts
import {UserModel} from './user.model';
import { AppointmentTypeModel} from './appointment_types.model';
import {ClientModel} from './client.model';
import {ProfessionalModel} from './professional.model';

export interface AppointmentModel {
  _id?: string;
  client_id: UserModel | string|ClientModel;
  professional_id: string | UserModel |ProfessionalModel;
  type_id: AppointmentTypeModel;
  scheduled_time: Date | string;
  duration_minutes?: number;
  status: 'pending' | 'confirmed' | 'canceled' | 'completed';
  createdAt?: Date;
  updatedAt?: Date;
}
export type AppointmentEditModel = {
  _id: string;
  type_id: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
};
export interface AppointmentPayload {
  client_id: string;
  professional_id: string;
  type_id: string;
  scheduled_time: string | Date;
  duration_minutes: number;
}
