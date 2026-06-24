import { useNavigate } from "react-router";
import { PencilIcon, TrashBinIcon, DocsIcon } from "../../../../icons";
import DataTable from "react-data-table-component";
import { ProductosService } from "../services/productosService";
import { useEffect, useState } from "react";
import ComponentCard from "../../../../components/common/ComponentCard";
import ButtonEdit from "../../../../components/ui/button/ButtonEdit";
import ButtonSmallAction from "../../../../components/ui/button/ButtonSmallAction";
import Button from "../../../../components/ui/button/Button";
import { Producto } from "../interfaces/Producto";
import { Modal } from "../../../../components/ui/modal";
import { useModal } from "../../../../hooks/useModal";
import { useAuth } from "../../../../context/auth/AuthContext";
import { useRole } from "../../../../hooks/useRole";
import { useSocket } from "../../../../context/SocketContext";
import { API_BASE_URL } from "../../../../components/auth/services/urlBase";
import axios from "axios";
import { pdf } from "@react-pdf/renderer";
import { FichaProductoPdf } from "../../../../components/pdf/FichaProductoPdf";
import { ReporteInventarioPDF } from "../../../Reportes/components/ReporteInventarioPDF";

const ProductosMain = () => {
  const [data, setData] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const socket = useSocket();

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

  useEffect(() => {
    const handleDataChanged = (data: { entity: string; action: string }) => {
      if (data.entity === "producto" || data.entity === "venta" || data.entity === "product") {
        console.log("Cambio detectado vía WebSocket en ProductosMain. Actualizando...");
        fetchProducts();
      }
    };

    socket.on("dataChanged", handleDataChanged);
    return () => {
      socket.off("dataChanged", handleDataChanged);
    };
  }, [socket]);

  const viewProducto = (row: Producto) => {
    setSelectedProduct(row);
    openModal();
  };

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

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadReport = async () => {
    try {
      setDownloadingPdf(true);
      const auditor = user?.name || "Auditor Autorizado";
      const response = await axios.get(`${API_BASE_URL}/reportes/data/inventario?auditor=${encodeURIComponent(auditor)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
      });
      const blob = await pdf(<ReporteInventarioPDF datos={response.data} />).toBlob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `Inventario-${new Date().toISOString().split("T")[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      alert("Error al descargar el PDF del inventario");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-BO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const columns = [
    {
      name: "#",
      selector: (_row: Producto, index?: number) =>
        index !== undefined ? index + 1 : 0,
      sortable: false,
      width: "80px",
    },
    {
      name: "Nombre",
      selector: (row: Producto) => row.nombre,
      sortable: true,
    },
    {
      name: "Precio Venta",
      selector: (row: Producto) => row.precio_venta,
      sortable: true,
    },
    {
      name: "Stock Actual",
      selector: (row: Producto) => row.stock_actual,
      cell: (row: Producto) => {
        const threshold = row.stock_minimo || 10;
        const ratio = row.stock_actual / threshold;
        
        let colorClass = "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-900";
        let indicator = "🟢";
        if (ratio < 0.25) {
          colorClass = "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 font-bold";
          indicator = "🔴";
        } else if (ratio <= 0.50) {
          colorClass = "text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-900";
          indicator = "🟡";
        }

        return (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs ${colorClass}`}>
            <span>{indicator}</span>
            <span>{row.stock_actual} / {threshold}</span>
          </div>
        );
      },
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
        <div className="flex gap-2">
          <ButtonSmallAction
            className="bg-blue-500 hover:bg-blue-600 text-white"
            variant="primary"
            size="sm"
            onClick={() => viewProducto(row)}
            startIcon={<DocsIcon className="w-4 h-4" color={"white"} />}
          >
            Ver
          </ButtonSmallAction>
          <ButtonSmallAction
            className="bg-purple-600 hover:bg-purple-700 text-white"
            variant="primary"
            size="sm"
              onClick={async () => {
                try {
                  const response = await axios.get(`${API_BASE_URL}/reportes/data/producto/${row.id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
                  });
                  const blob = await pdf(<FichaProductoPdf data={response.data} />).toBlob();
                  const downloadUrl = window.URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = downloadUrl;
                  link.setAttribute("download", `ficha-producto-${row.id}.pdf`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  window.URL.revokeObjectURL(downloadUrl);
                } catch (err) {
                  console.error(err);
                  alert("Error al estructurar la ficha en PDF.");
                }
              }}
            startIcon={<span className="font-bold">📄</span>}
          >
            PDF
          </ButtonSmallAction>
          {isAdmin && (
            <>
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
            </>
          )}
        </div>
      ),
      ignoreRowClick: true,
      width: "300px",
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Productos
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Lista de productos registrados en el sistema
          </p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDownloadReport}
                disabled={downloadingPdf}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {downloadingPdf ? "Generando..." : "📄 Descargar PDF"}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("registrar")}
                startIcon={<PencilIcon className="w-4 h-4" color={"white"} />}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Agregar Producto
              </Button>
            </>
          )}
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

      {/* Modal de detalle del producto */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-lg p-6 lg:p-8"
      >
        {selectedProduct && (
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
              Detalle del Producto
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nombre */}
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Nombre
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {selectedProduct.nombre}
                </p>
              </div>

              {/* Código de Barras */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Código de Barras
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {selectedProduct.codigo_barras || "-"}
                </p>
              </div>

              {/* Categoría */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Categoría
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {selectedProduct.categoria?.nombre || "-"}
                </p>
              </div>

              {/* Precio Venta */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Precio de Venta
                </p>
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                  Bs. {Number(selectedProduct.precio_venta).toFixed(2)}
                </p>
              </div>

              {/* Costo Compra */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Costo de Compra
                </p>
                <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                  Bs. {Number(selectedProduct.costo_compra).toFixed(2)}
                </p>
              </div>

              {/* Stock Actual */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Stock Actual
                </p>
                <p
                  className={`text-sm font-semibold ${selectedProduct.stock_actual <= selectedProduct.stock_minimo
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-800 dark:text-white"
                    }`}
                >
                  {selectedProduct.stock_actual} unidades
                  {selectedProduct.stock_actual <=
                    selectedProduct.stock_minimo && " ⚠️ Stock bajo"}
                </p>
              </div>

              {/* Stock Mínimo */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Stock Mínimo
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {selectedProduct.stock_minimo} unidades
                </p>
              </div>

              {/* Fecha de Creación */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Fecha de Creación
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {formatDate(selectedProduct.createdAt)}
                </p>
              </div>

              {/* Última Actualización */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Última Actualización
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {formatDate(selectedProduct.updatedAt)}
                </p>
              </div>
            </div>

            {/* Botones del modal */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              {isAdmin && (
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    closeModal();
                    editProducto(selectedProduct);
                  }}
                  startIcon={<PencilIcon className="w-4 h-4" color={"white"} />}
                >
                  Editar
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                className="bg-gray-500 hover:bg-gray-600 text-white"
                onClick={closeModal}
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductosMain;
