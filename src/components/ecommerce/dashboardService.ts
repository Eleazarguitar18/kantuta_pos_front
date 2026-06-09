import axios from "axios";
import { API_BASE_URL } from "../auth/services/urlBase";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

export interface DashboardStats {
  kpis: {
    ventas_hoy: number;
    recargas_hoy: number;
    ganancia_comisiones_hoy: number;
    productos_stock_bajo: number;
  };
  ventas_mensuales: { mes: string; total: number }[];
  top_productos: { nombre: string; cantidad: number; ganancia: number }[];
  recargas_distribucion: { proveedor: string; total: number }[];
}

export const DashboardService = {
  async getStats(anio?: number): Promise<{ data: DashboardStats }> {
    const url = anio
      ? `${API_BASE_URL}/reportes/dashboard-stats?anio=${anio}`
      : `${API_BASE_URL}/reportes/dashboard-stats`;
    return await axios.get(url, { headers: getHeaders() });
  },
};
