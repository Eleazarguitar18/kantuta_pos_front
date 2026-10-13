import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import ComponentCard from "../../../components/common/ComponentCard";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Button from "../../../components/ui/button/Button";
import { CheckCircle2, HandCoins, Plus, WalletCards } from "lucide-react";
import ModalNuevoPrestamoExterno from "../components/ModalNuevoPrestamoExterno";
import TablaPrestamosExternos from "../components/TablaPrestamosExternos";
import { PrestamoExterno, PrestamosExternosService } from "../services/prestamosExternosService";

const obtenerEstado = (prestamo: PrestamoExterno) =>
  (prestamo.estado_prestamo || prestamo.estado || "PENDIENTE").toUpperCase();

const PrestamosExternosPage: React.FC = () => {
  const [prestamos, setPrestamos] = useState<PrestamoExterno[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState(false);

  const cargarPrestamos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await PrestamosExternosService.listarPrestamosExternos();
      setPrestamos(response.data || []);
    } catch (error) {
      console.error("Error al cargar préstamos externos:", error);
      Swal.fire({
        icon: "error",
        title: "Error al cargar préstamos",
        text: "No se pudo obtener la lista de préstamos externos.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarPrestamos();
  }, [cargarPrestamos]);

  const resumen = useMemo(() => {
    const pendientes = prestamos.filter((prestamo) => obtenerEstado(prestamo) === "PENDIENTE");
    const pagados = prestamos.filter((prestamo) => obtenerEstado(prestamo) === "PAGADO");

    return {
      totalPrestadoActivo: pendientes.reduce((total, prestamo) => total + Number(prestamo.monto || 0), 0),
      prestamosPendientes: pendientes.length,
      totalDevuelto: pagados.reduce((total, prestamo) => total + Number(prestamo.monto || 0), 0),
    };
  }, [prestamos]);

  const handleRegistrarDevolucion = async (prestamo: PrestamoExterno) => {
    if (procesandoPago) return;

    const confirmacion = await Swal.fire({
      title: "¿Registrar devolución?",
      text: `Se marcará como pagado el préstamo de Bs. ${Number(prestamo.monto || 0).toFixed(2)}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, registrar pago",
      cancelButtonText: "Cancelar",
    });

    if (!confirmacion.isConfirmed) return;

    setProcesandoPago(true);
    try {
      await PrestamosExternosService.registrarDevolucion(prestamo.id);
      await Swal.fire({
        icon: "success",
        title: "Devolución registrada",
        text: "El préstamo externo fue marcado como pagado.",
        timer: 2200,
        showConfirmButton: false,
      });
      await cargarPrestamos();
    } catch (error: any) {
      const mensaje = error.response?.data?.message || "Error al registrar la devolución.";
      Swal.fire({
        icon: "error",
        title: "No se pudo registrar el pago",
        text: typeof mensaje === "string" ? mensaje : JSON.stringify(mensaje),
      });
    } finally {
      setProcesandoPago(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Gestión de Préstamos Externos" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Préstamos a Terceros Externos
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Registre, consulte y liquide préstamos de caja realizados a personas externas.
          </p>
        </div>
        <Button onClick={() => setModalAbierto(true)} className="bg-orange-600 font-bold text-white hover:bg-orange-700">
          <Plus className="h-5 w-5" />
          Registrar Préstamo Externo
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-800 dark:bg-orange-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-orange-700 dark:text-orange-400">
                Total Prestado Activo
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-orange-900 dark:text-orange-300">
                Bs. {resumen.totalPrestadoActivo.toFixed(2)}
              </h3>
            </div>
            <WalletCards className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-400">
                Préstamos Pendientes
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-amber-900 dark:text-amber-300">
                {resumen.prestamosPendientes}
              </h3>
            </div>
            <HandCoins className="h-8 w-8 text-amber-600" />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-900/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400">
                Total Devuelto
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-emerald-900 dark:text-emerald-300">
                Bs. {resumen.totalDevuelto.toFixed(2)}
              </h3>
            </div>
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
      </div>

      <ComponentCard title="Listado de Préstamos Externos">
        <TablaPrestamosExternos
          prestamos={prestamos}
          loading={loading}
          procesandoPago={procesandoPago}
          onRegistrarDevolucion={handleRegistrarDevolucion}
        />
      </ComponentCard>

      <ModalNuevoPrestamoExterno
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onPrestamoCreado={cargarPrestamos}
      />
    </div>
  );
};

export default PrestamosExternosPage;
