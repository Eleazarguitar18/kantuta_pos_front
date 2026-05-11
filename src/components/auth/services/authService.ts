import axios from "axios";
import { API_BASE_URL } from "./urlBase";
interface LoginData {
  email: string;
  password: string;
}

export const authService = {
  login: async (data: LoginData) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, data);
    return response;
  },
};
