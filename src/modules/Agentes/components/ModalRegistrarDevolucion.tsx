import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { HandCoins, RefreshCw } from "lucide-react";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import TextArea from "../../../components/form/input/TextArea";
import Button from "../../../components/ui/button/Button";
import { TransaccionAgente } from "../interfaces/Agente";
import { AgentesService } from "../services/agentesService";
import { formatMonto } from "../pages/AgentesBancoMain";

interface ModalRegistrarDevolucionProps {
  isOpen: boolean;
  onClose: () => void;
  transaccion: TransaccionAgente | null;
  onDevolucionRegistrada: () => void;
}

const obtenerPersonaLlevo = (transaccion: TransaccionAgente | null) =>
  transaccion?.persona_llevo ||
  transaccion?.persona_que_llevo ||
  transaccion?.nombre_operador ||
  "";

const obtenerSaldoPendiente = (transaccion: TransaccionAgente | null) => {
  if (!transaccion) return 0;
  const saldo = transaccion.saldo_pendiente ?? transaccion.monto_pendiente;
  if (saldo !== undefined && saldo !== null) return Number(saldo) || 0;

  const monto = Number(transaccion.monto || 0);
  const devuelto = Number(transaccion.monto_devuelto || 0);
  return Math.max(monto - devuelto, 0);
};

const ModalRegistrarDevolucion: React.FC<ModalRegistrarDevolucionProps> = ({
  isOpen,
  onClose,
  transaccion,
  onDevolucionRegistrada,
}) => {
  const [personaDevuelve, setPersonaDevuelve] = useState("");
  const [monto, setMonto] = useState<number | "">("");
  const [observacion, setObservacion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const personaLlevo = useMemo(() => obtenerPersonaLlevo(transaccion), [transaccion]);
  const saldoPendiente = useMemo(() => obtenerSaldoPendiente(transaccion), [transaccion]);

  useEffect(() => {
    if (!isOpen || !transaccion) return;
    setPersonaDevuelve("");
    setMonto(saldoPendiente > 0 ? saldoPendiente : Number(transaccion.monto || 0));
    setObservacion("");
  }, [isOpen, transaccion, saldoPendiente]);

  const handleUsarMismaPersona = () => {
    setPersonaDevuelve(personaLlevo);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!transaccion) return;

    const montoNum = Number(monto);
    if (!personaDevuelve.trim()) {
      Swal.fire("Dato requerido", "Ingrese el nombre de la persona que devolvió el dinero.", "warning");
      return;
    }

    if (!montoNum || montoNum <= 0) {
      Swal.fire("Monto inválido", "Ingrese un monto de devolución mayor a cero.", "warning");
      return;
    }

    if (saldoPendiente > 0 && montoNum > saldoPendiente) {
      Swal.fire(
        "Monto excedido",
        `El monto a devolver no puede superar el saldo pendiente de Bs. ${formatMonto(saldoPendiente)}.`,
        "warning",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await AgentesService.registrarDevolucionTransaccion(transaccion.id, {
        persona_devolvio: personaDevuelve.trim(),
        monto: montoNum,
        observacion: observacion.trim(),
      });

      await Swal.fire({
        icon: "success",
        title: "Devolución registrada",
        text: "La devolución fue vinculada correctamente al retiro.",
        timer: 2200,
        showConfirmButton: false,
      });

      onClose();
      onDevolucionRegistrada();
    } catch (error: any) {
      const mensaje = error?.response?.data?.message || "No se pudo registrar la devolución.";
      Swal.fire({
        icon: "error",
        title: "Error al registrar devolución",
        text: Array.isArray(mensaje) ? mensaje.join(", ") : String(mensaje),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="border-b border-gray-200 pb-3 dark:border-gray-700">
          <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <HandCoins className="h-5 w-5 text-emerald-600" />
            Registrar Devolución
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Vincule el retorno de dinero al retiro seleccionado.
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          <p><strong>Persona que llevó:</strong> {personaLlevo || "No especificado"}</p>
          <p><strong>Saldo pendiente:</strong> Bs. {formatMonto(saldoPendiente)}</p>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label>Persona que devuelve *</Label>
            {personaLlevo && (
              <button
                type="button"
                onClick={handleUsarMismaPersona}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                Usar misma persona
              </button>
            )}
          </div>
          <Input
            value={personaDevuelve}
            onChange={(event) => setPersonaDevuelve(event.target.value)}
            placeholder="Nombre de la persona que devolvió"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label>Monto a devolver (Bs.) *</Label>
          <Input
            type="number"
            step={0.1}
            min="0.10"
            max={saldoPendiente || undefined}
            value={monto}
            onChange={(event) => setMonto(event.target.value === "" ? "" : Number(event.target.value))}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label>Observación de la devolución</Label>
          <TextArea
            rows={3}
            value={observacion}
            onChange={setObservacion}
            placeholder="Ej. Devolución parcial, pago completo, referencia de transferencia..."
            disabled={isSubmitting}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-3 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-emerald-600 font-bold text-white hover:bg-emerald-700" disabled={isSubmitting}>
            {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
            Guardar Devolución
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ModalRegistrarDevolucion;
