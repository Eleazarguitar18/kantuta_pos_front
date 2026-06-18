import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ReporteFooterAudit } from '../../../components/reports/ReporteFooterAudit';

// Estilos vectoriales organizados para reportes combinados
const styles = StyleSheet.create({
    page: { padding: 35, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
    header: { borderBottomWidth: 2, borderBottomColor: '#2563eb', paddingBottom: 8, marginBottom: 15 },
    title: { fontSize: 20, color: '#2563eb', fontWeight: 'bold' },
    subtitle: { fontSize: 9, color: '#6b7280', marginTop: 2 },
    rangoFechas: { fontSize: 10, color: '#374151', marginTop: 6, fontWeight: 'bold' },

    // Títulos de secciones
    sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#1f2937', marginTop: 15, marginBottom: 8, textTransform: 'uppercase' },

    // Bloques informativos (KPIs)
    kpiContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    kpiCard: { width: '48%', backgroundColor: '#f3f4f6', padding: 12, borderRadius: 6 },
    kpiLabel: { fontSize: 9, color: '#4b5563', textTransform: 'uppercase' },
    kpiValue: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginTop: 4 },

    // Tabla 1: Resumen de Métodos de Pago (Compacta)
    resumenHeader: { flexDirection: 'row', backgroundColor: '#2563eb', padding: 6, borderRadius: 3 },
    resumenRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', padding: 6 },
    colResumenConcepto: { width: '70%', fontSize: 10 },
    colResumenMonto: { width: '30%', fontSize: 10, textAlign: 'right' },
    totalRow: { flexDirection: 'row', backgroundColor: '#e5e7eb', padding: 6, marginTop: 4, borderRadius: 3 },

    // Tabla 2: Historial Detallado de Ventas (Estructura Datatable)
    tableContainer: { marginTop: 5, width: '100%' },
    tableHeader: { flexDirection: 'row', backgroundColor: '#1e40af', padding: 6, borderRadius: 3, alignItems: 'center' },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 5, paddingHorizontal: 4, alignItems: 'center' },

    // Distribución de anchos de columna (Suma 100%)
    colTicket: { width: '15%', fontSize: 9, textAlign: 'center' },
    colFecha: { width: '25%', fontSize: 9, textAlign: 'center' },
    colTotal: { width: '20%', fontSize: 9, textAlign: 'right', paddingRight: 5 },
    colMetodo: { width: '20%', fontSize: 9, textAlign: 'center' },
    colEstado: { width: '20%', fontSize: 9, textAlign: 'center' },

    textHeader: { color: '#ffffff', fontWeight: 'bold', fontSize: 9 },
    textCell: { color: '#374151' },
    textTotalBold: { fontWeight: 'bold', color: '#111827' },

    // Badges para reflejar los estados de la fila de tu Datatable
    badge: {
        paddingVertical: 2,
        paddingHorizontal: 5,
        borderRadius: 4,
        fontSize: 8,
        fontWeight: 'bold',
        textAlign: 'center',
        alignSelf: 'center'
    },
    badgeCompletada: { backgroundColor: '#d1fae5', color: '#065f46' },
    badgeAnulada: { backgroundColor: '#fee2e2', color: '#991b1b' },
    badgeEditada: { backgroundColor: '#ffedd5', color: '#9a3412' },
    badgeDefault: { backgroundColor: '#f3f4f6', color: '#374151' }
});

interface VentaRow {
    id: number;
    fecha: string;
    total: number;
    metodo_pago: string;
    estado_venta: string;
}

interface ReporteProps {
    datos: {
        totales: {
            totalVendido: number;
            totalTransacciones: number;
            desglose: {
                efectivo: number;
                qr: number;
                transferencia: number;
                digitalTotal: number;
            };
        };
        ventas: VentaRow[];
    };
    rango: string;
}

const formatPdfDate = (dateStr: string) => {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-BO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateStr;
    }
};
// Función para transformar fechas "YYYY-MM-DD" o ISO a "DD-MM-YYYY"
const formatFechaBolivia = (fechaStr: string): string => {
    if (!fechaStr) return '';

    try {
        // Si es un rango (ej: "2026-06-01 al 2026-06-30")
        if (fechaStr.includes(' al ')) {
            const [inicio, fin] = fechaStr.split(' al ');

            const pInicio = inicio.split('-');
            const pFin = fin.split('-');

            const fInicio = pInicio.length === 3 ? `${pInicio[2]}-${pInicio[1]}-${pInicio[0]}` : inicio;
            const fFin = pFin.length === 3 ? `${pFin[2]}-${pFin[1]}-${pFin[0]}` : fin;

            return `${fInicio} al ${fFin}`;
        }

        // Si es una sola fecha (ej: "2026-06-18")
        const partes = fechaStr.split('T')[0].split('-');
        if (partes.length === 3) {
            return `${partes[2]}-${partes[1]}-${partes[0]}`;
        }

        return fechaStr;
    } catch (error) {
        return fechaStr;
    }
};
export const ReporteVentasPDF: React.FC<ReporteProps> = ({ datos, rango }) => {
    const { totales, ventas } = datos;

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* ENCABEZADO */}
                <View style={styles.header}>
                    <Text style={styles.title}>Kantuta POS</Text>
                    <Text style={styles.subtitle}>Reporte Completo de Cierre y Auditoría de Ventas</Text>
                    <Text style={styles.rangoFechas}>Período evaluado: {formatFechaBolivia(rango)}</Text>
                </View>

                {/* 1. SECCIÓN: RESUMEN FINANCIERO MACRO */}
                <Text style={styles.sectionTitle}>1. Resumen de Caja General</Text>

                <View style={styles.kpiContainer}>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiLabel}>Monto Bruto Operado</Text>
                        <Text style={[styles.kpiValue, { color: '#16a34a' }]}>
                            Bs. {totales.desglose.digitalTotal.toFixed(2)}
                        </Text>
                    </View>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiLabel}>Volumen de Operaciones</Text>
                        <Text style={styles.kpiValue}>{totales.totalTransacciones} transacciones</Text>
                    </View>
                </View>

                {/* TABLA 1: DESGLOSE DE MÉTODOS DE PAGO */}
                <View style={{ marginBottom: 15 }}>
                    <View style={styles.resumenHeader}>
                        <Text style={[styles.colResumenConcepto, { color: '#ffffff', fontWeight: 'bold' }]}>Origen de Fondos</Text>
                        <Text style={[styles.colResumenMonto, { color: '#ffffff', fontWeight: 'bold' }]}>Total Neto</Text>
                    </View>

                    <View style={styles.resumenRow}>
                        <Text style={styles.colResumenConcepto}>Ventas en Efectivo (Caja Física)</Text>
                        <Text style={styles.colResumenMonto}>Bs. {totales.desglose.efectivo.toFixed(2)}</Text>
                    </View>

                    <View style={styles.resumenRow}>
                        <Text style={styles.colResumenConcepto}>Cobros por Código QR</Text>
                        <Text style={styles.colResumenMonto}>Bs. {totales.desglose.qr.toFixed(2)}</Text>
                    </View>

                    <View style={styles.resumenRow}>
                        <Text style={styles.colResumenConcepto}>Transferencias Bancarias</Text>
                        <Text style={styles.colResumenMonto}>Bs. {totales.desglose.transferencia.toFixed(2)}</Text>
                    </View>

                    <View style={styles.totalRow}>
                        <Text style={[styles.colResumenConcepto, { fontWeight: 'bold' }]}>TOTAL NETO CONSOLIDADO</Text>
                        <Text style={[styles.colResumenMonto, { fontWeight: 'bold' }]}>
                            Bs. {totales.desglose.digitalTotal.toFixed(2)}
                        </Text>
                    </View>
                </View>

                {/* 2. SECCIÓN: DETALLE OPERATIVO DE TRANSACCIONES */}
                <Text style={styles.sectionTitle}>2. Historial Detallado de Ventas</Text>

                <View style={styles.tableContainer}>
                    {/* ENCABEZADOS DE COLUMNA DE LA DATATABLE */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.colTicket, styles.textHeader]}>Ticket #</Text>
                        <Text style={[styles.colFecha, styles.textHeader]}>Fecha / Hora</Text>
                        <Text style={[styles.colTotal, styles.textHeader]}>Total</Text>
                        <Text style={[styles.colMetodo, styles.textHeader]}>Método</Text>
                        <Text style={[styles.colEstado, styles.textHeader]}>Estado</Text>
                    </View>

                    {/* TRANSACCIONES ITERADAS */}
                    {ventas && ventas.length > 0 ? (
                        ventas.map((row) => {
                            // Asignación de clases de color de tu Datatable traducida a estilos PDF
                            let badgeStyle = styles.badgeDefault;
                            if (row.estado_venta === 'COMPLETADA') badgeStyle = styles.badgeCompletada;
                            if (row.estado_venta === 'ANULADA') badgeStyle = styles.badgeAnulada;
                            if (row.estado_venta === 'EDITADA') badgeStyle = styles.badgeEditada;

                            return (
                                /* wrap={false} evita que una fila se rompa por la mitad al cambiar de hoja */
                                <View key={row.id} style={styles.tableRow} wrap={false}>
                                    <Text style={[styles.colTicket, styles.textCell]}>{row.id}</Text>
                                    <Text style={[styles.colFecha, styles.textCell]}>{formatPdfDate(row.fecha)}</Text>
                                    <Text style={[styles.colTotal, styles.textCell, styles.textTotalBold]}>
                                        Bs. {row.total.toFixed(2)}
                                    </Text>
                                    <Text style={[styles.colMetodo, styles.textCell]}>{row.metodo_pago}</Text>

                                    <View style={{ width: '20%', justifyContent: 'center' }}>
                                        <Text style={[styles.badge, badgeStyle]}>{row.estado_venta}</Text>
                                    </View>
                                </View>
                            );
                        })
                    ) : (
                        <View style={{ padding: 15, textAlign: 'center' }}>
                            <Text style={{ fontSize: 10, color: '#6b7280' }}>No existen ventas en este rango de fechas.</Text>
                        </View>
                    )}
                </View>
                <ReporteFooterAudit />
            </Page>
        </Document>
    );
};