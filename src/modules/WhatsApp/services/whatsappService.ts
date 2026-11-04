import axios from "axios";
import { API_BASE_URL } from "../../../components/auth/services/urlBase";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

export type WhatsappEstado =
  | "desconectado"
  | "conectando"
  | "esperando_qr"
  | "conectado"
  | "cerrando"
  | "error";

export interface WhatsappStatus {
  success: boolean;
  estado: WhatsappEstado;
  conectado: boolean;
  qrBase64: string | null;
  qrActualizadoEn: string | null;
  telefono: string | null;
  nombre: string | null;
  mensaje: string;
  intentosReconexion: number;
  ultimoError: string | null;
  conectadoEn: string | null;
}

export const WhatsAppService = {
  async getStatus() {
    const response = await axios.get<WhatsappStatus>(
      `${API_BASE_URL}/whatsapp/qr`,
      {
        headers: getHeaders(),
      },
    );
    return response;
  },

  async connect() {
    return WhatsAppService.getStatus();
  },

  async logout() {
    const response = await axios.post<WhatsappStatus>(
      `${API_BASE_URL}/whatsapp/logout`,
      {},
      {
        headers: getHeaders(),
      },
    );
    return response;
  },

  async resetSession() {
    const response = await axios.post<WhatsappStatus>(
      `${API_BASE_URL}/whatsapp/session/reset`,
      {},
      {
        headers: getHeaders(),
      },
    );
    return response;
  },
};
