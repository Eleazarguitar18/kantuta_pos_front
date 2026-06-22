import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 20, borderBottomWidth: 2, borderBottomColor: '#f97316', paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#c2410c' },
  subtitle: { fontSize: 14, color: '#555', marginTop: 5 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff7ed', padding: 15, borderRadius: 8, marginBottom: 20, borderColor: '#ffedd5', borderWidth: 1 },
  infoItem: { width: '50%', marginBottom: 5 },
  infoLabel: { fontWeight: 'bold', color: '#9a3412' },
  table: { width: '100%', marginTop: 15 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f97316', color: 'white', padding: 8, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', padding: 8 },
  colId: { width: '15%' },
  colFecha: { width: '25%' },
  colProv: { width: '25%' },
  colPago: { width: '15%' },
  colTotal: { width: '20%', textAlign: 'right' },
  grandTotal: { marginTop: 20, textAlign: 'right', fontSize: 16, fontWeight: 'bold', color: '#c2410c' },
});

export const ComprasRangoPdf: React.FC<{ data: any }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial de Compras de Inventario</Text>
        <Text style={styles.subtitle}>Kantuta POS - Control de Ingresos</Text>
      </View>
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}><Text><Text style={styles.infoLabel}>Desde: </Text>{data.fechaInicio}</Text></View>
        <View style={styles.infoItem}><Text><Text style={styles.infoLabel}>Hasta: </Text>{data.fechaFin}</Text></View>
        <View style={styles.infoItem}><Text><Text style={styles.infoLabel}>Auditor: </Text>{data.auditor}</Text></View>
        <View style={styles.infoItem}><Text><Text style={styles.infoLabel}>Emisión: </Text>{new Date(data.fechaEmision).toLocaleString()}</Text></View>
      </View>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colId}>ID Compra</Text>
          <Text style={styles.colFecha}>Fecha/Hora</Text>
          <Text style={styles.colProv}>Proveedor</Text>
          <Text style={styles.colPago}>Pago Caja</Text>
          <Text style={styles.colTotal}>Total Inv.</Text>
        </View>
        {data.compras.map((c: any, i: number) => (
          <View style={styles.tableRow} key={i}>
            <Text style={styles.colId}>#{c.id}</Text>
            <Text style={styles.colFecha}>{new Date(c.fecha).toLocaleString()}</Text>
            <Text style={styles.colProv}>{c.proveedor}</Text>
            <Text style={styles.colPago}>{c.pagado_con_caja ? 'Sí' : 'No'}</Text>
            <Text style={styles.colTotal}>Bs. {c.total.toFixed(2)}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.grandTotal}>Total Invertido: Bs. {data.totalInvertido.toFixed(2)}</Text>
    </Page>
  </Document>
);
