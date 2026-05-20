import axios from "axios";
import { API_BASE_URL } from "../../../../components/auth/services/urlBase";

const token: string | null = localStorage.getItem("access_token");
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
};

export const ProductosService = {
  async getProducts() {
    const response = await axios.get(`${API_BASE_URL}/inventario`, { headers });
    return response;
  },
  async getProductById(id: number) {
    const response = await axios.get(`${API_BASE_URL}/inventario/${id}`, { headers });
    return response;
  },
  async createProduct(data: any) {
    const user: any = localStorage.getItem("user");
    data.id_user_create = JSON.parse(user).id;
    const response = await axios.post(`${API_BASE_URL}/inventario`, data, {
      headers,
    });
    return response;
  },
  async updateProduct(id: number, data: any) {
    const user: any = localStorage.getItem("user");
    data.id_user_update = JSON.parse(user).id;
    const response = await axios.patch(
      `${API_BASE_URL}/inventario/${id}`,
      data,
      {
        headers,
      },
    );
    return response;
  },
  async deleteProduct(id: number) {
    const response = await axios.delete(`${API_BASE_URL}/inventario/${id}`, {
      headers,
    });
    return response;
  },
};
