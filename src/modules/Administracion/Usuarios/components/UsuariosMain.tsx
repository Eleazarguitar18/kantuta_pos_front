import { useNavigate } from "react-router";
import { PlusIcon, DocsIcon } from "../../../../icons";
import DataTable from "react-data-table-component";
import { UsuariosService } from "../services/usuariosService";
import { useEffect, useState } from "react";
import ComponentCard from "../../../../components/common/ComponentCard";
import ButtonSmallAction from "../../../../components/ui/button/ButtonSmallAction";
import Button from "../../../../components/ui/button/Button";
import { Usuario } from "../interfaces/Usuario";

const UsuariosMain = () => {
  const [data, setData] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await UsuariosService.getUsuarios();
      // Asumimos que response.data.data es el arreglo según la interfaz
      setData(response.data.data || response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const editProfile = (row: Usuario) => {
    navigate(`editar/${row.id}`, { state: row });
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
        </div>
      ),
      ignoreRowClick: true,
      width: "200px",
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
