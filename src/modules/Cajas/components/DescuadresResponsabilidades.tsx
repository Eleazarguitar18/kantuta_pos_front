import React, { useEffect, useState, useMemo } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { CajasService } from "../services/cajasService";
import { useAuth } from "../../../context/auth/AuthContext";
import Swal from "sweetalert2";

interface DescuadreItem {
  id: number;
  id_sesion_caja: number;
  tipo: "EFECTIVO" | "PRODUCTO";
  cantidad_esperada: number;
  cantidad_declarada: number;
  diferencia: number;
  monto_deuda_estimado: number;
  precio_unitario_producto?: number;
  costo_unitario_producto?: number;
  observacion?: string;
  estado_resolucion: "PENDIENTE" | "RESUELTO" | "JUSTIFICADO";
  created_at: string;
  operador_culpable?: {
    id: number;
    email: string;
    name?: string;
    persona?: {
      nombres?: string;
      p_apellido?: string;
      s_apellido?: string;
      apellidos?: string;
    };
    role?: {
      nombre?: string;
    };
  };
  producto?: {
    id: number;
    nombre: string;
    codigo_barras?: string;
  };
  sesion_caja?: {
    id: number;
    caja?: {
      nombre?: string;
      nombre_caja?: string;
    };
  };
}

export default function DescuadresResponsabilidades() {
  const { user } = useAuth();
  const [descuadres, setDescuadres] = useState<DescuadreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>("TODOS");
  const [filtroTipo, setFiltroTipo] = useState<string>("TODOS");
  const [busqueda, setBusqueda] = useState<string>("");

  const fetchDescuadres = async () => {
    try {
      setLoading(true);
      const res = await CajasService.getHistorialDescuadres();
      setDescuadres(res.data || []);
    } catch (error) {
      console.error("Error al cargar historial de descuadres:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar las responsabilidades de descuadres.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDescuadres();
  }, []);

  const handleResolver = async (item: DescuadreItem, nuevoEstado: "RESUELTO" | "JUSTIFICADO") => {
    const actionLabel = nuevoEstado === "RESUELTO" ? "Cobrado / Repuesto por el Operador" : "Justificado (Exonerado / Merma)";
    
    const { value: observacionResolucion } = await Swal.fire({
      title: `Marcar como ${actionLabel}`,
      input: "text",
      inputLabel: "Nota o comprobante de resolución (Opcional):",
      inputPlaceholder: "Ej. Se descontó de nómina / repuso producto en físico...",
      showCancelButton: true,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: nuevoEstado === "RESUELTO" ? "#10B981" : "#6366F1",
    });

    if (observacionResolucion === undefined) return; // Cancelado

    try {
      await CajasService.resolverDescuadre(item.id, {
        estado_resolucion: nuevoEstado,
        observacion_resolucion: observacionResolucion || undefined,
      });

      Swal.fire({
        icon: "success",
        title: "Descuadre Actualizado",
        text: `El registro ha sido marcado como ${nuevoEstado}.`,
        timer: 2000,
        showConfirmButton: false,
      });

      fetchDescuadres();
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.message || "No se pudo actualizar el estado.",
      });
    }
  };

  const descuadresFiltrados = useMemo(() => {
    return descuadres.filter((item) => {
      const coincideEstado =
        filtroEstado === "TODOS" || item.estado_resolucion === filtroEstado;
      const coincideTipo = filtroTipo === "TODOS" || item.tipo === filtroTipo;

      const nombreOperador = item.operador_culpable?.persona
        ? `${item.operador_culpable.persona.nombres} ${item.operador_culpable.persona.apellidos}`
        : item.operador_culpable?.email || "Sin Asignar";

      const detalleTexto = item.tipo === "PRODUCTO" ? (item.producto?.nombre || "") : "Efectivo";

      const coincideBusqueda =
        busqueda.trim() === "" ||
        nombreOperador.toLowerCase().includes(busqueda.toLowerCase()) ||
        detalleTexto.toLowerCase().includes(busqueda.toLowerCase()) ||
        (item.observacion && item.observacion.toLowerCase().includes(busqueda.toLowerCase()));

      return coincideEstado && coincideTipo && coincideBusqueda;
    });
  }, [descuadres, filtroEstado, filtroTipo, busqueda]);

  // Totales para KPIs
  const kpis = useMemo(() => {
    const pendientes = descuadres.filter((d) => d.estado_resolucion === "PENDIENTE");
    const totalDeudaDinero = pendientes
      .filter((d) => d.tipo === "EFECTIVO")
      .reduce((acc, curr) => acc + (Number(curr.monto_deuda_estimado) || 0), 0);

    const totalDeudaStockBs = pendientes
      .filter((d) => d.tipo === "PRODUCTO")
      .reduce((acc, curr) => acc + (Number(curr.monto_deuda_estimado) || 0), 0);

    const totalUnidadesFaltantes = pendientes
      .filter((d) => d.tipo === "PRODUCTO")
      .reduce((acc, curr) => acc + Math.abs(Number(curr.diferencia) || 0), 0);

    return {
      pendientesCount: pendientes.length,
      totalDeudaDinero,
      totalDeudaStockBs,
      totalUnidadesFaltantes,
      totalDeudaGeneral: totalDeudaDinero + totalDeudaStockBs,
    };
  }, [descuadres]);

  return (
    <div>
      <PageMeta
        title="Responsabilidades y Deudas de Operadores | Kantuta POS"
        description="Módulo de auditoría de descuadres, faltantes y cuentas por cobrar a operadores"
      />
      <PageBreadcrumb pageTitle="Control de Deudas y Responsabilidades por Descuadre" />

      {/* KPIs Resumen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Total Deuda Pendiente
              </p>
              <h3 className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
                Bs. {kpis.totalDeudaGeneral.toFixed(2)}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <span className="text-xl">💰</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">Efectivo + Valorización de Stock</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Faltante en Dinero (Caja)
              </p>
              <h3 className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                Bs. {kpis.totalDeudaDinero.toFixed(2)}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <span className="text-xl">💵</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">Descuadres de caja pendientes</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Faltante en Productos
              </p>
              <h3 className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                {kpis.totalUnidadesFaltantes} u. (Bs. {kpis.totalDeudaStockBs.toFixed(2)})
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <span className="text-xl">📦</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">Auditorías de apertura y cierre</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                Incidencias Sin Resolver
              </p>
              <h3 className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
                {kpis.pendientesCount}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <span className="text-xl">⚠️</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">Cargadas a operadores</p>
        </div>
      </div>

      {/* Controles de Filtro */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 mb-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
              Buscar Operador o Detalle
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Nombre, producto, observación..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
              Estado de Resolución
            </label>
            <select
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="TODOS">Todos los estados</option>
              <option value="PENDIENTE">Pendientes (Por Cobrar)</option>
              <option value="RESUELTO">Resueltos (Cobrado/Repuesto)</option>
              <option value="JUSTIFICADO">Justificados (Exonerados)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
              Tipo de Descuadre
            </label>
            <select
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="TODOS">Efectivo y Productos</option>
              <option value="EFECTIVO">Solo Efectivo (Dinero)</option>
              <option value="PRODUCTO">Solo Productos (Stock)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchDescuadres}
              className="w-full rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white font-semibold py-2 px-4 text-sm transition"
            >
              🔄 Actualizar Datos
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Responsabilidades */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/75 dark:border-gray-800 dark:bg-gray-800/50">
                <th className="p-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">ID / Fecha</th>
                <th className="p-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Operador Responsable</th>
                <th className="p-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Caja / Sesión</th>
                <th className="p-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Tipo & Detalle</th>
                <th className="p-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Faltante / Deuda</th>
                <th className="p-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Observación</th>
                <th className="p-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Estado</th>
                <th className="p-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400 text-right">Acción Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    Cargando historial de descuadres...
                  </td>
                </tr>
              ) : descuadresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    No se encontraron registros de descuadres o deudas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                descuadresFiltrados.map((item) => {
                  const nombrePersona = item.operador_culpable?.persona
                    ? `${item.operador_culpable.persona.nombres || ""} ${item.operador_culpable.persona.p_apellido || item.operador_culpable.persona.apellidos || ""} ${item.operador_culpable.persona.s_apellido || ""}`.trim()
                    : item.operador_culpable?.name;
                  const nombreOperador = nombrePersona || item.operador_culpable?.email || (item.operador_culpable ? `Operador #${item.operador_culpable.id}` : "Sin asignar");

                  const fecha = item.created_at
                    ? new Date(item.created_at).toLocaleString()
                    : "-";

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition"
                    >
                      <td className="p-4 font-mono text-xs">
                        <span className="font-bold text-gray-800 dark:text-gray-200">#{item.id}</span>
                        <div className="text-gray-400 text-[11px]">{fecha}</div>
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {nombreOperador}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.operador_culpable?.email || (item.operador_culpable?.role?.nombre ? `Rol: ${item.operador_culpable.role.nombre}` : "")}
                        </div>
                      </td>

                      <td className="p-4 text-xs">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {item.sesion_caja?.caja?.nombre || item.sesion_caja?.caja?.nombre_caja || "Caja"}
                        </span>
                        <div className="text-gray-400">Sesión #{item.id_sesion_caja}</div>
                      </td>

                      <td className="p-4">
                        {item.tipo === "EFECTIVO" ? (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                            💵 Efectivo en Caja
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                              📦 {item.producto?.nombre || `Producto #${item.producto?.id || ""}`}
                            </span>
                            <div className="text-xs text-gray-400 mt-0.5">
                              Esp: {item.cantidad_esperada} | Físico: {item.cantidad_declarada}
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-red-600 dark:text-red-400">
                          {item.tipo === "EFECTIVO"
                            ? `Bs. ${Math.abs(Number(item.diferencia)).toFixed(2)}`
                            : `${item.diferencia} u.`}
                        </div>
                        {item.tipo === "PRODUCTO" && item.monto_deuda_estimado > 0 && (
                          <div className="text-xs font-semibold text-gray-500">
                            ≈ Bs. {item.monto_deuda_estimado.toFixed(2)}
                          </div>
                        )}
                      </td>

                      <td className="p-4 max-w-sm">
                        <div className="text-xs text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-850 p-2 rounded border border-gray-100 dark:border-gray-750" title={item.observacion}>
                          {item.observacion ? (
                            <div className="whitespace-pre-line leading-relaxed">
                              {item.observacion}
                            </div>
                          ) : (
                            <span className="italic text-gray-400 dark:text-gray-500">Sin observación registrada</span>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        {item.estado_resolucion === "PENDIENTE" && (
                          <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-800 dark:bg-red-950/40 dark:text-red-400">
                            ● PENDIENTE
                          </span>
                        )}
                        {item.estado_resolucion === "RESUELTO" && (
                          <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800 dark:bg-green-950/40 dark:text-green-400">
                            ✓ COBRADO
                          </span>
                        )}
                        {item.estado_resolucion === "JUSTIFICADO" && (
                          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                            - JUSTIFICADO
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        {item.estado_resolucion === "PENDIENTE" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleResolver(item, "RESUELTO")}
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition"
                              title="Marcar como cobrado o repuesto"
                            >
                              ✓ Cobrar / Repuesto
                            </button>
                            <button
                              onClick={() => handleResolver(item, "JUSTIFICADO")}
                              className="rounded-lg bg-gray-600 hover:bg-gray-700 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition"
                              title="Exonerar o justificar merma"
                            >
                              Justificar
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Concluido</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
