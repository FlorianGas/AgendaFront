// client.model.ts

export interface PopulatedUser {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ClientModel {
  _id: string;
  user_id: PopulatedUser; // car on utilise .populate('user_id')
  preferences?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}
