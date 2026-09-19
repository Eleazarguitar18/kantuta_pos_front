import React, { useState, useEffect } from "react";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import { Building2, PlusCircle, RefreshCw, Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import { AgentesService } from "../services/agentesService";
import { AgenteBanco, CrearAgenteDTO } from "../interfaces/Agente";
import Swal from "sweetalert2";

interface ModalCrearBancoProps {
  isOpen: boolean;
  onClose: () => void;
  onBancoCreado: (nuevoBanco: AgenteBanco) => void;
}

export const ModalCrearBanco: React.FC<ModalCrearBancoProps> = ({
  isOpen,
  onClose,
  onBancoCreado,
}) => {
  const [nombreBanco, setNombreBanco] = useState<string>("");
  const [capitalInicial, setCapitalInicial] = useState<number | "">("");
  const [montoEfectivo, setMontoEfectivo] = useState<number | "">("");
  const [montoBanco, setMontoBanco] = useState<number | "">("");
  const [descripcion, setDescripcion] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const resetForm = () => {
    setNombreBanco("");
    setCapitalInicial("");
    setMontoEfectivo("");
    setMontoBanco("");
    setDescripcion("");
  };

  // Auto-ajustar monto banco cuando se define el capital total y se escribe en montoEfectivo o viceversa
  const handleCapitalChange = (val: number | "") => {
    setCapitalInicial(val);
    if (val === "" || val === 0) {
      setMontoEfectivo("");
      setMontoBanco("");
    } else {
      // Si el usuario aún no había desglosado, por defecto el saldo en cuenta asume el total
      if (montoEfectivo === "" && montoBanco === "") {
        setMontoBanco(Number(val));
        setMontoEfectivo(0);
      } else if (typeof montoEfectivo === "number") {
        const diff = Number((val - montoEfectivo).toFixed(2));
        setMontoBanco(diff >= 0 ? diff : 0);
      }
    }
  };

  const handleEfectivoChange = (val: number | "") => {
    setMontoEfectivo(val);
    const efNum = val === "" ? 0 : Number(val);
    const totalNum = capitalInicial === "" ? 0 : Number(capitalInicial);
    if (totalNum > 0) {
      const remaining = Number((totalNum - efNum).toFixed(2));
      setMontoBanco(remaining >= 0 ? remaining : 0);
    }
  };

  const handleBancoChange = (val: number | "") => {
    setMontoBanco(val);
    const bNum = val === "" ? 0 : Number(val);
    const totalNum = capitalInicial === "" ? 0 : Number(capitalInicial);
    if (totalNum > 0) {
      const remaining = Number((totalNum - bNum).toFixed(2));
      setMontoEfectivo(remaining >= 0 ? remaining : 0);
    }
  };

  // Validar si la suma cuadra exactamente
  const totalNum = capitalInicial === "" ? 0 : Number(capitalInicial);
  const efNum = montoEfectivo === "" ? 0 : Number(montoEfectivo);
  const bNum = montoBanco === "" ? 0 : Number(montoBanco);
  const sumaDesglose = Number((efNum + bNum).toFixed(2));
  const desglosadoCuadrado = totalNum > 0 && Math.abs(sumaDesglose - totalNum) < 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nombreLimpio = nombreBanco.trim();
    if (!nombreLimpio || nombreLimpio.length < 3) {
      Swal.fire({
        icon: "warning",
        title: "Nombre Requerido",
        text: "Por favor ingrese un nombre válido para el banco o agente (mínimo 3 caracteres).",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    if (isNaN(totalNum) || totalNum <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Capital Inválido",
        text: "Por favor ingrese un monto de capital inicial válido mayor a 0.",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    // Validar suma: Saldo Efectivo + Saldo Banco == Monto Total
    if (!desglosadoCuadrado) {
      Swal.fire({
        icon: "warning",
        title: "Desglose Descuadrado",
        text: `La suma de Efectivo (Bs. ${efNum.toFixed(2)}) + Saldo en Cuenta (Bs. ${bNum.toFixed(2)}) es Bs. ${sumaDesglose.toFixed(2)}, la cual debe ser igual al Capital Total (Bs. ${totalNum.toFixed(2)}).`,
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    // Payload exacto y limpio garantizando los saldos iniciales numéricos
    const payload: CrearAgenteDTO = {
      nombre_banco: nombreLimpio,
      monto_total: Number(totalNum.toFixed(2)),
      monto_efectivo: Number(efNum.toFixed(2)),
      monto_banco: Number(bNum.toFixed(2)),
      ...(descripcion.trim() ? { descripcion: descripcion.trim() } : {}),
    };

    setIsSubmitting(true);
    try {
      const response = await AgentesService.crearBanco(payload);
      const bancoCreado = response.data;

      // Asegurarse de que el objeto devuelto contenga los valores enviados
      const bancoCompleto: AgenteBanco = {
        ...bancoCreado,
        nombre_banco: bancoCreado.nombre_banco || nombreLimpio,
        monto_total: Number(bancoCreado.monto_total ?? payload.monto_total),
        monto_efectivo: Number(bancoCreado.monto_efectivo ?? payload.monto_efectivo),
        monto_banco: Number(bancoCreado.monto_banco ?? payload.monto_banco),
        monto_cuentas_por_cobrar: Number(bancoCreado.monto_cuentas_por_cobrar ?? 0),
      };

      Swal.fire({
        icon: "success",
        title: "¡Banco Registrado!",
        text: `El banco "${bancoCompleto.nombre_banco}" ha sido creado con éxito con un capital de Bs. ${bancoCompleto.monto_total.toFixed(2)} (Efectivo: Bs. ${bancoCompleto.monto_efectivo.toFixed(2)}, Cuenta: Bs. ${bancoCompleto.monto_banco.toFixed(2)}).`,
        timer: 2500,
        showConfirmButton: false,
      });

      resetForm();
      onBancoCreado(bancoCompleto);
      onClose();
    } catch (error: any) {
      console.error("Error al registrar nuevo banco:", error);
      const msg = error?.response?.data?.message || "No se pudo registrar el nuevo banco.";
      Swal.fire({
        icon: "error",
        title: "Error al Registrar",
        text: typeof msg === "string" ? msg : JSON.stringify(msg),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      className="max-w-md p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Registrar Nuevo Banco / Agente
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Cree un nuevo agente financiero con sus saldos iniciales de capital, efectivo y banco.
          </p>
        </div>

        <div className="space-y-4">
          {/* Nombre del Banco */}
          <div>
            <Label htmlFor="nombre_banco">Nombre del Banco / Agente *</Label>
            <Input
              id="nombre_banco"
              type="text"
              placeholder="Ej: Banco Unión, BCP, Banco FIE, Yape..."
              value={nombreBanco}
              onChange={(e) => setNombreBanco(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Capital Total Inicial */}
          <div>
            <Label htmlFor="capital_inicial">Capital Inicial Total (Bs.) *</Label>
            <div className="relative">
              <Input
                id="capital_inicial"
                type="number"
                step={0.10}
                min="0.10"
                placeholder="0.00"
                value={capitalInicial}
                onChange={(e) => {
                  const val = e.target.value;
                  handleCapitalChange(val === "" ? "" : parseFloat(val) || 0);
                }}
                className="font-bold text-lg text-indigo-600 dark:text-indigo-400"
                required
                disabled={isSubmitting}
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Monto total inicial asignado a este banco o agente.
            </p>
          </div>

          {/* Desglose Obligatorio de Saldos Iniciales */}
          <div className="bg-gray-50 dark:bg-gray-800/70 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-indigo-500" />
                Desglose de Saldos Iniciales *
              </p>
              {totalNum > 0 && (
                <span
                  className={`text-[11px] font-bold flex items-center gap-1 ${
                    desglosadoCuadrado ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {desglosadoCuadrado ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Cuadrado (100%)
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" />
                      Diferencia: Bs. {Math.abs(totalNum - sumaDesglose).toFixed(2)}
                    </>
                  )}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Saldo Inicial en Efectivo */}
              <div>
                <Label htmlFor="monto_efectivo" className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                  Saldo en Efectivo (Bs.) *
                </Label>
                <Input
                  id="monto_efectivo"
                  type="number"
                  step={0.10}
                  min="0"
                  placeholder="0.00"
                  value={montoEfectivo}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleEfectivoChange(val === "" ? "" : parseFloat(val) || 0);
                  }}
                  disabled={isSubmitting}
                  className="text-xs font-bold text-blue-800 dark:text-blue-200"
                  required
                />
              </div>

              {/* Saldo Inicial en Banco / Digital */}
              <div>
                <Label htmlFor="monto_banco" className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  Saldo en Cuenta/Banco (Bs.) *
                </Label>
                <Input
                  id="monto_banco"
                  type="number"
                  step={0.10}
                  min="0"
                  placeholder="0.00"
                  value={montoBanco}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleBancoChange(val === "" ? "" : parseFloat(val) || 0);
                  }}
                  disabled={isSubmitting}
                  className="text-xs font-bold text-amber-800 dark:text-amber-200"
                  required
                />
              </div>
            </div>

            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              * La suma de Efectivo + Cuenta debe coincidir exactamente con el Capital Total.
            </p>
          </div>

          {/* Descripción */}
          <div>
            <Label htmlFor="descripcion">Descripción / Notas (Opcional)</Label>
            <Input
              id="descripcion"
              type="text"
              placeholder="Ej: Agente Principal Sucursal 1"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={
              isSubmitting ||
              !nombreBanco.trim() ||
              capitalInicial === "" ||
              totalNum <= 0 ||
              !desglosadoCuadrado
            }
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Guardando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                Crear Banco
              </span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ModalCrearBanco;
