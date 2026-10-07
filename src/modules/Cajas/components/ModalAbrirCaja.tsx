import React, { useState, useMemo, useEffect } from "react";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import { AlertTriangle, DollarSign, FileText, RefreshCw, CheckCircle2, Calculator, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../../../context/auth/AuthContext";
import { CajasService } from "../services/cajasService";
import SeccionArqueoBilletes, { ValoresArqueo } from "./SeccionArqueoBilletes";
import Swal from "sweetalert2";

/**
 * Formatea un número a string con 2 decimales para moneda boliviana.
 */
const formatMonto = (val: any): string => {
  const num = typeof val === "number" ? val : parseFloat(String(val || 0));
  return isNaN(num) ? "0.00" : num.toFixed(2);
};

interface ModalAbrirCajaProps {
  isOpen: boolean;
  onClose: () => void;
  /** ID de la caja física que se va a abrir */
  idCaja: number;
  /** Nombre de la caja para mostrar en el título */
  nombreCaja: string;
  /** Saldo esperado del sistema (saldo con el que cerró la sesión anterior o saldo inicial) */
  saldoEsperado: number;
  /** Callback cuando se abre exitosamente la sesión */
  onSesionAbierta: () => void;
}

const ModalAbrirCaja: React.FC<ModalAbrirCajaProps> = ({
  isOpen,
  onClose,
  idCaja,
  nombreCaja,
  saldoEsperado,
  onSesionAbierta,
}) => {
  const { user } = useAuth();

  // Estado del formulario
  const [montoDeclarado, setMontoDeclarado] = useState<number | "">("");
  const [observacion, setObservacion] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingInventario, setIsLoadingInventario] = useState<boolean>(false);
  const [desgloseArqueo, setDesgloseArqueo] = useState<any>(null);
  const [valoresArqueo, setValoresArqueo] = useState<ValoresArqueo | null>(null);
  const [mostrarDesglose, setMostrarDesglose] = useState<boolean>(false);

  // Calcular diferencia en tiempo real
  const diferencia = useMemo(() => {
    if (montoDeclarado === "" || montoDeclarado < 0) return null;
    return Number(montoDeclarado) - saldoEsperado;
  }, [montoDeclarado, saldoEsperado]);

  // Determinar estado del arqueo
  const estadoArqueo = useMemo(() => {
    if (diferencia === null) return null;
    if (Math.abs(diferencia) < 0.01) return "CUADRADO";
    return diferencia > 0 ? "SOBRANTE" : "FALTANTE";
  }, [diferencia]);

  // Hay descuadre
  const hayDescuadre = useMemo(() => {
    return estadoArqueo !== null && estadoArqueo !== "CUADRADO";
  }, [estadoArqueo]);

  // Cargar inventario para desglose del arqueo
  useEffect(() => {
    if (isOpen) {
      setIsLoadingInventario(true);
      CajasService.getEstadoInventario()
        .then((res) => {
          const items = Array.isArray(res?.data) ? res.data : [];
          // Construir mapa de conteo físico desde inventario
          const conteoMap: Record<string, number> = {};
          items.forEach((item: any) => {
            if (item?.id !== undefined) {
              conteoMap[item.id.toString()] = item.stockSistema ?? item.stock_actual ?? 0;
            }
          });
          setDesgloseArqueo({
            saldo_esperado: saldoEsperado,
            conteoFisico: conteoMap,
            fecha: new Date().toLocaleDateString("es-BO"),
            hora: new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" }),
            operador: user?.name || user?.email || "Operador",
          });
        })
        .catch(() => setDesgloseArqueo(null))
        .finally(() => setIsLoadingInventario(false));
    } else {
      // Reset al cerrar
      setMontoDeclarado("");
      setObservacion("");
      setDesgloseArqueo(null);
      setValoresArqueo(null);
      setMostrarDesglose(false);
    }
  }, [isOpen, saldoEsperado, user]);

  // Validación: si hay descuadre, la observación es obligatoria
  const isSubmitDisabled = useMemo(() => {
    if (montoDeclarado === "" || Number(montoDeclarado) < 0) return true;
    if (isSubmitting) return true;
    if (hayDescuadre && !observacion.trim()) return true;
    return false;
  }, [montoDeclarado, observacion, hayDescuadre, isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitDisabled) return;

    // Confirmación con SweetAlert
    const actionText = "Abrir Sesión de Turno";
    const result = await Swal.fire({
      title: `¿Confirmar ${actionText}?`,
      html: `
        <div class="text-left text-sm space-y-1 mt-2">
          <p><strong>Caja:</strong> ${nombreCaja}</p>
          <p><strong>Operador:</strong> ${user?.name || user?.email || "Operador"}</p>
          <p><strong>Saldo Esperado (Sistema):</strong> Bs. ${formatMonto(saldoEsperado)}</p>
          <p><strong>Monto Declarado (Físico):</strong> Bs. ${formatMonto(Number(montoDeclarado))}</p>
          ${diferencia !== null ? `<p><strong>Diferencia:</strong> <span class="${diferencia >= 0 ? "text-blue-600" : "text-red-600"}">${diferencia >= 0 ? "+" : ""}Bs. ${formatMonto(diferencia)}</span></p>` : ""}
          ${observacion.trim() ? `<p><strong>Observación:</strong> ${observacion}</p>` : ""}
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, abrir turno",
      cancelButtonText: "Cancelar",
      heightAuto: false,
      customClass: { container: "z-[99999]" },
    });

    if (!result.isConfirmed) return;

    setIsSubmitting(true);
    try {
      const desgloseCompleto = {
        ...desgloseArqueo,
        billetes: valoresArqueo,
        monto_real_fisico: Number(montoDeclarado),
        monto_diferencia: diferencia ?? 0,
        estado_arqueo: estadoArqueo ?? "CUADRADO",
        observacion: observacion.trim() || undefined,
      };

      await CajasService.abrirSesion({
        id_caja: idCaja,
        monto_inicial: Number(montoDeclarado),
        id_usuario: user?.id || 0,
        id_user_create: user?.id || 0,
        monto_sistema_esperado: saldoEsperado,
        monto_inicial_declarado: Number(montoDeclarado),
        diferencia_apertura: diferencia ?? 0,
        observacion_apertura: observacion.trim() || undefined,
        responsable_descuadre: hayDescuadre
          ? `Operador anterior responsable por ${diferencia! < 0 ? "faltante" : "sobrante"} de Bs. ${formatMonto(Math.abs(diferencia!))}`
          : undefined,
        desglose_arqueo: desgloseCompleto,
      });

      await Swal.fire({
        icon: "success",
        title: "¡Sesión Abierta!",
        text: `Turno iniciado correctamente en ${nombreCaja}.`,
        timer: 2000,
        showConfirmButton: false,
        heightAuto: false,
        customClass: { container: "z-[99999]" },
      });

      onSesionAbierta();
      onClose();
    } catch (error: any) {
      console.error("Error al abrir sesión de caja:", error);
      const rawMsg = error?.response?.data?.message || error?.message || "No se pudo abrir la sesión.";
      const msg = Array.isArray(rawMsg) ? rawMsg.join(", ") : typeof rawMsg === "string" ? rawMsg : JSON.stringify(rawMsg);
      Swal.fire({
        icon: "error",
        title: "Error al Abrir",
        text: msg,
        confirmButtonColor: "#3b82f6",
        heightAuto: false,
        customClass: { container: "z-[99999]" },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      className="max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Encabezado */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Apertura de Turno - {nombreCaja}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Declare el efectivo físico que encuentra en caja al iniciar su turno.
          </p>
        </div>

        {/* MONTO SISTEMA ESPERADO (solo lectura) */}
        <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-xl border-2 border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase">
                Saldo Esperado (Sistema)
              </p>
              <p className="text-[11px] text-indigo-500 dark:text-indigo-400 mt-0.5">
                Monto con el que cerró la sesión anterior
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300">
                Bs. {formatMonto(saldoEsperado)}
              </p>
            </div>
          </div>
        </div>

        {/* BOTÓN CONMUTADOR DE DESGLOSE DE CORTES */}
        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/80 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
              Desglose detallado de cortes (Billetes y Monedas)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMostrarDesglose((prev) => !prev)}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-lg transition"
          >
            {mostrarDesglose ? (
              <>
                Ocultar desglose <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Contar cortes <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* SECCIÓN DE ARQUEO DE CORTES */}
        {mostrarDesglose && (
          <div className="transition-all duration-300">
            <SeccionArqueoBilletes
              onChangeTotal={(total, valores) => {
                setMontoDeclarado(total);
                setValoresArqueo(valores);
              }}
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* MONTO FÍSICO DECLARADO */}
        <div>
          <Label className="text-sm font-bold text-gray-700 dark:text-gray-300">
            Efectivo Físico en Caja (Bs.) *
          </Label>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
            {mostrarDesglose
              ? "Calculado automáticamente a partir del desglose de cortes (o puede editarlo directamente)."
              : "Cuente físicamente el dinero en la gaveta e ingrese el total."}
          </p>
          <Input
            type="number"
            step={0.1}
            min="0"
            placeholder="0.00"
            value={montoDeclarado}
            onChange={(e) => {
              const val = e.target.value;
              setMontoDeclarado(val === "" ? "" : parseFloat(val) || 0);
            }}
            className="text-lg font-black text-blue-600 dark:text-blue-400"
            required
          />
        </div>

        {/* ALERTA DE DIFERENCIA EN TIEMPO REAL */}
        {diferencia !== null && Math.abs(diferencia) >= 0.01 && (
          <div
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              estadoArqueo === "FALTANTE"
                ? "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-700"
                : "bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700"
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  estadoArqueo === "FALTANTE"
                    ? "text-red-600 dark:text-red-400"
                    : "text-blue-600 dark:text-blue-400"
                }`}
              />
              <div>
                {estadoArqueo === "FALTANTE" ? (
                  <>
                    <p className="text-sm font-bold text-red-700 dark:text-red-300">
                      ⚠️ Faltante de Bs. {formatMonto(Math.abs(diferencia))} detectado
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                      Se registrará bajo la responsabilidad del operador anterior.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                      ℹ️ Sobrante de Bs. {formatMonto(diferencia)} detectado
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                      El sobrante quedará registrado en esta sesión.
                    </p>
                  </>
                )}
              </div>
            </div>
            {/* Badge de estado */}
            <div className="mt-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                  estadoArqueo === "FALTANTE"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                }`}
              >
                {estadoArqueo === "FALTANTE" ? "🔴 FALTANTE" : "🔵 SOBRANTE"}
              </span>
            </div>
          </div>
        )}

        {/* CUADRADO */}
        {diferencia !== null && Math.abs(diferencia) < 0.01 && (
          <div className="p-4 rounded-xl border-2 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700 transition-all duration-300">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  ✅ Caja Cuadrada
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  El efectivo declarado coincide con el saldo esperado.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* OBSERVACIÓN OBLIGATORIA SI HAY DESCUADRE */}
        {hayDescuadre && (
          <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
            <Label className="text-sm font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Observación / Reporte de Apertura *
            </Label>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-2">
              Es obligatorio justificar la diferencia detectada para deslindar responsabilidad.
            </p>
            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Ej: Faltante detectado al recibir turno, sobrante sin justificación aparente..."
              className="w-full rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-800 dark:text-white placeholder:text-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none resize-none"
              rows={3}
              required
            />
          </div>
        )}

        {/* OBSERVACIÓN OPCIONAL SI ESTÁ CUADRADO */}
        {!hayDescuadre && (
          <div>
            <Label className="text-xs text-gray-500 dark:text-gray-400">
              Observación (opcional)
            </Label>
            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Alguna nota adicional sobre la apertura..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-800 dark:text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none resize-none"
              rows={2}
            />
          </div>
        )}

        {/* BOTONES DE ACCIÓN */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitDisabled}
            className={`font-bold px-5 text-white ${
              isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Abriendo...
              </span>
            ) : (
              "Confirmar Apertura de Turno"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ModalAbrirCaja;
