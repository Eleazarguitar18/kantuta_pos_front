import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
    paddingBottom: 10,
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  grid: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 20,
    backgroundColor: '#f9fafb',
    lineHeight: 1.6,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 150,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  value: {
    color: '#111827',
  },
});

interface ProductoData {
  id: number;
  nombre: string;
  codigo_barras: string | null;
  categoria: string;
  stock_actual: number;
  stock_minimo: number;
  precio_venta: number;
  costo_compra: number;
  fecha_ingreso: string;
}

export const FichaProductoPdf: React.FC<{ data: ProductoData }> = ({ data }) => (
  <Document>
    <Page size="A5" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Ficha de Producto</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.row}>
          <Text style={styles.label}>ID Sistema:</Text>
          <Text style={styles.value}>{data.id}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Nombre:</Text>
          <Text style={styles.value}>{data.nombre}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Código Barras:</Text>
          <Text style={styles.value}>{data.codigo_barras || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Categoría:</Text>
          <Text style={styles.value}>{data.categoria}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Stock Actual:</Text>
          <Text style={styles.value}>{data.stock_actual}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Stock Mínimo:</Text>
          <Text style={styles.value}>{data.stock_minimo}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Precio Venta:</Text>
          <Text style={styles.value}>Bs. {data.precio_venta.toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Costo Compra:</Text>
          <Text style={styles.value}>Bs. {data.costo_compra.toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Fecha Ingreso:</Text>
          <Text style={styles.value}>{new Date(data.fecha_ingreso).toLocaleString()}</Text>
        </View>
      </View>
    </Page>
  </Document>
);
