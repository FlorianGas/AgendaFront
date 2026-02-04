export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface AuthUser {
  _id: string;
  email: string;
  role: 'client' | 'professional';
  first_name: string;
  last_name: string;
}
