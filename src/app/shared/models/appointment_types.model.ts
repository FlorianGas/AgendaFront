import {UserModel} from './user.model';

export interface AppointmentTypeModel{
  _id: string;
  name: string;
  description?: string;
  default_duration: number;
  price: { $numberDecimal: string } | number; // MongoDB Decimal128 or number
  color?: string;
  allowMultipleBookings?: boolean;
  professional_id: UserModel;
  createdAt?: Date;
  updatedAt?: Date;
}
