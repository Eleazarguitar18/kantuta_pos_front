import React, { useState } from 'react';
import { OperadoraNombre, CreateRecargaClienteDto } from '../types';
import { RecargasService } from '../api/RecargasService';
import { useRecargasAlerts } from '../hooks/useRecargasAlerts';

interface FormRecargaClienteProps {
  onSuccess: () => void;
  idCajaSesion: number | null;
}

export const FormRecargaCliente: React.FC<FormRecargaClienteProps> = ({ onSuccess, idCajaSesion }) => {
  const [formData, setFormData] = useState<CreateRecargaClienteDto>({
    operadora: '',
    numero_cliente: '',
    monto: 0,
    id_caja_sesion: idCajaSesion || 0
  });
  const [loading, setLoading] = useState(false);
  const { confirmRecargaCliente, showSuccess, showError } = useRecargasAlerts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCajaSesion) {
      showError("No tienes una sesión de caja abierta.");
      return;
    }
    
    // Validar con SweetAlert2
    const confirmed = await confirmRecargaCliente(formData.operadora, formData.numero_cliente, formData.monto);
    if (!confirmed) return;

    setLoading(true);
    try {
      await RecargasService.createRecargaCliente({ ...formData, id_caja_sesion: idCajaSesion });
      onSuccess();
      setFormData({ operadora: '', numero_cliente: '', monto: 0, id_caja_sesion: idCajaSesion });
      showSuccess("Recarga realizada con éxito");
    } catch (err: any) {
      showError(err.response?.data?.message || "Error al realizar la recarga");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Vender Saldo a Cliente</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Operadora</label>
          <select 
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={formData.operadora}
            onChange={(e) => setFormData({...formData, operadora: e.target.value as OperadoraNombre})}
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Número de Celular</label>
          <input 
            type="text" 
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ej: 78945612"
            value={formData.numero_cliente}
            onChange={(e) => setFormData({...formData, numero_cliente: e.target.value})}
            pattern="[0-9]{8}"
            title="Debe contener 8 dígitos numéricos"
            required
            disabled={!idCajaSesion}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monto (Bs.)</label>
          <input 
            type="number" 
            step="0.10"
            min="1"
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Procesando...' : 'Confirmar Recarga'}
        </button>
      </form>
    </div>
  );
};
