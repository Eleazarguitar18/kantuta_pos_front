import React, { useEffect, useState } from 'react';
import { RecargasService } from '../api/RecargasService';
import { InyeccionOperadora, OperadoraNombre } from '../types';

export default function RecargasHistorialInyecciones() {
  const [historial, setHistorial] = useState<InyeccionOperadora[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const data = await RecargasService.getHistorialInyecciones();
        setHistorial(data);
      } catch (err) {
        console.error("Error al cargar historial:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistorial();
  }, []);

  const getBadgeColor = (operadora: OperadoraNombre) => {
    switch (operadora) {
      case OperadoraNombre.TIGO: return 'bg-blue-100 text-blue-800';
      case OperadoraNombre.ENTEL: return 'bg-orange-100 text-orange-800';
      case OperadoraNombre.VIVA: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Historial de Fondeos (Inyecciones)</h1>
        <p className="text-gray-500 mt-1">Auditoría de ingresos de saldo mayorista a las líneas operadoras desde las cajas físicas.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Fecha y Hora</th>
                <th className="px-6 py-4">Operadora Destino</th>
                <th className="px-6 py-4">Monto Inyectado (Bs.)</th>
                <th className="px-6 py-4">ID Sesión Caja (Origen)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center">Cargando...</td></tr>
              ) : historial.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-4 text-center">No hay registros de inyecciones.</td></tr>
              ) : (
                historial.map((item) => (
                  <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(item.fecha_hora).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-medium text-xs ${getBadgeColor(item.operadora_destino)}`}>
                        {item.operadora_destino}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {Number(item.monto).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {item.id_caja_origen}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
