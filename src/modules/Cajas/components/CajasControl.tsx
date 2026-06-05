import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import Button from "../../../components/ui/button/Button";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import { CajasService } from "../services/cajasService";
import { RecargasService } from "../services/recargasService";
import Alert from "../../../components/ui/alert/Alert";
import { Caja, SesionCaja } from "../interfaces/Caja";
import ComponentCard from "../../../components/common/ComponentCard";
import { useCaja } from "../../../context/CajaContext";

const CajasControl = () => {
  const [caja, setCaja] = useState<Caja | null>(null);
  const [sesionActiva, setSesionActiva] = useState<SesionCaja | null>(null);
  const { abrirCaja, cerrarCaja } = useCaja();

  // Form states - Abrir Sesión
  const [montoInicial, setMontoInicial] = useState<number>(0);
  
  // Form states - Cerrar Sesión
  const [montoFinalReal, setMontoFinalReal] = useState<number>(0);

  // Form states - Movimiento
  const [tipoMovimiento, setTipoMovimiento] = useState<"INGRESO" | "EGRESO">("INGRESO");
  const [montoMovimiento, setMontoMovimiento] = useState<number>(0);
  const [motivoMovimiento, setMotivoMovimiento] = useState<string>("");

  // Recargas States
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [saldosIniciales, setSaldosIniciales] = useState<{ [key: number]: number }>({});
  const [saldosFinales, setSaldosFinales] = useState<{ [key: number]: number }>({});
  const [controlesRecarga, setControlesRecarga] = useState<any[]>([]);
  const [resumenRecargas, setResumenRecargas] = useState<any | null>(null);

  // Form states - Registrar Operación Recarga
  const [tipoOpRecarga, setTipoOpRecarga] = useState<"VENTA_RECARGA" | "COMPRA_SALDO">("VENTA_RECARGA");
  const [idProveedorSeleccionado, setIdProveedorSeleccionado] = useState<number>(0);
  const [montoRecarga, setMontoRecarga] = useState<number>(0);
  const [numeroTelefono, setNumeroTelefono] = useState<string>("");
  const [nroReferencia, setNroReferencia] = useState<string>("");

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Hubo un problema al ejecutar la operación.");

  const navigate = useNavigate();
  const { id } = useParams();

  const fetchProveedores = async () => {
    try {
      await RecargasService.seedProveedores();
      const res = await RecargasService.getProveedores();
      setProveedores(res.data);
      if (res.data.length > 0) {
        setIdProveedorSeleccionado(res.data[0].id);
        const init: { [key: number]: number } = {};
        const fin: { [key: number]: number } = {};
        res.data.forEach((p: any) => {
          init[p.id] = 0;
          fin[p.id] = 0;
        });
        setSaldosIniciales(init);
        setSaldosFinales(fin);
      }
    } catch (error) {
      console.error("Error al obtener proveedores", error);
    }
  };

  const fetchCajaData = async () => {
    try {
      const response = await CajasService.getCajaById(Number(id));
      const data: Caja = response.data;
      setCaja(data);
      const activa = data.sesiones?.find(s => s.estado_sesion === "ABIERTA");
      setSesionActiva(activa || null);
      if (activa) {
        // Cargar controles de recargas de la sesión
        const resumenRes = await RecargasService.getResumenSesion(activa.id);
        setResumenRecargas(resumenRes.data);
        setControlesRecarga(resumenRes.data.controles || []);
      } else {
        setResumenRecargas(null);
        setControlesRecarga([]);
      }
    } catch (error) {
      console.error("Error al cargar datos de la caja", error);
    }
  };

  useEffect(() => {
    fetchProveedores();
    fetchCajaData();
  }, [id]);

  const handleAbrirSesion = async () => {
    if (montoInicial < 0) return alert("El monto inicial debe ser válido.");
    try {
      const nuevaSesion = await abrirCaja(Number(id), montoInicial);
      if (nuevaSesion && nuevaSesion.id) {
        const saldosArr = Object.entries(saldosIniciales).map(([provId, saldo]) => ({
          id_proveedor: Number(provId),
          saldo_inicial: Number(saldo),
        }));
        await RecargasService.inicializarSaldosSesion({
          id_sesion_caja: nuevaSesion.id,
          saldos: saldosArr,
        });
      }
      setAlertMessage("Sesión abierta y saldos de recargas inicializados.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      fetchCajaData();
      fetchProveedores();
    } catch (error) {
      setErrorMessage("Hubo un problema al abrir la sesión.");
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const handleCerrarSesion = async () => {
    if (!sesionActiva) return;
    if (montoFinalReal < 0) return alert("El monto final real debe ser válido.");
    try {
      const saldosArr = Object.entries(saldosFinales).map(([provId, saldo]) => ({
        id_proveedor: Number(provId),
        saldo_final_real: Number(saldo),
      }));
      await RecargasService.finalizarSaldosSesion(sesionActiva.id, {
        saldos: saldosArr,
      });

      await cerrarCaja(montoFinalReal, sesionActiva.id);
      setAlertMessage("Sesión cerrada correctamente. Arqueo de caja y recargas completado.");
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      fetchCajaData();
      fetchProveedores();
    } catch (error) {
      setErrorMessage("Hubo un problema al cerrar la sesión.");
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const handleMovimiento = async () => {
    if (!sesionActiva) return;
    if (montoMovimiento <= 0 || !motivoMovimiento) return alert("Ingrese un monto válido y un motivo.");
    try {
      await CajasService.registrarMovimiento({
        tipo: tipoMovimiento,
        monto: montoMovimiento,
        motivo: motivoMovimiento,
        id_sesion_caja: sesionActiva.id,
        id_user_create: 0
      });
      setAlertMessage(`Movimiento de ${tipoMovimiento} registrado.`);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      setMontoMovimiento(0);
      setMotivoMovimiento("");
    } catch (error) {
      setErrorMessage("Error al registrar movimiento.");
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const handleRegistrarRecarga = async () => {
    if (!sesionActiva) return;
    if (montoRecarga <= 0) return alert("Ingrese un monto de recarga válido.");
    if (tipoOpRecarga === "VENTA_RECARGA" && !numeroTelefono) return alert("Ingrese el número de celular del cliente.");
    if (tipoOpRecarga === "COMPRA_SALDO" && !nroReferencia) return alert("Ingrese el número de referencia del depósito.");

    try {
      await RecargasService.registrarTransaccion({
        tipo_operacion: tipoOpRecarga,
        id_proveedor: idProveedorSeleccionado,
        monto: montoRecarga,
        numero_telefono: tipoOpRecarga === "VENTA_RECARGA" ? numeroTelefono : undefined,
        nro_referencia: tipoOpRecarga === "COMPRA_SALDO" ? nroReferencia : undefined,
        id_sesion_caja: sesionActiva.id,
      });

      setAlertMessage(`${tipoOpRecarga === "VENTA_RECARGA" ? "Venta" : "Compra"} de recarga registrada con éxito.`);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      setMontoRecarga(0);
      setNumeroTelefono("");
      setNroReferencia("");
      
      // Recargar datos actualizados
      fetchCajaData();
      fetchProveedores();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Error al procesar la operación de recarga.";
      setErrorMessage(msg);
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
    }
  };

  if (!caja) return <div className="p-6">Cargando datos de caja...</div>;

  return (
    <div>
      <PageBreadcrumb pageTitle={`Control de Caja - ${caja.nombre}`} />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {caja.nombre}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Especialidad: {caja.especialidad.replace("_", " ")}
          </p>
        </div>
        <Button
          className="bg-gray-500 hover:bg-gray-600 text-white"
          onClick={() => navigate("/cajas")}
        >
          Volver
        </Button>
      </div>

      {showAlert && (
        <div className="mb-4">
          <Alert variant="success" title="Éxito" message={alertMessage} />
        </div>
      )}
      {showError && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message={errorMessage} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel 1: Estado de Sesión / Apertura / Cierre */}
        <div className="space-y-6">
          <ComponentCard title="Estado Actual de la Caja">
            {sesionActiva ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <h4 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">Sesión Abierta</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">ID Sesión: <span className="font-medium text-gray-900 dark:text-gray-100">{sesionActiva.id}</span></p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Apertura: <span className="font-medium text-gray-900 dark:text-gray-100">{new Date(sesionActiva.fecha_apertura).toLocaleString()}</span></p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Monto Inicial: <span className="font-semibold text-gray-900 dark:text-gray-100">Bs. {sesionActiva.monto_inicial}</span></p>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Cerrar Sesión (Arqueo)</h4>
                  
                  {/* Formulario de conteo físico de recargas antes de cerrar */}
                  <div className="mb-4 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h5 className="font-semibold text-xs text-gray-700 dark:text-gray-300 mb-2">Arqueo Final Recargas (Saldo en Línea)</h5>
                    <div className="grid grid-cols-1 gap-2">
                      {proveedores.map(p => (
                        <div key={p.id} className="flex justify-between items-center">
                          <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">{p.nombre}</label>
                          <div className="w-1/2">
                            <Input
                              type="number"
                              step={0.10}
                              min="0"
                              placeholder="Físico real"
                              value={saldosFinales[p.id] || ""}
                              onChange={(e) => setSaldosFinales({
                                ...saldosFinales,
                                [p.id]: Number(e.target.value)
                              })}
                            />
                            {controlesRecarga.find(c => c.proveedor === p.nombre) && (
                              <span className="text-[10px] text-blue-500 block text-right mt-0.5">
                                Teórico: Bs. {controlesRecarga.find(c => c.proveedor === p.nombre)?.saldo_final_teorico}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <Label>Dinero Físico en Caja (Bs.)</Label>
                    <Input
                      type="number"
                      step={0.10}
                      min="0"
                      value={montoFinalReal}
                      onChange={(e) => setMontoFinalReal(Number(e.target.value))}
                    />
                  </div>
                  <Button
                    variant="primary"
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleCerrarSesion}
                  >
                    Confirmar Cierre de Caja
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-center">
                  <h4 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Caja Cerrada</h4>
                  <p className="text-sm text-gray-400 mt-1">No hay una sesión activa para esta caja.</p>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Abrir Nueva Sesión</h4>
                  
                  <div className="mb-4 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h5 className="font-semibold text-xs text-gray-700 dark:text-gray-300 mb-2">Inicializar Saldos Recargas (Líneas)</h5>
                    <div className="grid grid-cols-3 gap-2">
                      {proveedores.map(p => (
                        <div key={p.id}>
                          <label className="text-[10px] text-gray-600 dark:text-gray-400 font-medium block mb-1">{p.nombre}</label>
                          <Input
                            type="number"
                            step={0.10}
                            min="0"
                            value={saldosIniciales[p.id] || ""}
                            onChange={(e) => setSaldosIniciales({
                              ...saldosIniciales,
                              [p.id]: Number(e.target.value)
                            })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <Label>Monto Inicial / Sencillo (Bs.)</Label>
                    <Input
                      type="number"
                      step={0.10}
                      min="0"
                      value={montoInicial}
                      onChange={(e) => setMontoInicial(Number(e.target.value))}
                    />
                  </div>
                  <Button
                    variant="primary"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleAbrirSesion}
                  >
                    Abrir Caja
                  </Button>
                </div>
              </div>
            )}
          </ComponentCard>
        </div>

        {/* Panel 2: Movimientos de Caja Chica */}
        <div className="space-y-6">
          <ComponentCard title="Movimiento de Efectivo">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Registra transacciones de efectivo ordinarias que alteran el cuadre directo de caja.
            </p>
            
            <div className="space-y-4">
              <div>
                <Label>Tipo de Movimiento</Label>
                <Select
                  options={[
                    { value: "INGRESO", label: "Ingreso (+)" },
                    { value: "EGRESO", label: "Egreso (-)" }
                  ]}
                  onChange={(val) => setTipoMovimiento(val as "INGRESO" | "EGRESO")}
                  defaultValue={tipoMovimiento}
                />
              </div>

              <div>
                <Label>Monto (Bs.)</Label>
                <Input
                  type="number"
                  step={0.10}
                  min="0.10"
                  value={montoMovimiento}
                  onChange={(e) => setMontoMovimiento(Number(e.target.value))}
                  disabled={!sesionActiva}
                />
              </div>

              <div>
                <Label>Motivo / Justificación</Label>
                <Input
                  type="text"
                  placeholder="Ej: Pago de material de limpieza"
                  value={motivoMovimiento}
                  onChange={(e) => setMotivoMovimiento(e.target.value)}
                  disabled={!sesionActiva}
                />
              </div>

              <Button
                variant="primary"
                className={`w-full text-white ${
                  tipoMovimiento === "INGRESO" ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"
                } ${!sesionActiva ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={handleMovimiento}
                disabled={!sesionActiva}
              >
                Registrar {tipoMovimiento}
              </Button>
              
              {!sesionActiva && (
                <p className="text-xs text-red-500 text-center mt-2">Debe abrir sesión para registrar movimientos.</p>
              )}
            </div>
          </ComponentCard>
        </div>

        {/* Panel 3: Gestión de Recargas (Solo Activo con Sesión Abierta) */}
        <div className="space-y-6">
          <ComponentCard title="Líneas y Operaciones de Recargas">
            {/* Saldos Actuales */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Saldos de Líneas Disponibles</h4>
              <div className="grid grid-cols-3 gap-2">
                {proveedores.map(p => (
                  <div key={p.id} className="p-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-medium uppercase">{p.nombre}</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Bs. {p.saldo_actual}</span>
                    <span className="text-[9px] text-green-500 block">Com: {p.comision_porcentaje}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Registrar Transacción de Recarga</h4>
              
              <div>
                <Label>Tipo de Transacción</Label>
                <Select
                  options={[
                    { value: "VENTA_RECARGA", label: "Vender Recarga a Cliente (+ Caja / - Línea)" },
                    { value: "COMPRA_SALDO", label: "Comprar Saldo Mayorista (- Caja / + Línea)" }
                  ]}
                  onChange={(val) => setTipoOpRecarga(val as "VENTA_RECARGA" | "COMPRA_SALDO")}
                  defaultValue={tipoOpRecarga}
                  disabled={!sesionActiva}
                />
              </div>

              <div>
                <Label>Operador Telefónico</Label>
                <Select
                  options={proveedores.map(p => ({ value: String(p.id), label: p.nombre }))}
                  onChange={(val) => setIdProveedorSeleccionado(Number(val))}
                  defaultValue={String(idProveedorSeleccionado)}
                  disabled={!sesionActiva}
                />
              </div>

              <div>
                <Label>Monto (Bs.)</Label>
                <Input
                  type="number"
                  step={1}
                  min="1"
                  value={montoRecarga || ""}
                  onChange={(e) => setMontoRecarga(Number(e.target.value))}
                  disabled={!sesionActiva}
                  placeholder="Monto de recarga"
                />
              </div>

              {tipoOpRecarga === "VENTA_RECARGA" ? (
                <div>
                  <Label>Número Telefónico (Cliente)</Label>
                  <Input
                    type="text"
                    value={numeroTelefono}
                    onChange={(e) => setNumeroTelefono(e.target.value)}
                    disabled={!sesionActiva}
                    placeholder="Ej. 70712345"
                  />
                </div>
              ) : (
                <div>
                  <Label>Nro. Referencia (Depósito / Pago)</Label>
                  <Input
                    type="text"
                    value={nroReferencia}
                    onChange={(e) => setNroReferencia(e.target.value)}
                    disabled={!sesionActiva}
                    placeholder="Ej. DEP-55443"
                  />
                </div>
              )}

              <Button
                variant="primary"
                className={`w-full text-white bg-blue-600 hover:bg-blue-700 ${!sesionActiva ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={handleRegistrarRecarga}
                disabled={!sesionActiva}
              >
                Procesar {tipoOpRecarga === "VENTA_RECARGA" ? "Venta" : "Compra"}
              </Button>
            </div>

            {/* Resumen Sesión Acumulado */}
            {sesionActiva && resumenRecargas && (
              <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4 bg-gray-50 dark:bg-gray-800/30 p-3 rounded-lg">
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 text-center">Acumulado Recargas (Sesión)</h4>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Total Ventas (Ingreso):</span>
                  <span className="font-semibold text-green-600">Bs. {resumenRecargas.total_ventas || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Total Compras (Egreso):</span>
                  <span className="font-semibold text-red-500">Bs. {resumenRecargas.total_compras || 0}</span>
                </div>
              </div>
            )}
          </ComponentCard>
        </div>
      </div>
    </div>
  );
};

export default CajasControl;
