import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Button from "../../../components/ui/button/Button";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import { RecargasService } from "../../Cajas/services/recargasService";
import Alert from "../../../components/ui/alert/Alert";
import ComponentCard from "../../../components/common/ComponentCard";
import { useCaja } from "../../../context/CajaContext";

const RecargasMain = () => {
  const { sesionActiva, loading: loadingCaja } = useCaja();
  const navigate = useNavigate();

  // Recargas States
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [resumenRecargas, setResumenRecargas] = useState<any | null>(null);

  // Form states
  const [tipoOpRecarga, setTipoOpRecarga] = useState<"VENTA_RECARGA" | "COMPRA_SALDO">("VENTA_RECARGA");
  const [idProveedorSeleccionado, setIdProveedorSeleccionado] = useState<number>(0);
  const [montoRecarga, setMontoRecarga] = useState<number>(0);
  const [numeroTelefono, setNumeroTelefono] = useState<string>("");
  const [nroReferencia, setNroReferencia] = useState<string>("");

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchProveedores = async () => {
    try {
      await RecargasService.seedProveedores();
      const res = await RecargasService.getProveedores();
      setProveedores(res.data);
      if (res.data.length > 0 && idProveedorSeleccionado === 0) {
        setIdProveedorSeleccionado(res.data[0].id);
      }
    } catch (error) {
      console.error("Error al obtener proveedores", error);
    }
  };

  const fetchResumenSesion = async () => {
    if (sesionActiva) {
      try {
        const resumenRes = await RecargasService.getResumenSesion(sesionActiva.id);
        setResumenRecargas(resumenRes.data);
      } catch (error) {
        console.error("Error al cargar resumen de recargas", error);
      }
    }
  };

  useEffect(() => {
    fetchProveedores();
    fetchResumenSesion();
  }, [sesionActiva]);

  const handleRegistrarRecarga = async () => {
    if (!sesionActiva) return;
    if (montoRecarga <= 0) return alert("Ingrese un monto de recarga válido.");
    if (tipoOpRecarga === "VENTA_RECARGA" && !numeroTelefono) return alert("Ingrese el número de celular del cliente.");
    if (tipoOpRecarga === "COMPRA_SALDO" && !nroReferencia) return alert("Ingrese la referencia de depósito o motivo.");

    try {
      await RecargasService.registrarTransaccion({
        tipo_operacion: tipoOpRecarga,
        id_proveedor: idProveedorSeleccionado,
        monto: montoRecarga,
        numero_telefono: tipoOpRecarga === "VENTA_RECARGA" ? numeroTelefono : undefined,
        nro_referencia: tipoOpRecarga === "COMPRA_SALDO" ? nroReferencia : undefined,
        id_sesion_caja: sesionActiva.id,
      });

      setAlertMessage(`${tipoOpRecarga === "VENTA_RECARGA" ? "Venta" : "Inyección"} de recarga registrada con éxito.`);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      setMontoRecarga(0);
      setNumeroTelefono("");
      setNroReferencia("");
      
      fetchProveedores();
      fetchResumenSesion();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Error al procesar la operación de recarga.";
      setErrorMessage(msg);
      setShowError(true);
      setTimeout(() => setShowError(false), 4000);
    }
  };

  if (loadingCaja) {
    return <div className="p-6 text-center">Cargando datos de caja...</div>;
  }

  if (!sesionActiva) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
            <span className="text-2xl font-bold">!</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Caja Cerrada o Inactiva</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Debe tener una sesión de caja activa abierta para poder realizar operaciones de recargas. Por favor, inicie su turno de caja primero.
          </p>
          <Button
            variant="primary"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => navigate("/cajas")}
          >
            Ir a Control de Cajas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <PageBreadcrumb pageTitle="Operaciones de Recargas Telefónicas" />

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel Izquierdo: Dashboard de Liquidez en Tiempo Real */}
        <div className="lg:col-span-5 space-y-6">
          <ComponentCard title="Liquidez en Cajas de Operadoras (Virtual)">
            <p className="text-xs text-gray-500 mb-4">
              Cada operadora cuenta con su caja independiente. El saldo representa el crédito virtual telefónico disponible.
            </p>
            <div className="grid grid-cols-1 gap-4">
              {proveedores.map(p => {
                const saldo = Number(p.saldo_actual);
                let statusColor = "border-green-200 bg-green-50/50 text-green-700 dark:bg-green-950/20 dark:border-green-800 dark:text-green-400";
                let statusText = "Disponible";
                if (saldo < 50) {
                  statusColor = "border-red-200 bg-red-50/50 text-red-700 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400 animate-pulse";
                  statusText = "Crítico - Inyectar";
                } else if (saldo < 100) {
                  statusColor = "border-amber-200 bg-amber-50/50 text-amber-700 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400";
                  statusText = "Liquidez Baja";
                }

                let brandBorder = "border-l-4 border-l-blue-600";
                if (p.nombre.toLowerCase() === "viva") brandBorder = "border-l-4 border-l-green-500";
                if (p.nombre.toLowerCase() === "tigo") brandBorder = "border-l-4 border-l-blue-900";
                if (p.nombre.toLowerCase() === "entel") brandBorder = "border-l-4 border-l-orange-500";

                return (
                  <div key={p.id} className={`flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/40 rounded-xl ${brandBorder}`}>
                    <div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 block font-bold uppercase tracking-wider">{p.nombre}</span>
                      <span className={`inline-block text-[10px] px-2 py-0.5 mt-1 rounded-full border font-semibold ${statusColor}`}>
                        {statusText}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-extrabold text-gray-900 dark:text-white block">Bs. {saldo.toFixed(2)}</span>
                      <span className="text-xs text-gray-500">Comisión: {p.comision_porcentaje}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resumen Sesión Acumulado */}
            {resumenRecargas && (
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6 space-y-3">
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-center">Resumen de Turno de Recargas</h4>
                <div className="flex justify-between text-sm p-2 bg-green-50/40 dark:bg-green-950/10 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Total Ventas (Ingreso):</span>
                  <span className="font-bold text-green-600">Bs. {resumenRecargas.total_ventas || 0}</span>
                </div>
                <div className="flex justify-between text-sm p-2 bg-red-50/40 dark:bg-red-950/10 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Total Inyecciones (Egreso Caja):</span>
                  <span className="font-bold text-red-500">Bs. {resumenRecargas.total_compras || 0}</span>
                </div>
              </div>
            )}
          </ComponentCard>
        </div>

        {/* Panel Derecho: Registrar Operación */}
        <div className="lg:col-span-7 space-y-6">
          <ComponentCard title="Registrar Operación (Venta / Inyección)">
            <div className="space-y-5">
              <div>
                <Label>Tipo de Transacción</Label>
                <Select
                  options={[
                    { value: "VENTA_RECARGA", label: "Vender Recarga a Cliente" },
                    { value: "COMPRA_SALDO", label: "Inyectar Capital / Cargar Línea (Desde Caja)" }
                  ]}
                  onChange={(val) => {
                    setTipoOpRecarga(val as "VENTA_RECARGA" | "COMPRA_SALDO");
                    setMontoRecarga(0);
                  }}
                  defaultValue={tipoOpRecarga}
                />
              </div>

              <div>
                <Label>Operador Telefónico Destino</Label>
                <Select
                  options={proveedores.map(p => ({ value: String(p.id), label: p.nombre }))}
                  onChange={(val) => setIdProveedorSeleccionado(Number(val))}
                  defaultValue={String(idProveedorSeleccionado)}
                />
              </div>

              <div>
                <Label>Monto (Bs.)</Label>
                <div className="space-y-3">
                  <Input
                    type="number"
                    step={1}
                    min="1"
                    value={montoRecarga || ""}
                    onChange={(e) => setMontoRecarga(Number(e.target.value))}
                    placeholder="Monto de la transacción"
                  />
                  <div className="flex gap-2">
                    {[10, 20, 50, 100].map(amount => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setMontoRecarga(amount)}
                        className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 transition"
                      >
                        Bs. {amount}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Validación dinámica en caliente */}
              {tipoOpRecarga === "VENTA_RECARGA" && (
                (() => {
                  const prov = proveedores.find(p => p.id === idProveedorSeleccionado);
                  if (prov && montoRecarga > Number(prov.saldo_actual)) {
                    return (
                      <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-600 dark:text-red-400 font-semibold">
                        ⚠️ Saldo insuficiente en la línea de {prov.nombre}. Disponible: Bs. {Number(prov.saldo_actual).toFixed(2)}
                      </div>
                    );
                  }
                  return null;
                })()
              )}

              {tipoOpRecarga === "VENTA_RECARGA" ? (
                <div>
                  <Label>Número Telefónico (Cliente)</Label>
                  <Input
                    type="text"
                    value={numeroTelefono}
                    onChange={(e) => setNumeroTelefono(e.target.value)}
                    placeholder="Ej. 70712345"
                  />
                </div>
              ) : (
                <div>
                  <Label>Referencia de Operación / Justificación</Label>
                  <Input
                    type="text"
                    value={nroReferencia}
                    onChange={(e) => setNroReferencia(e.target.value)}
                    placeholder="Ej. Depósito Banco Unión, Transferencia de Caja, etc."
                  />
                  <p className="text-[11px] text-gray-500 mt-2">
                    Esta inyección restará la liquidez de la caja física activa e incrementará el saldo virtual de la operadora destino.
                  </p>
                </div>
              )}

              <Button
                variant="primary"
                className={`w-full py-3 text-white font-bold text-sm ${
                  tipoOpRecarga === "VENTA_RECARGA"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                } ${
                  (tipoOpRecarga === "VENTA_RECARGA" && (() => {
                    const prov = proveedores.find(p => p.id === idProveedorSeleccionado);
                    return prov && montoRecarga > Number(prov.saldo_actual);
                  })()) ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handleRegistrarRecarga}
                disabled={
                  tipoOpRecarga === "VENTA_RECARGA" && (() => {
                    const prov = proveedores.find(p => p.id === idProveedorSeleccionado);
                    return prov && montoRecarga > Number(prov.saldo_actual);
                  })()
                }
              >
                {tipoOpRecarga === "VENTA_RECARGA" ? "Confirmar Venta de Recarga" : "Confirmar Inyección de Fondos"}
              </Button>
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
};

export default RecargasMain;
