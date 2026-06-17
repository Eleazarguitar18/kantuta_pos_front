import { useState, useEffect } from "react";
import axios from "axios";
import Button from "../../../components/ui/button/Button";
import ComponentCard from "../../../components/common/ComponentCard";
import Alert from "../../../components/ui/alert/Alert";
import { API_BASE_URL } from "../../../components/auth/services/urlBase";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";

const WhatsAppMain = () => {
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [connectedMsg, setConnectedMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE_URL}/whatsapp/connect`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (res.data.success) {
        if (res.data.qrBase64) {
          setQrBase64(res.data.qrBase64);
          setConnectedMsg(null);
        } else {
          setConnectedMsg(res.data.message || "WhatsApp está conectado.");
          setQrBase64(null);
        }
      }
    } catch (err: any) {
      setError("Error de conexión al servidor de WhatsApp.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Pasarela de Comunicaciones WhatsApp" />

      {error && (
        <Alert variant="error" title="Error de Conexión" message={error} />
      )}

      <div className="max-w-md mx-auto">
        <ComponentCard title="Iniciar Sesión de WhatsApp">
          <p className="text-sm text-gray-500 mb-6 text-center dark:text-gray-400">
            Escanee este código QR desde la aplicación de WhatsApp en su celular para habilitar el agente inteligente de ventas y el envío automático de notificaciones.
          </p>

          <div className="flex flex-col items-center justify-center min-h-[300px] bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-6">
            {loading ? (
              <div className="text-gray-500 animate-pulse">Cargando estado de WhatsApp...</div>
            ) : qrBase64 ? (
              <div className="flex flex-col items-center">
                <img
                  src={qrBase64}
                  alt="WhatsApp QR Code"
                  className="w-64 h-64 border-4 border-white shadow-lg rounded-xl mb-4"
                />
                <span className="text-xs text-amber-600 font-semibold animate-pulse">
                  Esperando escaneo...
                </span>
              </div>
            ) : connectedMsg ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400">
                  <svg
                    className="w-8 h-8"
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
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Servicio Activo</h3>
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                  {connectedMsg}
                </p>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                No se pudo obtener el estado. Asegúrese de que el backend de WhatsApp esté encendido.
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-4">
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              onClick={checkConnection}
              disabled={loading}
            >
              Recargar Estado / QR
            </Button>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
};

export default WhatsAppMain;
