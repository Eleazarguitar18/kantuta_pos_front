import axios from "axios";
import { API_BASE_URL } from "../../../../components/auth/services/urlBase";
import {
  CreateContactoDto,
  UpdateContactoDto,
} from "../interfaces/NotificacionContacto";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

const BASE = `${API_BASE_URL}/notificaciones/contactos`;

export const NotificacionesService = {
  async getContactos() {
    return await axios.get(BASE, { headers: getHeaders() });
  },

  async getContacto(id: string) {
    return await axios.get(`${BASE}/${id}`, { headers: getHeaders() });
  },

  async getActivosStock() {
    return await axios.get(`${BASE}/activos-stock`, { headers: getHeaders() });
  },

  async createContacto(data: CreateContactoDto) {
    return await axios.post(BASE, data, { headers: getHeaders() });
  },

  async updateContacto(id: string, data: UpdateContactoDto) {
    return await axios.patch(`${BASE}/${id}`, data, { headers: getHeaders() });
  },

  async deleteContacto(id: string) {
    return await axios.delete(`${BASE}/${id}`, { headers: getHeaders() });
  },
};
