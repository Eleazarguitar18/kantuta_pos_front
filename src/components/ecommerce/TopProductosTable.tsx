interface TopProductosTableProps {
  data: { nombre: string; cantidad: number; ganancia: number }[];
}

export default function TopProductosTable({ data }: TopProductosTableProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
        Top 5 Productos más Vendidos
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="py-3 text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">Producto</th>
              <th className="py-3 text-xs font-semibold text-gray-500 uppercase dark:text-gray-400 text-center">Cant. Vendida</th>
              <th className="py-3 text-xs font-semibold text-gray-500 uppercase dark:text-gray-400 text-right">Ganancia Generada</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-6 text-center text-sm text-gray-400">
                  No hay datos de ventas registrados.
                </td>
              </tr>
            ) : (
              data.map((prod, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-800/40 last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                  <td className="py-3 text-sm font-medium text-gray-800 dark:text-white/90 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 text-xs font-semibold">
                      {index + 1}
                    </span>
                    {prod.nombre}
                  </td>
                  <td className="py-3 text-sm text-gray-600 dark:text-gray-400 text-center">{prod.cantidad}</td>
                  <td className="py-3 text-sm font-semibold text-gray-900 dark:text-white text-right">Bs. {Number(prod.ganancia).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
