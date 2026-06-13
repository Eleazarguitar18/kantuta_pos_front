import React, { useState } from 'react';
import { OperadoraNombre, CreateInyeccionDto } from '../types';
import { RecargasService } from '../api/RecargasService';
import { useRecargasAlerts } from '../hooks/useRecargasAlerts';

interface FormInyeccionMayoristaProps {
  onSuccess: () => void;
  idCajaSesion: number | null;
}

export const FormInyeccionMayorista: React.FC<FormInyeccionMayoristaProps> = ({ onSuccess, idCajaSesion }) => {
  const [formData, setFormData] = useState<CreateInyeccionDto>({
    operadora_destino: '',
    monto: 0,
    id_caja_sesion: idCajaSesion || 0
  });
  const [loading, setLoading] = useState(false);
  const { confirmInyeccionMayorista, showSuccess, showError } = useRecargasAlerts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCajaSesion) {
      showError("No tienes una sesión de caja abierta.");
      return;
    }

    const confirmed = await confirmInyeccionMayorista(formData.operadora_destino, formData.monto);
    if (!confirmed) return;
    
    setLoading(true);
    try {
      await RecargasService.createInyeccion({ ...formData, id_caja_sesion: idCajaSesion });
      onSuccess();
      setFormData({ operadora_destino: '', monto: 0, id_caja_sesion: idCajaSesion });
      showSuccess("Inyección registrada con éxito");
    } catch (err: any) {
      showError(err.response?.data?.message || "Error al realizar la inyección");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-bl-lg">
        EGRESO DE CAJA
      </div>
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Inyectar Saldo (Mayorista)</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Operadora Destino</label>
          <select 
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.operadora_destino}
            onChange={(e) => setFormData({...formData, operadora_destino: e.target.value as OperadoraNombre})}
            required
            disabled={!idCajaSesion}
          >
            <option value="" disabled>Seleccione una operadora</option>
            <option value={OperadoraNombre.TIGO}>Tigo</option>
            <option value={OperadoraNombre.ENTEL}>Entel</option>
            <option value={OperadoraNombre.VIVA}>Viva</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monto a Inyectar (Bs.)</label>
          <input 
            type="number" 
            step="1"
            min="10"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
            value={formData.monto || ''}
            onChange={(e) => setFormData({...formData, monto: Number(e.target.value)})}
            required
            disabled={!idCajaSesion}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || !idCajaSesion}
          className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Procesando...' : 'Registrar Inyección'}
        </button>
      </form>
    </div>
  );
};
