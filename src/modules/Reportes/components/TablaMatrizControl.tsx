import type { ReactNode } from "react";
import {
  MatrizControlData,
  MatrizControlFila,
} from "../interfaces/MatrizControl";

const decimal = new Intl.NumberFormat("es-BO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatAmount = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "—";
  return decimal.format(Number(value || 0));
};

const formatCell = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "—";
  if (Number(value) === 0) return "—";
  return decimal.format(Number(value));
};

const valueClass = (value: number): string =>
  value < 0
    ? "text-red-600 dark:text-red-400"
    : "text-gray-700 dark:text-gray-300";

const firstCellBase =
  "sticky left-0 z-10 px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300";

const amountCellClass =
  "whitespace-nowrap px-3 py-2 text-right text-xs tabular-nums";

const headerCellClass =
  "border-b border-gray-200 bg-gray-50 px-3 py-2 text-center text-[11px] font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200";

const firstCellBackground = (fila: MatrizControlFila): string => {
  if (fila.tipo === "saldo") {
    return "bg-emerald-50 dark:bg-gray-900";
  }
  if (fila.tipo === "total") {
    return "bg-amber-50 dark:bg-gray-900";
  }
  if (fila.tipo === "caja") {
    return "bg-slate-50 dark:bg-gray-900";
  }
  return "bg-white dark:bg-gray-900";
};

const rowClass = (fila: MatrizControlFila): string => {
  if (fila.tipo === "saldo") {
    return "border-b border-emerald-200 bg-emerald-50 font-bold dark:border-gray-700 dark:bg-emerald-900/20";
  }
  if (fila.tipo === "total") {
    return "border-b border-amber-200 bg-amber-50 font-bold dark:border-gray-700 dark:bg-amber-900/20";
  }
  if (fila.tipo === "caja") {
    return "border-b border-gray-200 bg-slate-50 font-semibold dark:border-gray-700 dark:bg-white/[0.04]";
  }
  return "border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]";
};

const TablaMatrizControl = ({ data }: { data: MatrizControlData }) => {
  const renderFila = (fila: MatrizControlFila) => {
    const esTotal = fila.tipo === "total";
    const esSaldo = fila.tipo === "saldo";
    const esCaja = fila.tipo === "caja";
    const resaltada = esTotal || esSaldo || esCaja;

    return (
      <tr key={fila.key} className={rowClass(fila)}>
        <td
          className={`${firstCellBase} ${firstCellBackground(fila)}`}
          title={fila.detalle}
        >
          {fila.label}
        </td>
        {data.columnas.map((columna, index) => {
          const value = fila.valores[index];
          const texto = columna.vacia
            ? ""
            : resaltada
              ? formatAmount(value)
              : formatCell(value);

          return (
            <td
              key={`${fila.key}-${index}`}
              className={`${amountCellClass} ${
                resaltada ? "text-gray-900 dark:text-white" : valueClass(value)
              }`}
            >
              {texto}
            </td>
          );
        })}
        <td
          className={`${amountCellClass} ${
            Number(fila.ajuste || 0) !== 0
              ? "text-gray-700 dark:text-gray-300"
              : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {!esCaja && !esSaldo && Number(fila.ajuste || 0) !== 0
            ? formatAmount(fila.ajuste)
            : "—"}
        </td>
        <td
          className={`${amountCellClass} ${
            !esCaja && !esSaldo && fila.total !== null
              ? "font-semibold text-gray-900 dark:text-white"
              : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {!esCaja && !esSaldo && fila.total !== null
            ? formatAmount(fila.total)
            : "—"}
        </td>
      </tr>
    );
  };

  if (
    data.columnas.length === 0 &&
    (!data.deudas_agentes || data.deudas_agentes.filas.length === 0)
  ) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-white/[0.02] dark:text-gray-400">
        No hay turnos de caja registrados para el período seleccionado.
      </div>
    );
  }

  return (
    <div className="max-h-[75vh] overflow-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="min-w-max w-full border-collapse text-sm">
        <thead className="sticky top-0 z-20">
          <tr>
            <th
              rowSpan={2}
              className={`${headerCellClass} sticky left-0 z-30 min-w-[280px] text-left`}
            >
              Concepto
            </th>
            {data.columnas.map((columna) => {
              const horario = columna.hora_apertura
                ? `${columna.hora_apertura}${
                    columna.hora_cierre
                      ? ` - ${columna.hora_cierre}`
                      : " - actual"
                  }`
                : "";

              return (
                <th
                  key={`operador-${columna.indice}`}
                  className={`${headerCellClass} min-w-[125px] align-middle ${
                    columna.vacia ? "opacity-60" : ""
                  }`}
                >
                  <div className="font-semibold text-gray-800 dark:text-gray-100">
                    {columna.etiqueta_operador}
                  </div>
                  {columna.vacia ? (
                    <div className="mt-0.5 text-[10px] font-normal text-gray-400 dark:text-gray-500">
                      Sin turno
                    </div>
                  ) : (
                    <>
                      <div className="mt-0.5 text-[10px] font-normal text-gray-600 dark:text-gray-300">
                        {columna.operador || "Sin operador"}
                      </div>
                      <div className="text-[10px] font-normal text-gray-500 dark:text-gray-400">
                        {columna.caja || "Sin caja"}
                      </div>
                      <div className="text-[10px] font-normal text-gray-500 dark:text-gray-400">
                        {horario}
                      </div>
                    </>
                  )}
                </th>
              );
            })}
            <th
              rowSpan={2}
              className={`${headerCellClass} min-w-[90px] align-middle`}
            >
              Ajustes
            </th>
            <th
              rowSpan={2}
              className={`${headerCellClass} min-w-[110px] align-middle`}
            >
              Total
            </th>
          </tr>
          <tr>
            {data.columnas.map((columna) => (
              <th
                key={`dia-${columna.indice}`}
                className={`${headerCellClass} text-[10px] font-medium ${
                  columna.vacia ? "opacity-60" : ""
                }`}
              >
                Día {columna.dia}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {renderFila(data.caja)}

          {data.secciones
            .filter((seccion) => seccion.filas.length > 0)
            .map((seccion) => (
              <FragmentSection
                key={seccion.key}
                label={seccion.label}
                filas={seccion.filas}
                total={seccion.total}
                columnas={data.columnas.length}
                renderFila={renderFila}
              />
            ))}

          {renderFila(data.saldo)}

          {data.deudas_agentes &&
            data.deudas_agentes.filas.length > 0 && (
              <FragmentSection
                key={data.deudas_agentes.key}
                label={data.deudas_agentes.label}
                filas={data.deudas_agentes.filas}
                total={data.deudas_agentes.total}
                columnas={data.columnas.length}
                renderFila={renderFila}
              />
            )}
        </tbody>
      </table>
    </div>
  );
};

const FragmentSection = ({
  label,
  filas,
  total,
  columnas,
  renderFila,
}: {
  label: string;
  filas: MatrizControlFila[];
  total: MatrizControlFila;
  columnas: number;
  renderFila: (fila: MatrizControlFila) => ReactNode;
}) => (
  <>
    <tr>
      <td
        colSpan={columnas + 3}
        className="sticky left-0 bg-slate-100 px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:bg-gray-800 dark:text-slate-200"
      >
        {label}
      </td>
    </tr>
    {filas.map(renderFila)}
    {renderFila(total)}
  </>
);

export default TablaMatrizControl;
