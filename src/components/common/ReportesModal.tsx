import { useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";

interface ReportesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (startDate: string, endDate: string) => void;
  title?: string;
}

const ReportesModal = ({ isOpen, onClose, onGenerate, title = "Generar Reporte en PDF" }: ReportesModalProps) => {
  const [mode, setMode] = useState<"MES" | "RANGO">("MES");
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const months = [
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => ({
    value: (new Date().getFullYear() - i).toString(),
    label: (new Date().getFullYear() - i).toString()
  }));

  const handleGenerate = () => {
    if (mode === "MES") {
      // Calculate first and last day of the month
      const start = new Date(Number(selectedYear), Number(selectedMonth) - 1, 1);
      const end = new Date(Number(selectedYear), Number(selectedMonth), 0);
      
      const sDate = start.toISOString().split("T")[0];
      const eDate = end.toISOString().split("T")[0];
      onGenerate(sDate, eDate);
    } else {
      if (!startDate || !endDate) return alert("Seleccione el rango completo");
      onGenerate(startDate, endDate);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{title}</h3>
      
      <div className="flex gap-2 mb-6">
        <button 
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${mode === "MES" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
          onClick={() => setMode("MES")}
        >
          Por Mes
        </button>
        <button 
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${mode === "RANGO" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
          onClick={() => setMode("RANGO")}
        >
          Rango Exacto
        </button>
      </div>

      {mode === "MES" ? (
        <div className="space-y-4">
          <div>
            <Label>Año</Label>
            <Select options={years} defaultValue={selectedYear} onChange={(val: string) => setSelectedYear(val)} />
          </div>
          <div>
            <Label>Mes</Label>
            <Select options={months} defaultValue={selectedMonth} onChange={(val: string) => setSelectedMonth(val)} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label>Fecha Inicio</Label>
            <Input type="date" value={startDate} onChange={(e: any) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>Fecha Fin</Label>
            <Input type="date" value={endDate} onChange={(e: any) => setEndDate(e.target.value)} />
          </div>
        </div>
      )}

      <div className="mt-8 flex gap-3 justify-end">
        <Button variant="primary" className="bg-gray-200 text-gray-800" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" className="bg-blue-600 text-white" onClick={handleGenerate}>Descargar PDF</Button>
      </div>
    </Modal>
  );
};

export default ReportesModal;
