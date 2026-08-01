export interface NotificacionContacto {
  id: string;
  nombre: string;
  codigo_pais: string;
  telefono: string;
  recibe_stock_bajo: boolean;
  recibe_cierre_caja: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateContactoDto {
  nombre: string;
  codigo_pais?: string;
  telefono: string;
  recibe_stock_bajo?: boolean;
  recibe_cierre_caja?: boolean;
  activo?: boolean;
}

export interface UpdateContactoDto extends Partial<CreateContactoDto> {}
