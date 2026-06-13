import React from 'react';
import { OperadoraSaldo, OperadoraNombre } from '../types';

interface SaldosCardsProps {
  saldos: OperadoraSaldo[];
}

export const SaldosCards: React.FC<SaldosCardsProps> = ({ saldos }) => {
  const getCardStyle = (operadora: OperadoraNombre) => {
    switch (operadora) {
      case OperadoraNombre.TIGO:
        return 'bg-blue-600 text-white';
      case OperadoraNombre.ENTEL:
        return 'bg-orange-500 text-white';
      case OperadoraNombre.VIVA:
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const operadorasConfig = [
    OperadoraNombre.TIGO,
    OperadoraNombre.ENTEL,
    OperadoraNombre.VIVA
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {operadorasConfig.map(op => {
        const saldoData = saldos.find(s => s.nombre_operadora === op);
        const saldoValue = saldoData ? Number(saldoData.saldo_actual).toFixed(2) : '0.00';
        
        return (
          <div key={op} className={`rounded-xl shadow-lg p-6 flex flex-col justify-between transition-transform transform hover:-translate-y-1 ${getCardStyle(op)}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold uppercase tracking-wider">{op}</h3>
              <svg className="w-8 h-8 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <p className="text-sm opacity-80 mb-1">Saldo Disponible</p>
              <p className="text-3xl font-extrabold flex items-baseline">
                <span className="text-lg mr-1 tracking-normal font-medium">Bs.</span>
                {saldoValue}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
