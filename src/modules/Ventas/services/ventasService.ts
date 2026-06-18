import axios from "axios";
import { API_BASE_URL } from "../../../components/auth/services/urlBase";
import {
  CrearVentaRequest,
  ActualizarVentaRequest,
} from "../interfaces/VentaDTO";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

const getUserId = (): number => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user).id : 0;
};

export const VentasService = {
  async getVentas() {
    return await axios.get(`${API_BASE_URL}/ventas`, { headers: getHeaders() });
  },
  async getVentaById(id: number) {
    return await axios.get(`${API_BASE_URL}/ventas/${id}`, {
      headers: getHeaders(),
    });
  },
  async createVenta(data: CrearVentaRequest) {
    data.id_user_create = getUserId();
    return await axios.post(`${API_BASE_URL}/ventas`, data, {
      headers: getHeaders(),
    });
  },
  async updateVenta(id: number, data: ActualizarVentaRequest) {
    data.id_user_update = getUserId();
    return await axios.patch(`${API_BASE_URL}/ventas/${id}`, data, {
      headers: getHeaders(),
    });
  },
  async getReporteResumen(fechaInicio: string, fechaFin: string) {
    const body = { fechaInicio, fechaFin };
    const response = await axios.post(
      `${API_BASE_URL}/ventas/reporte-resumen`,
      body,
      {
        headers: getHeaders(),
      },
    );
    return response.data;
  },
};
