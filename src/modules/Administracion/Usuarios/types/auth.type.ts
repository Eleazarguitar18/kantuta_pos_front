export interface UserPersona {
  nombres: string;
  p_apellido: string;
  s_apellido: string;
  fecha_nacimiento: string;
  genero: string;
}

export interface UserRole {
  id: number;
  nombre: string;
  descripcion?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  estado: boolean;
  role: UserRole | string | null;
  persona: UserPersona;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}
