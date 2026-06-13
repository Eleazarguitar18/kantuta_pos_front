import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import toast from 'react-hot-toast';

const MySwal = withReactContent(Swal);

export const useRecargasAlerts = () => {
  const confirmRecargaCliente = async (operadora: string, numero: string, monto: number): Promise<boolean> => {
    const result = await MySwal.fire({
      title: '¿Confirmar Recarga?',
      html: `
        <div class="text-left">
          <p class="mb-2">Vas a enviar saldo a un cliente con los siguientes detalles:</p>
          <ul class="list-disc list-inside text-gray-700 bg-gray-50 p-3 rounded-lg">
            <li><strong>Operadora:</strong> ${operadora}</li>
            <li><strong>Número:</strong> ${numero}</li>
            <li><strong>Monto:</strong> Bs. ${monto.toFixed(2)}</li>
          </ul>
          <p class="mt-4 text-sm text-gray-500">Esta acción descontará dinero virtual y registrará un ingreso en caja.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, enviar recarga',
      cancelButtonText: 'Cancelar'
    });
    return result.isConfirmed;
  };

  const confirmInyeccionMayorista = async (operadora: string, monto: number): Promise<boolean> => {
    const result = await MySwal.fire({
      title: '¡ATENCIÓN! Egreso de Caja',
      html: `
        <div class="text-left">
          <p class="mb-2 text-red-600 font-semibold">Esta operación generará un EGRESO automático en tu caja.</p>
          <ul class="list-disc list-inside text-gray-700 bg-red-50 p-3 rounded-lg border border-red-100">
            <li><strong>Operadora a Fondear:</strong> ${operadora}</li>
            <li><strong>Monto a Inyectar:</strong> Bs. ${monto.toFixed(2)}</li>
          </ul>
          <p class="mt-4 font-medium text-gray-800">¿Estás seguro de registrar esta inyección de efectivo?</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, confirmar egreso',
      cancelButtonText: 'Cancelar'
    });
    return result.isConfirmed;
  };

  const showSuccess = (message: string) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#10b981',
        color: '#fff',
        fontWeight: 'bold',
      },
    });
  };

  const showError = (message: string) => {
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#ef4444',
        color: '#fff',
        fontWeight: 'bold',
      },
    });
  };

  return {
    confirmRecargaCliente,
    confirmInyeccionMayorista,
    showSuccess,
    showError
  };
};
