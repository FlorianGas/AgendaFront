import {UserModel} from './user.model';
export interface PopulatedUser {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ProfessionalModel {
  _id: string; // correspond à l'ID du document Professional
  user_id: PopulatedUser; // le user lié, via populate
  business_name: string;
  specialization: string;
  tax_number?: string;
  business_address?: string;
  phone_number?: string;
  is_admin?: boolean;
  created_at?: Date;
  updated_at?: Date;
}
