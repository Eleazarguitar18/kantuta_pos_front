import axios from "axios";
import { API_BASE_URL } from "../../../components/auth/services/urlBase";

export type EstadoPrestamoExterno = "PENDIENTE" | "PAGADO" | string;

export interface AutorizadorPrestamoExterno {
  id: number;
  name?: string;
  email?: string;
  persona?: {
    nombres?: string;
    p_apellido?: string;
    s_apellido?: string;
  };
  role?: {
    nombre?: string;
  };
}

export interface PrestamoExterno {
  id: number;
  solicitante_externo?: string;
  solicitanteExterno?: string;
  solicitante?: string;
  autorizado_por?: string;
  autorizadoPor?: string;
  autorizador?: AutorizadorPrestamoExterno | string;
  monto: number | string;
  motivo?: string;
  observacion?: string;
  estado?: EstadoPrestamoExterno;
  estado_prestamo?: EstadoPrestamoExterno;
  fecha?: string;
  fecha_prestamo?: string;
  fecha_devolucion?: string;
}

export interface CrearPrestamoExternoRequest {
  solicitante_externo: string;
  id_autorizador: number;
  monto: number;
  motivo: string;
  id_user_create?: number;
}

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

const getUserId = (): number => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user).id : 0;
};

export const getNombreAutorizador = (autorizador: AutorizadorPrestamoExterno): string => {
  const nombres = [
    autorizador.persona?.nombres,
    autorizador.persona?.p_apellido,
    autorizador.persona?.s_apellido,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return nombres || autorizador.name || autorizador.email || `Usuario #${autorizador.id}`;
};

export const PrestamosExternosService = {
  async listarPrestamosExternos() {
    return await axios.get<PrestamoExterno[]>(`${API_BASE_URL}/prestamos-externos`, {
      headers: getHeaders(),
    });
  },

  async crearPrestamoExterno(data: CrearPrestamoExternoRequest) {
    return await axios.post(
      `${API_BASE_URL}/prestamos-externos`,
      {
        ...data,
        id_user_create: data.id_user_create ?? getUserId(),
      },
      { headers: getHeaders() },
    );
  },

  async registrarDevolucion(id: number) {
    return await axios.post(
      `${API_BASE_URL}/prestamos-externos/${id}/pagar`,
      { id_user_update: getUserId() },
      { headers: getHeaders() },
    );
  },

  async listarAutorizadores() {
    const response = await axios.get<AutorizadorPrestamoExterno[]>(
      `${API_BASE_URL}/usuario/autorizadores`,
      { headers: getHeaders() },
    );

    return response.data;
  },
};
