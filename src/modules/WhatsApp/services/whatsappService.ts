import axios from "axios";
import { API_BASE_URL } from "../../../components/auth/services/urlBase";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

export const WhatsAppService = {
  async connect() {
    const response = await axios.get(`${API_BASE_URL}/whatsapp/connect`, {
      headers: getHeaders(),
    });
    return response;
  },

  async logout() {
    const response = await axios.post(
      `${API_BASE_URL}/whatsapp/logout`,
      {},
      {
        headers: getHeaders(),
      },
    );
    return response;
  },
};
