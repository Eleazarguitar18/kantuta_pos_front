import axios from "axios";
import { API_BASE_URL } from "../../../components/auth/services/urlBase";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

const getUserId = (): number => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user).id : 0;
};

export interface CreateTransactionDto {
  tipo_operacion: 'COMPRA_SALDO' | 'VENTA_RECARGA';
  id_proveedor: number;
  monto: number;
  numero_telefono?: string;
  nro_referencia?: string;
  url_comprobante?: string;
  id_sesion_caja: number;
  id_user_create?: number;
}

export interface InitialBalanceItem {
  id_proveedor: number;
  saldo_inicial: number;
}

export interface OpenSessionTopUpDto {
  id_sesion_caja: number;
  saldos: InitialBalanceItem[];
  id_user_create?: number;
}

export interface FinalBalanceItem {
  id_proveedor: number;
  saldo_final_real: number;
}

export interface CloseSessionTopUpDto {
  saldos: FinalBalanceItem[];
  id_user_update?: number;
}

export const RecargasService = {
  async getProveedores() {
    return await axios.get(`${API_BASE_URL}/recargas/proveedores`, { headers: getHeaders() });
  },

  async seedProveedores() {
    const idUsuario = getUserId();
    return await axios.post(`${API_BASE_URL}/recargas/seed`, { id_usuario: idUsuario }, { headers: getHeaders() });
  },

  async registrarTransaccion(data: CreateTransactionDto) {
    data.id_user_create = getUserId();
    return await axios.post(`${API_BASE_URL}/recargas/transaccion`, data, { headers: getHeaders() });
  },

  async inicializarSaldosSesion(data: OpenSessionTopUpDto) {
    data.id_user_create = getUserId();
    return await axios.post(`${API_BASE_URL}/recargas/sesion-inicializar`, data, { headers: getHeaders() });
  },

  async finalizarSaldosSesion(idSesion: number, data: CloseSessionTopUpDto) {
    data.id_user_update = getUserId();
    return await axios.patch(`${API_BASE_URL}/recargas/sesion/${idSesion}/finalizar`, data, { headers: getHeaders() });
  },

  async getResumenSesion(idSesion: number) {
    return await axios.get(`${API_BASE_URL}/recargas/sesion/${idSesion}/resumen`, { headers: getHeaders() });
  },
};
