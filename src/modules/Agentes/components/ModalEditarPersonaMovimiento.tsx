import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Pencil, RefreshCw } from "lucide-react";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import { TransaccionAgente } from "../interfaces/Agente";
import { AgentesService } from "../services/agentesService";

interface ModalEditarPersonaMovimientoProps {
  isOpen: boolean;
  onClose: () => void;
  transaccion: TransaccionAgente | null;
  onPersonaActualizada: () => void;
}

const obtenerPersonaLlevo = (transaccion: TransaccionAgente | null) =>
  transaccion?.persona_llevo || transaccion?.persona_que_llevo || transaccion?.nombre_operador || "";

const obtenerPersonaDevolvio = (transaccion: TransaccionAgente | null) =>
  transaccion?.persona_devolvio || transaccion?.persona_que_devolvio || "";

const ModalEditarPersonaMovimiento: React.FC<ModalEditarPersonaMovimientoProps> = ({
  isOpen,
  onClose,
  transaccion,
  onPersonaActualizada,
}) => {
  const [personaLlevo, setPersonaLlevo] = useState("");
  const [personaDevolvio, setPersonaDevolvio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setPersonaLlevo(obtenerPersonaLlevo(transaccion));
    setPersonaDevolvio(obtenerPersonaDevolvio(transaccion));
  }, [isOpen, transaccion]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!transaccion) return;

    if (!personaLlevo.trim()) {
      Swal.fire("Dato requerido", "Ingrese el nombre de la persona que llevó el dinero.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await AgentesService.editarPersonaMovimiento(transaccion.id, {
        persona_llevo: personaLlevo.trim(),
        persona_devolvio: personaDevolvio.trim() || undefined,
      });

      await Swal.fire({
        icon: "success",
        title: "Persona actualizada",
        text: "Los datos del movimiento fueron corregidos correctamente.",
        timer: 2000,
        showConfirmButton: false,
      });

      onClose();
      onPersonaActualizada();
    } catch (error: any) {
      const mensaje = error?.response?.data?.message || "No se pudo actualizar la persona del movimiento.";
      Swal.fire({
        icon: "error",
        title: "Error al actualizar",
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
            <Pencil className="h-5 w-5 text-indigo-600" />
            Editar Persona del Movimiento
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Corrija nombres digitados por error sin alterar el movimiento financiero.
          </p>
        </div>

        <div>
          <Label>Persona que llevó *</Label>
          <Input
            value={personaLlevo}
            onChange={(event) => setPersonaLlevo(event.target.value)}
            placeholder="Nombre de la persona que llevó el dinero"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label>Persona que devolvió</Label>
          <Input
            value={personaDevolvio}
            onChange={(event) => setPersonaDevolvio(event.target.value)}
            placeholder="Nombre de la persona que devolvió, si aplica"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-3 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="font-bold">
            {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ModalEditarPersonaMovimiento;
