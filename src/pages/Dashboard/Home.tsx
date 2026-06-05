import { useState, useEffect } from "react";
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import RecargasDonutChart from "../../components/ecommerce/RecargasDonutChart";
import TopProductosTable from "../../components/ecommerce/TopProductosTable";
import PageMeta from "../../components/common/PageMeta";
import { DashboardService, DashboardStats } from "../../components/ecommerce/dashboardService";

const defaultStats: DashboardStats = {
  kpis: {
    ventas_hoy: 0,
    recargas_hoy: 0,
    ganancia_comisiones_hoy: 0,
    productos_stock_bajo: 0,
  },
  ventas_mensuales: [],
  top_productos: [],
  recargas_distribucion: [
    { proveedor: "Entel", total: 0 },
    { proveedor: "Viva", total: 0 },
    { proveedor: "Tigo", total: 0 },
  ],
};

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStats = async (year: number) => {
    setLoading(true);
    try {
      const response = await DashboardService.getStats(year);
      setStats(response.data);
    } catch (error) {
      console.error("Error al cargar estadísticas del dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(anio);
  }, [anio]);

  const handleAnioChange = (nuevoAnio: number) => {
    setAnio(nuevoAnio);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500 dark:text-gray-400">Cargando estadísticas...</span>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Dashboard Ejecutivo | Kantuta POS"
        description="Panel de estadísticas y reportes en tiempo real para la gestión de tienda"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* KPI Cards - Full Width */}
        <div className="col-span-12">
          <EcommerceMetrics kpis={stats.kpis} />
        </div>

        {/* Ventas Mensuales (Bar Chart) - Left */}
        <div className="col-span-12 xl:col-span-7">
          <MonthlySalesChart
            data={stats.ventas_mensuales}
            anio={anio}
            onAnioChange={handleAnioChange}
          />
        </div>

        {/* Distribución Recargas (Donut) - Right */}
        <div className="col-span-12 xl:col-span-5">
          <RecargasDonutChart data={stats.recargas_distribucion} />
        </div>

        {/* Top Productos Table - Full Width */}
        <div className="col-span-12">
          <TopProductosTable data={stats.top_productos} />
        </div>
      </div>
    </>
  );
}
