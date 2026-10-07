export interface CrearCajaRequest {
  nombre: string;
  especialidad: "SOLO_VENTAS" | "SOLO_AGENTES" | "MIXTA";
  saldo?: number;
  id_user_create?: number;
}

export interface DesgloseCortes {
  billete_200?: number;
  billete_100?: number;
  billete_50?: number;
  billete_20?: number;
  billete_10?: number;
  moneda_5?: number;
  moneda_2?: number;
  moneda_1?: number;
  moneda_050?: number;
  moneda_020?: number;
  moneda_010?: number;
  monedas_total?: number;
  monto_total_desglose?: number;
}

export interface AbrirCajaRequest {
  id_caja: number;
  monto_inicial: number;
  monto_sistema_esperado?: number;
  monto_inicial_declarado?: number;
  diferencia_apertura?: number;
  observacion_apertura?: string;
  observacion?: string;
  responsable_descuadre?: string;
  operador_saliente_id?: number;
  operador_responsable_id?: number;
  id_usuario: number;
  id_user_create: number;
  desglose_arqueo?: any;
}

export interface CerrarCajaRequest {
  monto_final_real: number;
  monto_real_fisico: number;
  monto_diferencia: number;
  monto_sistema_esperado?: number;
  monto_final_declarado?: number;
  diferencia_cierre?: number;
  responsable_descuadre?: string;
  estado_arqueo: "CUADRADO" | "SOBRANTE" | "FALTANTE";
  observacion?: string;
  observaciones?: string;
  observacion_cierre?: string;
  observaciones_cierre?: string;
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
