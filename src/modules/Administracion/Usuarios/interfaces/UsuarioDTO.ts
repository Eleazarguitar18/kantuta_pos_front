export interface RegisterUsuarioRequest {
  email: string;
  password?: string;
  nombres: string;
  p_apellido: string;
  s_apellido?: string;
  fecha_nacimiento: string;
  genero: string;
  name?: string;
  estado?: boolean;
  id_role?: number;
}

export interface UpdateUsuarioRequest {
  name?: string;
  email?: string;
  password?: string;
  estado?: boolean;
  id_role?: number;
}

export interface UpdatePersonaRequest {
  id: number;
  id_user_update: number;
  nombres?: string;
  p_apellido?: string;
  s_apellido?: string;
  fecha_nacimiento?: string;
  genero?: string;
}
