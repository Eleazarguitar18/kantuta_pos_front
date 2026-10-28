import React, { useEffect, useState, useMemo } from "react";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import { Banknote, Coins, RotateCcw } from "lucide-react";

export interface ValoresArqueo {
  // Billetes
  b200: number;
  b100: number;
  b50: number;
  b20: number;
  b10: number;
  // Monedas
  m5: number;
  m2: number;
  m1: number;
  m050: number;
  m020: number;
  m010: number;
  // Totales
  monedas: number; // Suma monetaria de monedas
  totalBilletes: number;
  totalMonedas: number;
  total: number;
  // Alias backend
  billete_200?: number;
  billete_100?: number;
  billete_50?: number;
  billete_20?: number;
  billete_10?: number;
  moneda_5?: number;
  moneda_2?: number;
  moneda_1?: number;
  moneda_050?: number;
  moneda_020?: number;
  moneda_010?: number;
  monedas_total?: number;
  monto_total_desglose?: number;
}

interface Props {
  onChangeTotal: (total: number, valores: ValoresArqueo) => void;
  disabled?: boolean;
}

const DENOMINACIONES_BILLETES = [
  { key: "b200" as const, valor: 200, label: "Bs. 200", color: "text-blue-600 dark:text-blue-400" },
  { key: "b100" as const, valor: 100, label: "Bs. 100", color: "text-red-600 dark:text-red-400" },
  { key: "b50" as const, valor: 50, label: "Bs. 50", color: "text-purple-600 dark:text-purple-400" },
  { key: "b20" as const, valor: 20, label: "Bs. 20", color: "text-amber-600 dark:text-amber-400" },
  { key: "b10" as const, valor: 10, label: "Bs. 10", color: "text-emerald-600 dark:text-emerald-400" },
];

const DENOMINACIONES_MONEDAS = [
  { key: "m5" as const, valor: 5, label: "Bs. 5.00" },
  { key: "m2" as const, valor: 2, label: "Bs. 2.00" },
  { key: "m1" as const, valor: 1, label: "Bs. 1.00" },
  { key: "m050" as const, valor: 0.5, label: "Bs. 0.50 (50 ctv)" },
  { key: "m020" as const, valor: 0.2, label: "Bs. 0.20 (20 ctv)" },
  { key: "m010" as const, valor: 0.1, label: "Bs. 0.10 (10 ctv)" },
];

const ESTADO_INICIAL: ValoresArqueo = {
  b200: 0,
  b100: 0,
  b50: 0,
  b20: 0,
  b10: 0,
  m5: 0,
  m2: 0,
  m1: 0,
  m050: 0,
  m020: 0,
  m010: 0,
  monedas: 0,
  totalBilletes: 0,
  totalMonedas: 0,
  total: 0,
};

const SeccionArqueoBilletes: React.FC<Props> = ({ onChangeTotal, disabled = false }) => {
  const [valores, setValores] = useState<ValoresArqueo>(ESTADO_INICIAL);

  const calculos = useMemo(() => {
    const totalBilletes =
      valores.b200 * 200 +
      valores.b100 * 100 +
      valores.b50 * 50 +
      valores.b20 * 20 +
      valores.b10 * 10;

    const totalMonedas = Number(
      (
        valores.m5 * 5 +
        valores.m2 * 2 +
        valores.m1 * 1 +
        valores.m050 * 0.5 +
        valores.m020 * 0.2 +
        valores.m010 * 0.1
      ).toFixed(2)
    );

    const totalGeneral = Number((totalBilletes + totalMonedas).toFixed(2));

    const valoresCompletos: ValoresArqueo = {
      ...valores,
      monedas: totalMonedas,
      totalBilletes,
      totalMonedas,
      total: totalGeneral,
      // Alias
      billete_200: valores.b200,
      billete_100: valores.b100,
      billete_50: valores.b50,
      billete_20: valores.b20,
      billete_10: valores.b10,
      moneda_5: valores.m5,
      moneda_2: valores.m2,
      moneda_1: valores.m1,
      moneda_050: valores.m050,
      moneda_020: valores.m020,
      moneda_010: valores.m010,
      monedas_total: totalMonedas,
      monto_total_desglose: totalGeneral,
    };

    return {
      totalBilletes,
      totalMonedas,
      totalGeneral,
      valoresCompletos,
    };
  }, [valores]);

  useEffect(() => {
    onChangeTotal(calculos.totalGeneral, calculos.valoresCompletos);
  }, [calculos, onChangeTotal]);

  const handleChange = (key: keyof ValoresArqueo, countStr: string) => {
    const num = countStr === "" ? 0 : parseInt(countStr, 10) || 0;
    setValores((prev) => ({ ...prev, [key]: num >= 0 ? num : 0 }));
  };

  const handleReset = () => {
    setValores(ESTADO_INICIAL);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-6 shadow-sm">
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm md:text-base">
              Arqueo de Dinero Físico (Cortes en Bs.)
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Ingrese la cantidad de unidades de cada corte de billete y moneda
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          disabled={disabled || calculos.totalGeneral === 0}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 dark:hover:text-red-400 font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed"
          title="Reiniciar conteo a 0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Limpiar</span>
        </button>
      </div>

      {/* BLOQUE 1: BILLETES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
            <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Billetes
          </span>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
            Subtotal: Bs. {calculos.totalBilletes.toFixed(2)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {DENOMINACIONES_BILLETES.map((b) => {
            const count = valores[b.key] || 0;
            const subtotal = count * b.valor;

            return (
              <div
                key={b.key}
                className="bg-gray-50 dark:bg-gray-900/60 p-2.5 rounded-xl border border-gray-200/80 dark:border-gray-700/80 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                    {b.label}
                  </Label>
                  <span className="text-[10px] text-gray-400">u.</span>
                </div>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={count === 0 ? "" : count}
                  onChange={(e) => handleChange(b.key, e.target.value)}
                  disabled={disabled}
                  placeholder="0"
                  className="text-center font-bold text-sm h-9"
                />
                <div className="text-[11px] font-semibold text-right mt-1.5 text-gray-600 dark:text-gray-400">
                  = Bs. {subtotal.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BLOQUE 2: MONEDAS */}
      <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-500" />
            Monedas
          </span>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
            Subtotal: Bs. {calculos.totalMonedas.toFixed(2)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {DENOMINACIONES_MONEDAS.map((m) => {
            const count = valores[m.key] || 0;
            const subtotal = Number((count * m.valor).toFixed(2));

            return (
              <div
                key={m.key}
                className="bg-gray-50 dark:bg-gray-900/60 p-2.5 rounded-xl border border-gray-200/80 dark:border-gray-700/80 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 truncate">
                    {m.label}
                  </Label>
                  <span className="text-[10px] text-gray-400">u.</span>
                </div>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={count === 0 ? "" : count}
                  onChange={(e) => handleChange(m.key, e.target.value)}
                  disabled={disabled}
                  placeholder="0"
                  className="text-center font-bold text-sm h-9"
                />
                <div className="text-[11px] font-semibold text-right mt-1.5 text-gray-600 dark:text-gray-400">
                  = Bs. {subtotal.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RESUMEN FINAL DEL ARQUEO */}
      <div className="pt-4 border-t-2 border-indigo-100 dark:border-indigo-950/60 bg-gradient-to-r from-indigo-50/70 via-indigo-50/30 to-purple-50/50 dark:from-indigo-950/20 dark:via-indigo-950/10 dark:to-purple-950/20 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Billetes: </span>
            <span className="font-bold text-gray-800 dark:text-gray-200">
              Bs. {calculos.totalBilletes.toFixed(2)}
            </span>
          </div>
          <div className="text-gray-300 dark:text-gray-600">|</div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Monedas: </span>
            <span className="font-bold text-gray-800 dark:text-gray-200">
              Bs. {calculos.totalMonedas.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400 uppercase mr-3">
            Total Físico Calculado:
          </span>
          <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
            Bs. {calculos.totalGeneral.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SeccionArqueoBilletes;
