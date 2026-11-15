import { useEffect, useRef, useState } from "react";
import type { FC } from "react";
import Input from "./InputField";

export interface NumberInputProps {
  /** Valor numérico controlado (acepta number, string numérico o vacío). */
  value: number | string | null | undefined;
  /** Se dispara en cada cambio con el número parseado, o null si el campo está vacío. */
  onValueChange: (value: number | null) => void;
  /** Cantidad máxima de decimales permitidos (2 para dinero, 0 para cantidades). */
  decimals?: number;
  /** Permite valores negativos. */
  allowNegative?: boolean;
  /** Si el valor es 0, muestra el campo vacío (evita el "cero por delante"). */
  emptyWhenZero?: boolean;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  name?: string;
  step?: number | string;
  required?: boolean;
  min?: number;
  max?: number;
  autoFocus?: boolean;
  maxLength?: number;
  "aria-label"?: string;
}

const toNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

const round = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const sanitize = (
  raw: string,
  allowNegative: boolean,
  decimals: number,
): string => {
  let text = raw.replace(/[^\d.,-]/g, "");

  if (decimals === 0) {
    // En campos enteros no tiene sentido mostrar separadores decimales.
    text = text.replace(/[.,]/g, "");
  } else {
    const firstSeparator = text.search(/[.,]/);
    if (firstSeparator !== -1) {
      text =
        text.slice(0, firstSeparator + 1) +
        text.slice(firstSeparator + 1).replace(/[.,]/g, "");
      const decimalsText = text.slice(firstSeparator + 1).slice(0, decimals);
      text = text.slice(0, firstSeparator + 1) + decimalsText;
    }
  }

  if (!allowNegative) {
    text = text.replace(/-/g, "");
  } else if (text.includes("-")) {
    const negative = text.startsWith("-");
    text = (negative ? "-" : "") + text.replace(/-/g, "");
  }

  return text;
};

const parse = (text: string, decimals: number): number | null => {
  const trimmed = text.trim();
  if (trimmed === "" || trimmed === "-" || trimmed === "." || trimmed === ",") {
    return null;
  }
  const value = toNumber(trimmed);
  return value === null ? null : round(value, decimals);
};

const display = (
  value: number | string | null | undefined,
  emptyWhenZero: boolean,
): string => {
  const numeric = toNumber(value);
  if (numeric === null) return "";
  if (emptyWhenZero && numeric === 0) return "";
  return String(numeric).replace(".", ",");
};

/**
 * Input numérico basado en texto: acepta coma o punto decimal, permite borrar
 * todo el contenido y no fuerza el cero. Evita los problemas de `type="number"`.
 */
const useNumericInput = ({
  value,
  onValueChange,
  decimals = 2,
  allowNegative = false,
  emptyWhenZero = true,
}: Pick<
  NumberInputProps,
  "value" | "onValueChange" | "decimals" | "allowNegative" | "emptyWhenZero"
>) => {
  const [text, setText] = useState<string>(() =>
    display(value, emptyWhenZero),
  );
  const lastEmitted = useRef<number | null>(toNumber(value));

  useEffect(() => {
    const incoming = toNumber(value);
    // Si el valor del padre coincide con lo último emitido, se conserva el
    // texto tal cual (permite escribir "12," o "12,5" sin que se reformatee).
    // Si difiere (el padre lo rechazó, lo recalculó o lo reinició), se
    // sincroniza el texto con el valor real.
    if (incoming === lastEmitted.current) return;
    lastEmitted.current = incoming;
    setText(display(value, emptyWhenZero));
  }, [value, emptyWhenZero, text]);

  const handleChange = (raw: string) => {
    const cleaned = sanitize(raw, allowNegative, decimals);
    setText(cleaned);
    const parsed = parse(cleaned, decimals);
    lastEmitted.current = parsed;
    onValueChange(parsed);
  };

  return { text, handleChange };
};

/** Input numérico con el estilo de los formularios del sistema. */
export const NumberField: FC<NumberInputProps> = ({
  value,
  onValueChange,
  decimals = 2,
  allowNegative = false,
  emptyWhenZero = true,
  className = "",
  placeholder,
  disabled,
  id,
  name,
  autoFocus,
  maxLength,
  ...rest
}) => {
  const { text, handleChange } = useNumericInput({
    value,
    onValueChange,
    decimals,
    allowNegative,
    emptyWhenZero,
  });

  return (
    <Input
      type="text"
      inputMode={decimals === 0 ? "numeric" : "decimal"}
      value={text}
      onChange={(event) => handleChange(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      id={id}
      name={name}
      className={className}
      autoFocus={autoFocus}
      maxLength={maxLength}
      {...rest}
    />
  );
};

/** Input numérico nativo (para tablas y estilos propios). */
const NumberInput: FC<NumberInputProps> = ({
  value,
  onValueChange,
  decimals = 2,
  allowNegative = false,
  emptyWhenZero = true,
  className = "",
  placeholder,
  disabled,
  id,
  name,
  autoFocus,
  maxLength,
  ...rest
}) => {
  const { text, handleChange } = useNumericInput({
    value,
    onValueChange,
    decimals,
    allowNegative,
    emptyWhenZero,
  });

  return (
    <input
      type="text"
      inputMode={decimals === 0 ? "numeric" : "decimal"}
      value={text}
      onChange={(event) => handleChange(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      id={id}
      name={name}
      className={className}
      autoFocus={autoFocus}
      maxLength={maxLength}
      {...rest}
    />
  );
};

export default NumberInput;
