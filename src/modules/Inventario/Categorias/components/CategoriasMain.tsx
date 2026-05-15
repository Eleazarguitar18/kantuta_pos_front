import { useNavigate } from "react-router";
import { PlusIcon } from "../../../../icons";
import DataTable from "react-data-table-component";

const CategoriasMain = () => {
  const navigate = useNavigate();
  const columns = [
    { name: "ID", selector: (row: any) => row.id },
    { name: "Nombre", selector: (row: any) => row.name },
    { name: "Descripción", selector: (row: any) => row.description },
    { name: "Acciones", selector: (row: any) => row.actions },
  ];

  const data = [
    { id: 1, name: "Categorias 1", description: "Categorias 1" },
    { id: 2, name: "Categorias 2", description: "Categorias 2" },
    { id: 3, name: "Categorias 3", description: "Categorias 3" },
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
          <button
            className="btn-primary px-4 py-2 flex items-center gap-2"
            onClick={() => navigate("registrar")}
          >
            <PlusIcon />
            <span className="hidden sm:inline">Agregar Categoria</span>
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={data} />
    </div>
  );
};

export default CategoriasMain;
