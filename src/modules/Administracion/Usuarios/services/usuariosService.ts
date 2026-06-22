import axios from "axios";
import { API_BASE_URL } from "../../../../components/auth/services/urlBase";
import {
  RegisterUsuarioRequest,
  UpdateUsuarioRequest,
  UpdatePersonaRequest,
} from "../interfaces/UsuarioDTO";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

const getUserId = (): number => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user).id : 0;
};

export const UsuariosService = {
  async getUsuarios() {
    return await axios.get(`${API_BASE_URL}/usuario`, {
      headers: getHeaders(),
    });
  },
  async getUsuario(id: number) {
    return await axios.get(`${API_BASE_URL}/usuario/${id}`, {
      headers: getHeaders(),
    });
  },
  async getRoles() {
    return await axios.get(`${API_BASE_URL}/auth/roles/list`, {
      headers: getHeaders(),
    });
  },
  async getPersonaById(id: number) {
    return await axios.get(`${API_BASE_URL}/persona/${id}`, {
      headers: getHeaders(),
    });
  },
  async registerUsuario(data: RegisterUsuarioRequest) {
    return await axios.post(`${API_BASE_URL}/usuario/register`, data, {
      headers: getHeaders(),
    });
  },
  async updateUsuario(id: number, data: UpdateUsuarioRequest) {
    return await axios.patch(`${API_BASE_URL}/usuario/${id}`, data, {
      headers: getHeaders(),
    });
  },
  async updatePersona(data: UpdatePersonaRequest) {
    data.id_user_update = getUserId();
    return await axios.put(`${API_BASE_URL}/persona`, data, {
      headers: getHeaders(),
    });
  },
};
