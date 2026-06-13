import React, { useState, useEffect } from 'react';
import { SaldosCards } from '../components/SaldosCards';
import { FormRecargaCliente } from '../components/FormRecargaCliente';
import { FormInyeccionMayorista } from '../components/FormInyeccionMayorista';
import { RecargasService } from '../api/RecargasService';
import { OperadoraSaldo } from '../types';
import { useCaja } from '../../../context/CajaContext';

export default function RecargasOperacion() {
  const [saldos, setSaldos] = useState<OperadoraSaldo[]>([]);
  const { sesionActiva } = useCaja();
  
  // Find open session
  const idCajaSesion = sesionActiva?.id || null;

  const loadSaldos = async () => {
    try {
      const data = await RecargasService.getSaldos();
      setSaldos(data);
    } catch (err) {
      console.error("Error al cargar saldos:", err);
    }
  };

  useEffect(() => {
    loadSaldos();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Panel de Operaciones de Recargas</h1>
        <p className="text-gray-500 mt-1">Gestiona las recargas de clientes y el fondeo de operadoras.</p>
      </div>

      {!idCajaSesion && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 font-medium">
                Atención: No tienes una sesión de caja abierta. Abre tu caja en el menú de Cajas para poder realizar transacciones.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas de Saldo */}
      <SaldosCards saldos={saldos} />

      {/* Formularios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <FormRecargaCliente 
          onSuccess={loadSaldos} 
          idCajaSesion={idCajaSesion} 
        />
        
        <FormInyeccionMayorista 
          onSuccess={loadSaldos} 
          idCajaSesion={idCajaSesion} 
        />
      </div>
    </div>
  );
}
