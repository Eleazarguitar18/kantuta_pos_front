import Button from "../../../components/ui/button/Button";
import { CheckCircle2, Clock, HandCoins } from "lucide-react";
import { PrestamoExterno } from "../services/prestamosExternosService";

interface TablaPrestamosExternosProps {
  prestamos: PrestamoExterno[];
  loading: boolean;
  procesandoPago: boolean;
  onRegistrarDevolucion: (prestamo: PrestamoExterno) => void;
}

const obtenerEstado = (prestamo: PrestamoExterno) =>
  (prestamo.estado_prestamo || prestamo.estado || "PENDIENTE").toUpperCase();

const obtenerSolicitante = (prestamo: PrestamoExterno) =>
  prestamo.solicitante_externo || prestamo.solicitanteExterno || prestamo.solicitante || "Sin solicitante";

const obtenerAutorizador = (prestamo: PrestamoExterno) => {
  if (typeof prestamo.autorizador === "string") return prestamo.autorizador;

  const autorizadoPor = prestamo.autorizado_por || prestamo.autorizadoPor;
  if (autorizadoPor) return autorizadoPor;

  const autorizador = prestamo.autorizador;
  if (!autorizador) return "No especificado";

  const nombreCompleto = [
    autorizador.persona?.nombres,
    autorizador.persona?.p_apellido,
    autorizador.persona?.s_apellido,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return nombreCompleto || autorizador.name || autorizador.email || `Usuario #${autorizador.id}`;
};

const obtenerFecha = (prestamo: PrestamoExterno) => prestamo.fecha_prestamo || prestamo.fecha;

const formatearFecha = (fecha?: string) => {
  if (!fecha) return "Sin fecha";
  const fechaValida = new Date(fecha);
  if (Number.isNaN(fechaValida.getTime())) return fecha;
  return fechaValida.toLocaleString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const TablaPrestamosExternos: React.FC<TablaPrestamosExternosProps> = ({
  prestamos,
  loading,
  procesandoPago,
  onRegistrarDevolucion,
}) => {
  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando préstamos externos...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Fecha</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Solicitante Externo</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Autorizado Por</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Monto</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Motivo</th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-500">Estado</th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-500">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {prestamos.map((prestamo) => {
            const estado = obtenerEstado(prestamo);
            const estaPendiente = estado === "PENDIENTE";

            return (
              <tr key={prestamo.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {formatearFecha(obtenerFecha(prestamo))}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {obtenerSolicitante(prestamo)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {obtenerAutorizador(prestamo)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-extrabold text-orange-600 dark:text-orange-400">
                  Bs. {Number(prestamo.monto || 0).toFixed(2)}
                </td>
                <td className="max-w-sm px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {prestamo.motivo || prestamo.observacion || "Sin observación"}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                      estaPendiente
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                    }`}
                  >
                    {estaPendiente ? <Clock className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    {estaPendiente ? "Pendiente" : "Pagado"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {estaPendiente ? (
                    <Button
                      size="sm"
                      className="mx-auto bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                      onClick={() => onRegistrarDevolucion(prestamo)}
                      disabled={procesandoPago}
                    >
                      <HandCoins className="h-4 w-4" />
                      Registrar Devolución
                    </Button>
                  ) : (
                    <span className="text-xs font-medium text-gray-400">
                      Pagado{prestamo.fecha_devolucion ? ` (${formatearFecha(prestamo.fecha_devolucion)})` : ""}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}

          {prestamos.length === 0 && (
            <tr>
              <td colSpan={7} className="py-10 text-center text-gray-500">
                No hay préstamos externos registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TablaPrestamosExternos;
