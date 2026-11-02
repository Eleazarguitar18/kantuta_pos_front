export interface MatrizControlColumna {
  indice: number;
  id_sesion: number | null;
  fecha: string;
  dia: number;
  slot: number;
  etiqueta_operador: string;
  hora_apertura: string | null;
  hora_cierre: string | null;
  operador_id: number | null;
  operador: string | null;
  caja_id: number | null;
  caja: string | null;
  estado: string | null;
  caja_inicial: number | null;
  caja_inicial_real: number | null;
  saldo: number | null;
  vacia: boolean;
}

export type MatrizControlFilaTipo =
  | "caja"
  | "dato"
  | "total"
  | "libre"
  | "saldo";

export interface MatrizControlFila {
  key: string;
  label: string;
  valores: number[];
  ajuste: number;
  total: number | null;
  tipo: MatrizControlFilaTipo;
  detalle?: string;
  fuente?: string;
  fecha?: string;
  estado?: string;
}

export type MatrizControlSeccionKey =
  | "ingresos"
  | "compras"
  | "gastos"
  | "pago_pasivos"
  | "otros_ingresos"
  | "activos"
  | "deudas_agentes";

export interface MatrizControlSeccion {
  key: MatrizControlSeccionKey;
  label: string;
  filas: MatrizControlFila[];
  total: MatrizControlFila;
}

export interface MatrizControlResumen {
  caja_inicial: number;
  total_ingresos: number;
  total_ingresos_control: number;
  total_compras: number;
  total_gastos: number;
  total_pago_pasivos: number;
  total_otros_ingresos: number;
  total_activos: number;
  total_activos_efectivo: number;
  total_ajustes_no_caja: number;
  total_deudas_agentes: number;
  total_egresos: number;
  saldo_final: number;
  saldos_por_columna: Array<number | null>;
  incluye_sesiones_abiertas: boolean;
}

export interface MatrizControlData {
  filtros: { id_caja: number | null };
  periodo: {
    mes: number;
    anio: number;
    etiqueta: string;
    titulo: string;
    inicio: string;
    fin: string;
  };
  columnas: MatrizControlColumna[];
  caja: MatrizControlFila;
  secciones: MatrizControlSeccion[];
  deudas_agentes: MatrizControlSeccion | null;
  saldo: MatrizControlFila;
  resumen: MatrizControlResumen;
  advertencias: string[];
}

export interface MatrizControlParams {
  mes: number;
  anio: number;
  id_caja?: number;
}
