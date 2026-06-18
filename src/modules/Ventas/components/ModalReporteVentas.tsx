import React, { useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { VentasService } from "../services/ventasService";
import { ReporteVentasPDF } from "./ReporteVentasPDF";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ModalReporteVentas: React.FC<ModalProps> = ({ isOpen, onClose }) => {
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [datosReporte, setDatosReporte] = useState<any>(null);
    const [cargandoDatos, setCargandoDatos] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const consultarHistorialVentas = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fechaInicio || !fechaFin) return;

        try {
            setCargandoDatos(true);
            setError('');
            setDatosReporte(null);

            // Consumimos el endpoint POST del backend pasándole los parámetros requeridos
            const data = await VentasService.getReporteResumen(fechaInicio, fechaFin);
            setDatosReporte(data);
        } catch (err: any) {
            console.error(err);
            setError('Hubo un error al extraer el historial del rango seleccionado.');
        } finally {
            setCargandoDatos(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl transition-all">
                {/* Cabecera */}
                <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="text-lg font-bold text-gray-800">Generar Reporte de Ventas</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                </div>

                {/* Formulario de Selección */}
                <form onSubmit={consultarHistorialVentas} className="mt-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Desde la fecha:</label>
                        <input
                            type="date"
                            required
                            value={fechaInicio}
                            onChange={(e) => { setFechaInicio(e.target.value); setDatosReporte(null); }}
                            className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Hasta la fecha:</label>
                        <input
                            type="date"
                            required
                            value={fechaFin}
                            onChange={(e) => { setFechaFin(e.target.value); setDatosReporte(null); }}
                            className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

                    {/* Botón de Sincronización */}
                    {!datosReporte && (
                        <button
                            type="submit"
                            disabled={cargandoDatos}
                            className="w-full mt-2 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {cargandoDatos ? 'Procesando datos en el servidor...' : 'Consultar Historial'}
                        </button>
                    )}
                </form>

                {/* Zona de Descarga Dinámica */}
                {datosReporte && (
                    <div className="mt-5 border-t pt-4 text-center">
                        <p className="text-sm text-green-600 mb-3 font-semibold">✓ Resumen estructurado con éxito</p>

                        <PDFDownloadLink
                            document={<ReporteVentasPDF datos={datosReporte} rango={`${fechaInicio} al ${fechaFin}`} />}
                            fileName={`Reporte_Ventas_Kantuta_${fechaInicio}_a_${fechaFin}.pdf`}
                            className="inline-flex w-full justify-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
                        >
                            {({ loading }) => (
                                loading ? 'Preparando archivo PDF...' : '⬇ Descargar Reporte en PDF'
                            )}
                        </PDFDownloadLink>
                    </div>
                )}
            </div>
        </div>
    );
};