import axios from "axios";
import { API_BASE_URL } from "../../../../components/auth/services/urlBase";
import { ProductoEditDto } from "../interfaces/ProductoEditDto";
import { Producto } from "../interfaces/Producto";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

export const ProductosService = {
  async getProducts() {
    const response = await axios.get(`${API_BASE_URL}/inventario/producto`, {
      headers: getHeaders(),
    });
    return response;
  },
  async getProductById(id: number) {
    const response = await axios.get(
      `${API_BASE_URL}/inventario/producto/${id}`,
      {
        headers: getHeaders(),
      },
    );
    return response;
  },
  async createProduct(data: Producto) {
    const user: any = localStorage.getItem("user");
    data.id_user_create = JSON.parse(user).id;
    const response = await axios.post(
      `${API_BASE_URL}/inventario/producto`,
      data,
      {
        headers: getHeaders(),
      },
    );
    return response;
  },
  async updateProduct(id: number, data: ProductoEditDto) {
    const user: any = localStorage.getItem("user");
    data.id_user_update = JSON.parse(user).id;
    const response = await axios.patch(
      `${API_BASE_URL}/inventario/producto/${id}`,
      data,
      {
        headers: getHeaders(),
      },
    );
    return response;
  },
  async deleteProduct(id: number) {
    const response = await axios.delete(
      `${API_BASE_URL}/inventario/producto/${id}`,
      {
        headers: getHeaders(),
      },
    );
    return response;
  },
};
