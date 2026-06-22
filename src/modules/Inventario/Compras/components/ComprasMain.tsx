import { useNavigate } from "react-router";
import { PlusIcon, DocsIcon } from "../../../../icons";
import DataTable from "react-data-table-component";
import { ComprasService } from "../services/comprasService";
import { useEffect, useState } from "react";
import ComponentCard from "../../../../components/common/ComponentCard";
import ButtonSmallAction from "../../../../components/ui/button/ButtonSmallAction";
import Button from "../../../../components/ui/button/Button";
import { Compra } from "../interfaces/Compra";
import { Modal } from "../../../../components/ui/modal";
import { useModal } from "../../../../hooks/useModal";
import ReportesModal from "../../../../components/common/ReportesModal";
import { useAuth } from "../../../../context/auth/AuthContext";
import { useRole } from "../../../../hooks/useRole";
import { API_BASE_URL } from "../../../../components/auth/services/urlBase";
import axios from "axios";
import { pdf } from "@react-pdf/renderer";
import { ComprasRangoPdf } from "../../../../components/pdf/ComprasRangoPdf";

const ComprasMain = () => {
  const [data, setData] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchCompras = async () => {
    try {
      setLoading(true);
      const response = await ComprasService.getCompras();
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar compras:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompras();
  }, []);

  const viewCompra = (row: Compra) => {
    setSelectedCompra(row);
    openModal();
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

  const handleDownloadComprasPdf = async (startDate: string, endDate: string) => {
    try {
      setDownloadingPdf(true);
      setReportModalOpen(false);
      const auditor = user?.name || "Auditor Autorizado";
      const url = `${API_BASE_URL}/reportes/data/compras-rango?fechaInicio=${startDate}&fechaFin=${endDate}&auditor=${encodeURIComponent(auditor)}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      const blob = await pdf(<ComprasRangoPdf data={response.data} />).toBlob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `Compras-${startDate}-a-${endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      alert("Error al estructurar el PDF de compras.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const columns = [
    {
      name: "# ID",
      selector: (row: Compra) => row.id,
      sortable: true,
      width: "80px",
    },
    {
      name: "Fecha",
      selector: (row: Compra) => row.fecha,
      cell: (row: Compra) => formatDate(row.fecha),
      sortable: true,
    },
    {
      name: "Proveedor",
      selector: (row: Compra) => row.proveedor || "Sin Proveedor",
      sortable: true,
    },
    {
      name: "Total (Bs)",
      selector: (row: Compra) => row.total,
      sortable: true,
    },
    {
      name: "Estado de Pago",
      cell: (row: Compra) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            row.pagado_con_caja
              ? "bg-green-100 text-green-800"
              : "bg-orange-100 text-orange-800"
          }`}
        >
          {row.pagado_con_caja ? "Caja" : "Otro"}
        </span>
      ),
    },
    {
      name: "Acciones",
      cell: (row: Compra) => (
        <div className="flex gap-2">
          <ButtonSmallAction
            className="bg-blue-500 hover:bg-blue-600 text-white"
            variant="primary"
            size="sm"
            onClick={() => viewCompra(row)}
            startIcon={<DocsIcon className="w-4 h-4" color={"white"} />}
          >
            Detalles
          </ButtonSmallAction>
        </div>
      ),
      ignoreRowClick: true,
      width: "150px",
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Compras de Inventario
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Historial de ingreso de mercadería
          </p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setReportModalOpen(true)}
              disabled={downloadingPdf}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {downloadingPdf ? "Generando..." : "📄 Reporte PDF"}
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate("registrar")}
            startIcon={<PlusIcon className="w-4 h-4" color={"white"} />}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Registrar Ingreso
          </Button>
        </div>
      </div>
      <ComponentCard title="Historial de Compras">
        <DataTable
          columns={columns}
          data={data}
          pagination
          progressPending={loading}
          highlightOnHover
          noDataComponent="No hay compras registradas"
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

      {/* Modal de detalle de la compra */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-2xl p-6 lg:p-8"
      >
        {selectedCompra && (
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
              Detalle de Compra #{selectedCompra.id}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Proveedor
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {selectedCompra.proveedor || "Sin Proveedor"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Fecha
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {formatDate(selectedCompra.fecha)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Total Pagado
                </p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  Bs. {Number(selectedCompra.total).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Método
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {selectedCompra.pagado_con_caja
                    ? "Efectivo (POS)"
                    : "Externo"}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
                Productos Ingresados
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cant.
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Costo Unit.
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {selectedCompra.detalles?.map((detalle, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-300">
                          {detalle.producto?.nombre || `ID: ${detalle.id_producto}`}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-gray-800 dark:text-gray-300">
                          {detalle.cantidad}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-gray-800 dark:text-gray-300">
                          Bs. {Number(detalle.costo_unitario).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-gray-800 dark:text-gray-300 font-medium">
                          Bs. {Number(detalle.subtotal).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end mt-6">
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

      <ReportesModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onGenerate={handleDownloadComprasPdf}
        title="Reporte de Compras (PDF)"
      />
    </div>
  );
};

export default ComprasMain;
