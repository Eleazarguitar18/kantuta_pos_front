import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Label from "../../../components/form/Label";
import Select from "../../../components/form/Select";
import Input from "../../../components/form/input/InputField";
import TextArea from "../../../components/form/input/TextArea";
import Button from "../../../components/ui/button/Button";
import { Modal } from "../../../components/ui/modal";
import {
  AutorizadorPrestamoExterno,
  getNombreAutorizador,
  PrestamosExternosService,
} from "../services/prestamosExternosService";

interface ModalNuevoPrestamoExternoProps {
  isOpen: boolean;
  onClose: () => void;
  onPrestamoCreado: () => Promise<void> | void;
}

const ModalNuevoPrestamoExterno: React.FC<ModalNuevoPrestamoExternoProps> = ({
  isOpen,
  onClose,
  onPrestamoCreado,
}) => {
  const [solicitanteExterno, setSolicitanteExterno] = useState("");
  const [idAutorizador, setIdAutorizador] = useState("");
  const [monto, setMonto] = useState("");
  const [motivo, setMotivo] = useState("");
  const [autorizadores, setAutorizadores] = useState<AutorizadorPrestamoExterno[]>([]);
  const [cargandoAutorizadores, setCargandoAutorizadores] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setCargandoAutorizadores(true);
    PrestamosExternosService.listarAutorizadores()
      .then((data) => setAutorizadores(data))
      .catch((error) => {
        console.error("Error al cargar autorizadores:", error);
        Swal.fire({
          icon: "error",
          title: "Error al cargar autorizadores",
          text: "No se pudieron obtener los usuarios Administradores/Encargados.",
        });
      })
      .finally(() => setCargandoAutorizadores(false));
  }, [isOpen]);

  const limpiarFormulario = () => {
    setSolicitanteExterno("");
    setIdAutorizador("");
    setMonto("");
    setMotivo("");
  };

  const cerrarModal = () => {
    if (enviando) return;
    limpiarFormulario();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const montoNumerico = Number(monto);

    if (!solicitanteExterno.trim()) {
      Swal.fire("Datos incompletos", "Ingrese el nombre del solicitante externo.", "warning");
      return;
    }

    if (!idAutorizador) {
      Swal.fire("Datos incompletos", "Seleccione quién autorizó el préstamo.", "warning");
      return;
    }

    if (!montoNumerico || montoNumerico <= 0) {
      Swal.fire("Monto inválido", "Ingrese un monto mayor a cero.", "warning");
      return;
    }

    if (!motivo.trim()) {
      Swal.fire("Datos incompletos", "Ingrese el motivo u observación del préstamo.", "warning");
      return;
    }

    setEnviando(true);
    try {
      await PrestamosExternosService.crearPrestamoExterno({
        solicitante_externo: solicitanteExterno.trim(),
        id_autorizador: Number(idAutorizador),
        monto: montoNumerico,
        motivo: motivo.trim(),
      });

      await Swal.fire({
        icon: "success",
        title: "Préstamo externo registrado",
        text: `Se registró el préstamo de Bs. ${montoNumerico.toFixed(2)} correctamente.`,
        timer: 2200,
        showConfirmButton: false,
      });

      limpiarFormulario();
      onClose();
      await onPrestamoCreado();
    } catch (error: any) {
      const mensaje = error.response?.data?.message || "Error al registrar el préstamo externo.";
      Swal.fire({
        icon: "error",
        title: "No se pudo registrar",
        text: typeof mensaje === "string" ? mensaje : JSON.stringify(mensaje),
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={cerrarModal} className="max-w-2xl p-6 lg:p-8">
      <div className="pr-10">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
          Registrar Préstamo Externo
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Registre salidas de dinero entregadas a personas externas y su respectivo autorizador.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <Label>Solicitante Externo *</Label>
          <Input
            placeholder="Ej. Juan Pérez"
            value={solicitanteExterno}
            onChange={(event) => setSolicitanteExterno(event.target.value)}
            disabled={enviando}
          />
        </div>

        <div>
          <Label>Autorizador *</Label>
          <Select
            placeholder={cargandoAutorizadores ? "Cargando autorizadores..." : "Seleccione un autorizador"}
            value={idAutorizador}
            disabled={cargandoAutorizadores || enviando}
            options={autorizadores.map((usuario) => ({
              value: usuario.id.toString(),
              label: `${getNombreAutorizador(usuario)}${usuario.role?.nombre ? ` - ${usuario.role.nombre}` : ""}`,
            }))}
            onChange={setIdAutorizador}
          />
        </div>

        <div>
          <Label>Monto en Bs. *</Label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={monto}
            onChange={(event) => setMonto(event.target.value)}
            disabled={enviando}
          />
        </div>

        <div>
          <Label>Motivo / Observación *</Label>
          <TextArea
            rows={4}
            placeholder="Detalle el motivo del préstamo externo"
            value={motivo}
            onChange={setMotivo}
            disabled={enviando}
          />
        </div>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={cerrarModal} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={enviando || cargandoAutorizadores}>
            {enviando ? "Registrando..." : "Registrar Préstamo"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ModalNuevoPrestamoExterno;
