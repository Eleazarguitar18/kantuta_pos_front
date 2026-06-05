import {
  BoxIconLine,
  GroupIcon,
} from "../../icons";

interface EcommerceMetricsProps {
  kpis: {
    ventas_hoy: number;
    recargas_hoy: number;
    ganancia_comisiones_hoy: number;
    productos_stock_bajo: number;
  };
}

export default function EcommerceMetrics({ kpis }: EcommerceMetricsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
      {/* Ventas Hoy */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <BoxIconLine className="text-blue-600 size-6 dark:text-blue-400" />
        </div>
        <div className="mt-5">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Ventas de Hoy
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            Bs. {Number(kpis.ventas_hoy).toFixed(2)}
          </h4>
        </div>
      </div>

      {/* Recargas Hoy */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl">
          <BoxIconLine className="text-green-600 size-6 dark:text-green-400" />
        </div>
        <div className="mt-5">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Venta de Recargas Hoy
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            Bs. {Number(kpis.recargas_hoy).toFixed(2)}
          </h4>
        </div>
      </div>

      {/* Comisiones Ganadas Hoy */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
          <GroupIcon className="text-indigo-600 size-6 dark:text-indigo-400" />
        </div>
        <div className="mt-5">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Ganancia por Comisiones Hoy
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            Bs. {Number(kpis.ganancia_comisiones_hoy).toFixed(2)}
          </h4>
        </div>
      </div>

      {/* Productos con Stock Bajo */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-xl">
          <BoxIconLine className="text-red-600 size-6 dark:text-red-400" />
        </div>
        <div className="mt-5">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Productos Stock Bajo
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {kpis.productos_stock_bajo}
          </h4>
        </div>
      </div>
    </div>
  );
}
