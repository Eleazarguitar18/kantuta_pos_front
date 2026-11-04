import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import Button from "../../../components/ui/button/Button";
import ComponentCard from "../../../components/common/ComponentCard";
import Alert from "../../../components/ui/alert/Alert";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import {
  WhatsAppService,
  type WhatsappStatus,
} from "../services/whatsappService";

const ACTUALIZACION_QR_MS = 60_000;

const WhatsAppMain = () => {
  const [status, setStatus] = useState<WhatsappStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState<"logout" | "reset" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestInFlight = useRef(false);
  const mounted = useRef(true);

  const loadStatus = useCallback(async (silent = false) => {
    if (requestInFlight.current) return;

    requestInFlight.current = true;
    if (!silent) setRefreshing(true);

    try {
      const res = await WhatsAppService.getStatus();
      if (!mounted.current) return;

      setStatus(res.data);
      setError(null);
    } catch (err: any) {
      if (!mounted.current) return;

      const mensaje =
        err?.response?.status === 401
          ? "Tu sesión expiró. Vuelve a iniciar sesión para administrar WhatsApp."
          : err?.response?.data?.message ||
            "No se pudo obtener el estado de WhatsApp. Verifica que el backend esté encendido.";
      setError(mensaje);
    } finally {
      requestInFlight.current = false;
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void loadStatus();

    const interval = setInterval(() => {
      void loadStatus(true);
    }, ACTUALIZACION_QR_MS);

    return () => {
      mounted.current = false;
      clearInterval(interval);
    };
  }, [loadStatus]);

  const refrescarDespuesDeLimpiar = () => {
    setTimeout(() => {
      void loadStatus(true);
    }, 2500);
  };

  const handleLogout = async () => {
    const confirmacion = await Swal.fire({
      title: "¿Cerrar sesión de WhatsApp?",
      text: "Se desvinculará el dispositivo y se eliminarán las credenciales locales. Después aparecerá un nuevo código QR.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    });

    if (!confirmacion.isConfirmed) return;

    setProcessing("logout");
    setError(null);

    try {
      const res = await WhatsAppService.logout();
      if (!mounted.current) return;
      setStatus(res.data);
      setLoading(false);
      refrescarDespuesDeLimpiar();
    } catch (err: any) {
      if (!mounted.current) return;
      setError(
        err?.response?.data?.message ||
          "No se pudo cerrar la sesión de WhatsApp. Intenta limpiar la sesión defectuosa.",
      );
    } finally {
      if (mounted.current) setProcessing(null);
    }
  };

  const handleReset = async () => {
    const confirmacion = await Swal.fire({
      title: "¿Limpiar la sesión defectuosa?",
      text: "Se cerrará el socket y se eliminará toda la carpeta de autenticación. Esta acción deja WhatsApp limpio para escanear un QR nuevo.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, limpiar todo",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
    });

    if (!confirmacion.isConfirmed) return;

    setProcessing("reset");
    setError(null);

    try {
      const res = await WhatsAppService.resetSession();
      if (!mounted.current) return;
      setStatus(res.data);
      setLoading(false);
      refrescarDespuesDeLimpiar();
    } catch (err: any) {
      if (!mounted.current) return;
      setError(
        err?.response?.data?.message ||
          "No se pudo limpiar la sesión. Verifica que el backend tenga permisos sobre la carpeta de autenticación.",
      );
    } finally {
      if (mounted.current) setProcessing(null);
    }
  };

  const deshabilitado = loading || refreshing || processing !== null;
  const qrActualizado = status?.qrActualizadoEn
    ? new Date(status.qrActualizadoEn).toLocaleTimeString("es-BO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  const estadoEtiqueta = processing
    ? processing === "logout"
      ? "Cerrando sesión..."
      : "Limpiando sesión..."
    : status?.estado === "conectado"
      ? "Conectado"
      : status?.estado === "esperando_qr"
        ? "Esperando escaneo"
        : status?.estado === "conectando"
          ? "Conectando"
          : status?.estado === "error"
            ? "Error"
            : "Desconectado";

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Pasarela de Comunicaciones WhatsApp" />

      {error && (
        <Alert variant="error" title="Error de Conexión" message={error} />
      )}

      <div className="mx-auto max-w-2xl">
        <ComponentCard title="Iniciar Sesión de WhatsApp">
          <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Escanea este código QR desde la aplicación de WhatsApp en tu celular.
            El código se actualiza automáticamente cada 60 segundos.
          </p>

          <div className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 sm:min-h-[460px] sm:p-8 dark:border-gray-700 dark:bg-gray-800">
            {loading ? (
              <div className="animate-pulse text-gray-500">
                Consultando estado de WhatsApp...
              </div>
            ) : status?.qrBase64 ? (
              <div className="flex w-full flex-col items-center">
                <div className="mb-4 flex w-full justify-center rounded-2xl bg-white p-3 shadow-lg sm:p-4">
                  <img
                    src={status.qrBase64}
                    alt="Código QR de WhatsApp"
                    className="aspect-square h-auto w-full max-w-[280px] object-contain sm:max-w-[340px] lg:max-w-[400px]"
                  />
                </div>
                <span className="animate-pulse text-xs font-semibold text-amber-600">
                  Esperando escaneo...
                </span>
                {qrActualizado && (
                  <span className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                    QR actualizado a las {qrActualizado}
                  </span>
                )}
              </div>
            ) : status?.conectado ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950/40 dark:text-green-400">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  WhatsApp vinculado
                </h3>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  {status.nombre || "Dispositivo conectado"}
                  {status.telefono ? ` · ${status.telefono}` : ""}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {status.mensaje}
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-center text-gray-500 dark:text-gray-400">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-600 dark:border-gray-600 dark:border-t-emerald-400" />
                <p className="text-sm">
                  {status?.mensaje ||
                    "Preparando la conexión y el código QR. Esto puede tardar unos segundos."}
                </p>
                <button
                  type="button"
                  className="text-sm font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                  onClick={() => void loadStatus()}
                  disabled={refreshing}
                >
                  Volver a consultar
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>
              Estado: <strong className="text-gray-700 dark:text-gray-200">{estadoEtiqueta}</strong>
            </span>
            {status?.intentosReconexion ? (
              <span>Reintentos: {status.intentosReconexion}</span>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button
              className="w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-700 sm:flex-1"
              onClick={() => void loadStatus()}
              disabled={deshabilitado}
            >
              {refreshing ? "Actualizando..." : "Actualizar QR"}
            </Button>
            <Button
              className="w-full bg-amber-600 font-semibold text-white hover:bg-amber-700 sm:flex-1"
              onClick={handleLogout}
              disabled={deshabilitado}
            >
              {processing === "logout" ? "Cerrando..." : "Cerrar sesión"}
            </Button>
            <Button
              className="w-full bg-red-600 font-semibold text-white hover:bg-red-700 sm:flex-1"
              onClick={handleReset}
              disabled={deshabilitado}
            >
              {processing === "reset" ? "Limpiando..." : "Limpiar sesión"}
            </Button>
          </div>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
            Usa <strong>Cerrar sesión</strong> si el dispositivo ya no debe estar vinculado.
            Usa <strong>Limpiar sesión</strong> si WhatsApp quedó trabado, no muestra el QR
            o no permite volver a iniciar sesión.
          </p>
        </ComponentCard>
      </div>
    </div>
  );
};

export default WhatsAppMain;
