import React, { useState, useEffect, useMemo, useCallback } from "react";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../components/common/ComponentCard";
import Button from "../../../components/ui/button/Button";
import Alert from "../../../components/ui/alert/Alert";
import { useSocket } from "../../../context/SocketContext";
import { useAuth } from "../../../context/auth/AuthContext";
import { useRole } from "../../../hooks/useRole";
import {
  AgenteBanco,
  AgenteBalance,
  OperadorDeuda,
  TransaccionAgente,
  TipoTransaccionAgente,
} from "../interfaces/Agente";
import { AgentesService } from "../services/agentesService";
import ModalCrearBanco from "../components/ModalCrearBanco";
import ModalRegistrarMovimiento from "../components/ModalRegistrarMovimiento";
import Swal from "sweetalert2";
import {
  Wallet,
  Building2,
  Users,
  PieChart,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Landmark,
  ShieldCheck,
  Trash2,
} from "lucide-react";

export const formatMonto = (val: any): string => {
  if (val === undefined || val === null || val === "") return "0.00";
  const num = typeof val === "number" ? val : parseFloat(String(val));
  return isNaN(num)
    ? "0.00"
    : num.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const AgentesBancoMain: React.FC = () => {
  const socket = useSocket();
  const { user } = useAuth();
  const { isAdmin: isRoleAdmin } = useRole();

  // Verificación estricta de permisos de administrador
  const esAdministrador = useMemo(() => {
    if (isRoleAdmin) return true;
    const rol = (user as any)?.role || (user as any)?.rol || "";
    const rolNombre = typeof rol === "string" ? rol : rol?.name || rol?.nombre || "";
    const rolUpper = rolNombre.toUpperCase();
    return rolUpper === "ADMIN" || rolUpper === "ADMINISTRADOR";
  }, [user, isRoleAdmin]);

  // Estados de Bancos y Selección
  const [bancos, setBancos] = useState<AgenteBanco[]>([]);
  const [selectedBancoId, setSelectedBancoId] = useState<number | null>(null);

  // Objeto con la información y balance de la caja independiente del banco activo
  const [bancoActivoData, setBancoActivoData] = useState<AgenteBalance>({
    monto_total: 0,
    monto_efectivo: 0,
    monto_banco: 0,
    monto_cuentas_por_cobrar: 0,
  });

  const [operadores, setOperadores] = useState<OperadorDeuda[]>([]);
  const [transacciones, setTransacciones] = useState<TransaccionAgente[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Filtros de búsqueda
  const [searchTermOperador, setSearchTermOperador] = useState<string>("");

  // Modales
  const [isModalCrearBancoOpen, setIsModalCrearBancoOpen] = useState<boolean>(false);
  const [isModalMovimientoOpen, setIsModalMovimientoOpen] = useState<boolean>(false);
  const [operadorSeleccionadoParaModal, setOperadorSeleccionadoParaModal] = useState<OperadorDeuda | null>(null);
  const [tipoOperacionModal, setTipoOperacionModal] = useState<TipoTransaccionAgente>("PRESTAMO_OPERADOR");

  // Alertas / Feedback
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Banco activo seleccionado derivado
  const bancoActivo = useMemo(() => {
    if (!bancos.length) return null;
    return bancos.find((b) => b.id === selectedBancoId) || bancos[0];
  }, [bancos, selectedBancoId]);

  // Cargar lista de bancos inicial
  const fetchBancos = useCallback(async () => {
    try {
      const res = await AgentesService.getBancos();
      const items: AgenteBanco[] = Array.isArray(res.data) ? res.data : [];
      setBancos(items);
      return items;
    } catch (error) {
      console.error("Error al cargar lista de bancos:", error);
      return [];
    }
  }, []);

  // Cargar datos de un banco específico
  const cargarDatosBanco = useCallback(async (bancoId: number | null, showLoader = true) => {
    if (showLoader) setLoading(true);
    setIsRefreshing(true);
    try {
      if (bancoId) {
        const [balRes, opsRes, transRes] = await Promise.allSettled([
          AgentesService.getBalanceByBancoId(bancoId),
          AgentesService.getOperadoresDeuda(bancoId),
          AgentesService.getTransacciones(bancoId, 30),
        ]);

        if (balRes.status === "fulfilled" && balRes.value?.data) {
          const resBal = balRes.value.data;
          setBancoActivoData({
            id_banco: resBal.id_banco || bancoId,
            nombre_banco: resBal.nombre_banco,
            monto_total: Number(resBal.monto_total) || 0,
            monto_efectivo: Number(resBal.monto_efectivo) || 0,
            monto_banco: Number(resBal.monto_banco) || 0,
            monto_cuentas_por_cobrar: Number(resBal.monto_cuentas_por_cobrar) || 0,
          });
        }
        if (opsRes.status === "fulfilled" && Array.isArray(opsRes.value?.data)) {
          setOperadores(opsRes.value.data);
        }
        if (transRes.status === "fulfilled" && Array.isArray(transRes.value?.data)) {
          setTransacciones(transRes.value.data);
        }
      } else {
        const [balRes, opsRes, transRes] = await Promise.allSettled([
          AgentesService.getAgenteBalance(),
          AgentesService.getOperadoresDeuda(),
          AgentesService.getTransacciones(undefined, 30),
        ]);

        if (balRes.status === "fulfilled" && balRes.value?.data) {
          const resBal = balRes.value.data;
          setBancoActivoData({
            monto_total: Number(resBal.monto_total) || 0,
            monto_efectivo: Number(resBal.monto_efectivo) || 0,
            monto_banco: Number(resBal.monto_banco) || 0,
            monto_cuentas_por_cobrar: Number(resBal.monto_cuentas_por_cobrar) || 0,
          });
        }
        if (opsRes.status === "fulfilled" && Array.isArray(opsRes.value?.data)) {
          setOperadores(opsRes.value.data);
        }
        if (transRes.status === "fulfilled" && Array.isArray(transRes.value?.data)) {
          setTransacciones(transRes.value.data);
        }
      }
    } catch (error) {
      console.error("Error al cargar detalles del banco:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Inicialización de la vista
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      const lista = await fetchBancos();
      if (!isMounted) return;
      if (lista.length > 0) {
        setSelectedBancoId(lista[0].id);
      } else {
        cargarDatosBanco(null, true);
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [fetchBancos, cargarDatosBanco]);

  // Efecto que reacciona de manera limpia UNICAMENTE cuando cambia selectedBancoId
  useEffect(() => {
    if (!selectedBancoId) return;
    cargarDatosBanco(selectedBancoId, true);
  }, [selectedBancoId]);

  // Suscripción a WebSockets
  useEffect(() => {
    const handleAgenteCreado = (nuevoAgente: AgenteBanco | any) => {
      console.log("📡 WebSocket [agente:creado] recibido:", nuevoAgente);
      if (nuevoAgente && nuevoAgente.id) {
        const parsedAgente: AgenteBanco = {
          ...nuevoAgente,
          monto_total: Number(nuevoAgente.monto_total) || 0,
          monto_efectivo: Number(nuevoAgente.monto_efectivo) || 0,
          monto_banco: Number(nuevoAgente.monto_banco) || 0,
          monto_cuentas_por_cobrar: Number(nuevoAgente.monto_cuentas_por_cobrar) || 0,
        };
        setBancos((prev) => {
          const yaExiste = prev.some((b) => b.id === parsedAgente.id);
          return yaExiste ? prev.map((b) => (b.id === parsedAgente.id ? parsedAgente : b)) : [...prev, parsedAgente];
        });
      } else {
        fetchBancos();
      }
    };

    const handleAgenteActualizado = (data: { id?: number; id_banco?: number; id_agente?: number; balance?: AgenteBalance } | any) => {
      console.log("📡 WebSocket [agente:actualizado] recibido:", data);
      const targetId = data?.id || data?.id_banco || data?.id_agente;
      if (!targetId || targetId === selectedBancoId) {
        cargarDatosBanco(selectedBancoId, false);
      }
      fetchBancos();
    };

    const handleDataChanged = (data: { entity: string; action: string }) => {
      if (
        data.entity === "agente" ||
        data.entity === "banco" ||
        data.entity === "caja" ||
        data.entity === "transaccion_agente"
      ) {
        console.log(`📡 WebSocket [dataChanged] detectado en AgentesBancoMain: ${data.action} (${data.entity})`);
        fetchBancos().then(() => {
          cargarDatosBanco(selectedBancoId, false);
        });
      }
    };

    socket.on("agente:creado", handleAgenteCreado);
    socket.on("agente:actualizado", handleAgenteActualizado);
    socket.on("dataChanged", handleDataChanged);

    return () => {
      socket.off("agente:creado", handleAgenteCreado);
      socket.off("agente:actualizado", handleAgenteActualizado);
      socket.off("dataChanged", handleDataChanged);
    };
  }, [socket, selectedBancoId, fetchBancos, cargarDatosBanco]);

  // Manejar creación exitosa de un banco
  const handleBancoCreado = (nuevoBanco: AgenteBanco) => {
    const formattedNuevoBanco: AgenteBanco = {
      ...nuevoBanco,
      monto_total: Number(nuevoBanco.monto_total) || 0,
      monto_efectivo: Number(nuevoBanco.monto_efectivo) || 0,
      monto_banco: Number(nuevoBanco.monto_banco) || 0,
      monto_cuentas_por_cobrar: Number(nuevoBanco.monto_cuentas_por_cobrar) || 0,
    };

    setBancos((prev) => {
      const existe = prev.some((b) => b.id === formattedNuevoBanco.id);
      return existe
        ? prev.map((b) => (b.id === formattedNuevoBanco.id ? formattedNuevoBanco : b))
        : [...prev, formattedNuevoBanco];
    });

    setSelectedBancoId(formattedNuevoBanco.id);
    setBancoActivoData({
      id_banco: formattedNuevoBanco.id,
      nombre_banco: formattedNuevoBanco.nombre_banco,
      monto_total: formattedNuevoBanco.monto_total,
      monto_efectivo: formattedNuevoBanco.monto_efectivo,
      monto_banco: formattedNuevoBanco.monto_banco,
      monto_cuentas_por_cobrar: formattedNuevoBanco.monto_cuentas_por_cobrar || 0,
    });
    setOperadores([]);
    setTransacciones([]);

    cargarDatosBanco(formattedNuevoBanco.id, false);
  };

  // Manejar eliminación de un banco / agente
  const handleEliminarBanco = async () => {
    if (!bancoActivo || !bancoActivo.id) return;

    const nombre = bancoActivo.nombre_banco;
    const idAEliminar = bancoActivo.id;

    const confirmResult = await Swal.fire({
      title: `¿Eliminar ${nombre}?`,
      text: "Esta acción eliminará el banco/agente seleccionado. Los registros y balances asociados no estarán disponibles.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar banco",
      cancelButtonText: "Cancelar",
    });

    if (!confirmResult.isConfirmed) return;

    setIsDeleting(true);
    try {
      await AgentesService.eliminarBanco(idAEliminar);

      Swal.fire({
        icon: "success",
        title: "Banco Eliminado",
        text: `El banco "${nombre}" ha sido eliminado exitosamente.`,
        timer: 2000,
        showConfirmButton: false,
      });

      const bancosRestantes = bancos.filter((b) => b.id !== idAEliminar);
      setBancos(bancosRestantes);

      if (bancosRestantes.length > 0) {
        const proximoId = bancosRestantes[0].id;
        setSelectedBancoId(proximoId);
        cargarDatosBanco(proximoId, true);
      } else {
        setSelectedBancoId(null);
        setBancoActivoData({
          monto_total: 0,
          monto_efectivo: 0,
          monto_banco: 0,
          monto_cuentas_por_cobrar: 0,
        });
        setOperadores([]);
        setTransacciones([]);
      }
    } catch (error: any) {
      console.error("Error al eliminar banco:", error);
      const rawMsg = error?.response?.data?.message || error?.message || "No se pudo eliminar el banco seleccionado.";
      const msg = Array.isArray(rawMsg) ? rawMsg.join(", ") : typeof rawMsg === "string" ? rawMsg : JSON.stringify(rawMsg);
      Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: msg,
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrado de operadores por nombre
  const filteredOperadores = useMemo(() => {
    if (!searchTermOperador.trim()) return operadores;
    const term = searchTermOperador.toLowerCase();
    return operadores.filter(
      (op) =>
        op.nombre_operador.toLowerCase().includes(term) ||
        (op.telefono && op.telefono.includes(term)) ||
        (op.ci && op.ci.includes(term))
    );
  }, [operadores, searchTermOperador]);

  // Total de deudas de operadores calculado
  const totalDeudaOperadores = useMemo(() => {
    return operadores.reduce((acc, op) => acc + Number(op.monto_pendiente || 0), 0);
  }, [operadores]);

  // Abrir modal configurado para un operador específico
  const handleAbrirModalParaOperador = (operador: OperadorDeuda, accion: "PRESTAMO" | "COBRO") => {
    setTipoOperacionModal(accion === "PRESTAMO" ? "PRESTAMO_OPERADOR" : "COBRO_OPERADOR");
    setOperadorSeleccionadoParaModal(operador);
    setIsModalMovimientoOpen(true);
  };

  // Abrir modal vacío para nuevo movimiento
  const handleAbrirModalNuevoMovimiento = () => {
    setTipoOperacionModal("PRESTAMO_OPERADOR");
    setOperadorSeleccionadoParaModal(null);
    setIsModalMovimientoOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Módulo Agentes-Banco (Multi-Banco y Control de Capital)" />

      {/* CABECERA PRINCIPAL CON SELECTOR DE BANCO Y ACCIONES */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              Gestión Multi-Banco y Agentes
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Administre capitales independientes, fondos en cuenta y préstamos por banco o entidad financiera.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => {
                fetchBancos();
                cargarDatosBanco(selectedBancoId, true);
              }}
              disabled={isRefreshing}
              className="flex items-center gap-2 text-xs py-2 px-3 border-gray-300 dark:border-gray-600"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-600" : ""}`} />
              {isRefreshing ? "Actualizando..." : "Actualizar"}
            </Button>

            {/* BOTÓN RESTRINGIDO VISUALMENTE SOLO PARA ADMINISTRADORES */}
            {esAdministrador && (
              <Button
                variant="outline"
                onClick={() => setIsModalCrearBancoOpen(true)}
                className="flex items-center gap-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-400 dark:text-indigo-300 dark:hover:bg-indigo-950/40 text-xs font-bold py-2 px-3.5"
                title="Acción exclusiva de Administrador"
              >
                <PlusCircle className="w-4 h-4" />
                + Nuevo Banco
              </Button>
            )}

            <Button
              variant="primary"
              onClick={handleAbrirModalNuevoMovimiento}
              disabled={!bancoActivo}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold px-4 py-2 text-xs sm:text-sm shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              Registrar Movimiento
            </Button>
          </div>
        </div>

        {/* SELECTOR DE BANCOS (TABS / PILLS DINÁMICAS) */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-indigo-500" />
              Seleccione Banco / Agente Activo:
            </span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
              {esAdministrador && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
              {bancos.length} banco(s) registrado(s)
            </span>
          </div>

          {bancos.length === 0 ? (
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-dashed border-indigo-200 dark:border-indigo-800 rounded-xl text-center">
              <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                {esAdministrador
                  ? "Aún no hay bancos registrados. Haga clic en \"+ Nuevo Banco\" para crear su primer agente financiero."
                  : "No hay bancos registrados disponibles actualmente."}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {bancos.map((banco) => {
                const isSelected = selectedBancoId === banco.id;
                return (
                  <button
                    key={banco.id}
                    type="button"
                    onClick={() => setSelectedBancoId(banco.id)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap border-2 ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-[1.02]"
                        : "bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Building2 className={`w-4 h-4 ${isSelected ? "text-white" : "text-indigo-500"}`} />
                    <span>{banco.nombre_banco}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                      }`}
                    >
                      Bs. {formatMonto(banco.monto_total)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Alertas dinámicas */}
      {feedback && (
        <Alert
          variant={feedback.type === "success" ? "success" : "error"}
          title={feedback.type === "success" ? "Éxito" : "Error"}
          message={feedback.message}
        />
      )}

      {/* BANNER DEL BANCO ACTIVO CON BOTÓN DE ELIMINACIÓN */}
      {bancoActivo && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Building2 className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <p className="text-xs uppercase tracking-wider text-indigo-200 font-bold">Banco Activo</p>
              </div>
              <h3 className="text-xl font-black">{bancoActivo.nombre_banco}</h3>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end text-xs">
            <div className="bg-white/10 px-3 py-1.5 rounded-lg">
              <span className="text-indigo-200">Capital Asignado: </span>
              <strong className="text-white text-sm">Bs. {formatMonto(bancoActivo.monto_total)}</strong>
            </div>

            {/* BOTÓN ELIMINAR BANCO / AGENTE (EXCLUSIVO ADMINISTRADOR) */}
            {esAdministrador && (
              <button
                type="button"
                onClick={handleEliminarBanco}
                disabled={isDeleting}
                title="Eliminar este banco/agente"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? "Eliminando..." : "Eliminar Banco"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4 TARJETAS DINÁMICAS DE CAPITAL CONECTADAS DIRECTAMENTE AL BANCO SELECCIONADO (bancoActivoData) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* BLOQUE 1: EFECTIVO (AZUL) */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/60 dark:from-blue-950/40 dark:to-blue-900/20 border-2 border-blue-500/60 dark:border-blue-500/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-3 right-3 p-2.5 bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
            1. Efectivo Disponible
          </p>
          <div className="mt-3">
            {loading ? (
              <div className="h-9 flex items-center">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
              </div>
            ) : (
              <h3 className="text-2xl sm:text-3xl font-extrabold text-blue-900 dark:text-blue-100">
                Bs. {formatMonto(bancoActivoData.monto_efectivo)}
              </h3>
            )}
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1 flex items-center gap-1 font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
              Efectivo físico en caja ({bancoActivo?.nombre_banco || "General"})
            </p>
          </div>
        </div>

        {/* BLOQUE 2: SALDO EN CUENTA / BANCO (AMARILLO) */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-amber-900/20 border-2 border-amber-500/60 dark:border-amber-500/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-3 right-3 p-2.5 bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
            2. Saldo en Cuenta / Banco
          </p>
          <div className="mt-3">
            {loading ? (
              <div className="h-9 flex items-center">
                <RefreshCw className="w-5 h-5 animate-spin text-amber-600" />
              </div>
            ) : (
              <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-900 dark:text-amber-100">
                Bs. {formatMonto(bancoActivoData.monto_banco)}
              </h3>
            )}
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1 flex items-center gap-1 font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
              Saldo digital en {bancoActivo?.nombre_banco || "cuenta"}
            </p>
          </div>
        </div>

        {/* BLOQUE 3: CUENTAS POR COBRAR (VERDE) */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-emerald-950/40 dark:to-emerald-900/20 border-2 border-emerald-500/60 dark:border-emerald-500/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-3 right-3 p-2.5 bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
            3. Cuentas por Cobrar
          </p>
          <div className="mt-3">
            {loading ? (
              <div className="h-9 flex items-center">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
              </div>
            ) : (
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-900 dark:text-emerald-100">
                Bs. {formatMonto(bancoActivoData.monto_cuentas_por_cobrar ?? totalDeudaOperadores)}
              </h3>
            )}
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1 flex items-center gap-1 font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              {operadores.length} operador(es) deudores
            </p>
          </div>
        </div>

        {/* BLOQUE 4: TOTAL CAPITAL CONSTANTE (ROJO - DESTACADO) */}
        <div className="bg-gradient-to-br from-rose-50 to-red-100/80 dark:from-rose-950/50 dark:to-red-900/30 border-2 border-red-500 dark:border-red-500 rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden">
          <div className="absolute top-3 right-3 p-2.5 bg-red-500/15 dark:bg-red-400/15 text-red-600 dark:text-red-400 rounded-xl">
            <PieChart className="w-6 h-6" />
          </div>
          <p className="text-xs font-extrabold text-red-700 dark:text-red-300 uppercase tracking-wider">
            4. TOTAL CAPITAL CONSTANTE
          </p>
          <div className="mt-3">
            {loading ? (
              <div className="h-9 flex items-center">
                <RefreshCw className="w-5 h-5 animate-spin text-rose-600" />
              </div>
            ) : (
              <h3 className="text-2xl sm:text-3xl font-black text-red-900 dark:text-red-100">
                Bs. {formatMonto(
                  bancoActivoData.monto_total ||
                  bancoActivo?.monto_total ||
                  (bancoActivoData.monto_efectivo +
                    bancoActivoData.monto_banco +
                    (bancoActivoData.monto_cuentas_por_cobrar || totalDeudaOperadores))
                )}
              </h3>
            )}
            <p className="text-xs text-red-700 dark:text-red-300 mt-1 flex items-center gap-1 font-semibold">
              <span className="inline-block w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
              Efectivo + Banco + Por Cobrar
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: OPERADORES Y HISTORIAL DEL BANCO SELECCIONADO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMNA IZQUIERDA: LISTA DE OPERADORES DEL BANCO ACTIVO */}
        <div className="lg:col-span-2 space-y-4">
          <ComponentCard
            title={`Operadores y Deudas - ${bancoActivo?.nombre_banco || "General"}`}
            desc={`Control de préstamos otorgados y cuentas por cobrar asociadas a ${bancoActivo?.nombre_banco || "este agente"}.`}
          >
            {/* Barra de búsqueda */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar operador..."
                  value={searchTermOperador}
                  onChange={(e) => setSearchTermOperador(e.target.value)}
                  className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent pl-9 pr-4 py-2 text-xs text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary border-gray-300 dark:border-gray-700"
                />
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <span>Total deudas:</span>
                <strong className="text-emerald-700 dark:text-emerald-400 text-sm font-bold">
                  Bs. {formatMonto(totalDeudaOperadores)}
                </strong>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                Cargando operadores de {bancoActivo?.nombre_banco || "banco"}...
              </div>
            ) : filteredOperadores.length === 0 ? (
              <div className="py-12 text-center text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                <Users className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="font-semibold text-gray-600 dark:text-gray-300 text-sm">
                  {searchTermOperador
                    ? "No se encontraron operadores con ese criterio"
                    : `No hay operadores con deudas en ${bancoActivo?.nombre_banco || "este banco"}`}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Utilice el botón "Registrar Movimiento" para otorgar un nuevo préstamo.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase text-[11px]">
                      <th className="py-3 px-3">Operador</th>
                      <th className="py-3 px-3 text-right">Monto Pendiente</th>
                      <th className="py-3 px-3 text-center">Estado</th>
                      <th className="py-3 px-3 text-right">Acciones Rápidas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredOperadores.map((op) => {
                      const deuda = Number(op.monto_pendiente || 0);
                      const tieneDeuda = deuda > 0;
                      return (
                        <tr
                          key={op.id || op.nombre_operador}
                          className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                                {op.nombre_operador.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                                  {op.nombre_operador}
                                </p>
                                {(op.telefono || op.ci) && (
                                  <p className="text-[11px] text-gray-400">
                                    {op.ci ? `CI: ${op.ci}` : ""} {op.telefono ? `• Tel: ${op.telefono}` : ""}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <span
                              className={`font-extrabold text-sm ${
                                tieneDeuda
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-gray-400 dark:text-gray-500"
                              }`}
                            >
                              Bs. {formatMonto(deuda)}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            {tieneDeuda ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                <AlertCircle className="w-3 h-3" />
                                Con Saldo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                <CheckCircle2 className="w-3 h-3" />
                                Al Día
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Botón Cobrar Deuda */}
                              <button
                                type="button"
                                onClick={() => handleAbrirModalParaOperador(op, "COBRO")}
                                disabled={!tieneDeuda}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                  tieneDeuda
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800"
                                }`}
                                title="Registrar cobro de este operador"
                              >
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                                Cobrar
                              </button>

                              {/* Botón Prestar */}
                              <button
                                type="button"
                                onClick={() => handleAbrirModalParaOperador(op, "PRESTAMO")}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm flex items-center gap-1"
                                title="Otorgar nuevo préstamo a este operador"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                Prestar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </ComponentCard>
        </div>

        {/* COLUMNA DERECHA: HISTORIAL RECIENTE */}
        <div className="space-y-4">
          <ComponentCard
            title="Últimos Movimientos"
            desc={`Flujo de ${bancoActivo?.nombre_banco || "agente"}.`}
          >
            {transacciones.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                <Clock className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-1" />
                No hay movimientos registrados para este banco.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {transacciones.map((t) => {
                  const tipoStr = String(t?.tipo || "");
                  const isPrestamo =
                    tipoStr === "PRESTAMO_OPERADOR" ||
                    tipoStr === "PRESTAMO" ||
                    tipoStr === "EGRESO_BANCO";
                  const viaStr = String(t?.origen_fondo || (t as any)?.via || "BANCO");
                  const fechaStr = t?.fecha || t?.created_at;
                  const fechaDisplay = fechaStr ? new Date(fechaStr).toLocaleDateString("es-BO") : "-";

                  return (
                    <div
                      key={t?.id || Math.random()}
                      className="p-3 bg-gray-50/70 dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-700 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`p-2 rounded-lg mt-0.5 ${
                            isPrestamo
                              ? "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                              : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                          }`}
                        >
                          {isPrestamo ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-gray-200">
                            {t?.nombre_operador || (t as any)?.usuario?.nombre || "Operación General"}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            {t?.motivo || (t as any)?.observacion || (tipoStr ? tipoStr.replace(/_/g, " ") : "Movimiento")}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                            <span>Vía: <strong>{viaStr}</strong></span>
                            <span>•</span>
                            <span>{fechaDisplay}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={`font-black text-xs ${
                            isPrestamo
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isPrestamo ? "-" : "+"}Bs. {formatMonto(t?.monto)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ComponentCard>
        </div>
      </div>

      {/* MODAL CREAR BANCO (SOLO RENDERIZABLE SI ES ADMIN) */}
      {esAdministrador && (
        <ModalCrearBanco
          isOpen={isModalCrearBancoOpen}
          onClose={() => setIsModalCrearBancoOpen(false)}
          onBancoCreado={handleBancoCreado}
        />
      )}

      {/* MODAL DE REGISTRAR MOVIMIENTO CON OPERADORES DE LA BD */}
      <ModalRegistrarMovimiento
        isOpen={isModalMovimientoOpen}
        onClose={() => setIsModalMovimientoOpen(false)}
        bancoActivo={bancoActivo}
        operadorInicial={operadorSeleccionadoParaModal}
        tipoInicial={tipoOperacionModal}
        onMovimientoRegistrado={() => {
          cargarDatosBanco(selectedBancoId, false);
          setFeedback({
            type: "success",
            message: `Movimiento registrado con éxito en ${bancoActivo?.nombre_banco || "Banco"}.`,
          });
          setTimeout(() => setFeedback(null), 4000);
        }}
      />
    </div>
  );
};

export default AgentesBancoMain;
