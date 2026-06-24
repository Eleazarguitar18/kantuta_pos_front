import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router";
import Button from "../../../components/ui/button/Button";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import { CajasService } from "../services/cajasService";
import Alert from "../../../components/ui/alert/Alert";
import { Caja } from "../interfaces/Caja";
import Swal from "sweetalert2";

const CajasEdit = () => {
  const [nombre, setNombre] = useState("");
  const [especialidad, setEspecialidad] = useState<"SOLO_VENTAS" | "SOLO_AGENTES" | "MIXTA">("MIXTA");

  const [showAlert, setShowAlert] = useState(false);
  const [showError, setShowError] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const cajaAEditar = location.state as Caja;

  useEffect(() => {
    if (cajaAEditar) {
      setNombre(cajaAEditar.nombre);
      setEspecialidad(cajaAEditar.especialidad);
    } else if (id) {
      CajasService.getCajaById(Number(id)).then(res => {
        setNombre(res.data.nombre);
        setEspecialidad(res.data.especialidad);
      }).catch(err => console.error("Error al cargar la caja", err));
    }
  }, [cajaAEditar, id]);

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
      const payload = {
        nombre,
        especialidad,
      };

      const response = await CajasService.updateCaja(Number(id), payload);
      if (response.status === 200) {
        setShowAlert(true);
        setTimeout(() => {
          navigate("/cajas");
        }, 2000);
      }
    } catch (error: any) {
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      console.error("Error al actualizar la caja:", error);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Edición de Caja" />

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-theme-sm border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
            Editar Caja #{id}
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
            <Alert variant="success" title="¡Guardado!" message="La caja se actualizó correctamente." />
          </div>
        )}
        {showError && (
          <div className="mb-4">
            <Alert variant="error" title="Error al guardar" message="Hubo un error al actualizar la caja." />
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="nombre">Nombre de la Caja</Label>
            <Input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="especialidad">Especialidad de la Caja</Label>
            {especialidad && (
              <Select
                options={especialidadOptions}
                onChange={(value) => setEspecialidad(value as "SOLO_VENTAS" | "SOLO_AGENTES" | "MIXTA")}
                defaultValue={especialidad}
              />
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            variant="primary"
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            onClick={onSubmit}
          >
            Actualizar Caja
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CajasEdit;
