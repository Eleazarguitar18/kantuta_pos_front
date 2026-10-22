import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Cpu,
  CreditCard,
  Package,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { CajasService } from "../services/cajasService";
import { CategoriasService } from "../../Inventario/Categorias/services/categoriasService";

export interface ItemStock {
  id: number;
  nombre: string;
  stockSistema: number;
  stockFisico: number;
  diferencia: number;
}

interface ProductoInventario {
  id: number;
  nombre: string;
  categoria: string;
  precioVenta: number;
  stockSistema: number;
}

interface ProductoApi {
  id?: number | string | null;
  nombre?: string | null;
  categoria?: string | null;
  precio_venta?: number | string | null;
  stockSistema?: number | string | null;
  stock_actual?: number | string | null;
  tipo?: string | null;
}

interface CategoriaApi {
  nombre?: string | null;
}

interface Props {
  onStockChange: (items: ItemStock[], observacionGenerada: string) => void;
  disabled?: boolean;
  modo?: "apertura" | "cierre";
}

interface TemaCategoria {
  Icono: typeof Package;
  borde: string;
  cabecera: string;
  input: string;
}

// Orden preferente de las categorías de la planilla física
const ORDEN_CATEGORIAS = ["chips", "tarjetas", "accesorios"];

const TEMAS: Record<string, TemaCategoria> = {
  chips: {
    Icono: Cpu,
    borde: "border-blue-200 dark:border-blue-800",
    cabecera: "bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300",
    input:
      "border-blue-300 text-blue-700 focus:ring-blue-500 dark:border-blue-700 dark:text-blue-300",
  },
  tarjetas: {
    Icono: CreditCard,
    borde: "border-indigo-200 dark:border-indigo-800",
    cabecera:
      "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300",
    input:
      "border-indigo-300 text-indigo-700 focus:ring-indigo-500 dark:border-indigo-700 dark:text-indigo-300",
  },
  accesorios: {
    Icono: ShoppingBag,
    borde: "border-purple-200 dark:border-purple-800",
    cabecera:
      "bg-purple-50 text-purple-800 dark:bg-purple-950/30 dark:text-purple-300",
    input:
      "border-purple-300 text-purple-700 focus:ring-purple-500 dark:border-purple-700 dark:text-purple-300",
  },
  otros: {
    Icono: Package,
    borde: "border-gray-200 dark:border-gray-700",
    cabecera:
      "bg-gray-50 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300",
    input:
      "border-gray-300 text-gray-700 focus:ring-gray-500 dark:border-gray-600 dark:text-gray-200",
  },
};

const normalizar = (valor?: string | null) =>
  (valor ?? "").toString().trim().toLowerCase();

const compararNatural = (a: string, b: string) =>
  a.localeCompare(b, "es", { numeric: true, sensitivity: "base" });

const claveTema = (categoria: string): keyof typeof TEMAS => {
  const valor = normalizar(categoria);
  if (valor.includes("chip")) return "chips";
  if (valor.includes("tarjeta")) return "tarjetas";
  if (valor.includes("accesorio") || valor.includes("tecnolog")) {
    return "accesorios";
  }
  return "otros";
};

const prioridadCategoria = (categoria: string): number => {
  const valor = normalizar(categoria);
  const indice = ORDEN_CATEGORIAS.findIndex((prefijo) =>
    valor.includes(prefijo),
  );
  return indice === -1 ? ORDEN_CATEGORIAS.length : indice;
};

/**
 * Las recargas y plataformas no forman parte del inventario físico,
 * por lo que se excluyen de la planilla de conteo.
 */
const esInventarioFisico = (item: ProductoApi): boolean => {
  if (!item) return false;
  if (item.id === undefined || item.id === null || item.id === "") return false;
  if (Number.isNaN(Number(item.id))) return false;

  const tipo = normalizar(item.tipo);
  if (tipo === "plataforma" || tipo === "saldo_virtual") return false;

  const categoria = normalizar(item.categoria);
  if (categoria.includes("recarga") || categoria.includes("plataforma")) {
    return false;
  }

  return true;
};

const InventarioPorCategorias = ({
  onStockChange,
  disabled = false,
  modo = "cierre",
}: Props) => {
  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [conteoFisico, setConteoFisico] = useState<Record<number, number>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [soloDiferencias, setSoloDiferencias] = useState(false);

  // Guardamos el callback en un ref para no re-disparar el efecto en cada render
  const onStockChangeRef = useRef(onStockChange);
  useEffect(() => {
    onStockChangeRef.current = onStockChange;
  }, [onStockChange]);

  const cargarInventario = useCallback(async () => {
    setCargando(true);
    setError(false);

    try {
      const [respuesta, respuestaCategorias] = await Promise.all([
        CajasService.getEstadoInventario(),
        CategoriasService.getCategories().catch((err) => {
          console.warn(
            "No se pudieron cargar las categorías para la planilla:",
            err,
          );
          return null;
        }),
      ]);

      const data = respuesta?.data;
      const itemsCrudos: ProductoApi[] = Array.isArray(data) ? data : [];

      const itemsFiltrados: ProductoInventario[] = itemsCrudos
        .filter(esInventarioFisico)
        .map((item) => ({
          id: Number(item.id),
          nombre: (item.nombre ?? "").toString(),
          categoria:
            (item.categoria ?? "Sin categoría").toString().trim() ||
            "Sin categoría",
          precioVenta: Number(item.precio_venta ?? 0),
          stockSistema: Number(item.stockSistema ?? item.stock_actual ?? 0),
        }));

      // Categorías activas de la BD: permiten mostrar también las que no
      // tienen productos asignados.
      const dataCategorias = respuestaCategorias?.data;
      const categoriasCrudas: CategoriaApi[] = Array.isArray(dataCategorias)
        ? dataCategorias
        : [];

      const nombresCategorias = new Map<string, string>();
      categoriasCrudas.forEach((categoria) => {
        const nombre = (categoria?.nombre ?? "").toString().trim();
        if (!nombre) return;

        const clave = normalizar(nombre);
        if (clave.includes("recarga") || clave.includes("plataforma")) return;
        if (!nombresCategorias.has(clave)) {
          nombresCategorias.set(clave, nombre);
        }
      });

      const conteoInicial: Record<number, number> = {};
      itemsFiltrados.forEach((item) => {
        conteoInicial[item.id] = item.stockSistema;
      });

      setProductos(itemsFiltrados);
      setCategorias([...nombresCategorias.values()]);
      setConteoFisico(conteoInicial);
    } catch (err) {
      console.error("Error al cargar inventario para la planilla:", err);
      setError(true);
      setProductos([]);
      setCategorias([]);
      setConteoFisico({});
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarInventario();
  }, [cargarInventario]);

  const conteoDe = (producto: ProductoInventario): number =>
    conteoFisico[producto.id] ?? producto.stockSistema;

  const diferenciaDe = (producto: ProductoInventario): number =>
    conteoDe(producto) - producto.stockSistema;

  // Agrupación por categoría real de la base de datos. Primero se siembran
  // todas las categorías activas (aunque no tengan productos) y luego se
  // reparten los productos.
  const grupos = useMemo(() => {
    const mapa = new Map<
      string,
      { categoria: string; items: ProductoInventario[] }
    >();

    categorias.forEach((categoria) => {
      const clave = normalizar(categoria);
      if (!mapa.has(clave)) {
        mapa.set(clave, { categoria, items: [] });
      }
    });

    productos.forEach((producto) => {
      const clave = normalizar(producto.categoria);
      const grupo = mapa.get(clave);

      if (grupo) {
        grupo.items.push(producto);
      } else {
        mapa.set(clave, { categoria: producto.categoria, items: [producto] });
      }
    });

    return Array.from(mapa.values())
      .map(({ categoria, items }) => ({
        categoria,
        items: [...items].sort((a, b) => compararNatural(a.nombre, b.nombre)),
      }))
      .sort((a, b) => {
        const prioridadA = prioridadCategoria(a.categoria);
        const prioridadB = prioridadCategoria(b.categoria);
        if (prioridadA !== prioridadB) return prioridadA - prioridadB;
        return compararNatural(a.categoria, b.categoria);
      });
  }, [productos, categorias]);

  const resumen = useMemo(() => {
    const totalSistema = productos.reduce(
      (acumulado, producto) => acumulado + producto.stockSistema,
      0,
    );
    const totalContado = productos.reduce(
      (acumulado, producto) => acumulado + conteoDe(producto),
      0,
    );
    const diferencias = productos.filter(
      (producto) => diferenciaDe(producto) !== 0,
    ).length;

    return {
      totalProductos: productos.length,
      totalSistema,
      totalContado,
      diferencia: totalContado - totalSistema,
      diferencias,
    };
    // conteoDe/diferenciaDe dependen de conteoFisico
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productos, conteoFisico]);

  // Notifica al padre con el mismo contrato que usaba la tabla plana
  useEffect(() => {
    if (cargando) return;

    const items: ItemStock[] = productos.map((producto) => {
      const stockFisico = conteoDe(producto);
      return {
        id: producto.id,
        nombre: producto.nombre,
        stockSistema: producto.stockSistema,
        stockFisico,
        diferencia: stockFisico - producto.stockSistema,
      };
    });

    const faltantes = items.filter((item) => item.diferencia < 0);
    const sobrantes = items.filter((item) => item.diferencia > 0);

    let observacion = "";
    if (faltantes.length > 0) {
      observacion +=
        "Faltantes(Stock): " +
        faltantes
          .map((item) => `${Math.abs(item.diferencia)} ${item.nombre}`)
          .join(", ") +
        ". ";
    }
    if (sobrantes.length > 0) {
      observacion +=
        "Sobrantes(Stock): " +
        sobrantes
          .map((item) => `${item.diferencia} ${item.nombre}`)
          .join(", ") +
        ". ";
    }

    onStockChangeRef.current(items, observacion.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productos, conteoFisico, cargando]);

  const actualizarConteo = (id: number, valor: string) => {
    const numero = valor === "" ? 0 : Number.parseInt(valor, 10);
    const conteoValido = Number.isNaN(numero) || numero < 0 ? 0 : numero;

    setConteoFisico((previo) => ({ ...previo, [id]: conteoValido }));
  };

  if (cargando) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        Cargando inventario por categorías...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-950/20">
        <p className="text-sm font-semibold text-red-700 dark:text-red-300">
          No se pudo cargar el inventario para la planilla.
        </p>
        <button
          type="button"
          onClick={() => void cargarInventario()}
          className="mt-2 inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reintentar
        </button>
      </div>
    );
  }

  const gruposVisibles = grupos
    .map((grupo) => ({
      ...grupo,
      itemsVisibles: soloDiferencias
        ? grupo.items.filter((producto) => diferenciaDe(producto) !== 0)
        : grupo.items,
    }))
    // En modo normal se muestran también las categorías vacías
    .filter((grupo) =>
      soloDiferencias ? grupo.itemsVisibles.length > 0 : true,
    );

  const colorDiferenciaResumen =
    resumen.diferencia === 0
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-rose-600 dark:text-rose-400";

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 print:border-gray-400 print:shadow-none">
      {/* Encabezado de la planilla */}
      <div className="flex flex-col gap-3 border-b border-gray-200 p-4 dark:border-gray-700 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-gray-800 dark:text-gray-100">
              Inventario por Categorías
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {modo === "apertura"
                ? "Conteo físico inicial. El sistema propone el stock actual; ajústelo si hay diferencias."
                : "Conteo físico de cierre. El sistema propone el stock actual; ajústelo si hay diferencias."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300">
            Productos: {resumen.totalProductos}
          </span>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300">
            Sistema: {resumen.totalSistema}
          </span>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300">
            Contado: {resumen.totalContado}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 ${
              resumen.diferencias === 0
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
            }`}
          >
            Diferencias: {resumen.diferencias}
          </span>
          <span className={`rounded-full bg-gray-100 px-2.5 py-1 dark:bg-gray-700/60 ${colorDiferenciaResumen}`}>
            Dif. total: {resumen.diferencia > 0 ? "+" : ""}
            {resumen.diferencia}
          </span>

          <button
            type="button"
            onClick={() => setSoloDiferencias((previo) => !previo)}
            aria-pressed={soloDiferencias}
            className={`rounded-lg border px-2.5 py-1 transition ${
              soloDiferencias
                ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {soloDiferencias ? "Ver todos" : "Ver solo diferencias"}
          </button>

          <button
            type="button"
            onClick={() => void cargarInventario()}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Planilla de categorías */}
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 2xl:grid-cols-3">
        {gruposVisibles.length === 0 ? (
          <p className="col-span-full py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {soloDiferencias
              ? "No hay diferencias de inventario registradas."
              : "No hay categorías registradas en el inventario."}
          </p>
        ) : (
          gruposVisibles.map((grupo) => {
            const tema = TEMAS[claveTema(grupo.categoria)];
            const Icono = tema.Icono;
            const totalSistemaGrupo = grupo.items.reduce(
              (acumulado, producto) => acumulado + producto.stockSistema,
              0,
            );
            const totalContadoGrupo = grupo.items.reduce(
              (acumulado, producto) => acumulado + conteoDe(producto),
              0,
            );
            const diferenciaGrupo = totalContadoGrupo - totalSistemaGrupo;

            return (
              <div
                key={grupo.categoria}
                className={`overflow-hidden rounded-xl border bg-white dark:bg-gray-900/40 ${tema.borde}`}
              >
                <div
                  className={`flex items-center justify-between gap-2 px-3 py-2 ${tema.cabecera}`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Icono className="h-4 w-4 shrink-0" />
                    <h5 className="truncate text-xs font-extrabold uppercase tracking-wide">
                      {grupo.categoria}
                    </h5>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold">
                    {grupo.items.length} ítem(s)
                  </span>
                </div>

                {grupo.items.length === 0 ? (
                  <p className="px-3 py-4 text-center text-[11px] text-gray-400 dark:text-gray-500">
                    No tiene productos asignados
                  </p>
                ) : (
                  <>
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {grupo.itemsVisibles.map((producto) => {
                        const conteo = conteoDe(producto);
                        const diferencia = diferenciaDe(producto);

                        return (
                          <div
                            key={producto.id}
                            className="flex items-center gap-2 px-3 py-1.5"
                          >
                            <div className="min-w-0 flex-1">
                              <p
                                className="truncate text-xs font-semibold text-gray-800 dark:text-gray-200"
                                title={producto.nombre}
                              >
                                {producto.nombre}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                Sist. {producto.stockSistema}
                                {producto.precioVenta > 0
                                  ? ` · Bs. ${producto.precioVenta.toFixed(2)}`
                                  : ""}
                              </p>
                            </div>

                            <input
                              type="number"
                              min="0"
                              step="1"
                              inputMode="numeric"
                              value={conteo}
                              disabled={disabled}
                              onChange={(event) =>
                                actualizarConteo(
                                  producto.id,
                                  event.target.value,
                                )
                              }
                              aria-label={`Conteo físico de ${producto.nombre}`}
                              className={`w-16 rounded-md border py-1 px-1.5 text-center text-xs font-bold outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${tema.input}`}
                            />

                            <span
                              className={`inline-flex min-w-[3.25rem] justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                diferencia === 0
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                  : diferencia > 0
                                    ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
                                    : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                              }`}
                            >
                              {diferencia === 0
                                ? "OK"
                                : `${diferencia > 0 ? "+" : ""}${diferencia}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50/70 px-3 py-1.5 text-[10px] font-semibold text-gray-500 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-400">
                      <span>Sist. {totalSistemaGrupo}</span>
                      <span>Contado {totalContadoGrupo}</span>
                      <span
                        className={
                          diferenciaGrupo === 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }
                      >
                        Dif. {diferenciaGrupo > 0 ? "+" : ""}
                        {diferenciaGrupo}
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default InventarioPorCategorias;
