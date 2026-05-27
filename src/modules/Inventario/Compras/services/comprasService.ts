import axios from "axios";
import { API_BASE_URL } from "../../../../components/auth/services/urlBase";
import { CrearCompraRequest } from "../interfaces/CrearCompraRequest";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

export const ComprasService = {
  async getCompras() {
    const response = await axios.get(`${API_BASE_URL}/compras`, { headers: getHeaders() });
    return response;
  },
  async createCompra(data: CrearCompraRequest) {
    const user: any = localStorage.getItem("user");
    if (user) {
      data.id_user_create = JSON.parse(user).id;
    }
    const response = await axios.post(`${API_BASE_URL}/compras`, data, {
      headers: getHeaders(),
    });
    return response;
  },
};
