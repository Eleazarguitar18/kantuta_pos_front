export interface BaseEntityAudit {
  estado: boolean;
  id_user_create: number | null;
  id_user_update?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Caja extends BaseEntityAudit {
  id: number;
  nombre: string;
  especialidad: "SOLO_VENTAS" | "SOLO_AGENTES" | "MIXTA";
  sesiones?: SesionCaja[];
  saldo: number;
}

export interface SesionCaja extends BaseEntityAudit {
  id: number;
  monto_inicial: number;
  monto_final_teorico: number | null;
  monto_final_real: number | null;
  diferencia: number | null;
  estado_sesion: "ABIERTA" | "CERRADA";
  fecha_apertura: string;
  fecha_cierre: string | null;
  id_caja: number;
  caja?: Caja;
  id_usuario: number;
  // Campos de descuadre / declaración
  monto_sistema_esperado_apertura?: number | null;
  monto_inicial_declarado?: number | null;
  diferencia_apertura?: number | null;
  observacion_apertura?: string | null;
  responsable_descuadre_apertura?: string | null;
  monto_sistema_esperado_cierre?: number | null;
  monto_final_declarado?: number | null;
  diferencia_cierre?: number | null;
  observacion_cierre?: string | null;
  responsable_descuadre_cierre?: string | null;
}

export interface MovimientoCaja extends BaseEntityAudit {
  id: number;
  tipo: "INGRESO" | "EGRESO";
  monto: number;
  motivo: string;
  fecha: string;
  id_sesion_caja: number;
}
