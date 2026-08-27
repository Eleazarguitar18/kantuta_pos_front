import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../components/auth/services/urlBase';
import PageBreadcrumb from '../../../components/common/PageBreadCrumb';
import ComponentCard from '../../../components/common/ComponentCard';
import Button from '../../../components/ui/button/Button';
import Label from '../../../components/form/Label';
import Input from '../../../components/form/input/InputField';
import { useCaja } from '../../../context/CajaContext';
import { useAuth } from '../../../context/auth/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import Swal from 'sweetalert2';
import { HandCoins, ArrowDownRight, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';

interface PrestamoCaja {
  id: number;
  monto: number;
  motivo: string;
  estado_prestamo: 'PENDIENTE' | 'PAGADO';
  fecha_prestamo: string;
  fecha_devolucion?: string;
  id_sesion_caja: number;
}

export const PrestamosMain: React.FC = () => {
  const [prestamos, setPrestamos] = useState<PrestamoCaja[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form state
  const [monto, setMonto] = useState<number>(0);
  const [motivo, setMotivo] = useState<string>('');

  const { sesionActiva } = useCaja();
  const { user } = useAuth();
  const socket = useSocket();

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
  });

  const fetchPrestamos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/cajas/prestamos/listar`, {
        headers: getHeaders(),
      });
      setPrestamos(res.data);
    } catch (err) {
      console.error('Error al cargar préstamos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrestamos();
  }, [fetchPrestamos]);

  useEffect(() => {
    const handleDataChanged = (data: { entity: string; action: string }) => {
      if (data.entity === 'caja') {
        fetchPrestamos();
      }
    };
    socket.on('dataChanged', handleDataChanged);
    return () => {
      socket.off('dataChanged', handleDataChanged);
    };
  }, [socket, fetchPrestamos]);

  const handleCrearPrestamo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sesionActiva) {
      Swal.fire({
        icon: 'warning',
        title: 'Caja Cerrada',
        text: 'Debe abrir una sesión de caja para registrar egresos o préstamos.',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    if (monto <= 0 || !motivo.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos Incompletos',
        text: 'Ingrese un monto válido y una justificación / motivo obligatorio.',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/cajas/prestamos`,
        {
          id_sesion_caja: sesionActiva.id,
          monto: Number(monto),
          motivo: motivo.trim(),
          id_user_create: user?.id || 0,
        },
        { headers: getHeaders() }
      );

      Swal.fire({
        icon: 'success',
        title: 'Préstamo Registrado',
        text: `Se retiraron Bs. ${Number(monto).toFixed(2)} de la caja activa.`,
        timer: 2000,
        showConfirmButton: false,
      });

      setMonto(0);
      setMotivo('');
      fetchPrestamos();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al registrar el préstamo.';
      Swal.fire({
        icon: 'error',
        title: 'Error al Registrar',
        text: typeof msg === 'string' ? msg : JSON.stringify(msg),
      });
    }
  };

  const handleDevolverPrestamo = async (prestamo: PrestamoCaja) => {
    if (!sesionActiva) {
      Swal.fire({
        icon: 'warning',
        title: 'Caja Cerrada',
        text: 'Debe tener una sesión de caja abierta para recibir la devolución del dinero.',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    const confirm = await Swal.fire({
      title: '¿Confirmar Devolución?',
      text: `¿Confirma la devolución de Bs. ${Number(prestamo.monto).toFixed(2)} a la caja activa?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, registrar devolución',
      cancelButtonText: 'Cancelar',
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.post(
        `${API_BASE_URL}/cajas/prestamos/${prestamo.id}/pagar`,
        {
          id_sesion_caja: sesionActiva.id,
          id_user_update: user?.id || 0,
        },
        { headers: getHeaders() }
      );

      Swal.fire({
        icon: 'success',
        title: 'Devolución Exitosa',
        text: `Se reingresó Bs. ${Number(prestamo.monto).toFixed(2)} al saldo de la caja activa.`,
        timer: 2500,
        showConfirmButton: false,
      });

      fetchPrestamos();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al devolver el dinero.';
      Swal.fire({
        icon: 'error',
        title: 'Error al Devolver',
        text: typeof msg === 'string' ? msg : JSON.stringify(msg),
      });
    }
  };

  const totalPrestadoPendiente = prestamos
    .filter((p) => p.estado_prestamo === 'PENDIENTE')
    .reduce((sum, p) => sum + Number(p.monto), 0);

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Gestión de Préstamos y Salidas de Caja" />

      {/* Seccion superior: Formulario + Resumen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de registro */}
        <div className="lg:col-span-2">
          <ComponentCard title="Registrar Retiro / Préstamo de Caja">
            <form onSubmit={handleCrearPrestamo} className="space-y-4">
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
                <p className="text-xs text-orange-700 dark:text-orange-400">
                  <span className="font-semibold">Atención:</span> Los retiros de dinero reducirán de forma directa el saldo de la caja física activa. Es obligatorio ingresar la justificación.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Monto a Retirar (Bs.) *</Label>
                  <Input
                    type="number"
                    step={0.10}
                    min="0.10"
                    placeholder="0.00"
                    value={monto || ''}
                    onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
                    disabled={!sesionActiva}
                  />
                </div>
                <div>
                  <Label>Motivo / Justificación *</Label>
                  <Input
                    type="text"
                    placeholder="Ej. Préstamo a empleado / Gastos de movilidad"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    disabled={!sesionActiva}
                  />
                </div>
              </div>

              <Button
                variant="primary"
                className={`w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold py-3 ${
                  !sesionActiva ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => handleCrearPrestamo()}
                disabled={!sesionActiva}
              >
                <ArrowDownRight className="w-5 h-5 mr-1" />
                Registrar Salida de Efectivo
              </Button>
            </form>
          </ComponentCard>
        </div>

        {/* Resumen lateral */}
        <div className="space-y-4">
          <div className="p-5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase">
                  Préstamos Activos
                </p>
                <h3 className="text-2xl font-extrabold text-orange-900 dark:text-orange-300 mt-1">
                  Bs. {totalPrestadoPendiente.toFixed(2)}
                </h3>
              </div>
              <HandCoins className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-xs text-orange-600 mt-2">
              {prestamos.filter((p) => p.estado_prestamo === 'PENDIENTE').length} devoluciones pendientes
            </p>
          </div>

          <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase">
                  Préstamos Devueltos
                </p>
                <h3 className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-300 mt-1">
                  {prestamos.filter((p) => p.estado_prestamo === 'PAGADO').length} devueltos
                </h3>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de préstamos */}
      <ComponentCard title="Historial de Préstamos y Salidas de Caja">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Cargando lista de préstamos...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Préstamo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo / Justificación</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto Retirado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {prestamos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200">#{p.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(p.fecha_prestamo).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200 max-w-xs">
                      {p.motivo}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-extrabold text-orange-600 dark:text-orange-400">
                      Bs. {Number(p.monto).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          p.estado_prestamo === 'PENDIENTE'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }`}
                      >
                        {p.estado_prestamo === 'PENDIENTE' ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        {p.estado_prestamo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.estado_prestamo === 'PENDIENTE' ? (
                        <Button
                          variant="primary"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 font-bold rounded-lg shadow-sm flex items-center justify-center gap-1 mx-auto"
                          onClick={() => handleDevolverPrestamo(p)}
                        >
                          <ArrowUpRight className="w-4 h-4" />
                          Pagar / Devolver Dinero
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">
                          Devuelto ({p.fecha_devolucion ? new Date(p.fecha_devolucion).toLocaleDateString() : 'OK'})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {prestamos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No hay préstamos ni salidas de caja registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </ComponentCard>
    </div>
  );
};

export default PrestamosMain;
