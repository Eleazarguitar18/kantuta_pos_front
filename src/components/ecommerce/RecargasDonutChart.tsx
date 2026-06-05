import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface RecargasDonutChartProps {
  data: { proveedor: string; total: number }[];
}

export default function RecargasDonutChart({ data }: RecargasDonutChartProps) {
  const categories = data.map((item) => item.proveedor);
  const series = data.map((item) => Number(item.total));

  // Custom premium color palette: Entel (Blue), Viva (Green/Cyan), Tigo (Indigo/Dark Blue)
  const colors = ["#2563EB", "#10B981", "#4F46E5"];

  const options: ApexOptions = {
    colors: colors,
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
    },
    labels: categories,
    legend: {
      show: true,
      position: "bottom",
      fontFamily: "Outfit",
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total Ventas",
              formatter: (w) => {
                const sum = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                return `Bs. ${sum.toFixed(2)}`;
              },
            },
          },
        },
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
        Ventas de Recargas (Mes Actual)
      </h3>
      <div className="flex justify-center items-center">
        {series.every((s) => s === 0) ? (
          <div className="text-gray-400 text-sm py-10">Sin ventas de recargas este mes.</div>
        ) : (
          <Chart options={options} series={series} type="donut" width="100%" height={260} />
        )}
      </div>
    </div>
  );
}
