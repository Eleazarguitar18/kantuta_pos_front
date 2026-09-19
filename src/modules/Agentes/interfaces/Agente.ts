export interface BaseEntityAudit {
  estado?: boolean;
  id_user_create?: number | null;
  id_user_update?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface AgenteBanco extends BaseEntityAudit {
  id: number;
  nombre_banco: string;
  monto_total: number;
  monto_efectivo: number;
  monto_banco: number;
  monto_cuentas_por_cobrar: number;
  descripcion?: string;
}

export interface CrearAgenteDTO {
  nombre_banco: string;
  monto_total: number;
  monto_efectivo: number;
  monto_banco: number;
  descripcion?: string;
  id_user_create?: number;
}

// Alias para compatibilidad
export type CrearBancoDTO = CrearAgenteDTO;

export interface AgenteBalance {
  id_banco?: number;
  id_agente?: number;
  nombre_banco?: string;
  monto_total: number;
  monto_efectivo: number;
  monto_banco: number;
  monto_cuentas_por_cobrar: number;
}

export interface OperadorDeuda {
  id: number;
  id_banco?: number;
  id_agente?: number;
  nombre_operador: string;
  monto_pendiente: number;
  telefono?: string;
  ci?: string;
  ultima_transaccion?: string;
}

export interface Operador {
  id: number;
  nombre?: string;
  nombre_completo?: string;
  usuario?: string;
  email?: string;
  telefono?: string;
  ci?: string;
  rol?: string;
}

export type TipoTransaccionAgente = 'PRESTAMO_OPERADOR' | 'COBRO_OPERADOR' | 'INGRESO_BANCO' | 'EGRESO_BANCO' | 'AJUSTE_CAPITAL';
export type OrigenFondo = 'EFECTIVO' | 'BANCO';

export interface TransaccionAgente extends BaseEntityAudit {
  id: number;
  id_banco?: number;
  id_agente?: number;
  nombre_banco?: string;
  tipo: TipoTransaccionAgente;
  monto: number;
  origen_fondo: OrigenFondo;
  id_operador?: number;
  nombre_operador?: string;
  motivo: string;
  fecha: string;
  id_sesion_caja?: number;
}

export interface RegistrarTransaccionAgenteDTO {
  // Campos estándar / normalizados
  banco_id?: number;
  usuario_id?: number;
  id_banco?: number;
  id_agente?: number;
  id_operador?: number;
  tipo: TipoTransaccionAgente | 'PRESTAMO' | 'COBRO' | string;
  monto: number;
  via?: OrigenFondo | string;
  origen_fondo?: OrigenFondo | string;
  motivo?: string;
  observacion?: string;
  nombre_operador?: string;
  id_user_create?: number;
}
