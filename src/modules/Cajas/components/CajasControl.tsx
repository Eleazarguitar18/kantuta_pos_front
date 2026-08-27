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
import { ArqueoCajaAccordion, ArqueoCajaErrorBoundary } from "./ArqueoCajaAccordion";
import { Modal } from "../../../components/ui/modal";

import Swal from "sweetalert2";

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
  const [totalIngresos, setTotalIngresos] = useState<number>(0);
  const [totalEgresos, setTotalEgresos] = useState<number>(0);
  const [showArqueoForm, setShowArqueoForm] = useState<boolean>(false);

  // Movimiento de efectivo en modal
  const [isMovimientoModalOpen, setIsMovimientoModalOpen] = useState<boolean>(false);
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
      setMontoInicial(Number(data.saldo) || 0);
      setCaja(data);
      const activa = data.sesiones?.find(s => s.estado_sesion === "ABIERTA");
      setSesionActiva(activa || null);
      if (activa) {
        try {
          const balanceRes = await CajasService.getSesionBalance(activa.id);
          if (balanceRes && balanceRes.data) {
            if (typeof balanceRes.data === "object") {
              setMontoFinalReal(Number(balanceRes.data.monto_final_teorico || 0));
              setTotalIngresos(Number(balanceRes.data.ingresos || 0));
              setTotalEgresos(Number(balanceRes.data.egresos || 0));
            } else {
              setMontoFinalReal(Number(balanceRes.data || 0));
            }
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
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Hubo un problema al abrir la sesión.";
      Swal.fire({
        icon: "warning",
        title: "Sesión ya activa",
        text: typeof msg === "string" ? msg : "El usuario ya cuenta con una caja abierta.",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Entendido",
      });
      setErrorMessage(typeof msg === "string" ? msg : "Hubo un problema al abrir la sesión.");
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const handleCerrarSesion = async () => {
    if (!sesionActiva) return;
    setShowArqueoForm(true);
  };

  const handleConfirmarArqueo = async (montoDeclarado: number, desgloseArqueo: any) => {
    if (!sesionActiva) return;
    try {
      await cerrarCaja(montoDeclarado, sesionActiva.id, desgloseArqueo);
      setAlertMessage("Sesión de caja cerrada y arqueo registrado correctamente.");
      setShowAlert(true);
      setShowArqueoForm(false);
      setTimeout(() => setShowAlert(false), 3000);
      fetchCajaData();
    } catch (error) {
      setErrorMessage("Hubo un problema al cerrar la sesión de caja.");
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
      setAlertMessage(`Movimiento de ${tipoMovimiento} registrado correctamente.`);
      setShowAlert(true);
      setIsMovimientoModalOpen(false);
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
    <div className="space-y-6">
      <PageBreadcrumb pageTitle={`Control de Caja - ${caja.nombre}`} />

      {/* Cabecera Principal de Acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">{caja.nombre}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Especialidad: <strong>{caja.especialidad.replace("_", " ")}</strong>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {sesionActiva && (
            <Button
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 text-sm shadow-md"
              onClick={() => setIsMovimientoModalOpen(true)}
            >
              ➕ Registrar Movimiento de Efectivo
            </Button>
          )}
          <Button className="bg-gray-500 hover:bg-gray-600 text-white text-sm" onClick={() => navigate("/cajas")}>
            Volver
          </Button>
        </div>
      </div>

      {showAlert && (
        <div>
          <Alert variant="success" title="Éxito" message={alertMessage} />
        </div>
      )}
      {showError && (
        <div>
          <Alert variant="error" title="Error" message={errorMessage} />
        </div>
      )}

      {/* Vista de Estado y Arqueo Principal (Ancho Completo 100%) */}
      <div className="w-full">
        <ComponentCard title="Estado Actual de la Caja">
          {sesionActiva ? (
            <div className="space-y-6">
              <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                    <h4 className="text-lg font-bold text-emerald-900 dark:text-emerald-300">Sesión de Caja Activa</h4>
                  </div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <p>ID Sesión: <strong>#{sesionActiva.id}</strong></p>
                    <p>Apertura: <strong>{new Date(sesionActiva.fecha_apertura).toLocaleString()}</strong></p>
                    <p>Monto Inicial: <strong>Bs. {Number(sesionActiva.monto_inicial).toFixed(2)}</strong></p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="primary" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2 px-4 shadow-sm" onClick={handleDownloadPDF}>
                    📄 Descargar Extracto (PDF)
                  </Button>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-base mb-4">Cerrar Sesión y Arqueo Digital</h4>
                {!showArqueoForm ? (
                  <Button variant="primary" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl text-base shadow-md" onClick={handleCerrarSesion}>
                    📋 Iniciar Arqueo y Cierre de Turno
                  </Button>
                ) : (
                  <ArqueoCajaErrorBoundary
                    teoricoCalculado={montoFinalReal}
                    totalIngresos={totalIngresos}
                    totalEgresos={totalEgresos}
                    onConfirmarCierre={handleConfirmarArqueo}
                    onCancelar={() => setShowArqueoForm(false)}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-center">
                <h4 className="text-lg font-bold text-gray-500 dark:text-gray-400">Caja Cerrada</h4>
                <p className="text-sm text-gray-400 mt-1">No hay una sesión activa operando actualmente en esta caja.</p>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-base mb-4">Abrir Nueva Sesión</h4>
                {!showArqueoForm ? (
                  <div className="space-y-4 max-w-xl">
                    <div>
                      <Label>Monto Inicial de Efectivo en Caja (Bs.)</Label>
                      <Input
                        type="number"
                        step={0.10}
                        min="0"
                        value={montoInicial}
                        onChange={e => setMontoInicial(Number(e.target.value))}
                        className="text-lg font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button variant="primary" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3" onClick={handleAbrirSesion}>
                        Apertura Rápida
                      </Button>
                      <Button variant="outline" className="w-full text-indigo-600 border-indigo-600 hover:bg-indigo-50 font-bold py-3" onClick={() => setShowArqueoForm(true)}>
                        📋 Apertura con Arqueo Completo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <ArqueoCajaErrorBoundary
                    modo="apertura"
                    teoricoCalculado={montoInicial}
                    onConfirmar={async (montoDeclarado, desglose) => {
                      try {
                        await abrirCaja(Number(id), montoDeclarado, desglose);
                        setAlertMessage("Sesión abierta con arqueo completo.");
                        setShowAlert(true);
                        setShowArqueoForm(false);
                        setTimeout(() => setShowAlert(false), 3000);
                        fetchCajaData();
                      } catch (error: any) {
                        const msg = error?.response?.data?.message || "Error al abrir la sesión.";
                        setErrorMessage(typeof msg === "string" ? msg : "Error al abrir la sesión.");
                        setShowError(true);
                        setTimeout(() => setShowError(false), 3000);
                      }
                    }}
                    onCancelar={() => setShowArqueoForm(false)}
                  />
                )}
              </div>
            </div>
          )}
        </ComponentCard>
      </div>

      {/* Historial de Sesiones */}
      {caja.sesiones && caja.sesiones.length > 0 && (
        <div className="mt-8">
          <ComponentCard title="Historial de Sesiones">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase">Apertura</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase">Cierre</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-500 uppercase">Monto Inicial</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-500 uppercase">Monto Final (Cierre)</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-500 uppercase">Diferencia</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {[...caja.sesiones].sort((a, b) => b.id - a.id).map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-300 font-bold">#{s.id}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(s.fecha_apertura).toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.fecha_cierre ? new Date(s.fecha_cierre).toLocaleString() : "-"}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800 dark:text-gray-300">Bs. {Number(s.monto_inicial).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {s.estado_sesion === "CERRADA" ? (
                          <span className="text-blue-600 dark:text-blue-400">Bs. {Number(s.monto_final_real ?? 0).toFixed(2)}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                            🟡 En Curso
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {s.estado_sesion === "CERRADA" && s.diferencia !== null ? (
                          <span className={s.diferencia >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                            {s.diferencia >= 0 ? "+" : ""}Bs. {Number(s.diferencia).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-medium ${s.estado_sesion === "ABIERTA" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                          {s.estado_sesion}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ComponentCard>
        </div>
      )}

      {/* MODAL DE REGISTRO DE MOVIMIENTO DE EFECTIVO */}
      <Modal
        isOpen={isMovimientoModalOpen}
        onClose={() => setIsMovimientoModalOpen(false)}
        className="max-w-md p-6"
      >
        <div className="space-y-5">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Registrar Movimiento de Efectivo
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Ingrese los detalles del ingreso o egreso directo en la caja activa.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Tipo de Movimiento</Label>
              <Select
                options={[
                  { value: "INGRESO", label: "Ingreso (+)" },
                  { value: "EGRESO", label: "Egreso (-)" },
                ]}
                onChange={(val) => setTipoMovimiento(val as "INGRESO" | "EGRESO")}
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
                onChange={(e) => setMontoMovimiento(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Motivo / Justificación (Obligatorio)</Label>
              <Input
                type="text"
                placeholder="Ej: Gastos de transporte, Pago de limpieza"
                value={motivoMovimiento}
                onChange={(e) => setMotivoMovimiento(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setIsMovimientoModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              className={`text-white font-bold px-5 ${
                tipoMovimiento === "INGRESO"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-orange-600 hover:bg-orange-700"
              }`}
              onClick={handleMovimiento}
            >
              Guardar {tipoMovimiento}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CajasControl;
