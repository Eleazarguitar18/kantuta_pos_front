import axios from "axios";
import { API_BASE_URL } from "../../../components/auth/services/urlBase";
import {
  CrearCajaRequest,
  AbrirCajaRequest,
  CerrarCajaRequest,
  CrearMovimientoRequest,
} from "../interfaces/CajaDTO";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

const getUserId = (): number => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user).id : 0;
};

export const CajasService = {
  // CRUD de Cajas Físicas
  async getCajas() {
    return await axios.get(`${API_BASE_URL}/cajas`, { headers: getHeaders() });
  },
  async getCajaById(id: number) {
    return await axios.get(`${API_BASE_URL}/cajas/${id}`, {
      headers: getHeaders(),
    });
  },
  async createCaja(data: CrearCajaRequest) {
    data.id_user_create = getUserId();
    return await axios.post(`${API_BASE_URL}/cajas`, data, {
      headers: getHeaders(),
    });
  },
  async updateCaja(id: number, data: Partial<CrearCajaRequest>) {
    return await axios.patch(`${API_BASE_URL}/cajas/${id}`, data, {
      headers: getHeaders(),
    });
  },
  async deleteCaja(id: number) {
    const id_user_update = getUserId();
    return await axios.delete(
      `${API_BASE_URL}/cajas/${id}?id_user_update=${id_user_update}`,
      {
        headers: getHeaders(),
      },
    );
  },

  // Operaciones de Sesión y Movimientos
  async getSesionActivaUsuario(idUsuario: number) {
    return await axios.get(`${API_BASE_URL}/cajas/sesion-activa/${idUsuario}`, {
      headers: getHeaders(),
    });
  },
  async abrirSesion(data: AbrirCajaRequest) {
    data.id_user_create = getUserId();
    data.id_usuario = getUserId();
    return await axios.post(`${API_BASE_URL}/cajas/abrir`, data, {
      headers: getHeaders(),
    });
  },
  async cerrarSesion(id_sesion: number, data: CerrarCajaRequest) {
    data.id_user_update = getUserId();
    return await axios.patch(
      `${API_BASE_URL}/cajas/sesion/${id_sesion}/cerrar`,
      data,
      {
        headers: getHeaders(),
      },
    );
  },
  async getSesionBalance(id_sesion: number) {
    return await axios.get(
      `${API_BASE_URL}/cajas/sesion/${id_sesion}/balance`,
      {
        headers: getHeaders(),
      },
    );
  },
  async registrarMovimiento(data: CrearMovimientoRequest) {
    data.id_user_create = getUserId();
    return await axios.post(`${API_BASE_URL}/cajas/movimiento`, data, {
      headers: getHeaders(),
    });
  },
};
