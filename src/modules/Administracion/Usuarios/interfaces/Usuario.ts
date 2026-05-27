export interface BaseEntityAudit {
  estado: boolean;
  id_user_create: number | null;
  id_user_update?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  nombre: "admin" | "user" | string;
  descripcion?: string;
}

export interface Persona extends BaseEntityAudit {
  id: number;
  nombres: string;
  p_apellido: string;
  s_apellido?: string;
  fecha_nacimiento: string; 
  genero: string; 
}

export interface Usuario extends BaseEntityAudit {
  id: number;
  name: string;
  email: string;
  persona: Persona;
  role: Role;
}
