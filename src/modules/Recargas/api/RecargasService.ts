import axios from "axios";
import { API_BASE_URL } from "../../../components/auth/services/urlBase";
import { 
  OperadoraSaldo, 
  RecargaCliente, 
  InyeccionOperadora, 
  CreateRecargaClienteDto, 
  CreateInyeccionDto 
} from '../types';

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

export const RecargasService = {
  async getSaldos(): Promise<OperadoraSaldo[]> {
    const response = await axios.get(`${API_BASE_URL}/recargas/operadoras/saldos`, { headers: getHeaders() });
    return response.data;
  },

  async getHistorialClientes(): Promise<RecargaCliente[]> {
    const response = await axios.get(`${API_BASE_URL}/recargas/historial/clientes`, { headers: getHeaders() });
    return response.data;
  },

  async getHistorialInyecciones(): Promise<InyeccionOperadora[]> {
    const response = await axios.get(`${API_BASE_URL}/recargas/historial/inyecciones`, { headers: getHeaders() });
    return response.data;
  },

  async createRecargaCliente(data: CreateRecargaClienteDto): Promise<RecargaCliente> {
    const response = await axios.post(`${API_BASE_URL}/recargas/cliente`, data, { headers: getHeaders() });
    return response.data;
  },

  async createInyeccion(data: CreateInyeccionDto): Promise<InyeccionOperadora> {
    const response = await axios.post(`${API_BASE_URL}/recargas/inyeccion`, data, { headers: getHeaders() });
    return response.data;
  }
};
