import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 20, borderBottomWidth: 2, borderBottomColor: '#8b5cf6', paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#5b21b6' },
  subtitle: { fontSize: 14, color: '#555', marginTop: 5 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#f5f3ff', padding: 15, borderRadius: 8, marginBottom: 20, borderColor: '#ddd6fe', borderWidth: 1 },
  infoItem: { width: '50%', marginBottom: 5 },
  infoLabel: { fontWeight: 'bold', color: '#6d28d9' },
  table: { width: '100%', marginTop: 15 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#8b5cf6', color: 'white', padding: 8, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', padding: 8 },
  colOp: { width: '40%' },
  colCant: { width: '30%', textAlign: 'center' },
  colTotal: { width: '30%', textAlign: 'right' },
});

export const ProductividadOperadorPdf: React.FC<{ data: any }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Productividad y Ventas por Operador</Text>
        <Text style={styles.subtitle}>Kantuta POS - Monitoreo de Desempeño</Text>
      </View>
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}><Text><Text style={styles.infoLabel}>Desde: </Text>{data.fechaInicio}</Text></View>
        <View style={styles.infoItem}><Text><Text style={styles.infoLabel}>Hasta: </Text>{data.fechaFin}</Text></View>
        <View style={styles.infoItem}><Text><Text style={styles.infoLabel}>Emisión: </Text>{new Date(data.fechaEmision).toLocaleString()}</Text></View>
      </View>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colOp}>Operador</Text>
          <Text style={styles.colCant}>Transacciones Realizadas</Text>
          <Text style={styles.colTotal}>Total Facturado</Text>
        </View>
        {data.operadores.map((op: any, i: number) => (
          <View style={styles.tableRow} key={i}>
            <Text style={styles.colOp}>{op.operador}</Text>
            <Text style={styles.colCant}>{op.cantidad_ventas} ventas</Text>
            <Text style={[styles.colTotal, { fontWeight: 'bold', color: '#5b21b6' }]}>Bs. {op.total_facturado.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);
