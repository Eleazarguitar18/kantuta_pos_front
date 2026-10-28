import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { PieChart, RefreshCw } from "lucide-react";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import { AgenteBanco } from "../interfaces/Agente";
import { AgentesService } from "../services/agentesService";
import { formatMonto } from "../pages/AgentesBancoMain";

interface ModalAjustarCapitalBancoProps {
  isOpen: boolean;
  onClose: () => void;
  banco: AgenteBanco | null;
  onCapitalActualizado: () => void;
}

const ModalAjustarCapitalBanco: React.FC<ModalAjustarCapitalBancoProps> = ({
  isOpen,
  onClose,
  banco,
  onCapitalActualizado,
}) => {
  const [montoTotal, setMontoTotal] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setMontoTotal(Number(banco?.monto_total || 0));
  }, [isOpen, banco]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!banco) return;

    const montoNum = Number(montoTotal);
    if (Number.isNaN(montoNum) || montoNum < 0) {
      Swal.fire("Monto inválido", "Ingrese un capital total válido.", "warning");
      return;
    }

    const confirmacion = await Swal.fire({
      title: "¿Ajustar capital total?",
      text: `El capital de ${banco.nombre_banco} cambiará a Bs. ${formatMonto(montoNum)}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, ajustar capital",
      cancelButtonText: "Cancelar",
    });

    if (!confirmacion.isConfirmed) return;

    setIsSubmitting(true);
    try {
      await AgentesService.ajustarCapitalBanco(banco.id, montoNum);
      await Swal.fire({
        icon: "success",
        title: "Capital actualizado",
        text: "El capital total del banco fue actualizado correctamente.",
        timer: 2200,
        showConfirmButton: false,
      });
      onClose();
      onCapitalActualizado();
    } catch (error: any) {
      const mensaje = error?.response?.data?.message || "No se pudo ajustar el capital del banco.";
      Swal.fire({
        icon: "error",
        title: "Error al ajustar capital",
        text: Array.isArray(mensaje) ? mensaje.join(", ") : String(mensaje),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="border-b border-gray-200 pb-3 dark:border-gray-700">
          <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <PieChart className="h-5 w-5 text-red-600" />
            Editar Capital Total
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Acción disponible únicamente para perfil Administrador.
          </p>
        </div>

        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300">
          <p><strong>Banco:</strong> {banco?.nombre_banco || "Sin banco seleccionado"}</p>
          <p><strong>Capital actual:</strong> Bs. {formatMonto(banco?.monto_total)}</p>
        </div>

        <div>
          <Label>Nuevo monto de capital total (Bs.) *</Label>
          <Input
            type="number"
            step={0.1}
            min="0"
            value={montoTotal}
            onChange={(event) => setMontoTotal(event.target.value === "" ? "" : Number(event.target.value))}
            disabled={isSubmitting}
            className="text-lg font-black text-red-700 dark:text-red-300"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-3 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || montoTotal === ""} className="bg-red-600 font-bold text-white hover:bg-red-700">
            {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
            Guardar Capital
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ModalAjustarCapitalBanco;
