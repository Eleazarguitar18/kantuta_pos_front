import { useNavigate } from "react-router";
import { DocsIcon, TrashBinIcon, PencilIcon } from "../../../icons";
import DataTable from "react-data-table-component";
import { VentasService } from "../services/ventasService";
import { useEffect, useState, useCallback } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import ButtonSmallAction from "../../../components/ui/button/ButtonSmallAction";
import Button from "../../../components/ui/button/Button";
import { Venta } from "../interfaces/Venta";
import { Modal } from "../../../components/ui/modal";
import { useModal } from "../../../hooks/useModal";
import Alert from "../../../components/ui/alert/Alert";
import ReportesModal from "../../../components/common/ReportesModal";
import { useAuth } from "../../../context/auth/AuthContext";
import { useRole } from "../../../hooks/useRole";
import { useSocket } from "../../../context/SocketContext";
import { API_BASE_URL } from "../../../components/auth/services/urlBase";
import axios from "axios";
import { ModalReporteVentas } from "./ModalReporteVentas";
import { pdf } from "@react-pdf/renderer";
import { TicketVentaPdf } from "../../../components/pdf/TicketVentaPdf";
import { ReporteVentasPDF } from "./ReporteVentasPDF";

const VentasMain = () => {
  const [data, setData] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const { isOpen, openModal, closeModal } = useModal();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const socket = useSocket();

  const fetchVentas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await VentasService.getVentas();
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar ventas:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVentas();
  }, [fetchVentas]);

  useEffect(() => {
    const handleDataChanged = (data: { entity: string; action: string }) => {
      if (data.entity === "venta" || data.entity === "producto") {
        console.log("Cambio detectado vía WebSocket en VentasMain. Actualizando...");
        fetchVentas();
      }
    };

    socket.on("dataChanged", handleDataChanged);
    return () => {
      socket.off("dataChanged", handleDataChanged);
    };
  }, [socket, fetchVentas]);

  const viewVenta = (row: Venta) => {
    setSelectedVenta(row);
    openModal();
  };

  const anularVenta = async (row: Venta) => {
    const motivo = window.prompt("Ingrese el motivo de anulación:");
    if (motivo) {
      try {
        await VentasService.updateVenta(row.id, {
          estado_venta: "ANULADA",
          motivo_edicion: motivo
        });
        setAlertMessage("Venta anulada correctamente.");
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 3000);
        fetchVentas();
      } catch (error) {
        alert("Error al anular la venta.");
      }
    }
  };

  const handleDownloadVentasPdf = async (startDate: string, endDate: string) => {
    try {
      setDownloadingPdf(true);
      setReportModalOpen(false);
      const auditor = user?.name || "Auditor Autorizado";
      const url = `${API_BASE_URL}/reportes/data/ventas-rango?fechaInicio=${startDate}&fechaFin=${endDate}&auditor=${encodeURIComponent(auditor)}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
      });
      const blob = await pdf(<ReporteVentasPDF datos={response.data} rango={`${startDate} al ${endDate}`} />).toBlob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `Ventas-${startDate}-a-${endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      alert("Error al generar el PDF de ventas.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-BO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const columns = [
    {
      name: "Ticket #",
      selector: (row: Venta) => row.id,
      sortable: true,
      width: "100px",
    },
    {
      name: "Fecha",
      selector: (row: Venta) => row.fecha,
      cell: (row: Venta) => formatDate(row.fecha),
      sortable: true,
    },
    {
      name: "Total (Bs)",
      selector: (row: Venta) => row.total,
      sortable: true,
      cell: (row: Venta) => <span className="font-semibold text-gray-800 dark:text-white">Bs. {Number(row.total).toFixed(2)}</span>
    },
    {
      name: "Método",
      selector: (row: Venta) => row.metodo_pago,
      sortable: true,
      cell: (row: Venta) => (
        <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
          {row.metodo_pago}
        </span>
      ),
    },
    {
      name: "Estado",
      selector: (row: Venta) => row.estado_venta,
      sortable: true,
      cell: (row: Venta) => {
        let colorClass = "bg-gray-100 text-gray-800";
        if (row.estado_venta === "COMPLETADA") colorClass = "bg-green-100 text-green-800";
        if (row.estado_venta === "ANULADA") colorClass = "bg-red-100 text-red-800";
        if (row.estado_venta === "EDITADA") colorClass = "bg-orange-100 text-orange-800";

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${colorClass}`}>
            {row.estado_venta}
          </span>
        );
      }
    },
    {
      name: "Acciones",
      cell: (row: Venta) => (
        <div className="flex gap-2">
          <ButtonSmallAction
            className="bg-indigo-500 hover:bg-indigo-600 text-white"
            variant="primary"
            size="sm"
            onClick={() => viewVenta(row)}
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
                // Fetch JSON data instead of Blob
                const response = await axios.get(`${API_BASE_URL}/reportes/data/venta/${row.id}`, {
                  headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
                });
                // Generate PDF locally
                const blob = await pdf(<TicketVentaPdf data={response.data} />).toBlob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = downloadUrl;
                link.setAttribute("download", `ticket-venta-${row.id}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(downloadUrl);
              } catch (err) {
                console.error(err);
                alert("Error al estructurar el ticket en PDF.");
              }
            }}
            startIcon={<span className="font-bold">📄</span>}
          >
            PDF
          </ButtonSmallAction>
          {isAdmin && row.estado_venta === "COMPLETADA" && (
            <ButtonSmallAction
              className="bg-red-500 hover:bg-red-600 text-white"
              variant="primary"
              size="sm"
              onClick={() => anularVenta(row)}
              startIcon={<TrashBinIcon className="w-4 h-4" color={"white"} />}
            >
              Anular
            </ButtonSmallAction>
          )}
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
            Historial de Ventas
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Revisión y administración de ventas realizadas
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
            onClick={() => navigate("pos")}
            startIcon={<PencilIcon className="w-4 h-4" color={"white"} />}
            className="bg-green-600 hover:bg-green-700 text-white px-6 shadow-lg hover:shadow-xl transition-all font-semibold"
          >
            Abrir Punto de Venta (POS)
          </Button>
        </div>
      </div>

      {showAlert && (
        <div className="mb-4">
          <Alert variant="success" title="Éxito" message={alertMessage} />
        </div>
      )}

      <ComponentCard title="Todas las ventas">
        <DataTable
          columns={columns}
          data={data}
          pagination
          progressPending={loading}
          highlightOnHover
          noDataComponent="No hay ventas registradas"
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

      {/* Modal de detalle de Venta */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-3xl p-6 lg:p-8"
      >
        {selectedVenta && (
          <div>
            <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                Ticket #{selectedVenta.id}
              </h3>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${selectedVenta.estado_venta === "COMPLETADA" ? "bg-green-100 text-green-800" :
                selectedVenta.estado_venta === "ANULADA" ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"
                }`}>
                {selectedVenta.estado_venta}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Fecha</p>
                <p className="font-medium text-gray-800 dark:text-gray-200">{formatDate(selectedVenta.fecha)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Método de Pago</p>
                <p className="font-medium text-gray-800 dark:text-gray-200">{selectedVenta.metodo_pago}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Caja Origen</p>
                <p className="font-medium text-gray-800 dark:text-gray-200">Sesión {selectedVenta.id_sesion_caja}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Total Pagado</p>
                <p className="text-xl font-bold text-green-600">Bs. {Number(selectedVenta.total).toFixed(2)}</p>
              </div>
            </div>

            {selectedVenta.estado_venta === "ANULADA" && selectedVenta.motivo_edicion && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 dark:bg-red-900/20 rounded">
                <p className="text-sm font-semibold text-red-800 dark:text-red-400 mb-1">Motivo de Anulación:</p>
                <p className="text-sm text-red-700 dark:text-red-300">{selectedVenta.motivo_edicion}</p>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Detalle de Productos</h4>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Producto</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Cant.</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">P. Unitario</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {selectedVenta.detalles?.map((detalle, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm text-gray-800 dark:text-gray-300 font-medium">
                          {detalle.producto?.nombre || `ID: ${detalle.id_producto}`}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-gray-600 dark:text-gray-400">
                          {detalle.cantidad}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-gray-600 dark:text-gray-400">
                          Bs. {Number(detalle.precio_unitario).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-gray-900 dark:text-gray-100 font-semibold">
                          Bs. {Number(detalle.subtotal).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                className="bg-gray-600 hover:bg-gray-700 text-white"
                onClick={closeModal}
              >
                Cerrar Ventana
              </Button>
            </div>
          </div>
        )}
      </Modal>
      <ReportesModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Reporte de Ventas (PDF)"
        onGenerate={handleDownloadVentasPdf}
      />
    </div>
  );
};

export default VentasMain;
