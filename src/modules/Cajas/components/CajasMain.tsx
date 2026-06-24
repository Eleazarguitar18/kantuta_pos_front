import { useNavigate } from "react-router";
import { PlusIcon, DocsIcon, PencilIcon, TrashBinIcon } from "../../../icons";
import DataTable from "react-data-table-component";
import { CajasService } from "../services/cajasService";
import { useEffect, useState } from "react";
import ComponentCard from "../../../components/common/ComponentCard";
import ButtonSmallAction from "../../../components/ui/button/ButtonSmallAction";
import Button from "../../../components/ui/button/Button";
import { Caja } from "../interfaces/Caja";
import ButtonEdit from "../../../components/ui/button/ButtonEdit";
import { useRole } from "../../../hooks/useRole";
import axios from "axios";
import { API_BASE_URL } from "../../../components/auth/services/urlBase";
import { pdf } from "@react-pdf/renderer";
import { CajaHistorialPdf } from "../../../components/pdf/CajaHistorialPdf";
import { useSocket } from "../../../context/SocketContext";

const CajasMain = () => {
  const [data, setData] = useState<Caja[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const socket = useSocket();

  const fetchCajas = async () => {
    try {
      setLoading(true);
      const response = await CajasService.getCajas();
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar cajas:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCajas();
  }, []);

  useEffect(() => {
    const handleDataChanged = (data: { entity: string; action: string }) => {
      if (data.entity === "caja") {
        console.log(`📡 WebSocket detectado en CajasMain: ${data.action}`);
        fetchCajas();
      }
    };

    socket.on("dataChanged", handleDataChanged);
    return () => {
      socket.off("dataChanged", handleDataChanged);
    };
  }, [socket]);

  const editCaja = (row: Caja) => {
    navigate(`editar/${row.id}`, { state: row });
  };

  const manageCaja = (row: Caja) => {
    navigate(`control/${row.id}`, { state: row });
  };

  const deleteCaja = async (row: Caja) => {
    if (window.confirm(`¿Está seguro de que desea eliminar la caja "${row.nombre}"?`)) {
      try {
        await CajasService.deleteCaja(row.id);
        fetchCajas();
      } catch (error) {
        console.error("Error al eliminar la caja:", error);
        alert("Hubo un error al eliminar la caja.");
      }
    }
  };

  const columns = [
    {
      name: "ID",
      selector: (row: Caja) => row.id,
      sortable: true,
      width: "80px",
    },
    {
      name: "Nombre de Caja",
      selector: (row: Caja) => row.nombre,
      sortable: true,
    },
    {
      name: "Especialidad",
      selector: (row: Caja) => row.especialidad,
      cell: (row: Caja) => (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {row.especialidad.replace("_", " ")}
        </span>
      ),
      sortable: true,
    },
    {
      name: "Estado",
      selector: (row: Caja) => row.estado,
      cell: (row: Caja) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {row.estado ? "Activa" : "Inactiva"}
        </span>
      ),
    },
    {
      name: "Acciones",
      cell: (row: Caja) => (
        <div className="flex gap-2">
          <ButtonSmallAction
            className="bg-indigo-500 hover:bg-indigo-600 text-white"
            variant="primary"
            size="sm"
            onClick={() => manageCaja(row)}
            startIcon={<DocsIcon className="w-4 h-4" color={"white"} />}
          >
            Control (Sesiones)
          </ButtonSmallAction>
          <ButtonSmallAction
            className="bg-purple-600 hover:bg-purple-700 text-white"
            variant="primary"
            size="sm"
            onClick={async () => {
              try {
                const response = await axios.get(`${API_BASE_URL}/reportes/data/caja-historial/${row.id}`, {
                  headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
                });
                const blob = await pdf(<CajaHistorialPdf data={response.data} />).toBlob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = downloadUrl;
                link.setAttribute("download", `caja-historial-${row.id}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(downloadUrl);
              } catch (err) {
                console.error(err);
                alert("Error al estructurar el extracto de caja en PDF. Asegúrese de que la caja tenga movimientos.");
              }
            }}
            startIcon={<span className="font-bold">📄</span>}
          >
            PDF Historial
          </ButtonSmallAction>
          {isAdmin && (
            <>
              <ButtonEdit
                variant="primary"
                size="sm"
                onClick={() => editCaja(row)}
                startIcon={<PencilIcon className="w-4 h-4" color={"white"} />}
              >
                Editar
              </ButtonEdit>
              <ButtonSmallAction
                className="bg-red-500 hover:bg-red-600 text-white"
                variant="primary"
                size="sm"
                onClick={() => deleteCaja(row)}
                startIcon={<TrashBinIcon className="w-4 h-4" color={"white"} />}
              >
                Eliminar
              </ButtonSmallAction>
            </>
          )}
        </div>
      ),
      ignoreRowClick: true,
      width: "350px",
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Gestión de Cajas Físicas
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Administración de estaciones de trabajo y puntos de cobro
          </p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/reportes/caja")}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                📄 Reportes (PDF)
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("registrar")}
                startIcon={<PlusIcon className="w-4 h-4" color={"white"} />}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Nueva Caja
              </Button>
            </>
          )}
        </div>
      </div>
      <ComponentCard title="Lista de Cajas">
        <DataTable
          columns={columns}
          data={data}
          pagination
          progressPending={loading}
          highlightOnHover
          noDataComponent="No hay cajas registradas"
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

export default CajasMain;
