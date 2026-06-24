import { useNavigate } from "react-router";
import { PencilIcon, TrashBinIcon } from "../../../../icons";
import DataTable from "react-data-table-component";
import { CategoriasService } from "../services/categoriasService";
import { useCallback, useContext, useEffect, useState } from "react";
import ComponentCard from "../../../../components/common/ComponentCard";
import ButtonEdit from "../../../../components/ui/button/ButtonEdit";
import ButtonSmallAction from "../../../../components/ui/button/ButtonSmallAction";
import Button from "../../../../components/ui/button/Button";
import { SocketContext } from "../../../../context/SocketContext";
import { useRole } from "../../../../hooks/useRole";
interface Categoria {
  id: number;
  nombre: string;
  actions: string;
}

const CategoriasMain = () => {
  const socket = useContext(SocketContext);
  const [data, setData] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useRole();

  // 1. Extraemos la lógica de carga a una función estable
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await CategoriasService.getCategories();
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      setLoading(false);
    }
  }, []);

  // 2. Carga inicial
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // 3. Escucha del evento de Socket.io
  useEffect(() => {
    if (socket) {
      const handleDataChanged = (data: { entity: string; action: string }) => {
        if (data.entity === "category" || data.entity === "categoria") {
          fetchCategories();
        }
      };

      socket.on("dataChanged", handleDataChanged);

      return () => {
        socket.off("dataChanged", handleDataChanged);
      };
    }
  }, [socket, fetchCategories]);

  const navigate = useNavigate();
  const editCategoria = (row: Categoria) => {
    navigate(`editar/${row.id}`, { state: row });
    // console.log("Editando ID:", row);
  };
  const deleteCategoria = (row: Categoria) => {
    console.log("Eliminando ID:", row);
  };
  const columns = [
    {
      name: "#",
      selector: (_row: Categoria, index?: number) =>
        index !== undefined ? index + 1 : 0,
      sortable: false,
      width: "80px",
    },
    { name: "Nombre", selector: (row: Categoria) => row.nombre },
    {
      name: "Acciones",
      cell: (row: Categoria) => (
        <div className="flex gap-3">
          <ButtonEdit
            className=""
            variant="primary"
            size="sm"
            onClick={() => editCategoria(row)}
            startIcon={<PencilIcon className="w-4 h-4" color={"white"} />}
          >
            Editar
          </ButtonEdit>
          <ButtonSmallAction
            className="bg-red-500 hover:bg-red-600 text-white"
            variant="primary"
            size="sm"
            onClick={() => deleteCategoria(row)}
            startIcon={<TrashBinIcon className="w-4 h-4" color={"white"} />}
          >
            Eliminar
          </ButtonSmallAction>
        </div>
      ),
      ignoreRowClick: true,
    },
  ];

  const finalColumns = isAdmin ? columns : columns.filter(col => col.name !== "Acciones");

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Categorias</h2>
          <p className="text-gray-600 mt-1">
            Lista de categorias registrados en el sistema
          </p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("registrar")}
              startIcon={<PencilIcon className="w-4 h-4" color={"white"} />}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Agregar Categoria
            </Button>
          )}
        </div>
      </div>
      <ComponentCard title="Lista de Categorias">
        <DataTable
          columns={finalColumns}
          data={data}
          pagination
          progressPending={loading}
          highlightOnHover
          noDataComponent="No hay categorías registradas"
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

export default CategoriasMain;
