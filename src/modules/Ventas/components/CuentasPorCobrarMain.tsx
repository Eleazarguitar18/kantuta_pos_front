import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../components/auth/services/urlBase';
import PageBreadcrumb from '../../../components/common/PageBreadCrumb';
import ComponentCard from '../../../components/common/ComponentCard';
import Button from '../../../components/ui/button/Button';
import Label from '../../../components/form/Label';
import Select from '../../../components/form/Select';
import { useCaja } from '../../../context/CajaContext';
import { useAuth } from '../../../context/auth/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import Swal from 'sweetalert2';
import { DollarSign, CheckCircle2, Clock, UserCheck } from 'lucide-react';

interface CuentaPorCobrar {
  id: number;
  id_venta?: number;
  cliente_nombre: string;
  monto: number;
  estado_cuenta: 'PENDIENTE' | 'PAGADO';
  fecha_registro: string;
  fecha_pago?: string;
  metodo_pago_cancelacion?: string;
  venta?: {
    id: number;
    total: number;
    detalles?: Array<{
      cantidad: number;
      precio_unitario: number;
      producto?: { nombre: string };
    }>;
  };
}

export const CuentasPorCobrarMain: React.FC = () => {
  const [cuentas, setCuentas] = useState<CuentaPorCobrar[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCuenta, setSelectedCuenta] = useState<CuentaPorCobrar | null>(null);
  const [metodoCobro, setMetodoCobro] = useState<'EFECTIVO' | 'QR'>('EFECTIVO');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const { sesionActiva } = useCaja();
  const { user } = useAuth();
  const socket = useSocket();

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
  });

  const fetchCuentas = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/ventas/cuentas-por-cobrar/listar`, {
        headers: getHeaders(),
      });
      setCuentas(res.data);
    } catch (err) {
      console.error('Error al cargar cuentas por cobrar:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCuentas();
  }, [fetchCuentas]);

  useEffect(() => {
    const handleDataChanged = (data: { entity: string; action: string }) => {
      if (data.entity === 'venta' || data.entity === 'caja') {
        fetchCuentas();
      }
    };
    socket.on('dataChanged', handleDataChanged);
    return () => {
      socket.off('dataChanged', handleDataChanged);
    };
  }, [socket, fetchCuentas]);

  const handleOpenCobroModal = (cuenta: CuentaPorCobrar) => {
    if (!sesionActiva) {
      Swal.fire({
        icon: 'warning',
        title: 'Caja Requerida',
        text: 'Debe tener una sesión de caja abierta para registrar el cobro de la deuda.',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
    setSelectedCuenta(cuenta);
    setIsModalOpen(true);
  };

  const handleConfirmarCobro = async () => {
    if (!selectedCuenta || !sesionActiva) return;

    try {
      await axios.post(
        `${API_BASE_URL}/ventas/cuentas-por-cobrar/${selectedCuenta.id}/cobrar`,
        {
          id_sesion_caja: sesionActiva.id,
          metodo_pago: metodoCobro,
          id_user_update: user?.id || 0,
        },
        { headers: getHeaders() }
      );

      Swal.fire({
        icon: 'success',
        title: '¡Cobro Exitoso!',
        text: `Se ha registrado el pago de Bs. ${Number(selectedCuenta.monto).toFixed(2)} del cliente ${selectedCuenta.cliente_nombre}.`,
        timer: 2500,
        showConfirmButton: false,
      });

      setIsModalOpen(false);
      setSelectedCuenta(null);
      fetchCuentas();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al procesar el cobro.';
      Swal.fire({
        icon: 'error',
        title: 'Error al Cobrar',
        text: typeof msg === 'string' ? msg : JSON.stringify(msg),
      });
    }
  };

  const totalPendiente = cuentas
    .filter((c) => c.estado_cuenta === 'PENDIENTE')
    .reduce((sum, c) => sum + Number(c.monto), 0);

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Gestión de Cuentas por Cobrar (Ventas Fiadas)" />

      {/* Tarjeta resumen de totales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase">
              Total Cuentas Pendientes
            </p>
            <h3 className="text-2xl font-extrabold text-amber-900 dark:text-amber-300 mt-1">
              Bs. {totalPendiente.toFixed(2)}
            </h3>
          </div>
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-800/40 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase">
              Cantidad Fiados Pendientes
            </p>
            <h3 className="text-2xl font-extrabold text-blue-900 dark:text-blue-300 mt-1">
              {cuentas.filter((c) => c.estado_cuenta === 'PENDIENTE').length} registros
            </h3>
          </div>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800/40 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase">
              Cuentas Cobradas
            </p>
            <h3 className="text-2xl font-extrabold text-green-900 dark:text-green-300 mt-1">
              {cuentas.filter((c) => c.estado_cuenta === 'PAGADO').length} finalizadas
            </h3>
          </div>
          <div className="w-12 h-12 bg-green-100 dark:bg-green-800/40 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabla de cuentas por cobrar */}
      <ComponentCard title="Listado de Ventas a Crédito / Fiadas">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Cargando cuentas por cobrar...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente / Deudor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalle Productos</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Emisión</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {cuentas.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200">#{c.id}</td>
                    <td className="px-4 py-3 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {c.cliente_nombre}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {c.venta?.detalles
                        ? c.venta.detalles.map((d) => `${d.cantidad}x ${d.producto?.nombre || 'Prod'}`).join(', ')
                        : 'Venta #' + c.id_venta}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-extrabold text-gray-900 dark:text-gray-100">
                      Bs. {Number(c.monto).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(c.fecha_registro).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          c.estado_cuenta === 'PENDIENTE'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                      >
                        {c.estado_cuenta === 'PENDIENTE' ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        {c.estado_cuenta}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {c.estado_cuenta === 'PENDIENTE' ? (
                        <Button
                          variant="primary"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 font-bold rounded-lg shadow-sm flex items-center justify-center gap-1 mx-auto"
                          onClick={() => handleOpenCobroModal(c)}
                        >
                          <DollarSign className="w-4 h-4" />
                          Cobrar / Cancelar Deuda
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">
                          Pagado ({c.metodo_pago_cancelacion || 'Efectivo'})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {cuentas.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No hay registros de cuentas por cobrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </ComponentCard>

      {/* Modal para Procesar Cobro */}
      {isModalOpen && selectedCuenta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-600" />
              Cancelar Deuda - Cuenta #{selectedCuenta.id}
            </h3>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-2 text-sm">
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-white">Cliente:</span> {selectedCuenta.cliente_nombre}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-white">Monto a Cobrar:</span>{' '}
                <span className="text-emerald-600 font-extrabold text-base">Bs. {Number(selectedCuenta.monto).toFixed(2)}</span>
              </p>
            </div>

            <div>
              <Label>Forma de Pago del Cobro</Label>
              <Select
                options={[
                  { value: 'EFECTIVO', label: 'Efectivo (Ingresa al saldo de caja)' },
                  { value: 'QR', label: 'Pago QR / Transferencia' },
                ]}
                onChange={(v) => setMetodoCobro(v as 'EFECTIVO' | 'QR')}
                defaultValue={metodoCobro}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="w-1/2" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                onClick={handleConfirmarCobro}
              >
                Confirmar Cobro
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CuentasPorCobrarMain;
