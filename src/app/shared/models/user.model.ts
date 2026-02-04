export interface Address {
  street ?: string;
  postal_code?: string;
  city?: string;
  country?: string;
}

export interface UserModel {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: 'client' | 'professional';
  phone_number: string;
  profile_picture?: string;
  created_at?: Date;
  updated_at?: Date;
  address?: Address; // <-- Ajout ici
}
