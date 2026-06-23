import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import Button from "../../../components/ui/button/Button";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import { CajasService } from "../services/cajasService";
import Alert from "../../../components/ui/alert/Alert";
import { Caja, SesionCaja } from "../interfaces/Caja";
import ComponentCard from "../../../components/common/ComponentCard";
import { useCaja } from "../../../context/CajaContext";
import { useAuth } from "../../../context/auth/AuthContext";
import { useRole } from "../../../hooks/useRole";
import { useSocket } from "../../../context/SocketContext";
import { API_BASE_URL } from "../../../components/auth/services/urlBase";
import axios from "axios";
import { pdf } from "@react-pdf/renderer";
import { MovimientosCajaPdf } from "../../../components/pdf/MovimientosCajaPdf";

const CajasControl = () => {
  // Core data
  const [caja, setCaja] = useState<Caja | null>(null);
  const [sesionActiva, setSesionActiva] = useState<SesionCaja | null>(null);
  const { abrirCaja, cerrarCaja } = useCaja();
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const socket = useSocket();

  // Form state – apertura
  const [montoInicial, setMontoInicial] = useState<number>(0);

  // Form state – cierre (pre‑llenado con balance teórico)
  const [montoFinalReal, setMontoFinalReal] = useState<number>(0);

  // Movimiento de efectivo
  const [tipoMovimiento, setTipoMovimiento] = useState<"INGRESO" | "EGRESO">("INGRESO");
  const [montoMovimiento, setMontoMovimiento] = useState<number>(0);
  const [motivoMovimiento, setMotivoMovimiento] = useState<string>("");

  // UI feedback
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Hubo un problema al ejecutar la operación.");

  const navigate = useNavigate();
  const { id } = useParams();

  const fetchCajaData = async () => {
    try {
      const response = await CajasService.getCajaById(Number(id));
      const data: Caja = response.data;
      setMontoInicial(data.saldo);
      setCaja(data);
      const activa = data.sesiones?.find(s => s.estado_sesion === "ABIERTA");
      setSesionActiva(activa || null);
      if (activa) {
        try {
          const balanceRes = await CajasService.getSesionBalance(activa.id);
          if (balanceRes && balanceRes.data) {
            setMontoFinalReal(Number(balanceRes.data));
          }
        } catch (error: any) {
          if (error.response?.status === 404) {
            setSesionActiva(null);
          } else {
            console.error("Error al cargar balance de la sesión", error);
          }
        }
      }
    } catch (error) {
      console.error("Error al cargar datos de la caja", error);
    }
  };

  useEffect(() => {
    fetchCajaData();
  }, [id]);

  useEffect(() => {
    const handleDataChanged = (data: { entity: string; action: string }) => {
      if (data.entity === "caja") {
        console.log(`📡 WebSocket detectado en CajasControl: ${data.action}`);
        fetchCajaData();
      }
    };

    socket.on("dataChanged", handleDataChanged);
    return () => {
      socket.off("dataChanged", handleDataChanged);
    };
  }, [socket, id]);

  const handleAbrirSesion = async () => {
    if (montoInicial < 0) return alert("El monto inicial debe ser válido.");
    try {
      await abrirCaja(Number(id), montoInicial);
      setAlertMessage("Sesión abierta correctamente.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      fetchCajaData();
    } catch (error) {
      setErrorMessage("Hubo un problema al abrir la sesión.");
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const handleCerrarSesion = async () => {
    if (!sesionActiva) return;
    if (montoFinalReal < 0) return alert("El monto final real debe ser válido.");
    try {
      await cerrarCaja(montoFinalReal, sesionActiva.id);
      setAlertMessage("Sesión cerrada correctamente.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      fetchCajaData();
    } catch (error) {
      setErrorMessage("Hubo un problema al cerrar la sesión.");
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const handleMovimiento = async () => {
    if (!sesionActiva) return;
    if (montoMovimiento <= 0 || !motivoMovimiento) return alert("Ingrese un monto válido y un motivo.");
    try {
      await CajasService.registrarMovimiento({
        tipo: tipoMovimiento,
        monto: montoMovimiento,
        motivo: motivoMovimiento,
        id_sesion_caja: sesionActiva.id,
        id_user_create: 0
      });
      setAlertMessage(`Movimiento de ${tipoMovimiento} registrado.`);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      setMontoMovimiento(0);
      setMotivoMovimiento("");
      fetchCajaData();
    } catch (error) {
      setErrorMessage("Error al registrar movimiento.");
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const handleDownloadPDF = async () => {
    if (!sesionActiva) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/reportes/data/movimientos-caja/${sesionActiva.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
      });
      const blob = await pdf(<MovimientosCajaPdf data={response.data} />).toBlob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `Caja-Sesion-${sesionActiva.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      alert("Error al estructurar el PDF de movimientos.");
    }
  };

  if (!caja) return <div className="p-6">Cargando datos de caja...</div>;

  return (
    <div>
      <PageBreadcrumb pageTitle={`Control de Caja - ${caja.nombre}`} />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{caja.nombre}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Especialidad: {caja.especialidad.replace("_", " ")}
          </p>
        </div>
        <Button className="bg-gray-500 hover:bg-gray-600 text-white" onClick={() => navigate("/cajas")}>Volver</Button>
      </div>

      {showAlert && (
        <div className="mb-4">
          <Alert variant="success" title="Éxito" message={alertMessage} />
        </div>
      )}
      {showError && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={errorMessage} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1 – Estado y apertura/cierre */}
        <div className="space-y-6">
          <ComponentCard title="Estado Actual de la Caja">
            {sesionActiva ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <h4 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">Sesión Abierta</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">ID Sesión: <span className="font-medium text-gray-900 dark:text-gray-100">{sesionActiva.id}</span></p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Apertura: <span className="font-medium text-gray-900 dark:text-gray-100">{new Date(sesionActiva.fecha_apertura).toLocaleString()}</span></p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Monto Inicial: <span className="font-semibold text-gray-900 dark:text-gray-100">Bs. {sesionActiva.monto_inicial}</span></p>

                  <div className="mt-4">
                    <Button variant="primary" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2 px-4" onClick={handleDownloadPDF}>
                      📄 Descargar Extracto (PDF)
                    </Button>
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Cerrar Sesión (Arqueo)</h4>
                  <div className="mb-3">
                    <Label>Dinero Físico en Caja (Bs.)</Label>
                    <Input
                      type="number"
                      step={0.10}
                      min="0"
                      value={montoFinalReal}
                      onChange={e => setMontoFinalReal(Number(e.target.value))}
                    />
                  </div>
                  <Button variant="primary" className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={handleCerrarSesion}>Confirmar Cierre de Caja</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-center">
                  <h4 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Caja Cerrada</h4>
                  <p className="text-sm text-gray-400 mt-1">No hay una sesión activa para esta caja.</p>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Abrir Nueva Sesión</h4>
                  <div className="mb-3">
                    <Label>Monto Inicial (Bs.)</Label>
                    <Input
                      type="number"
                      step={0.10}
                      min="0"
                      value={montoInicial}
                      onChange={e => setMontoInicial(Number(e.target.value))}
                    />
                  </div>
                  <Button variant="primary" className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAbrirSesion}>Abrir Caja</Button>
                </div>
              </div>
            )}
          </ComponentCard>
        </div>

        {/* Panel 2 – Movimiento de efectivo */}
        <div className="space-y-6">
          <ComponentCard title="Movimiento de Efectivo">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Registra transacciones de efectivo ordinarias que alteran el cuadre directo de caja.</p>
            <div className="space-y-4">
              <div>
                <Label>Tipo de Movimiento</Label>
                <Select
                  options={[{ value: "INGRESO", label: "Ingreso (+)" }, { value: "EGRESO", label: "Egreso (-)" }]}
                  onChange={val => setTipoMovimiento(val as "INGRESO" | "EGRESO")}
                  defaultValue={tipoMovimiento}
                />
              </div>
              <div>
                <Label>Monto (Bs.)</Label>
                <Input
                  type="number"
                  step={0.10}
                  min="0.10"
                  value={montoMovimiento}
                  onChange={e => setMontoMovimiento(Number(e.target.value))}
                  disabled={!sesionActiva}
                />
              </div>
              <div>
                <Label>Motivo / Justificación</Label>
                <Input
                  type="text"
                  placeholder="Ej: Pago de material de limpieza"
                  value={motivoMovimiento}
                  onChange={e => setMotivoMovimiento(e.target.value)}
                  disabled={!sesionActiva}
                />
              </div>
              <Button
                variant="primary"
                className={`w-full text-white ${tipoMovimiento === "INGRESO" ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"} ${!sesionActiva ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={handleMovimiento}
                disabled={!sesionActiva}
              >
                Registrar {tipoMovimiento}
              </Button>
              {!sesionActiva && (
                <p className="text-xs text-red-500 text-center mt-2">Debe abrir sesión para registrar movimientos.</p>
              )}
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
};

export default CajasControl;
