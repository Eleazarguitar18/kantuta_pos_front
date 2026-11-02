import axios from "axios";
import { API_BASE_URL } from "../../../components/auth/services/urlBase";
import {
  MatrizControlData,
  MatrizControlParams,
} from "../interfaces/MatrizControl";

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
});

const normalizeParams = (params: MatrizControlParams) => ({
  mes: params.mes,
  anio: params.anio,
  ...(params.id_caja ? { id_caja: params.id_caja } : {}),
});

export const ReportesService = {
  async getMatrizControl(params: MatrizControlParams) {
    return await axios.get<MatrizControlData>(
      `${API_BASE_URL}/reportes/matriz-control`,
      {
        params: normalizeParams(params),
        headers: getHeaders(),
      },
    );
  },

  async downloadMatrizControlExcel(params: MatrizControlParams) {
    return await axios.get(`${API_BASE_URL}/reportes/matriz-control/excel`, {
      params: normalizeParams(params),
      headers: getHeaders(),
      responseType: "blob",
    });
  },
};
