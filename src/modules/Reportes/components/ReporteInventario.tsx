import { useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { pdf } from "@react-pdf/renderer";
import { ReporteInventarioPDF } from "./ReporteInventarioPDF";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../components/common/ComponentCard";
import Button from "../../../components/ui/button/Button";
import Alert from "../../../components/ui/alert/Alert";
import { useAuth } from "../../../context/auth/AuthContext";
import { API_BASE_URL } from "../../../components/auth/services/urlBase";

const ReporteInventario = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  });

  const handleDownload = async () => {
    try {
      setCargando(true);
      setError(null);
      const auditor = user?.name || "Auditor Autorizado";
      const url = `${API_BASE_URL}/reportes/data/inventario?auditor=${encodeURIComponent(auditor)}`;
      const response = await axios.get(url, {
        headers: getHeaders(),
      });

      const datosReporte = response.data;

      // Generar el PDF en el frontend
      const blob = await pdf(<ReporteInventarioPDF datos={datosReporte} />).toBlob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `inventario-actual-${new Date().toISOString().split("T")[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error(err);
      setError("Error al generar el PDF de inventario. Intente de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Reporte de Inventario Actual" />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Inventario y Stock
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Genera un PDF con el estado actual del inventario de productos.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="bg-gray-400 hover:bg-gray-500 text-white"
          onClick={() => navigate("/reportes")}
        >
          ← Volver a Reportes
        </Button>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      <div className="max-w-2xl">
        <ComponentCard title="Descargar Estado Actual">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Este reporte captura una "fotografía" del estado del stock en este mismo instante. 
            Incluye semaforización de stock bajo, cálculo de inversión y ganancia proyectada. 
            <strong> No requiere seleccionar fechas.</strong>
          </p>
          
          <Button
            variant="primary"
            className="w-full py-4 text-white font-bold text-lg bg-purple-600 hover:bg-purple-700 shadow-xl transition-all duration-300"
            onClick={handleDownload}
            disabled={cargando}
          >
            {cargando ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Generando PDF...
              </span>
            ) : (
              "📊 Generar PDF de Inventario"
            )}
          </Button>
        </ComponentCard>
      </div>
    </div>
  );
};

export default ReporteInventario;
