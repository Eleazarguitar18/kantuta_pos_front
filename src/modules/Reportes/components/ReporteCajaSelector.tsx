import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { pdf } from "@react-pdf/renderer";
import { MovimientosCajaPdf } from "../../../components/pdf/MovimientosCajaPdf";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../components/common/ComponentCard";
import Button from "../../../components/ui/button/Button";
import Alert from "../../../components/ui/alert/Alert";
import { API_BASE_URL } from "../../../components/auth/services/urlBase";
import { Caja, SesionCaja } from "../../Cajas/interfaces/Caja";
import { CajasService } from "../../Cajas/services/cajasService";
import DataTable from "react-data-table-component";

const ReporteCajaSelector = () => {
  const navigate = useNavigate();

  // Step state
  const [step, setStep] = useState<"select-caja" | "select-sesion">("select-caja");

  // Data
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [selectedCaja, setSelectedCaja] = useState<Caja | null>(null);
  const [sesiones, setSesiones] = useState<SesionCaja[]>([]);

  // UI
  const [loading, setLoading] = useState(true);
  const [cargandoPdf, setCargandoPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  });

  useEffect(() => {
    fetchCajas();
  }, []);

  const fetchCajas = async () => {
    try {
      setLoading(true);
      const response = await CajasService.getCajas();
      setCajas(response.data);
    } catch (err) {
      console.error(err);
      setError("Error al cargar las cajas.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCaja = async (caja: Caja) => {
    setSelectedCaja(caja);
    setStep("select-sesion");
    try {
      setLoading(true);
      const response = await CajasService.getCajaById(caja.id);
      const cajaData: Caja = response.data;
      setSesiones(cajaData.sesiones || []);
    } catch (err) {
      console.error(err);
      setError("Error al cargar las sesiones de esta caja.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (sesion: SesionCaja) => {
    try {
      setCargandoPdf(true);
      setError(null);
      const url = `${API_BASE_URL}/reportes/data/movimientos-caja/${sesion.id}`;
      const response = await axios.get(url, {
        headers: getHeaders(),
      });

      const blob = await pdf(<MovimientosCajaPdf data={response.data} />).toBlob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `movimientos-caja-sesion-${sesion.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error(err);
      setError("Error al generar el PDF. Intente de nuevo.");
    } finally {
      setCargandoPdf(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("es-BO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const cajasColumns = [
    {
      name: "ID",
      selector: (row: Caja) => row.id,
      sortable: true,
      width: "80px",
    },
    {
      name: "Nombre",
      selector: (row: Caja) => row.nombre,
      sortable: true,
    },
    {
      name: "Especialidad",
      selector: (row: Caja) => row.especialidad,
      cell: (row: Caja) => (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {row.especialidad.replace("_", " ")}
        </span>
      ),
    },
    {
      name: "Estado",
      cell: (row: Caja) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {row.estado ? "Activa" : "Inactiva"}
        </span>
      ),
    },
    {
      name: "Acción",
      cell: (row: Caja) => (
        <Button
          variant="primary"
          size="sm"
          className="bg-indigo-500 hover:bg-indigo-600 text-white"
          onClick={() => handleSelectCaja(row)}
        >
          Ver Sesiones
        </Button>
      ),
      width: "160px",
    },
  ];

  const sesionesColumns = [
    {
      name: "# Sesión",
      selector: (row: SesionCaja) => row.id,
      sortable: true,
      width: "110px",
    },
    {
      name: "Apertura",
      selector: (row: SesionCaja) => row.fecha_apertura,
      cell: (row: SesionCaja) => formatDate(row.fecha_apertura),
      sortable: true,
    },
    {
      name: "Cierre",
      selector: (row: SesionCaja) => row.fecha_cierre || "",
      cell: (row: SesionCaja) => row.fecha_cierre ? formatDate(row.fecha_cierre) : (
        <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">EN CURSO</span>
      ),
      sortable: true,
    },
    {
      name: "Monto Inicial",
      selector: (row: SesionCaja) => row.monto_inicial,
      cell: (row: SesionCaja) => <span className="font-semibold">Bs. {Number(row.monto_inicial).toFixed(2)}</span>,
      sortable: true,
    },
    {
      name: "Estado",
      cell: (row: SesionCaja) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${row.estado_sesion === "ABIERTA" ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
          {row.estado_sesion}
        </span>
      ),
    },
    {
      name: "Reporte",
      cell: (row: SesionCaja) => (
        <Button
          variant="primary"
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => handleDownloadPdf(row)}
          disabled={cargandoPdf}
        >
          {cargandoPdf ? "..." : "📄 PDF"}
        </Button>
      ),
      width: "120px",
    },
  ];

  return (
    <div>
      <PageBreadcrumb pageTitle="Reporte de Movimientos de Caja" />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {step === "select-caja" ? "Paso 1: Seleccione la Caja" : `Paso 2: Sesiones de "${selectedCaja?.nombre}"`}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {step === "select-caja"
              ? "Elija una caja física para ver sus sesiones."
              : "Seleccione una sesión para generar el reporte PDF de movimientos."}
          </p>
        </div>
        <div className="flex gap-3">
          {step === "select-sesion" && (
            <Button
              variant="primary"
              size="sm"
              className="bg-gray-500 hover:bg-gray-600 text-white"
              onClick={() => {
                setStep("select-caja");
                setSelectedCaja(null);
                setSesiones([]);
              }}
            >
              ← Volver a Cajas
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            className="bg-gray-400 hover:bg-gray-500 text-white"
            onClick={() => navigate("/reportes")}
          >
            Volver a Reportes
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${step === "select-caja" ? "bg-indigo-600 text-white shadow-lg" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-xs font-bold">1</span>
          Caja
        </div>
        <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600" />
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${step === "select-sesion" ? "bg-indigo-600 text-white shadow-lg" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-xs font-bold">2</span>
          Sesión
        </div>
        <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600" />
        <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-xs font-bold">3</span>
          PDF
        </div>
      </div>

      {step === "select-caja" && (
        <ComponentCard title="Cajas Registradas">
          <DataTable
            columns={cajasColumns}
            data={cajas}
            pagination
            progressPending={loading}
            highlightOnHover
            noDataComponent="No hay cajas registradas"
            customStyles={{
              headCells: {
                style: {
                  fontWeight: "bold",
                  fontSize: "14px",
                  backgroundColor: "#f9fafb",
                },
              },
            }}
          />
        </ComponentCard>
      )}

      {step === "select-sesion" && (
        <ComponentCard title={`Sesiones de Caja: ${selectedCaja?.nombre}`}>
          <DataTable
            columns={sesionesColumns}
            data={sesiones}
            pagination
            progressPending={loading}
            highlightOnHover
            noDataComponent="No hay sesiones para esta caja"
            defaultSortFieldId={1}
            defaultSortAsc={false}
            customStyles={{
              headCells: {
                style: {
                  fontWeight: "bold",
                  fontSize: "14px",
                  backgroundColor: "#f9fafb",
                },
              },
            }}
          />
        </ComponentCard>
      )}
    </div>
  );
};

export default ReporteCajaSelector;
