import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 35, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { borderBottomWidth: 2, borderBottomColor: '#8b5cf6', paddingBottom: 8, marginBottom: 15 },
  title: { fontSize: 20, color: '#5b21b6', fontWeight: 'bold' },
  subtitle: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, backgroundColor: '#f5f3ff', padding: 10, borderRadius: 4, borderWidth: 1, borderColor: '#ddd6fe' },
  infoItem: { fontSize: 9, color: '#374151' },
  infoLabel: { fontWeight: 'bold', color: '#6d28d9' },

  tableContainer: { marginTop: 10, width: '100%' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#8b5cf6', padding: 6, borderRadius: 3, alignItems: 'center' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 5, paddingHorizontal: 4, alignItems: 'center' },

  colCodigo: { width: '15%', fontSize: 9, textAlign: 'center' },
  colNombre: { width: '35%', fontSize: 9, textAlign: 'left' },
  colCategoria: { width: '15%', fontSize: 9, textAlign: 'center' },
  colStock: { width: '10%', fontSize: 9, textAlign: 'center' },
  colCosto: { width: '12%', fontSize: 9, textAlign: 'right' },
  colPrecio: { width: '13%', fontSize: 9, textAlign: 'right' },

  textHeader: { color: '#ffffff', fontWeight: 'bold', fontSize: 9 },
  textCell: { color: '#374151' },

  bajoStockBadge: { backgroundColor: '#fee2e2', color: '#991b1b', paddingHorizontal: 3, paddingVertical: 1, borderRadius: 2, fontSize: 8 },

  summaryBox: { marginTop: 20, padding: 12, backgroundColor: '#fdf4ff', borderWidth: 1, borderColor: '#fbcfe8', borderRadius: 4 },
  summaryTitle: { fontSize: 12, fontWeight: 'bold', color: '#86198f', marginBottom: 6 },
  summaryText: { fontSize: 10, color: '#4b5563', marginBottom: 4 },
  summaryBold: { fontWeight: 'bold', color: '#111827' },
});

export interface InventarioRow {
  codigo_barras: string;
  nombre: string;
  categoria: string;
  stock_actual: number;
  bajoStock: boolean;
  costo: number;
  precio: number;
}

interface ReporteInventarioProps {
  datos: {
    fechaCorte: string;
    auditor: string;
    productos: InventarioRow[];
    resumen: {
      itemsBajoStock: number;
      totalCosto: number;
      totalPrecio: number;
      gananciaProyectada: number;
    };
  };
}

const formatPdfDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-BO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

export const ReporteInventarioPDF: React.FC<ReporteInventarioProps> = ({ datos }) => {
  const { productos, resumen, fechaCorte, auditor } = datos;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* ENCABEZADO */}
        <View style={styles.header}>
          <Text style={styles.title}>Reporte de Inventario Actual</Text>
          <Text style={styles.subtitle}>Kantuta POS - Existencias y Valoración</Text>
        </View>

        {/* INFO GRID */}
        <View style={styles.infoGrid}>
          <Text style={styles.infoItem}><Text style={styles.infoLabel}>Fecha de Corte: </Text>{formatPdfDate(fechaCorte)}</Text>
          <Text style={styles.infoItem}><Text style={styles.infoLabel}>Auditor Responsable: </Text>{auditor}</Text>
        </View>

        {/* TABLA DE PRODUCTOS */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colCodigo, styles.textHeader]}>Cód. Barras</Text>
            <Text style={[styles.colNombre, styles.textHeader]}>Producto</Text>
            <Text style={[styles.colCategoria, styles.textHeader]}>Categoría</Text>
            <Text style={[styles.colStock, styles.textHeader]}>Stock</Text>
            <Text style={[styles.colCosto, styles.textHeader]}>Costo Un.</Text>
            <Text style={[styles.colPrecio, styles.textHeader]}>PVP Un.</Text>
          </View>

          {productos && productos.length > 0 ? (
            productos.map((row, index) => (
              <View key={index} style={styles.tableRow} wrap={false}>
                <Text style={[styles.colCodigo, styles.textCell]}>{row.codigo_barras}</Text>
                <Text style={[styles.colNombre, styles.textCell]}>{row.nombre}</Text>
                <Text style={[styles.colCategoria, styles.textCell]}>{row.categoria}</Text>
                
                <View style={[styles.colStock, { alignItems: 'center' }]}>
                  {row.bajoStock ? (
                    <Text style={styles.bajoStockBadge}>{row.stock_actual} (BAJO)</Text>
                  ) : (
                    <Text style={styles.textCell}>{row.stock_actual}</Text>
                  )}
                </View>

                <Text style={[styles.colCosto, styles.textCell]}>Bs. {row.costo.toFixed(2)}</Text>
                <Text style={[styles.colPrecio, styles.textCell]}>Bs. {row.precio.toFixed(2)}</Text>
              </View>
            ))
          ) : (
            <View style={{ padding: 15, textAlign: 'center' }}>
              <Text style={{ fontSize: 10, color: '#6b7280' }}>No existen productos en inventario.</Text>
            </View>
          )}
        </View>

        {/* RESUMEN DE VALORACION */}
        <View style={styles.summaryBox} wrap={false}>
          <Text style={styles.summaryTitle}>Resumen de Valoración</Text>
          <Text style={styles.summaryText}>
            Total de ítems en estado crítico (Bajo Stock): <Text style={styles.summaryBold}>{resumen.itemsBajoStock}</Text>
          </Text>
          <Text style={styles.summaryText}>
            Costo Total del Inventario: <Text style={styles.summaryBold}>Bs. {resumen.totalCosto.toFixed(2)}</Text>
          </Text>
          <Text style={styles.summaryText}>
            Valor de Venta del Inventario: <Text style={styles.summaryBold}>Bs. {resumen.totalPrecio.toFixed(2)}</Text>
          </Text>
          <Text style={styles.summaryText}>
            Ganancia Proyectada: <Text style={styles.summaryBold}>Bs. {resumen.gananciaProyectada.toFixed(2)}</Text>
          </Text>
        </View>

      </Page>
    </Document>
  );
};
