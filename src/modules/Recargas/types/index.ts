export enum OperadoraNombre {
  TIGO = 'Tigo',
  ENTEL = 'Entel',
  VIVA = 'Viva'
}

export interface OperadoraSaldo {
  id: number;
  nombre_operadora: OperadoraNombre;
  saldo_actual: number | string;
  estado: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecargaCliente {
  id: number;
  operadora: OperadoraNombre;
  numero_cliente: string;
  monto: number | string;
  fecha_hora: string;
  id_caja_sesion: number;
  caja_sesion?: any;
  estado: boolean;
}

export interface InyeccionOperadora {
  id: number;
  operadora_destino: OperadoraNombre;
  monto: number | string;
  fecha_hora: string;
  id_caja_origen: number;
  caja_origen?: any;
  estado: boolean;
}

export interface CreateRecargaClienteDto {
  operadora: OperadoraNombre | '';
  numero_cliente: string;
  monto: number;
  id_caja_sesion: number;
}

export interface CreateInyeccionDto {
  operadora_destino: OperadoraNombre | '';
  monto: number;
  id_caja_sesion: number;
}
