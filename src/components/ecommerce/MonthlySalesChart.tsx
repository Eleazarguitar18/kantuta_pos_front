import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface MonthlySalesChartProps {
  data: { mes: string; total: number }[];
  anio: number;
  onAnioChange: (anio: number) => void;
}

export default function MonthlySalesChart({ data, anio, onAnioChange }: MonthlySalesChartProps) {
  const categories = data.map((item) => item.mes);
  const seriesData = data.map((item) => item.total);

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      title: {
        text: undefined,
      },
      labels: {
        formatter: (val: number) => `Bs. ${val.toFixed(0)}`,
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: (val: number) => `Bs. ${val.toFixed(2)}`,
      },
    },
  };

  const series = [
    {
      name: "Ventas",
      data: seriesData,
    },
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Ventas Mensuales
        </h3>
        <select
          value={anio}
          onChange={(e) => onAnioChange(Number(e.target.value))}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <Chart options={options} series={series} type="bar" height={180} />
        </div>
      </div>
    </div>
  );
}
