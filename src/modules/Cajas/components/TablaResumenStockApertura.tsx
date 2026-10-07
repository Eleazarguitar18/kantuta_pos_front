import React, { useEffect, useState, useMemo } from "react";
import { Package, AlertCircle } from "lucide-react";
import { CajasService } from "../services/cajasService";

export interface ItemStock {
  id: number;
  nombre: string;
  stockSistema: number;
  stockFisico: number;
  diferencia: number;
}

interface Props {
  onStockChange: (items: ItemStock[], observacionGenerada: string) => void;
  disabled?: boolean;
}

const TablaResumenStockApertura: React.FC<Props> = ({ onStockChange, disabled = false }) => {
  const [items, setItems] = useState<ItemStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    CajasService.getEstadoInventario()
      .then((res) => {
        const rawItems = Array.isArray(res?.data) ? res.data : [];
        const mapped = rawItems.map((item: any) => ({
          id: item.id,
          nombre: item.nombre,
          stockSistema: item.stockSistema ?? item.stock_actual ?? 0,
          stockFisico: item.stockSistema ?? item.stock_actual ?? 0, // initially assumes matched
          diferencia: 0,
        }));
        setItems(mapped);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    
    // Generate observation string
    const faltantes = items.filter(i => i.diferencia < 0);
    const sobrantes = items.filter(i => i.diferencia > 0);
    
    let obs = "";
    if (faltantes.length > 0) {
      obs += "Faltantes(Stock): " + faltantes.map(f => `${Math.abs(f.diferencia)} ${f.nombre}`).join(", ") + ". ";
    }
    if (sobrantes.length > 0) {
      obs += "Sobrantes(Stock): " + sobrantes.map(s => `${s.diferencia} ${s.nombre}`).join(", ") + ". ";
    }
    
    onStockChange(items, obs.trim());
  }, [items, loading]);

  const handleMontoChange = (id: number, valStr: string) => {
    setItems((prev) => 
      prev.map(item => {
        if (item.id === id) {
          const num = valStr === "" ? 0 : parseInt(valStr, 10) || 0;
          return {
            ...item,
            stockFisico: num >= 0 ? num : 0,
            diferencia: (num >= 0 ? num : 0) - item.stockSistema
          };
        }
        return item;
      })
    );
  };

  if (loading) return <div className="text-sm text-gray-500 p-4">Cargando inventario...</div>;
  if (error) return <div className="text-sm text-red-500 p-4">Error al cargar inventario para el arqueo.</div>;
  if (items.length === 0) return null; // Or return a message if needed

  return (
    <div className="bg-white dark:bg-gray-800 p-0 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mt-4">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Package className="w-5 h-5 text-emerald-500" />
          Resumen de Stock e Inventario
        </h4>
        <p className="text-xs text-gray-500 mt-1">
          Verifique el stock físico. Si encuentra diferencias, cambie el valor en "Stock Físico".
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-400">Producto</th>
              <th className="px-4 py-2 text-center font-semibold text-gray-600 dark:text-gray-400">Stock Sist.</th>
              <th className="px-4 py-2 text-center font-semibold text-gray-600 dark:text-gray-400 w-32">Stock Físico</th>
              <th className="px-4 py-2 text-center font-semibold text-gray-600 dark:text-gray-400">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((item) => {
              const hayFaltante = item.diferencia < 0;
              const haySobrante = item.diferencia > 0;
              return (
                <tr key={item.id} className={hayFaltante ? "bg-red-50 dark:bg-red-900/10" : haySobrante ? "bg-blue-50 dark:bg-blue-900/10" : ""}>
                  <td className="px-4 py-2 text-gray-800 dark:text-gray-300 font-medium">
                    {item.nombre}
                  </td>
                  <td className="px-4 py-2 text-center text-gray-600 dark:text-gray-400 font-bold">
                    {item.stockSistema}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="number"
                      min="0"
                      className={`w-20 text-center rounded-md border py-1 px-2 text-sm outline-none focus:ring-2 ${
                        hayFaltante 
                          ? "border-red-300 focus:ring-red-500/20 text-red-700 bg-red-50" 
                          : haySobrante 
                          ? "border-blue-300 focus:ring-blue-500/20 text-blue-700 bg-blue-50" 
                          : "border-gray-300 focus:ring-emerald-500/20 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      }`}
                      value={item.stockFisico === 0 && item.stockSistema > 0 && item.stockFisico !== 0 ? "" : item.stockFisico} // bit hacky to show placeholder, let's just use value
                      onChange={(e) => handleMontoChange(item.id, e.target.value)}
                      disabled={disabled}
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    {item.diferencia === 0 ? (
                      <span className="inline-flex items-center text-emerald-600 text-[11px] font-bold">✅ OK</span>
                    ) : (
                      <span className={`inline-flex flex-col items-center text-[11px] font-bold ${hayFaltante ? 'text-red-600' : 'text-blue-600'}`}>
                        {hayFaltante ? '🔴 FALTANTE' : '🔵 SOBRANTE'}
                        <span className="text-xs">
                          ({item.diferencia > 0 ? "+" : ""}{item.diferencia})
                        </span>
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablaResumenStockApertura;