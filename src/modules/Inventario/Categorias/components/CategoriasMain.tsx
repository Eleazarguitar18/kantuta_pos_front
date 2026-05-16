import { useNavigate } from "react-router";
import { PencilIcon, TrashBinIcon } from "../../../../icons";
import DataTable from "react-data-table-component";
import { CategoriasService } from "../services/categoriasService";
import { useEffect, useState } from "react";
import ComponentCard from "../../../../components/common/ComponentCard";
import ButtonEdit from "../../../../components/ui/button/ButtonEdit";
import ButtonSmallAction from "../../../../components/ui/button/ButtonSmallAction";
import Button from "../../../../components/ui/button/Button";
interface Categoria {
  id: number;
  nombre: string;
  actions: string;
}

const CategoriasMain = () => {
  const [data, setData] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await CategoriasService.getCategories();
        setData(response.data);
        setLoading(false);
      } catch (error) {
        console.log(error);
      }
    };
    fetchCategories();
  }, []);

  const navigate = useNavigate();

  const columns = [
    { name: "ID", selector: (row: Categoria) => row.id },
    { name: "Nombre", selector: (row: Categoria) => row.nombre },
    {
      name: "Acciones",
      cell: (row: Categoria) => (
        <div className="flex gap-3">
          <ButtonEdit
            className=""
            variant="primary"
            size="sm"
            onClick={() => console.log("Editando ID:", row.id)} // <-- Aquí ya la estás usando
            startIcon={<PencilIcon className="w-4 h-4" color={"white"} />}
          >
            Editar
          </ButtonEdit>
          <ButtonSmallAction
            className="bg-red-500 hover:bg-red-600 text-white"
            variant="primary"
            size="sm"
            onClick={() => console.log("Eliminando ID:", row.id)} // <-- Aquí ya la estás usando
            startIcon={<TrashBinIcon className="w-4 h-4" color={"white"} />}
          >
            Eliminar
          </ButtonSmallAction>
        </div>
      ),
      ignoreRowClick: true,
    },
  ];

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
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate("registrar")}
            startIcon={<PencilIcon className="w-4 h-4" color={"white"} />}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Agregar Categoria
          </Button>
        </div>
      </div>
      <ComponentCard title="Lista de Categorias">
        <DataTable
          columns={columns}
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
