import axios from "axios";
import { API_BASE_URL } from "../../../../components/auth/services/urlBase";
const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

interface Categoria {
  nombre: string;
  id_user_create?: number;
  id_user_update?: number;
}
export const CategoriasService = {
  async getCategories() {
    const response = await axios.get(`${API_BASE_URL}/inventario/categorias`, {
      headers: getHeaders(),
    });
    return response;
  },
  async getCategoryById(id: number) {
    const response = await axios.get(
      `${API_BASE_URL}/inventario/categorias/${id}`,
      { headers: getHeaders() },
    );
    return response;
  },
  async createCategory(data: Categoria) {
    const user: any = localStorage.getItem("user");
    data.id_user_create = JSON.parse(user).id;
    // console.log("DATOS: ", data);
    const response = await axios.post(
      `${API_BASE_URL}/inventario/categorias`,
      data,
      {
        headers: getHeaders(),
      },
    );
    return response;
  },
  async updateCategory(id: number, data: Categoria) {
    const response = await axios.patch(
      `${API_BASE_URL}/inventario/categorias/${id}`,
      data,
      {
        headers: getHeaders(),
      },
    );
    return response;
  },
  async deleteCategory(id: number) {
    const response = await axios.delete(
      `${API_BASE_URL}/inventario/categorias/${id}`,
      {
        headers: getHeaders(),
      },
    );
    return response;
  },
};
