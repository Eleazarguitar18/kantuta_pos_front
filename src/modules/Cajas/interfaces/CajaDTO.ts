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
}

export interface CerrarCajaRequest {
  monto_final_real: number;
  id_user_update: number;
}

export interface CrearMovimientoRequest {
  tipo: "INGRESO" | "EGRESO";
  monto: number;
  motivo: string;
  id_sesion_caja: number;
  id_user_create: number;
}
