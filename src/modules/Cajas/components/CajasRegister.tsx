import { useState } from "react";
import { useNavigate } from "react-router";
import Button from "../../../components/ui/button/Button";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import { CajasService } from "../services/cajasService";
import Alert from "../../../components/ui/alert/Alert";
import { CrearCajaRequest } from "../interfaces/CajaDTO";
import Swal from "sweetalert2";

const CajasRegister = () => {
  const [nombre, setNombre] = useState("");
  const [especialidad, setEspecialidad] = useState<"SOLO_VENTAS" | "SOLO_AGENTES" | "MIXTA">("MIXTA");
  const [montoCreacion, setMontoCreacion] = useState<number>(0);

  const [showAlert, setShowAlert] = useState(false);
  const [showError, setShowError] = useState(false);

  const navigate = useNavigate();

  const especialidadOptions = [
    { value: "MIXTA", label: "Mixta (Ventas y Agentes)" },
    { value: "SOLO_VENTAS", label: "Solo Ventas POS" },
    { value: "SOLO_AGENTES", label: "Solo Agentes Externos" },
  ];

  const onSubmit = async () => {
    if (!nombre.trim()) {
      Swal.fire({
        title: "Campo Requerido",
        text: "El nombre de la caja no puede estar vacío.",
        icon: "warning",
        confirmButtonColor: "#ef4444"
      });
      return;
    }
    if (nombre.length < 3) {
      Swal.fire({
        title: "Nombre muy corto",
        text: "El nombre de la caja debe tener al menos 3 caracteres.",
        icon: "warning",
        confirmButtonColor: "#ef4444"
      });
      return;
    }

    try {
      const payload: CrearCajaRequest = {
        nombre,
        especialidad,
        saldo: Number(montoCreacion)
      };

      const response = await CajasService.createCaja(payload);
      if (response.status === 201 || response.status === 200) {
        setShowAlert(true);
        // Clear form to stay on the same view and add more
        setNombre("");
        setMontoCreacion(0);
        setEspecialidad("MIXTA");
        setTimeout(() => {
          setShowAlert(false)
          navigate("/cajas")
        }, 2000);
      }
    } catch (error: any) {
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      console.error("Error al registrar la caja:", error);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Registro de Caja" />

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-theme-sm border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
            Crear Nueva Caja
          </h3>
          <Button
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={() => navigate("/cajas")}
          >
            Atras
          </Button>
        </div>

        {showAlert && (
          <div className="mb-4">
            <Alert variant="success" title="¡Caja Guardada!" message="La caja se registró correctamente en el sistema." />
          </div>
        )}
        {showError && (
          <div className="mb-4">
            <Alert variant="error" title="Error al guardar" message="Hubo un error al registrar la caja." />
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="nombre">Nombre de la Caja</Label>
            <Input
              type="text"
              id="nombre"
              placeholder="Ej: Caja Principal 01"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="especialidad">Especialidad de la Caja</Label>
            <Select
              options={especialidadOptions}
              onChange={(value) => setEspecialidad(value as "SOLO_VENTAS" | "SOLO_AGENTES" | "MIXTA")}
              defaultValue={especialidad}
            />
          </div>

          <div>
            <Label htmlFor="saldo">Monto de Creación / Saldo Inicial Base (Bs.)</Label>
            <Input
              type="number"
              id="saldo"
              placeholder="Ej: 500.00"
              step={0.10}
              min="0"
              value={montoCreacion.toString()}
              onChange={(e: any) => setMontoCreacion(Number(e.target.value))}
            />
            <p className="text-xs text-gray-500 mt-1">Este será el dinero físico con el que la caja operará en su primer turno.</p>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            variant="primary"
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            onClick={onSubmit}
          >
            Guardar Caja
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CajasRegister;
