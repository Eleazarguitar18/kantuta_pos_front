import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../components/common/ComponentCard";
import Button from "../../../components/ui/button/Button";
import Alert from "../../../components/ui/alert/Alert";
import Label from "../../../components/form/Label";
import { CajasService } from "../../Cajas/services/cajasService";
import { ReportesService } from "../services/reportesService";
import { MatrizControlData } from "../interfaces/MatrizControl";
import TablaMatrizControl from "./TablaMatrizControl";

const meses = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

interface CajaOption {
  id: number;
  nombre: string;
}

const decimal = new Intl.NumberFormat("es-BO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const money = (value: number | undefined): string =>
  `Bs ${decimal.format(Number(value || 0))}`;

const selectClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300";

interface ApiError {
  response?: { data?: { message?: string } };
}

const errorMessage = (error: unknown, fallback: string): string => {
  const apiError = error as ApiError;
  return apiError.response?.data?.message || fallback;
};

const ReporteMatrizControl = () => {
  const navigate = useNavigate();
  const now = new Date();

  const [mes, setMes] = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());
  const [idCaja, setIdCaja] = useState("");
  const [cajas, setCajas] = useState<CajaOption[]>([]);
  const [data, setData] = useState<MatrizControlData | null>(null);
  const [cargando, setCargando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const anioActual = now.getFullYear();
  const anios = Array.from({ length: 5 }, (_, index) => anioActual - 2 + index);

  const cargarMatriz = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const response = await ReportesService.getMatrizControl({
        mes,
        anio,
        id_caja: idCaja ? Number(idCaja) : undefined,
      });
      setData(response.data);
    } catch (error) {
      setError(
        errorMessage(
          error,
          "No se pudo generar la matriz de control. Verifique los filtros e intente de nuevo.",
        ),
      );
    } finally {
      setCargando(false);
    }
  }, [mes, anio, idCaja]);

  useEffect(() => {
    cargarMatriz();
  }, [cargarMatriz]);

  useEffect(() => {
    const cargarCajas = async () => {
      try {
        const response = await CajasService.getCajas();
        setCajas(response.data || []);
      } catch {
        setCajas([]);
      }
    };
    cargarCajas();
  }, []);

  const descargarExcel = async () => {
    try {
      setDescargando(true);
      setError(null);
      const response = await ReportesService.downloadMatrizControlExcel({
        mes,
        anio,
        id_caja: idCaja ? Number(idCaja) : undefined,
      });
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `matriz-control-${anio}-${String(mes).padStart(2, "0")}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError(
        errorMessage(
          error,
          "No se pudo descargar el archivo Excel. Intente de nuevo.",
        ),
      );
    } finally {
      setDescargando(false);
    }
  };

  const mesAnterior = () => {
    const fecha = new Date(anio, mes - 2, 1);
    setMes(fecha.getMonth() + 1);
    setAnio(fecha.getFullYear());
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Matriz Mensual de Control Diario" />

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Matriz de Control Diario por Operador
          </h2>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Ingresos, compras, gastos, pasivos, otros ingresos y activos.
            Dos columnas por día, con columnas extra si hay más turnos.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="bg-gray-400 text-white hover:bg-gray-500"
          onClick={() => navigate("/reportes")}
        >
          Volver a Reportes
        </Button>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={error} />
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <ComponentCard title="Período">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mes</Label>
                <select
                  className={selectClass}
                  value={mes}
                  onChange={(event) => setMes(Number(event.target.value))}
                >
                  {meses.map((nombre, index) => (
                    <option key={nombre} value={index + 1}>
                      {nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Año</Label>
                <select
                  className={selectClass}
                  value={anio}
                  onChange={(event) => setAnio(Number(event.target.value))}
                >
                  {anios.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Caja</Label>
              <select
                className={selectClass}
                value={idCaja}
                onChange={(event) => setIdCaja(event.target.value)}
              >
                <option value="">Todas las cajas</option>
                {cajas.map((caja) => (
                  <option key={caja.id} value={caja.id}>
                    {caja.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="primary"
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={cargarMatriz}
                disabled={cargando}
              >
                {cargando ? "Generando..." : "Actualizar vista previa"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={descargarExcel}
                disabled={descargando}
              >
                {descargando ? "Descargando..." : "Descargar Excel"}
              </Button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={() => {
                  setMes(now.getMonth() + 1);
                  setAnio(now.getFullYear());
                }}
              >
                Mes actual
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={mesAnterior}
              >
                Mes anterior
              </button>
            </div>
          </ComponentCard>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-3">
          <SummaryCard
            title="Caja inicial"
            value={money(data?.resumen.caja_inicial)}
            tone="gray"
            hint="Apertura real del primer turno mostrado"
          />
          <SummaryCard
            title="Total ingresos"
            value={money(data?.resumen.total_ingresos)}
            tone="green"
            hint="Ingresos operativos; no incluye caja inicial"
          />
          <SummaryCard
            title="Total egresos"
            value={money(data?.resumen.total_egresos)}
            tone="red"
            hint="Compras, gastos, pasivos y activos con efecto en caja"
          />
          <SummaryCard
            title="Saldo final del período"
            value={money(data?.resumen.saldo_final)}
            tone="emerald"
            hint="Saldo del último turno real mostrado"
          />
          <SummaryCard
            title="Ajustes sin caja"
            value={money(data?.resumen.total_ajustes_no_caja)}
            tone="gray"
            hint="Faltantes de producto, ventas a crédito y recuperaciones"
          />
          <SummaryCard
            title="Deudas con agentes"
            value={money(data?.resumen.total_deudas_agentes)}
            tone="gray"
            hint="Saldo pendiente informativo; no afecta la caja"
          />

          {data?.resumen.incluye_sesiones_abiertas && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300 sm:col-span-2">
              El período incluye turnos con caja abierta. El saldo final puede
              variar cuando se cierren.
            </div>
          )}

          {data && data.advertencias.length > 0 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300 sm:col-span-2">
              <p className="font-semibold">Advertencias del período</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {data.advertencias.map((advertencia) => (
                  <li key={advertencia}>{advertencia}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {data ? (
        <div className="space-y-6">
          <ComponentCard
            title={`Matriz ${data.periodo.etiqueta}`}
            desc="Montos en bolivianos (Bs). Ajustes agrupa movimientos sin efecto en caja; Total es el movimiento neto de la fila."
          >
            <TablaMatrizControl data={data} />
          </ComponentCard>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-white/[0.03]">
          <p className="text-gray-600 dark:text-gray-400">
            {cargando
              ? "Generando la matriz de control..."
              : "No se pudo cargar la matriz. Presione Actualizar vista previa."}
          </p>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({
  title,
  value,
  hint,
  tone,
}: {
  title: string;
  value: string;
  hint: string;
  tone: "gray" | "green" | "red" | "emerald";
}) => {
  const toneClass = {
    gray: "text-gray-800 dark:text-gray-100",
    green: "text-emerald-600 dark:text-emerald-400",
    red: "text-red-600 dark:text-red-400",
    emerald: "text-emerald-700 dark:text-emerald-300",
  }[tone];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</p>
      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">{hint}</p>
    </div>
  );
};

export default ReporteMatrizControl;
