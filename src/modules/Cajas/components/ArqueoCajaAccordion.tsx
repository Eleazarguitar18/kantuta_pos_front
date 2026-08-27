import React, { useState, useEffect, useMemo } from 'react';
import Button from '../../../components/ui/button/Button';
import Input from '../../../components/form/input/InputField';
import Label from '../../../components/form/Label';
import { ChevronDown, ChevronUp, DollarSign, Smartphone, CreditCard, Cpu, ShoppingBag, User, Clock, Calendar } from 'lucide-react';
import { CajasService } from '../services/cajasService';
import { useAuth } from '../../../context/auth/AuthContext';

export interface ProductoEstado {
  id: number;
  nombre: string;
  codigo_barras?: string;
  precio_venta: number;
  stockSistema: number;
  stock_actual?: number;
  categoria: string;
  tipo?: 'FISICO' | 'SALDO_VIRTUAL';
}

interface ArqueoCajaAccordionProps {
  modo?: 'apertura' | 'cierre';
  teoricoCalculado: number;
  totalIngresos?: number;
  totalEgresos?: number;
  onConfirmarCierre?: (montoFinalReal: number, desgloseArqueo: any) => void;
  onConfirmar?: (montoFinalReal: number, desgloseArqueo: any) => void;
  onCancelar?: () => void;
}

export const formatMonto = (val: any): string => {
  const num = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

export const ArqueoCajaAccordion: React.FC<ArqueoCajaAccordionProps> = ({
  modo = 'cierre',
  teoricoCalculado,
  totalIngresos = 0,
  totalEgresos = 0,
  onConfirmarCierre,
  onConfirmar,
  onCancelar,
}) => {
  const { user } = useAuth();
  const fechaActual = useMemo(() => new Date().toLocaleDateString('es-BO'), []);
  const horaActual = useMemo(() => new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }), []);

  // 1. Efectivo Global en Caja (sin desglose de billetes, parseo defensivo a number)
  const [efectivoTotal, setEfectivoTotal] = useState<number>(Number(teoricoCalculado) || 0);

  // Estado de acordeones principales
  const [openSections, setOpenSections] = useState({
    tarjetas: true,
    chips: true,
    plataformas: true,
    accesorios: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Sub-acordeones de accesorios
  const [openAccGrupos, setOpenAccGrupos] = useState({
    cargadores: true,
    audifonos: true,
    cables: true,
    otros: false,
  });

  const toggleAccGrupo = (grupo: keyof typeof openAccGrupos) => {
    setOpenAccGrupos((prev) => ({ ...prev, [grupo]: !prev[grupo] }));
  };

  // Base de datos de inventario
  const [productosBD, setProductosBD] = useState<ProductoEstado[]>([]);
  const [conteoFisico, setConteoFisico] = useState<Record<string, number>>({});

  // Carga de inventario general desde endpoint NestJS
  useEffect(() => {
    setEfectivoTotal(teoricoCalculado || 0);

    const fetchInventario = async () => {
      try {
        const response = await CajasService.getEstadoInventario();
        const items: ProductoEstado[] = Array.isArray(response?.data) ? response.data : [];
        setProductosBD(items);

        // Pre-llenar conteo con los valores actuales del sistema por defecto
        const initialMap: Record<string, number> = {};
        (items || []).forEach((item) => {
          if (item && item.id !== undefined) {
            initialMap[item.id.toString()] = item.stockSistema ?? item.stock_actual ?? 0;
          }
        });

        // Pre-llenar saldos virtuales predeterminados si no existen en BD
        const defaultPlatforms = ['VIVA BOX', 'RECARGA ENTEL', 'RECARGA VIVA', 'RECARGA TIGO', 'Kiosco Viva', 'Kiosco Entel'];
        defaultPlatforms.forEach((plat) => {
          if (!initialMap[plat]) initialMap[plat] = 0;
        });

        setConteoFisico((prev) => ({ ...initialMap, ...prev }));
      } catch (err) {
        console.error('Error al cargar inventario para control de caja:', err);
        setProductosBD([]);
      }
    };

    fetchInventario();
  }, [teoricoCalculado]);

  // Clasificación de productos según la planilla de control

  // 1. Tarjetas Físicas (Entel, Viva, Tigo por denominación)
  const tarjetasPorOperador = useMemo(() => {
    const denomsMap: Record<string, { den: number; idKey: string; stockSys: number }[]> = {
      VIVA: [100, 50, 30, 20, 10].map((d) => ({ den: d, idKey: `tarjeta-viva-${d}`, stockSys: 0 })),
      ENTEL: [100, 50, 30, 15, 10].map((d) => ({ den: d, idKey: `tarjeta-entel-${d}`, stockSys: 0 })),
      TIGO: [100, 50, 30, 20, 10].map((d) => ({ den: d, idKey: `tarjeta-tigo-${d}`, stockSys: 0 })),
    };

    // Mapear con datos reales de la BD
    productosBD.forEach((p) => {
      const name = p.nombre.toUpperCase();
      if (name.includes('TARJETA')) {
        ['VIVA', 'ENTEL', 'TIGO'].forEach((op) => {
          if (name.includes(op)) {
            denomsMap[op].forEach((item) => {
              if (name.includes(`${item.den}`)) {
                item.stockSys = p.stockSistema ?? 0;
                item.idKey = p.id.toString();
              }
            });
          }
        });
      }
    });

    return denomsMap;
  }, [productosBD]);

  // 2. Chips y Recuperaciones
  const listChips = useMemo(() => {
    const itemsDefault = [
      { label: 'CHIP VIVA', key: 'chip-viva', stockSys: 0 },
      { label: 'CHIP TIGO', key: 'chip-tigo', stockSys: 0 },
      { label: 'CHIP ENTEL', key: 'chip-entel', stockSys: 0 },
      { label: 'RECUPERACIÓN VIVA', key: 'recuperacion-viva', stockSys: 0 },
      { label: 'RECUPERACIÓN TIGO', key: 'recuperacion-tigo', stockSys: 0 },
    ];

    productosBD.forEach((p) => {
      const name = p.nombre.toUpperCase();
      if (name.includes('CHIP') || name.includes('RECUPERA')) {
        itemsDefault.forEach((item) => {
          if (name.includes(item.label.replace('RECUPERACIÓN', 'RECUPERA'))) {
            item.stockSys = p.stockSistema ?? 0;
            item.key = p.id.toString();
          }
        });
      }
    });

    return itemsDefault;
  }, [productosBD]);

  // 3. Recargas Electrónicas y Saldos de Plataformas
  const listPlataformas = useMemo(() => {
    const platDefault = [
      { label: 'VIVA BOX', key: 'plat-viva-box', saldoTeorico: 0 },
      { label: 'RECARGA ENTEL', key: 'plat-recarga-entel', saldoTeorico: 0 },
      { label: 'RECARGA VIVA', key: 'plat-recarga-viva', saldoTeorico: 0 },
      { label: 'RECARGA TIGO', key: 'plat-recarga-tigo', saldoTeorico: 0 },
      { label: 'Kiosco Viva', key: 'plat-kiosco-viva', saldoTeorico: 0 },
      { label: 'Kiosco Entel', key: 'plat-kiosco-entel', saldoTeorico: 0 },
    ];

    productosBD.forEach((p) => {
      const name = p.nombre.toUpperCase();
      platDefault.forEach((plat) => {
        if (name.includes(plat.label.toUpperCase())) {
          plat.saldoTeorico = p.precio_venta || p.stockSistema || 0;
          plat.key = p.id.toString();
        }
      });
    });

    return platDefault;
  }, [productosBD]);

  // 4. Accesorios y Hardware agrupados por subcategorías
  const accesoriosGrupos = useMemo(() => {
    const cargadores: { label: string; key: string; stockSys: number; precio: number }[] = [];
    const audifonos: { label: string; key: string; stockSys: number; precio: number }[] = [];
    const cables: { label: string; key: string; stockSys: number; precio: number }[] = [];
    const otros: { label: string; key: string; stockSys: number; precio: number }[] = [];

    productosBD.forEach((p) => {
      const cat = (p.categoria || '').toLowerCase();
      const name = p.nombre.toLowerCase();
      const item = { label: p.nombre, key: p.id.toString(), stockSys: p.stockSistema ?? 0, precio: p.precio_venta };

      if (cat.includes('cargador') || name.includes('cargador')) {
        cargadores.push(item);
      } else if (cat.includes('audifono') || name.includes('audifono') || name.includes('auricular')) {
        audifonos.push(item);
      } else if (cat.includes('cable') || name.includes('cable') || name.includes('usb')) {
        cables.push(item);
      } else if (!cat.includes('chip') && !cat.includes('tarjeta') && !cat.includes('recarga')) {
        otros.push(item);
      }
    });

    return { cargadores, audifonos, cables, otros };
  }, [productosBD]);

  // Cálculos del Sticky Footer
  const diferencia = useMemo(() => {
    const numEfectivo = Number(efectivoTotal) || 0;
    const numTeorico = Number(teoricoCalculado) || 0;
    return numEfectivo - numTeorico;
  }, [efectivoTotal, teoricoCalculado]);

  const handleInputChange = (key: string, val: number) => {
    setConteoFisico((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = () => {
    const desglose = {
      efectivoTotal: Number(efectivoTotal) || 0,
      conteoFisico,
      fecha: fechaActual,
      hora: horaActual,
      operador: user?.name || user?.email || 'Operador',
      diferencia,
    };

    if (onConfirmar) {
      onConfirmar(Number(efectivoTotal) || 0, desglose);
    } else if (onConfirmarCierre) {
      onConfirmarCierre(Number(efectivoTotal) || 0, desglose);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* 1. ENCABEZADO DE CONTROL DE SESIÓN */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Operador Responsable</p>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                {user?.name || user?.email || 'Cajero de Turno'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>Fecha: <strong>{fechaActual}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>Hora: <strong>{horaActual}</strong></span>
            </div>
          </div>
        </div>

        {/* INPUT DE EFECTIVO TOTAL GLOBAL */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Monto Global de Efectivo en Caja (Sin desglose de billetes)
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
              Ingrese el efectivo total contado disponible físicamente en gaveta.
            </p>
          </div>
          <div className="w-full sm:w-56">
            <Label className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Efectivo Total (Bs.)</Label>
            <Input
              type="number"
              step={0.10}
              min="0"
              value={efectivoTotal}
              onChange={(e) => setEfectivoTotal(parseFloat(e.target.value) || 0)}
              className="text-right font-extrabold text-lg bg-white dark:bg-gray-900 text-emerald-700 dark:text-emerald-300 border-emerald-300 focus:ring-emerald-500"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* 2. BLOQUES DESPLEGABLES DE INVENTARIO Y SALDOS */}

      {/* ACORDEÓN 1: TARJETAS FÍSICAS POR DENOMINACIÓN */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-gray-800">
        <button
          type="button"
          onClick={() => toggleSection('tarjetas')}
          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div className="text-left">
              <h4 className="font-bold text-gray-800 dark:text-gray-100">
                1. Tarjetas Físicas (Productos con Stock por Unidades)
              </h4>
              <p className="text-xs text-gray-500">Tarjetas físicas de raspar por operador y denominación</p>
            </div>
          </div>
          {openSections.tarjetas ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
        </button>

        {openSections.tarjetas && (
          <div className="p-5 space-y-6 border-t border-gray-200 dark:border-gray-700">
            {Object.entries(tarjetasPorOperador).map(([op, list]) => (
              <div key={op} className="bg-gray-50/70 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <h5 className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">
                  Operador {op}
                </h5>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500">
                        <th className="py-2 px-3">Denominación</th>
                        <th className="py-2 px-3 text-center">Stock Sistema (Solo lectura)</th>
                        <th className="py-2 px-3 text-center">Conteo Físico (Input)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {list.map((item) => {
                        const val = conteoFisico[item.idKey] ?? item.stockSys;
                        return (
                          <tr key={item.idKey}>
                            <td className="py-2 px-3 font-semibold text-gray-800 dark:text-gray-200">
                              Tarjeta {op} - {item.den} Bs.
                            </td>
                            <td className="py-2 px-3 text-center">
                              <input
                                type="number"
                                value={item.stockSys}
                                disabled
                                readOnly
                                className="w-20 text-center font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-2 cursor-not-allowed"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <input
                                type="number"
                                min="0"
                                value={val}
                                onChange={(e) => handleInputChange(item.idKey, parseInt(e.target.value) || 0)}
                                className="w-20 text-center font-bold bg-white dark:bg-gray-900 border border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 rounded-md py-1 px-2 focus:ring-2 focus:ring-indigo-500"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ACORDEÓN 2: CHIPS Y RECUPERACIONES */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-gray-800">
        <button
          type="button"
          onClick={() => toggleSection('chips')}
          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div className="text-left">
              <h4 className="font-bold text-gray-800 dark:text-gray-100">
                2. Chips y Recuperaciones
              </h4>
              <p className="text-xs text-gray-500">Conteo de SIM cards y reposiciones por operador</p>
            </div>
          </div>
          {openSections.chips ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
        </button>

        {openSections.chips && (
          <div className="p-5 border-t border-gray-200 dark:border-gray-700 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500">
                  <th className="py-2 px-3">Producto</th>
                  <th className="py-2 px-3 text-center">Stock Sistema (Solo lectura)</th>
                  <th className="py-2 px-3 text-center">Conteo Físico (Input)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {listChips.map((item) => {
                  const val = conteoFisico[item.key] ?? item.stockSys;
                  return (
                    <tr key={item.key}>
                      <td className="py-2 px-3 font-semibold text-gray-800 dark:text-gray-200">
                        {item.label}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          value={item.stockSys}
                          disabled
                          readOnly
                          className="w-20 text-center font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-2 cursor-not-allowed"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          value={val}
                          onChange={(e) => handleInputChange(item.key, parseInt(e.target.value) || 0)}
                          className="w-20 text-center font-bold bg-white dark:bg-gray-900 border border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 rounded-md py-1 px-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ACORDEÓN 3: RECARGAS ELECTRÓNICAS Y SALDOS DE PLATAFORMAS */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-gray-800">
        <button
          type="button"
          onClick={() => toggleSection('plataformas')}
          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div className="text-left">
              <h4 className="font-bold text-gray-800 dark:text-gray-100">
                3. Recargas Electrónicas y Saldos de Plataformas
              </h4>
              <p className="text-xs text-gray-500">Saldos/bolsas virtuales de dinero disponibles para recargas</p>
            </div>
          </div>
          {openSections.plataformas ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
        </button>

        {openSections.plataformas && (
          <div className="p-5 border-t border-gray-200 dark:border-gray-700 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500">
                  <th className="py-2 px-3">Plataforma / Bolsa Digital</th>
                  <th className="py-2 px-3 text-center">Saldo Teórico (Bs.)</th>
                  <th className="py-2 px-3 text-center">Saldo Declarado en Sistema (Bs.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {listPlataformas.map((item) => {
                  const val = conteoFisico[item.key] ?? item.saldoTeorico;
                  return (
                    <tr key={item.key}>
                      <td className="py-2 px-3 font-semibold text-gray-800 dark:text-gray-200">
                        {item.label}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          step={0.10}
                          value={item.saldoTeorico}
                          disabled
                          readOnly
                          className="w-24 text-center font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-2 cursor-not-allowed"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          step={0.10}
                          min="0"
                          value={val}
                          onChange={(e) => handleInputChange(item.key, parseFloat(e.target.value) || 0)}
                          className="w-24 text-center font-bold bg-white dark:bg-gray-900 border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300 rounded-md py-1 px-2 focus:ring-2 focus:ring-amber-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ACORDEÓN 4: ACCESORIOS Y HARDWARE */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-gray-800">
        <button
          type="button"
          onClick={() => toggleSection('accesorios')}
          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <div className="text-left">
              <h4 className="font-bold text-gray-800 dark:text-gray-100">
                4. Conteo de Accesorios y Hardware
              </h4>
              <p className="text-xs text-gray-500">Conteo por sub-grupos (Cargadores, Audífonos, Cables USB)</p>
            </div>
          </div>
          {openSections.accesorios ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
        </button>

        {openSections.accesorios && (
          <div className="p-5 space-y-4 border-t border-gray-200 dark:border-gray-700">
            {/* SUB-GRUPO: CARGADORES */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccGrupo('cargadores')}
                className="w-full flex items-center justify-between p-3 bg-purple-50/70 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 font-bold text-xs"
              >
                <span>🔌 Sub-grupo: Cargadores</span>
                {openAccGrupos.cargadores ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openAccGrupos.cargadores && (
                <div className="p-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500">
                        <th className="py-2 px-3">Modelo / Precio</th>
                        <th className="py-2 px-3 text-center">Stock Sistema (Solo lectura)</th>
                        <th className="py-2 px-3 text-center">Conteo Físico (Input)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {accesoriosGrupos.cargadores.length === 0 ? (
                        <tr><td colSpan={3} className="text-center py-3 text-gray-400">No hay cargadores registrados.</td></tr>
                      ) : (
                        accesoriosGrupos.cargadores.map((item) => {
                          const val = conteoFisico[item.key] ?? item.stockSys;
                          return (
                            <tr key={item.key}>
                              <td className="py-2 px-3 font-semibold text-gray-800 dark:text-gray-200">
                                {item.label} <span className="text-gray-400 font-normal">(Bs. {item.precio})</span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input type="number" value={item.stockSys} disabled readOnly className="w-20 text-center font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 border rounded-md py-1 px-2 cursor-not-allowed" />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input type="number" min="0" value={val} onChange={(e) => handleInputChange(item.key, parseInt(e.target.value) || 0)} className="w-20 text-center font-bold bg-white dark:bg-gray-900 border border-purple-300 text-purple-700 rounded-md py-1 px-2 focus:ring-2 focus:ring-purple-500" />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SUB-GRUPO: AUDÍFONOS */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccGrupo('audifonos')}
                className="w-full flex items-center justify-between p-3 bg-purple-50/70 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 font-bold text-xs"
              >
                <span>🎧 Sub-grupo: Audífonos</span>
                {openAccGrupos.audifonos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openAccGrupos.audifonos && (
                <div className="p-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500">
                        <th className="py-2 px-3">Modelo / Precio</th>
                        <th className="py-2 px-3 text-center">Stock Sistema (Solo lectura)</th>
                        <th className="py-2 px-3 text-center">Conteo Físico (Input)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {accesoriosGrupos.audifonos.length === 0 ? (
                        <tr><td colSpan={3} className="text-center py-3 text-gray-400">No hay audífonos registrados.</td></tr>
                      ) : (
                        accesoriosGrupos.audifonos.map((item) => {
                          const val = conteoFisico[item.key] ?? item.stockSys;
                          return (
                            <tr key={item.key}>
                              <td className="py-2 px-3 font-semibold text-gray-800 dark:text-gray-200">
                                {item.label} <span className="text-gray-400 font-normal">(Bs. {item.precio})</span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input type="number" value={item.stockSys} disabled readOnly className="w-20 text-center font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 border rounded-md py-1 px-2 cursor-not-allowed" />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input type="number" min="0" value={val} onChange={(e) => handleInputChange(item.key, parseInt(e.target.value) || 0)} className="w-20 text-center font-bold bg-white dark:bg-gray-900 border border-purple-300 text-purple-700 rounded-md py-1 px-2 focus:ring-2 focus:ring-purple-500" />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SUB-GRUPO: CABLES USB */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccGrupo('cables')}
                className="w-full flex items-center justify-between p-3 bg-purple-50/70 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 font-bold text-xs"
              >
                <span>🔋 Sub-grupo: Cables USB</span>
                {openAccGrupos.cables ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {openAccGrupos.cables && (
                <div className="p-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500">
                        <th className="py-2 px-3">Modelo / Precio</th>
                        <th className="py-2 px-3 text-center">Stock Sistema (Solo lectura)</th>
                        <th className="py-2 px-3 text-center">Conteo Físico (Input)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {accesoriosGrupos.cables.length === 0 ? (
                        <tr><td colSpan={3} className="text-center py-3 text-gray-400">No hay cables registrados.</td></tr>
                      ) : (
                        accesoriosGrupos.cables.map((item) => {
                          const val = conteoFisico[item.key] ?? item.stockSys;
                          return (
                            <tr key={item.key}>
                              <td className="py-2 px-3 font-semibold text-gray-800 dark:text-gray-200">
                                {item.label} <span className="text-gray-400 font-normal">(Bs. {item.precio})</span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input type="number" value={item.stockSys} disabled readOnly className="w-20 text-center font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 border rounded-md py-1 px-2 cursor-not-allowed" />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input type="number" min="0" value={val} onChange={(e) => handleInputChange(item.key, parseInt(e.target.value) || 0)} className="w-20 text-center font-bold bg-white dark:bg-gray-900 border border-purple-300 text-purple-700 rounded-md py-1 px-2 focus:ring-2 focus:ring-purple-500" />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SUB-GRUPO: OTROS */}
            {accesoriosGrupos.otros.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleAccGrupo('otros')}
                  className="w-full flex items-center justify-between p-3 bg-purple-50/70 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 font-bold text-xs"
                >
                  <span>📦 Otros Accesorios y Hardware</span>
                  {openAccGrupos.otros ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openAccGrupos.otros && (
                  <div className="p-3 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500">
                          <th className="py-2 px-3">Modelo / Precio</th>
                          <th className="py-2 px-3 text-center">Stock Sistema (Solo lectura)</th>
                          <th className="py-2 px-3 text-center">Conteo Físico (Input)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {accesoriosGrupos.otros.map((item) => {
                          const val = conteoFisico[item.key] ?? item.stockSys;
                          return (
                            <tr key={item.key}>
                              <td className="py-2 px-3 font-semibold text-gray-800 dark:text-gray-200">
                                {item.label} <span className="text-gray-400 font-normal">(Bs. {item.precio})</span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input type="number" value={item.stockSys} disabled readOnly className="w-20 text-center font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 border rounded-md py-1 px-2 cursor-not-allowed" />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input type="number" min="0" value={val} onChange={(e) => handleInputChange(item.key, parseInt(e.target.value) || 0)} className="w-20 text-center font-bold bg-white dark:bg-gray-900 border border-purple-300 text-purple-700 rounded-md py-1 px-2 focus:ring-2 focus:ring-purple-500" />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. RESUMEN Y BALANCE FLOTANTE (STICKY FOOTER) */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-[290px] z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t-2 border-indigo-500 shadow-2xl p-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto text-center md:text-left">
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Total Ingresos (+)</p>
              <p className="text-base font-bold text-green-600 dark:text-green-400">
                Bs. {formatMonto(totalIngresos)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Total Egresos (-)</p>
              <p className="text-base font-bold text-red-600 dark:text-red-400">
                Bs. {formatMonto(totalEgresos)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Efectivo Declarado</p>
              <p className="text-base font-bold text-blue-600 dark:text-blue-400">
                Bs. {formatMonto(efectivoTotal)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Diferencia</p>
              <p
                className={`text-base font-extrabold ${
                  diferencia >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {diferencia >= 0 ? '+' : ''}Bs. {formatMonto(diferencia)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {onCancelar && (
              <Button variant="outline" className="w-full md:w-auto" onClick={onCancelar}>
                Cancelar
              </Button>
            )}
            <Button
              variant="primary"
              className="w-full md:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
              onClick={handleSubmit}
            >
              {modo === 'apertura' ? 'Confirmar y Guardar Apertura' : 'Confirmar y Cerrar Caja'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// React Error Boundary para capturar cualquier falla imprevista durante el renderizado
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ArqueoCajaErrorBoundary extends React.Component<
  ArqueoCajaAccordionProps,
  ErrorBoundaryState
> {
  constructor(props: ArqueoCajaAccordionProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ArqueoCajaAccordion Error Boundary capturó un fallo:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-center space-y-4">
          <h4 className="text-lg font-bold text-red-800 dark:text-red-300">
            Ocurrió un problema al cargar el formulario de arqueo
          </h4>
          <p className="text-xs text-red-600 dark:text-red-400">
            {this.state.error?.message || 'Error inesperado de renderizado.'}
          </p>
          <div className="flex justify-center gap-3">
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700 text-white text-xs py-2 px-4"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              🔄 Reintentar Carga
            </Button>
            {this.props.onCancelar && (
              <Button
                variant="outline"
                className="text-xs py-2 px-4"
                onClick={this.props.onCancelar}
              >
                Volver
              </Button>
            )}
          </div>
        </div>
      );
    }

    return <ArqueoCajaAccordion {...this.props} />;
  }
}
