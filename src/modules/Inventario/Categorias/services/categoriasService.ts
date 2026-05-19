import axios from "axios";
import { API_BASE_URL } from "../../../../components/auth/services/urlBase";
const token: string | null = localStorage.getItem("access_token");
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
};
interface Categoria {
  nombre: string;
  id_user_create?: number;
  id_user_update?: number;
}
export const CategoriasService = {
  async getCategories() {
    const response = await axios.get(`${API_BASE_URL}/categorias`, { headers });
    return response;
  },
  async createCategory(data: Categoria) {
    const user: any = localStorage.getItem("user");
    data.id_user_create = JSON.parse(user).id;
    // console.log("DATOS: ", data);
    const response = await axios.post(`${API_BASE_URL}/categorias`, data, {
      headers,
    });
    return response;
  },
  async updateCategory(id: number, data: Categoria) {
    const response = await axios.patch(
      `${API_BASE_URL}/categorias/${id}`,
      data,
      {
        headers,
      },
    );
    return response;
  },
  async deleteCategory(id: number) {
    const response = await axios.delete(`${API_BASE_URL}/categorias/${id}`, {
      headers,
    });
    return response;
  },
};
