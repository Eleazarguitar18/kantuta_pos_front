import { useNavigate } from "react-router";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";

const reportCategories = [
  {
    title: "Movimientos de Caja",
    description: "Reporte detallado de ingresos, egresos, saldo inicial y teórico de una sesión de caja.",
    icon: "💰",
    gradient: "from-blue-500 to-indigo-600",
    hoverGradient: "hover:from-blue-600 hover:to-indigo-700",
    path: "/reportes/caja",
    tag: "PDF",
  },
  {
    title: "Reporte de Ventas",
    description: "Auditoría consolidada de ventas en un rango de fechas específico.",
    icon: "🛒",
    gradient: "from-emerald-500 to-teal-600",
    hoverGradient: "hover:from-emerald-600 hover:to-teal-700",
    path: "/reportes/ventas",
    tag: "PDF",
  },
  {
    title: "Reporte de Compras",
    description: "Historial de compras e ingreso de mercadería por periodo.",
    icon: "📦",
    gradient: "from-orange-500 to-amber-600",
    hoverGradient: "hover:from-orange-600 hover:to-amber-700",
    path: "/reportes/compras",
    tag: "PDF",
  },
  {
    title: "Inventario de Productos",
    description: "Estado actual del stock, semaforización y niveles de alerta por producto.",
    icon: "📊",
    gradient: "from-purple-500 to-violet-600",
    hoverGradient: "hover:from-purple-600 hover:to-violet-700",
    path: "/reportes/inventario",
    tag: "PDF",
  },
  {
    title: "Productividad por Operador",
    description: "Evaluación del rendimiento de cada operador en un periodo determinado.",
    icon: "👤",
    gradient: "from-rose-500 to-pink-600",
    hoverGradient: "hover:from-rose-600 hover:to-pink-700",
    path: "/reportes/productividad",
    tag: "PDF",
  },
];

const ReportesMain = () => {
  const navigate = useNavigate();

  return (
    <div>
      <PageBreadcrumb pageTitle="Centro de Reportes" />

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Centro de Reportes e Informes
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Seleccione la categoría de reporte que desea generar. Cada módulo le guiará con opciones de selección.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCategories.map((cat) => (
          <button
            key={cat.path}
            onClick={() => navigate(cat.path)}
            className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${cat.gradient} ${cat.hoverGradient} p-6 text-left text-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.03] active:scale-[0.98] cursor-pointer`}
          >
            {/* Decorative circle */}
            <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-150" />
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/5" />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <span className="text-4xl">{cat.icon}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                  {cat.tag}
                </span>
              </div>
              <h3 className="text-lg font-bold mb-2">{cat.title}</h3>
              <p className="text-sm text-white/80 leading-relaxed">{cat.description}</p>

              <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                Generar Reporte
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReportesMain;
