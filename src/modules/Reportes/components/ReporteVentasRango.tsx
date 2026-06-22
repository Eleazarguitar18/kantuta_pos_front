import { useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { pdf } from "@react-pdf/renderer";
import { ReporteVentasPDF } from "../../Ventas/components/ReporteVentasPDF";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../components/common/ComponentCard";
import Button from "../../../components/ui/button/Button";
import Alert from "../../../components/ui/alert/Alert";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import { useAuth } from "../../../context/auth/AuthContext";
import { API_BASE_URL } from "../../../components/auth/services/urlBase";

const quickRanges = [
  { label: "Hoy", getDates: () => { const t = new Date().toISOString().split("T")[0]; return { inicio: t, fin: t }; } },
  { label: "Esta Semana", getDates: () => {
    const now = new Date();
    const day = now.getDay();
    const mondayDiff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayDiff);
    return { inicio: monday.toISOString().split("T")[0], fin: now.toISOString().split("T")[0] };
  }},
  { label: "Este Mes", getDates: () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return { inicio: firstDay.toISOString().split("T")[0], fin: now.toISOString().split("T")[0] };
  }},
  { label: "Mes Pasado", getDates: () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    return { inicio: firstDay.toISOString().split("T")[0], fin: lastDay.toISOString().split("T")[0] };
  }},
  { label: "Últimos 3 Meses", getDates: () => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    return { inicio: threeMonthsAgo.toISOString().split("T")[0], fin: now.toISOString().split("T")[0] };
  }},
];

const ReporteVentasRango = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuick, setSelectedQuick] = useState<string | null>(null);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  });

  const handleQuickRange = (label: string, inicio: string, fin: string) => {
    setFechaInicio(inicio);
    setFechaFin(fin);
    setSelectedQuick(label);
  };

  const handleDownload = async () => {
    if (!fechaInicio || !fechaFin) return setError("Seleccione el rango de fechas.");
    if (new Date(fechaInicio) > new Date(fechaFin)) return setError("La fecha de inicio no puede ser mayor que la fecha fin.");

    try {
      setCargando(true);
      setError(null);
      const auditor = user?.name || "Auditor Autorizado";
      const url = `${API_BASE_URL}/reportes/data/ventas-rango?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}&auditor=${encodeURIComponent(auditor)}`;
      const response = await axios.get(url, {
        headers: getHeaders(),
      });

      const datosReporte = response.data;
      const rangoTexto = `${fechaInicio} al ${fechaFin}`;

      // Generar el PDF en el frontend
      const blob = await pdf(<ReporteVentasPDF datos={datosReporte} rango={rangoTexto} />).toBlob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `ventas-rango-${fechaInicio}-a-${fechaFin}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error(err);
      setError("Error al generar el PDF de ventas. Intente de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Reporte de Ventas por Rango" />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Reporte de Ventas
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Seleccione un periodo predefinido o personalice su rango de fechas para generar la auditoría de ventas.
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick ranges */}
        <div className="lg:col-span-1">
          <ComponentCard title="Periodos Rápidos">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Seleccione un periodo predefinido para no tener que escribir fechas manualmente.
            </p>
            <div className="space-y-2">
              {quickRanges.map((range) => (
                <button
                  key={range.label}
                  onClick={() => {
                    const { inicio, fin } = range.getDates();
                    handleQuickRange(range.label, inicio, fin);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                    selectedQuick === range.label
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 shadow-sm"
                      : "border-gray-200 dark:border-gray-700 hover:border-emerald-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{range.label}</span>
                    {selectedQuick === range.label && (
                      <span className="text-emerald-600">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ComponentCard>
        </div>

        {/* Date pickers and download */}
        <div className="lg:col-span-2">
          <ComponentCard title="Rango de Fechas Personalizado">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              O personalice el rango de fechas manualmente seleccionando las fechas del calendario.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <Label>Fecha Inicio</Label>
                <Input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => {
                    setFechaInicio(e.target.value);
                    setSelectedQuick(null);
                  }}
                />
              </div>
              <div>
                <Label>Fecha Fin</Label>
                <Input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => {
                    setFechaFin(e.target.value);
                    setSelectedQuick(null);
                  }}
                />
              </div>
            </div>

            {fechaInicio && fechaFin && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl mb-6">
                <p className="text-sm text-emerald-800 dark:text-emerald-300">
                  <span className="font-semibold">Periodo seleccionado: </span>
                  {new Date(fechaInicio + "T00:00:00").toLocaleDateString("es-BO", { year: "numeric", month: "long", day: "numeric" })}
                  {" — "}
                  {new Date(fechaFin + "T00:00:00").toLocaleDateString("es-BO", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            )}

            <Button
              variant="primary"
              className={`w-full py-3 text-white font-semibold text-base transition-all duration-300 ${
                fechaInicio && fechaFin
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl"
                  : "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
              }`}
              onClick={handleDownload}
              disabled={cargando || !fechaInicio || !fechaFin}
            >
              {cargando ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Generando PDF...
                </span>
              ) : (
                "📄 Descargar Reporte de Ventas (PDF)"
              )}
            </Button>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
};

export default ReporteVentasRango;
