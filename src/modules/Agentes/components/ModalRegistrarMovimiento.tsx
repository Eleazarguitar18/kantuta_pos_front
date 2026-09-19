import React, { useState, useEffect } from "react";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/form/Select";
import { PlusCircle, RefreshCw, ArrowUpRight, ArrowDownLeft, User } from "lucide-react";
import { AgentesService } from "../services/agentesService";
import {
  AgenteBanco,
  Operador,
  OperadorDeuda,
  TipoTransaccionAgente,
  OrigenFondo,
  RegistrarTransaccionAgenteDTO,
} from "../interfaces/Agente";
import Swal from "sweetalert2";

export const formatMonto = (val: number | undefined | null): string => {
  const num = typeof val === "number" ? val : parseFloat(String(val || 0));
  return isNaN(num)
    ? "0.00"
    : num.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

interface ModalRegistrarMovimientoProps {
  isOpen: boolean;
  onClose: () => void;
  bancoActivo: AgenteBanco | null;
  onMovimientoRegistrado: () => void;
  operadorInicial?: OperadorDeuda | null;
  tipoInicial?: TipoTransaccionAgente;
}

export const ModalRegistrarMovimiento: React.FC<ModalRegistrarMovimientoProps> = ({
  isOpen,
  onClose,
  bancoActivo,
  onMovimientoRegistrado,
  operadorInicial = null,
  tipoInicial = "PRESTAMO_OPERADOR",
}) => {
  const [tipoOperacion, setTipoOperacion] = useState<TipoTransaccionAgente>(tipoInicial);
  const [origenFondo, setOrigenFondo] = useState<OrigenFondo>("BANCO");
  const [monto, setMonto] = useState<number | "">("");
  const [motivo, setMotivo] = useState<string>("");

  // Operadores de la BD
  const [listaOperadores, setListaOperadores] = useState<Operador[]>([]);
  const [operadorId, setOperadorId] = useState<string>("");
  const [loadingOperadores, setLoadingOperadores] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Cargar operadores reales desde la BD al abrir el modal
  useEffect(() => {
    if (isOpen) {
      let isMounted = true;
      const fetchOps = async () => {
        setLoadingOperadores(true);
        try {
          const ops = await AgentesService.getOperadores();
          if (isMounted) {
            setListaOperadores(ops);
            // Si vino un operador inicial por props, seleccionarlo o buscar coincidencia
            if (operadorInicial) {
              const matched = ops.find(
                (o) =>
                  o.id === operadorInicial.id ||
                  (o.nombre && o.nombre.toLowerCase() === operadorInicial.nombre_operador.toLowerCase()) ||
                  (o.nombre_completo && o.nombre_completo.toLowerCase() === operadorInicial.nombre_operador.toLowerCase())
              );
              if (matched) {
                setOperadorId(String(matched.id));
              } else if (operadorInicial.id) {
                setOperadorId(String(operadorInicial.id));
              }
            } else if (ops.length > 0) {
              setOperadorId(String(ops[0].id));
            }
          }
        } catch (error) {
          console.error("Error al cargar lista de operadores:", error);
        } finally {
          if (isMounted) setLoadingOperadores(false);
        }
      };

      fetchOps();

      // Configurar estado inicial
      setTipoOperacion(tipoInicial);
      setOrigenFondo("BANCO");
      setMonto("");
      if (operadorInicial) {
        setMotivo(
          tipoInicial === "PRESTAMO_OPERADOR"
            ? `Préstamo a ${operadorInicial.nombre_operador} (${bancoActivo?.nombre_banco || "Agente"})`
            : `Cobro de deuda de ${operadorInicial.nombre_operador} (${bancoActivo?.nombre_banco || "Agente"})`
        );
      } else {
        setMotivo("");
      }

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, operadorInicial, tipoInicial, bancoActivo]);

  const resetForm = () => {
    setMonto("");
    setMotivo("");
    setOrigenFondo("BANCO");
    if (listaOperadores.length > 0) {
      setOperadorId(String(listaOperadores[0].id));
    } else {
      setOperadorId("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const montoNum = Number(monto);
    if (isNaN(montoNum) || montoNum <= 0 || monto === "") {
      Swal.fire({
        icon: "warning",
        title: "Monto inválido",
        text: "Por favor ingrese un monto mayor a 0.",
        confirmButtonColor: "#3b82f6",
        heightAuto: false,
        customClass: {
          container: "z-[99999]",
        },
      });
      return;
    }

    if (!operadorId) {
      Swal.fire({
        icon: "warning",
        title: "Operador requerido",
        text: "Debe seleccionar un operador de la lista.",
        confirmButtonColor: "#3b82f6",
        heightAuto: false,
        customClass: {
          container: "z-[99999]",
        },
      });
      return;
    }

    const opSeleccionado = listaOperadores.find((op) => String(op.id) === String(operadorId));
    const nombreOpFinal =
      opSeleccionado?.nombre_completo ||
      opSeleccionado?.nombre ||
      opSeleccionado?.usuario ||
      operadorInicial?.nombre_operador ||
      "Operador";

    if (!motivo.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Motivo requerido",
        text: "Ingrese un motivo o justificación para este movimiento.",
        confirmButtonColor: "#3b82f6",
        heightAuto: false,
        customClass: {
          container: "z-[99999]",
        },
      });
      return;
    }

    // Ocultar inmediatamente el modal para evitar colisión visual y de backdrop con SweetAlert2
    onClose();

    const actionText = tipoOperacion === "PRESTAMO_OPERADOR" ? "Otorgar Préstamo" : "Registrar Cobro";
    
    Swal.fire({
      title: `¿Confirmar ${actionText}?`,
      html: `
        <div class="text-left text-sm space-y-1 mt-2">
          <p><strong>Banco/Agente:</strong> ${bancoActivo?.nombre_banco || "Agente Principal"}</p>
          <p><strong>Operador:</strong> ${nombreOpFinal}</p>
          <p><strong>Monto:</strong> Bs. ${formatMonto(montoNum)}</p>
          <p><strong>Vía:</strong> ${origenFondo}</p>
          <p><strong>Motivo:</strong> ${motivo}</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: tipoOperacion === "PRESTAMO_OPERADOR" ? "#ef4444" : "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `Sí, ${actionText}`,
      cancelButtonText: "Cancelar",
      heightAuto: false,
      customClass: {
        container: "z-[99999]",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        setIsSubmitting(true);
        try {
          const tipoPayload = tipoOperacion === "PRESTAMO_OPERADOR" ? "PRESTAMO" : "COBRO";
          const bancoIdNum = Number(bancoActivo?.id) || 0;
          const operadorIdNum = Number(operadorId) || 0;
          const motivoLimpio = motivo.trim();

          const payload = {
            id_banco: bancoIdNum,
            banco_id: bancoIdNum,
            id_agente: bancoIdNum,
            id_operador: operadorIdNum,
            usuario_id: operadorIdNum,
            tipo: tipoPayload, // 'PRESTAMO' o 'COBRO'
            monto: montoNum,
            origen_fondo: origenFondo,
            via: origenFondo,
            motivo: motivoLimpio,
            observacion: motivoLimpio,
            nombre_operador: nombreOpFinal,
          };

          await AgentesService.registrarTransaccionAgente(payload);

          Swal.fire({
            icon: "success",
            title: "¡Transacción Registrada Exitosamente!",
            text: `${actionText} registrado con éxito.`,
            timer: 2000,
            showConfirmButton: false,
            heightAuto: false,
            customClass: {
              container: "z-[99999]",
            },
          });

          // Resetear los campos del formulario
          resetForm();

          // Refrescar los datos del módulo principal
          onMovimientoRegistrado();
        } catch (error: any) {
          console.error("Error al registrar movimiento de agente:", error);
          const rawMsg =
            error?.response?.data?.message ||
            error?.message ||
            "Ocurrió un error al procesar el movimiento.";
          const msg = Array.isArray(rawMsg)
            ? rawMsg.join(", ")
            : typeof rawMsg === "string"
            ? rawMsg
            : JSON.stringify(rawMsg);

          Swal.fire({
            icon: "error",
            title: "Error al Registrar",
            text: msg,
            confirmButtonColor: "#3b82f6",
            heightAuto: false,
            customClass: {
              container: "z-[99999]",
            },
          });
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      className="max-w-lg p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-600" />
            Registrar Movimiento - {bancoActivo?.nombre_banco || "Banco"}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Registre préstamos o cobros a operadores asociados a este banco.
          </p>
        </div>

        <div className="space-y-4">
          {/* TIPO DE OPERACIÓN */}
          <div>
            <Label>Tipo de Operación</Label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <button
                type="button"
                onClick={() => setTipoOperacion("PRESTAMO_OPERADOR")}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs border-2 transition-all flex items-center justify-center gap-2 ${
                  tipoOperacion === "PRESTAMO_OPERADOR"
                    ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-rose-500" />
                Otorgar Préstamo
              </button>
              <button
                type="button"
                onClick={() => setTipoOperacion("COBRO_OPERADOR")}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs border-2 transition-all flex items-center justify-center gap-2 ${
                  tipoOperacion === "COBRO_OPERADOR"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                Cobrar a Operador
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {tipoOperacion === "PRESTAMO_OPERADOR"
                ? "📉 Disminuye Banco/Efectivo y sube Cuentas por Cobrar."
                : "📈 Sube Banco/Efectivo y disminuye Cuentas por Cobrar."}
            </p>
          </div>

          {/* ORIGEN / DESTINO DEL FONDO */}
          <div>
            <Label>Vía / Medio del Fondo</Label>
            <Select
              options={[
                { value: "BANCO", label: `Cuenta de Banco (${bancoActivo?.nombre_banco || "Transferencia/QR"})` },
                { value: "EFECTIVO", label: "Efectivo Físico (Caja Agentes)" },
              ]}
              defaultValue={origenFondo}
              onChange={(val) => setOrigenFondo(val as OrigenFondo)}
            />
          </div>

          {/* SELECCIÓN DE OPERADOR REAL DESDE LA BD */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="operador_select">
                Operador * {loadingOperadores && <span className="text-xs text-indigo-500 font-normal">(Cargando...)</span>}
              </Label>
            </div>

            <div className="relative">
              <select
                id="operador_select"
                value={operadorId}
                onChange={(e) => setOperadorId(e.target.value)}
                disabled={isSubmitting || loadingOperadores}
                className="w-full h-11 appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                required
              >
                <option value="" className="text-gray-500">
                  {loadingOperadores ? "Cargando operadores..." : "Seleccione un operador..."}
                </option>
                {listaOperadores.map((op) => {
                  const nombreDisplay =
                    op.nombre_completo ||
                    op.nombre ||
                    op.usuario ||
                    `Operador #${op.id}`;
                  const extra = op.ci ? ` (CI: ${op.ci})` : op.rol ? ` (${op.rol})` : "";
                  return (
                    <option key={op.id} value={op.id} className="text-gray-900 dark:text-white dark:bg-gray-800">
                      {nombreDisplay}{extra}
                    </option>
                  );
                })}
              </select>
            </div>
            {listaOperadores.length === 0 && !loadingOperadores && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                No se encontraron operadores registrados en el sistema.
              </p>
            )}
          </div>

          {/* MONTO */}
          <div>
            <Label htmlFor="monto_transaccion">Monto (Bs.) *</Label>
            <Input
              id="monto_transaccion"
              type="number"
              step={0.10}
              min="0.10"
              placeholder="0.00"
              value={monto}
              onChange={(e) => {
                const val = e.target.value;
                setMonto(val === "" ? "" : parseFloat(val) || 0);
              }}
              className="text-lg font-black text-indigo-600 dark:text-indigo-400"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* MOTIVO */}
          <div>
            <Label htmlFor="motivo_transaccion">Motivo / Observación *</Label>
            <Input
              id="motivo_transaccion"
              type="text"
              placeholder="Ej: Inyección de saldo para recargas, devolución de turno"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

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
            disabled={isSubmitting || monto === "" || Number(monto) <= 0 || !operadorId}
            className={`font-bold px-5 text-white ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : tipoOperacion === "PRESTAMO_OPERADOR"
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Procesando...
              </span>
            ) : tipoOperacion === "PRESTAMO_OPERADOR" ? (
              "Confirmar Préstamo"
            ) : (
              "Confirmar Cobro"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ModalRegistrarMovimiento;
