import axios from "axios";
import { API_BASE_URL } from "../../../components/auth/services/urlBase";
import {
  AgenteBanco,
  CrearAgenteDTO,
  AgenteBalance,
  OperadorDeuda,
  Operador,
  TransaccionAgente,
  RegistrarTransaccionAgenteDTO,
} from "../interfaces/Agente";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

const getUserId = (): number => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user).id : 0;
};

export const AgentesService = {
  // Obtener lista de todos los Bancos/Agentes registrados
  async getBancos() {
    return await axios.get<AgenteBanco[]>(`${API_BASE_URL}/agentes/bancos`, {
      headers: getHeaders(),
    });
  },

  // Crear un nuevo Banco/Agente con payload limpio
  async crearBanco(data: CrearAgenteDTO) {
    const userId = getUserId();
    const payload: CrearAgenteDTO = {
      nombre_banco: String(data.nombre_banco).trim(),
      monto_total: Number(data.monto_total) || 0,
      monto_efectivo: Number(data.monto_efectivo) || 0,
      monto_banco: Number(data.monto_banco) || 0,
      ...(data.descripcion && data.descripcion.trim()
        ? { descripcion: data.descripcion.trim() }
        : {}),
      ...(userId ? { id_user_create: userId } : {}),
    };

    return await axios.post<AgenteBanco>(`${API_BASE_URL}/agentes/bancos`, payload, {
      headers: getHeaders(),
    });
  },

  // Eliminar un banco / agente por su ID (ruta estándar backend: DELETE /agentes/:id)
  async eliminarBanco(id: number | string) {
    return await axios.delete<{ success: boolean; message?: string }>(`${API_BASE_URL}/agentes/${id}`, {
      headers: getHeaders(),
    });
  },

  // Obtener balance dinámico de un banco por su ID
  async getBalanceByBancoId(id: number | string) {
    return await axios.get<AgenteBalance>(`${API_BASE_URL}/agentes/${id}/balance`, {
      headers: getHeaders(),
    });
  },

  // Obtener el balance general global
  async getAgenteBalance() {
    return await axios.get<AgenteBalance>(`${API_BASE_URL}/agentes/balance`, {
      headers: getHeaders(),
    });
  },

  // Obtener lista de operadores/usuarios reales desde la BD
  async getOperadores(): Promise<Operador[]> {
    try {
      // Intentar primero con /agentes/operadores
      const res = await axios.get<any>(`${API_BASE_URL}/agentes/operadores`, {
        headers: getHeaders(),
      });
      const data = Array.isArray(res.data) ? res.data : (res.data?.data && Array.isArray(res.data.data) ? res.data.data : []);
      return data;
    } catch (error) {
      try {
        // Fallback a /usuarios
        const resUsers = await axios.get<any>(`${API_BASE_URL}/usuarios`, {
          headers: getHeaders(),
        });
        const users = Array.isArray(resUsers.data) ? resUsers.data : (resUsers.data?.data && Array.isArray(resUsers.data.data) ? resUsers.data.data : []);
        return users;
      } catch (err2) {
        console.error("Error al obtener lista de operadores:", err2);
        return [];
      }
    }
  },

  // Obtener la lista de operadores con deudas/cuentas pendientes (opcionalmente filtrado por banco)
  async getOperadoresDeuda(bancoId?: number) {
    const url = bancoId
      ? `${API_BASE_URL}/agentes/operadores-deuda?bancoId=${bancoId}`
      : `${API_BASE_URL}/agentes/operadores-deuda`;
    return await axios.get<OperadorDeuda[]>(url, {
      headers: getHeaders(),
    });
  },

  // Obtener el historial de transacciones
  async getTransacciones(bancoId?: number, limit = 50) {
    const url = bancoId
      ? `${API_BASE_URL}/agentes/transacciones?bancoId=${bancoId}&limit=${limit}`
      : `${API_BASE_URL}/agentes/transacciones?limit=${limit}`;
    return await axios.get<TransaccionAgente[]>(url, {
      headers: getHeaders(),
    });
  },

  // Registrar movimiento en el banco activo
  async registrarTransaccionAgente(payload: RegistrarTransaccionAgenteDTO) {
    const userId = getUserId();
    const bancoId = payload.banco_id ?? payload.id_banco ?? payload.id_agente;
    const usuarioId = payload.usuario_id ?? payload.id_operador;
    const observacionText = (payload.observacion ?? payload.motivo ?? "").trim();
    const viaText = payload.via ?? payload.origen_fondo ?? "BANCO";

    // Mapear tipo a formato compatible
    let tipoFormateado = payload.tipo;
    if (tipoFormateado === "PRESTAMO_OPERADOR") tipoFormateado = "PRESTAMO";
    if (tipoFormateado === "COBRO_OPERADOR") tipoFormateado = "COBRO";

    const cleanPayload: Record<string, any> = {
      banco_id: Number(bancoId) || 0,
      usuario_id: Number(usuarioId) || 0,
      id_banco: Number(bancoId) || 0,
      id_agente: Number(bancoId) || 0,
      id_operador: Number(usuarioId) || 0,
      tipo: tipoFormateado,
      monto: Number(payload.monto) || 0,
      via: viaText,
      origen_fondo: viaText,
      observacion: observacionText,
      motivo: observacionText,
      ...(payload.nombre_operador && payload.nombre_operador.trim()
        ? { nombre_operador: payload.nombre_operador.trim() }
        : {}),
      ...(userId ? { id_user_create: userId } : {}),
    };

    return await axios.post<TransaccionAgente>(`${API_BASE_URL}/agentes/transacciones`, cleanPayload, {
      headers: getHeaders(),
    });
  },
};
