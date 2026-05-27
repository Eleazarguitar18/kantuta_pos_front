import { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import ComponentCard from "../components/common/ComponentCard";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Select from "../components/form/Select";
import Button from "../components/ui/button/Button";
import Alert from "../components/ui/alert/Alert";
import { UsuariosService } from "../modules/Administracion/Usuarios/services/usuariosService";
import { Usuario } from "../modules/Administracion/Usuarios/interfaces/Usuario";

export default function UserProfiles() {
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState<Usuario | null>(location.state as Usuario || null);
  const [loading, setLoading] = useState(!usuario);
  
  const [showAlert, setShowAlert] = useState(false);
  const [showError, setShowError] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [estado, setEstado] = useState(true);
  
  const [nombres, setNombres] = useState("");
  const [p_apellido, setP_apellido] = useState("");
  const [s_apellido, setS_apellido] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [genero, setGenero] = useState("M");

  useEffect(() => {
    if (!usuario && id) {
      // Fetch usuario si se recarga la pagina (aunque en la guia la API es GET /usuario)
      UsuariosService.getUsuarios().then(res => {
        const data = res.data.data || res.data;
        const found = data.find((u: Usuario) => u.id === Number(id));
        if (found) {
          setUsuario(found);
          populateForm(found);
        }
        setLoading(false);
      });
    } else if (usuario) {
      populateForm(usuario);
    }
  }, [id, usuario]);

  const populateForm = (u: Usuario) => {
    setEmail(u.email);
    setName(u.name || "");
    setEstado(u.estado);
    if (u.persona) {
      setNombres(u.persona.nombres);
      setP_apellido(u.persona.p_apellido);
      setS_apellido(u.persona.s_apellido || "");
      setFechaNacimiento(u.persona.fecha_nacimiento ? u.persona.fecha_nacimiento.split('T')[0] : "");
      setGenero(u.persona.genero || "M");
    }
  };

  const handleSaveUsuario = async () => {
    if (!usuario) return;
    try {
      await UsuariosService.updateUsuario(usuario.id, {
        email,
        name,
        estado
      });
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } catch (error) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const handleSavePersona = async () => {
    if (!usuario || !usuario.persona) return;
    try {
      await UsuariosService.updatePersona({
        id: usuario.persona.id,
        id_user_update: 0,
        nombres,
        p_apellido,
        s_apellido,
        fecha_nacimiento: fechaNacimiento,
        genero
      });
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } catch (error) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  if (loading) return <div className="p-6">Cargando perfil...</div>;

  return (
    <>
      <PageMeta
        title="Perfil de Usuario | Kantuta POS"
        description="Edición de perfil de usuario"
      />
      
      <div className="flex justify-between items-center mb-6">
        <PageBreadcrumb pageTitle="Perfil de Usuario" />
        <Button
          className="bg-gray-500 hover:bg-gray-600 text-white"
          onClick={() => navigate("/administracion/usuarios")}
        >
          Volver a Usuarios
        </Button>
      </div>

      {showAlert && (
        <div className="mb-4">
          <Alert variant="success" title="Actualizado" message="Los datos se han guardado correctamente." />
        </div>
      )}
      {showError && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message="Hubo un problema al guardar los cambios." />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Card: Información de Cuenta (Usuario) */}
        <ComponentCard title="Información de la Cuenta">
          <div className="space-y-4">
            <div>
              <Label>Correo Electrónico</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Nombre de Usuario (Username)</Label>
              <Input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Estado de la Cuenta</Label>
              <Select
                options={[
                  { value: "true", label: "Activo" },
                  { value: "false", label: "Inactivo" },
                ]}
                onChange={(val) => setEstado(val === "true")}
                defaultValue={estado ? "true" : "false"}
              />
            </div>
            <div className="pt-4 flex justify-end border-t border-gray-100 dark:border-gray-800">
              <Button onClick={handleSaveUsuario} className="bg-blue-600 hover:bg-blue-700 text-white">
                Guardar Cuenta
              </Button>
            </div>
          </div>
        </ComponentCard>

        {/* Card: Información Personal (Persona) */}
        <ComponentCard title="Información Personal">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Nombres</Label>
                <Input type="text" value={nombres} onChange={(e) => setNombres(e.target.value)} />
              </div>
              <div>
                <Label>Primer Apellido</Label>
                <Input type="text" value={p_apellido} onChange={(e) => setP_apellido(e.target.value)} />
              </div>
              <div>
                <Label>Segundo Apellido</Label>
                <Input type="text" value={s_apellido} onChange={(e) => setS_apellido(e.target.value)} />
              </div>
              <div>
                <Label>Fecha de Nacimiento</Label>
                <Input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} />
              </div>
              <div>
                <Label>Género</Label>
                <Select
                  options={[
                    { value: "M", label: "Masculino" },
                    { value: "F", label: "Femenino" },
                    { value: "O", label: "Otro" },
                  ]}
                  onChange={(val) => setGenero(val.toString())}
                  defaultValue={genero}
                />
              </div>
            </div>
            <div className="pt-4 flex justify-end border-t border-gray-100 dark:border-gray-800">
              <Button onClick={handleSavePersona} className="bg-blue-600 hover:bg-blue-700 text-white">
                Guardar Datos Personales
              </Button>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}
