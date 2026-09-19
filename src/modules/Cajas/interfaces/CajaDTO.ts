export interface CrearCajaRequest {
  nombre: string;
  especialidad: "SOLO_VENTAS" | "SOLO_AGENTES" | "MIXTA";
  saldo?: number;
  id_user_create?: number;
}

export interface AbrirCajaRequest {
  id_caja: number;
  monto_inicial: number;
  id_usuario: number;
  id_user_create: number;
  desglose_arqueo?: any;
}

export interface CerrarCajaRequest {
  monto_final_real: number;
  monto_real_fisico: number;
  monto_diferencia: number;
  estado_arqueo: "CUADRADO" | "SOBRANTE" | "FALTANTE";
  observacion?: string;
  id_user_update: number;
  desglose_arqueo?: any;
}

export interface CrearMovimientoRequest {
  tipo: "INGRESO" | "EGRESO";
  monto: number;
  motivo: string;
  id_sesion_caja: number;
  id_user_create: number;
}
