import { useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";

// Importaciones de las herramientas del PDF y de tu API Service
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ReporteVentasPDF } from "../../modules/Ventas/components/ReporteVentasPDF";
import { VentasService } from "../../modules/Ventas/services/ventasService";

interface ReportesModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  onGenerate?: (startDate: string, endDate: string) => void;
}

const ReportesModal = ({ isOpen, onClose, title = "Generar Reporte en PDF", onGenerate }: ReportesModalProps) => {
  const [mode, setMode] = useState<"MES" | "RANGO">("MES");
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Nuevos estados para controlar la sincronización de datos con NestJS
  const [datosReporte, setDatosReporte] = useState<any>(null);
  const [loadingBackend, setLoadingBackend] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [rangoTexto, setRangoTexto] = useState<string>("");

  const months = [
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => ({
    value: (new Date().getFullYear() - i).toString(),
    label: (new Date().getFullYear() - i).toString()
  }));

  const handleConsultarServidor = async () => {
    let sDate = "";
    let eDate = "";

    if (mode === "MES") {
      const start = new Date(Number(selectedYear), Number(selectedMonth) - 1, 1);
      const end = new Date(Number(selectedYear), Number(selectedMonth), 0);

      sDate = start.toISOString().split("T")[0];
      eDate = end.toISOString().split("T")[0];
    } else {
      if (!startDate || !endDate) return alert("Seleccione el rango completo");
      sDate = startDate;
      eDate = endDate;
    }

    if (onGenerate) {
      // If a custom generator is passed, let it handle the logic and close the modal
      onGenerate(sDate, eDate);
      return;
    }

    try {
      setLoadingBackend(true);
      setError("");
      setDatosReporte(null);
      setRangoTexto(`${sDate} al ${eDate}`);

      // Consumimos el endpoint POST enviando el body estructurado
      const data = await VentasService.getReporteResumen(sDate, eDate);
      setDatosReporte(data);
    } catch (err: any) {
      console.error(err);
      setError("Hubo un error al extraer los datos para el reporte en este rango.");
    } finally {
      setLoadingBackend(false);
    }
  };

  // Función para resetear estados y cerrar de forma limpia
  const handleCloseClean = () => {
    setDatosReporte(null);
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCloseClean} className="max-w-md p-6">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{title}</h3>

      <div className="flex gap-2 mb-6">
        <button
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "MES" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" : "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400"}`}
          onClick={() => { setMode("MES"); setDatosReporte(null); }}
        >
          Por Mes
        </button>
        <button
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "RANGO" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" : "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400"}`}
          onClick={() => { setMode("RANGO"); setDatosReporte(null); }}
        >
          Rango Exacto
        </button>
      </div>

      {mode === "MES" ? (
        <div className="space-y-4">
          <div>
            <Label>Año</Label>
            <Select options={years} defaultValue={selectedYear} onChange={(val: string) => { setSelectedYear(val); setDatosReporte(null); }} />
          </div>
          <div>
            <Label>Mes</Label>
            <Select options={months} defaultValue={selectedMonth} onChange={(val: string) => { setSelectedMonth(val); setDatosReporte(null); }} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label>Fecha Inicio</Label>
            <Input type="date" value={startDate} onChange={(e: any) => { setStartDate(e.target.value); setDatosReporte(null); }} />
          </div>
          <div>
            <Label>Fecha Fin</Label>
            <Input type="date" value={endDate} onChange={(e: any) => { setEndDate(e.target.value); setDatosReporte(null); }} />
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>}

      {/* FOOTER DE ACCIONES DEL MODAL */}
      <div className="mt-8 flex gap-3 justify-end">
        <Button variant="primary" className="bg-gray-200 text-gray-800 dark:bg-zinc-700 dark:text-zinc-200" onClick={handleCloseClean}>
          Cancelar
        </Button>

        {/* Si no hay datos cargados, se muestra el botón tradicional para consultar al Backend */}
        {!datosReporte ? (
          <Button
            variant="primary"
            className="bg-blue-600 text-white disabled:opacity-50"
            onClick={handleConsultarServidor}
            disabled={loadingBackend}
          >
            {loadingBackend ? "Sincronizando..." : "Consultar Rango"}
          </Button>
        ) : (
          /* Si los datos ya llegaron con éxito, transformamos el botón en el link de descarga del PDF */
          <PDFDownloadLink
            document={<ReporteVentasPDF datos={datosReporte} rango={rangoTexto} />}
            fileName={`Reporte_Kantuta_${rangoTexto.replace(/ /g, "_")}.pdf`}
            style={{ textDecoration: "none" }}
          >
            {({ loading }) => (
              <Button
                variant="primary"
                className="bg-green-600 text-white"
                disabled={loading}
              >
                {loading ? "Estructurando PDF..." : "⬇️ Descargar PDF"}
              </Button>
            )}
          </PDFDownloadLink>
        )}
      </div>
    </Modal>
  );
};

export default ReportesModal;