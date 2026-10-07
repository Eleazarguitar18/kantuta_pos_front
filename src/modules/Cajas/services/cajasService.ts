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
    const id_usuario = getUserId();
    const id_user_create = getUserId();
    
    const b = data.desglose_arqueo?.billetes;
    const desglose_cortes = b ? {
      billete_200: Number(b.billete_200 ?? b.b200) || 0,
      billete_100: Number(b.billete_100 ?? b.b100) || 0,
      billete_50: Number(b.billete_50 ?? b.b50) || 0,
      billete_20: Number(b.billete_20 ?? b.b20) || 0,
      billete_10: Number(b.billete_10 ?? b.b10) || 0,
      moneda_5: Number(b.moneda_5 ?? b.m5) || 0,
      moneda_2: Number(b.moneda_2 ?? b.m2) || 0,
      moneda_1: Number(b.moneda_1 ?? b.m1) || 0,
      moneda_050: Number(b.moneda_050 ?? b.m050) || 0,
      moneda_020: Number(b.moneda_020 ?? b.m020) || 0,
      moneda_010: Number(b.moneda_010 ?? b.m010) || 0,
      monedas_total: Number(b.monedas_total ?? b.totalMonedas ?? b.monedas) || 0,
      monto_total_desglose: Number(b.monto_total_desglose ?? b.total) || 0,
    } : undefined;

    let descuadres_productos = undefined;
    const observacionGeneralApertura = data.observacion_apertura || data.observacion;
    if (data.desglose_arqueo?.stock && Array.isArray(data.desglose_arqueo.stock)) {
      descuadres_productos = data.desglose_arqueo.stock
        .filter((item: any) => item && (item.producto_id || item.id))
        .map((item: any) => {
          const obsItem = item.observacion || item.motivo || "";
          const obsDiferencia = item.diferencia !== undefined && item.diferencia !== 0 ? `Diferencia de ${item.diferencia} u.` : "";
          const partes = [obsItem, observacionGeneralApertura, obsDiferencia].filter(Boolean);
          const obsFinal = Array.from(new Set(partes)).join(" | ");
          return {
            producto_id: Number(item.producto_id ?? item.id),
            cantidad_declarada: Number(item.stockFisico ?? item.cantidad_declarada ?? 0),
            observacion: obsFinal || undefined,
          };
        });
    }

    const payload = {
      id_caja: Number(data.id_caja),
      monto_inicial: Number(data.monto_inicial) || 0,
      monto_inicial_declarado: Number(data.monto_inicial_declarado ?? data.monto_inicial) || 0,
      id_usuario: Number(id_usuario),
      id_user_create: Number(id_user_create),
      observaciones_apertura: data.observacion_apertura ? String(data.observacion_apertura) : undefined,
      desglose_cortes,
      desglose_arqueo: data.desglose_arqueo, // Se manda porque el DTO sí lo permite como 'any'
      descuadres_productos,
    };

    return await axios.post(`${API_BASE_URL}/cajas/abrir`, payload, {
      headers: getHeaders(),
    });
  },
  async cerrarSesion(id_sesion: number, data: CerrarCajaRequest) {
    data.id_user_update = getUserId();
    
    const b = data.desglose_arqueo?.billetes;
    const desglose_cortes = b ? {
      billete_200: Number(b.billete_200 ?? b.b200) || 0,
      billete_100: Number(b.billete_100 ?? b.b100) || 0,
      billete_50: Number(b.billete_50 ?? b.b50) || 0,
      billete_20: Number(b.billete_20 ?? b.b20) || 0,
      billete_10: Number(b.billete_10 ?? b.b10) || 0,
      moneda_5: Number(b.moneda_5 ?? b.m5) || 0,
      moneda_2: Number(b.moneda_2 ?? b.m2) || 0,
      moneda_1: Number(b.moneda_1 ?? b.m1) || 0,
      moneda_050: Number(b.moneda_050 ?? b.m050) || 0,
      moneda_020: Number(b.moneda_020 ?? b.m020) || 0,
      moneda_010: Number(b.moneda_010 ?? b.m010) || 0,
      monedas_total: Number(b.monedas_total ?? b.totalMonedas ?? b.monedas) || 0,
      monto_total_desglose: Number(b.monto_total_desglose ?? b.total) || 0,
    } : undefined;

    let descuadres_productos = undefined;
    const observacionGeneralCierre = data.observacion || (data as any).observaciones_cierre;
    if (data.desglose_arqueo?.stock && Array.isArray(data.desglose_arqueo.stock)) {
      descuadres_productos = data.desglose_arqueo.stock
        .filter((item: any) => item && (item.producto_id || item.id))
        .map((item: any) => {
          const obsItem = item.observacion || item.motivo || "";
          const obsDiferencia = item.diferencia !== undefined && item.diferencia !== 0 ? `Diferencia de ${item.diferencia} u.` : "";
          const partes = [obsItem, observacionGeneralCierre, obsDiferencia].filter(Boolean);
          const obsFinal = Array.from(new Set(partes)).join(" | ");
          return {
            producto_id: Number(item.producto_id ?? item.id),
            cantidad_declarada: Number(item.stockFisico ?? item.cantidad_declarada ?? 0),
            observacion: obsFinal || undefined,
          };
        });
    }

    const payload = {
      monto_real_fisico: Number(data.monto_real_fisico) || 0,
      monto_final_declarado: Number(data.monto_final_declarado ?? data.monto_real_fisico) || 0,
      id_user_update: Number(data.id_user_update),
      observacion: data.observacion ? String(data.observacion) : undefined,
      desglose_cortes,
      descuadres_productos,
    };

    return await axios.patch(
      `${API_BASE_URL}/cajas/sesion/${id_sesion}/cerrar`,
      payload,
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
  async getResumenInventario() {
    return await axios.get(`${API_BASE_URL}/cajas/resumen-inventario`, {
      headers: getHeaders(),
    });
  },
  async getEstadoInventario() {
    return await axios.get(`${API_BASE_URL}/cajas/estado-inventario`, {
      headers: getHeaders(),
    });
  },
  async getHistorialDescuadres(params?: { operador_id?: number; estado?: string }) {
    return await axios.get(`${API_BASE_URL}/cajas/historial-descuadres`, {
      params,
      headers: getHeaders(),
    });
  },
  async resolverDescuadre(
    id: number,
    data: { estado_resolucion: string; observacion_resolucion?: string },
  ) {
    return await axios.patch(
      `${API_BASE_URL}/cajas/descuadres/${id}/resolver`,
      {
        ...data,
        id_user_update: getUserId(),
      },
      {
        headers: getHeaders(),
      },
    );
  },
};
