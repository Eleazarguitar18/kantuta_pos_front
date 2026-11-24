import { useNavigate } from "react-router";
import Swal from "sweetalert2";
import { PlusIcon, DocsIcon } from "../../../../icons";
import DataTable from "react-data-table-component";
import { UsuariosService } from "../services/usuariosService";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../../context/auth/AuthContext";
import { useSocket } from "../../../../context/SocketContext";
import ComponentCard from "../../../../components/common/ComponentCard";
import ButtonSmallAction from "../../../../components/ui/button/ButtonSmallAction";
import Button from "../../../../components/ui/button/Button";
import { Usuario } from "../interfaces/Usuario";

const UsuariosMain = () => {
  const [data, setData] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

  const fetchUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const response = await UsuariosService.getUsuarios();
      // Asumimos que response.data.data es el arreglo según la interfaz
      setData(response.data.data || response.data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  useEffect(() => {
    const handleDataChanged = (data: { entity: string; action: string }) => {
      if (data.entity === "usuario" && data.action === "estado_actualizado") {
        fetchUsuarios();
      }
    };
    socket.on("dataChanged", handleDataChanged);
    return () => {
      socket.off("dataChanged", handleDataChanged);
    };
  }, [socket, fetchUsuarios]);

  const editProfile = (row: Usuario) => {
    navigate(`editar/${row.id}`, { state: row });
  };

  const toggleEstado = async (row: Usuario) => {
    if (row.id === user?.id) {
      Swal.fire({
        icon: "warning",
        title: "No permitido",
        text: "No puede desactivar su propio usuario.",
      });
      return;
    }

    const nuevoEstado = !row.estado;
    const confirmacion = await Swal.fire({
      title: nuevoEstado ? "¿Reactivar usuario?" : "¿Desactivar usuario?",
      text: nuevoEstado
        ? `${row.name} volverá a tener acceso al sistema.`
        : `${row.name} no podrá iniciar sesión ni realizar acciones hasta que sea reactivado.`,
      icon: nuevoEstado ? "question" : "warning",
      showCancelButton: true,
      confirmButtonColor: nuevoEstado ? "#16a34a" : "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: nuevoEstado ? "Sí, reactivar" : "Sí, desactivar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmacion.isConfirmed) return;

    setProcesandoId(row.id);
    try {
      await UsuariosService.cambiarEstadoUsuario(row.id, nuevoEstado);
      await Swal.fire({
        icon: "success",
        title: nuevoEstado ? "Usuario reactivado" : "Usuario desactivado",
        text: nuevoEstado
          ? `${row.name} ya puede volver a ingresar.`
          : `${row.name} ya no puede ingresar al sistema.`,
        timer: 2000,
        showConfirmButton: false,
      });
      await fetchUsuarios();
    } catch (error: any) {
      const mensaje = error.response?.data?.message || "No se pudo cambiar el estado del usuario.";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: typeof mensaje === "string" ? mensaje : JSON.stringify(mensaje),
      });
    } finally {
      setProcesandoId(null);
    }
  };

  const columns = [
    {
      name: "ID",
      selector: (row: Usuario) => row.id,
      sortable: true,
      width: "80px",
    },
    {
      name: "Nombre Completo",
      selector: (row: Usuario) => `${row.persona?.nombres || ''} ${row.persona?.p_apellido || ''}`,
      sortable: true,
    },
    {
      name: "Email",
      selector: (row: Usuario) => row.email,
      sortable: true,
    },
    {
      name: "Rol",
      selector: (row: Usuario) => row.role?.nombre,
      cell: (row: Usuario) => (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {row.role?.nombre?.toUpperCase() || "USER"}
        </span>
      ),
      sortable: true,
    },
    {
      name: "Estado",
      selector: (row: Usuario) => row.estado,
      cell: (row: Usuario) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {row.estado ? "Activo" : "Inactivo"}
        </span>
      ),
    },
    {
      name: "Acciones",
      cell: (row: Usuario) => (
        <div className="flex gap-2">
          <ButtonSmallAction
            className="bg-indigo-500 hover:bg-indigo-600 text-white"
            variant="primary"
            size="sm"
            onClick={() => editProfile(row)}
            startIcon={<DocsIcon className="w-4 h-4" color={"white"} />}
          >
            Ver/Editar Perfil
          </ButtonSmallAction>
          <ButtonSmallAction
            className={
              row.estado
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }
            variant="primary"
            size="sm"
            disabled={procesandoId === row.id || row.id === user?.id}
            onClick={() => toggleEstado(row)}
          >
            {procesandoId === row.id
              ? "..."
              : row.estado
                ? "Desactivar"
                : "Activar"}
          </ButtonSmallAction>
        </div>
      ),
      ignoreRowClick: true,
      width: "320px",
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Gestión de Usuarios
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Administración de cuentas y personal
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate("registrar")}
            startIcon={<PlusIcon className="w-4 h-4" color={"white"} />}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Nuevo Usuario
          </Button>
        </div>
      </div>
      <ComponentCard title="Lista de Usuarios">
        <DataTable
          columns={columns}
          data={data}
          pagination
          progressPending={loading}
          highlightOnHover
          noDataComponent="No hay usuarios registrados"
          customStyles={{
            headCells: {
              style: {
                fontWeight: "bold",
                fontSize: "14px",
                backgroundColor: "#f9fafb",
              },
            },
          }}
        />
      </ComponentCard>
    </div>
  );
};

export default UsuariosMain;
