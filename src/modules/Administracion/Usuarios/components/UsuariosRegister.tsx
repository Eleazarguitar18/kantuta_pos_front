import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Button from "../../../../components/ui/button/Button";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import Label from "../../../../components/form/Label";
import Input from "../../../../components/form/input/InputField";
import Select from "../../../../components/form/Select";
import { UsuariosService } from "../services/usuariosService";
import Alert from "../../../../components/ui/alert/Alert";
import { RegisterUsuarioRequest } from "../interfaces/UsuarioDTO";

const UsuariosRegister = () => {
  const [formData, setFormData] = useState<RegisterUsuarioRequest>({
    email: "",
    password: "",
    nombres: "",
    p_apellido: "",
    s_apellido: "",
    fecha_nacimiento: "",
    genero: "M",
    name: "",
    estado: true,
    id_role: undefined,
  });

  const [roles, setRoles] = useState<any[]>([]);

  const [showAlert, setShowAlert] = useState(false);
  const [showError, setShowError] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    UsuariosService.getRoles()
      .then((res) => setRoles(res.data || []))
      .catch((err) => console.error("Error fetching roles:", err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const onSubmit = async () => {
    if (!formData.email || !formData.password || !formData.nombres || !formData.p_apellido) {
      alert("Por favor complete los campos obligatorios (Email, Password, Nombres, Apellido).");
      return;
    }

    try {
      const response = await UsuariosService.registerUsuario(formData);
      if (response.status === 201 || response.status === 200) {
        setShowAlert(true);
        setTimeout(() => {
          navigate("/administracion/usuarios");
        }, 2000);
      }
    } catch (error: any) {
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      console.error("Error al registrar el usuario:", error);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Registro de Usuario" />

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-theme-sm border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
            Crear Nueva Cuenta
          </h3>
          <Button
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={() => navigate("/administracion/usuarios")}
          >
            Atras
          </Button>
        </div>

        {showAlert && (
          <div className="mb-4">
            <Alert variant="success" title="¡Usuario Creado!" message="El usuario y su perfil personal se crearon correctamente." />
          </div>
        )}
        {showError && (
          <div className="mb-4">
            <Alert variant="error" title="Error" message="Hubo un error al registrar el usuario." />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Datos de la Cuenta */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase text-gray-500 mb-2">Datos de la Cuenta</h4>
            <div>
              <Label htmlFor="email">Correo Electrónico *</Label>
              <Input type="email" id="email" value={formData.email} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="password">Contraseña *</Label>
              <Input type="password" id="password" value={formData.password} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="name">Nombre de Usuario (Username)</Label>
              <Input type="text" id="name" value={formData.name} onChange={handleChange} placeholder="Ej: jdoe99" />
            </div>
            <div>
              <Label htmlFor="id_role">Rol del Usuario</Label>
              <Select
                options={[
                  { value: "", label: "Seleccione un rol" },
                  ...roles.map((r) => ({ value: r.id.toString(), label: r.nombre })),
                ]}
                onChange={(val) => setFormData(prev => ({...prev, id_role: val ? parseInt(val.toString(), 10) : undefined}))}
                defaultValue={formData.id_role?.toString() || ""}
              />
            </div>
          </div>

          {/* Datos Personales */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase text-gray-500 mb-2">Datos Personales</h4>
            <div>
              <Label htmlFor="nombres">Nombres *</Label>
              <Input type="text" id="nombres" value={formData.nombres} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="p_apellido">Primer Apellido *</Label>
                <Input type="text" id="p_apellido" value={formData.p_apellido} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="s_apellido">Segundo Apellido</Label>
                <Input type="text" id="s_apellido" value={formData.s_apellido} onChange={handleChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fecha_nacimiento">Fecha Nacimiento</Label>
                <Input type="date" id="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="genero">Género</Label>
                <Select
                  options={[
                    { value: "M", label: "Masculino" },
                    { value: "F", label: "Femenino" },
                    { value: "O", label: "Otro" },
                  ]}
                  onChange={(val) => setFormData(prev => ({...prev, genero: val.toString()}))}
                  defaultValue={formData.genero}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="primary"
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
            onClick={onSubmit}
          >
            Crear Usuario
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UsuariosRegister;
