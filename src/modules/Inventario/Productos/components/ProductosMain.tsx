import { useNavigate } from "react-router";
import { PencilIcon, TrashBinIcon } from "../../../../icons";
import DataTable from "react-data-table-component";
import { ProductosService } from "../services/productosService";
import { useEffect, useState } from "react";
import ComponentCard from "../../../../components/common/ComponentCard";
import ButtonEdit from "../../../../components/ui/button/ButtonEdit";
import ButtonSmallAction from "../../../../components/ui/button/ButtonSmallAction";
import Button from "../../../../components/ui/button/Button";
import { Producto } from "../interfaces/Producto";

const ProductosMain = () => {
  const [data, setData] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await ProductosService.getProducts();
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.log("Error al cargar productos:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const editProducto = (row: Producto) => {
    navigate(`editar/${row.id}`, { state: row });
  };

  const deleteProducto = async (row: Producto) => {
    if (
      window.confirm(
        `¿Está seguro de que desea eliminar el producto "${row.nombre}"?`,
      )
    ) {
      try {
        await ProductosService.deleteProduct(row.id!);
        // Recargar datos
        fetchProducts();
      } catch (error) {
        console.error("Error al eliminar el producto:", error);
        alert("Hubo un error al eliminar el producto.");
      }
    }
  };

  const columns = [
    { name: "ID", selector: (row: Producto) => row.id || 0, sortable: true },
    {
      name: "Nombre",
      selector: (row: Producto) => row.nombre,
      sortable: true,
    },
    {
      name: "Código de Barras",
      selector: (row: Producto) => row.codigo_barras || "-",
      sortable: true,
    },
    {
      name: "Precio Venta",
      selector: (row: Producto) => row.precio_venta,
      sortable: true,
    },
    {
      name: "Costo Compra",
      selector: (row: Producto) => row.costo_compra,
      sortable: true,
    },
    {
      name: "Stock Actual",
      selector: (row: Producto) => row.stock_actual,
      sortable: true,
    },
    {
      name: "Stock Mínimo",
      selector: (row: Producto) => row.stock_minimo,
      sortable: true,
    },
    {
      name: "Categoría",
      selector: (row: Producto) => row.categoria?.nombre || "-",
      sortable: true,
    },
    {
      name: "Acciones",
      cell: (row: Producto) => (
        <div className="flex gap-3">
          <ButtonEdit
            className=""
            variant="primary"
            size="sm"
            onClick={() => editProducto(row)}
            startIcon={<PencilIcon className="w-4 h-4" color={"white"} />}
          >
            Editar
          </ButtonEdit>
          <ButtonSmallAction
            className="bg-red-500 hover:bg-red-600 text-white"
            variant="primary"
            size="sm"
            onClick={() => deleteProducto(row)}
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
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Productos</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Lista de productos registrados en el sistema
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
            Agregar Producto
          </Button>
        </div>
      </div>
      <ComponentCard title="Lista de Productos">
        <DataTable
          columns={columns}
          data={data}
          pagination
          progressPending={loading}
          highlightOnHover
          noDataComponent="No hay productos registrados"
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

export default ProductosMain;
