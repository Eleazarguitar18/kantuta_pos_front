import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 20, borderBottomWidth: 2, borderBottomColor: '#3b82f6', paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e3a8a' },
  subtitle: { fontSize: 14, color: '#555', marginTop: 5 },
  table: { width: '100%', marginTop: 15 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#3b82f6', color: 'white', padding: 8, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', padding: 8 },
  colId: { width: '10%' },
  colFecha: { width: '20%' },
  colSesion: { width: '15%' },
  colTipo: { width: '15%' },
  colMotivo: { width: '25%' },
  colMonto: { width: '15%', textAlign: 'right' },
  badgeIngreso: { color: '#065f46', fontSize: 10, fontWeight: 'bold' },
  badgeEgreso: { color: '#991b1b', fontSize: 10, fontWeight: 'bold' },
  totalBox: { marginTop: 20, padding: 15, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 8, alignSelf: 'flex-end', width: 250 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  totalFinal: { fontWeight: 'bold', borderTopWidth: 1, borderTopColor: '#bfdbfe', paddingTop: 5, marginTop: 5, color: '#1e3a8a' },
});

export const CajaHistorialPdf: React.FC<{ data: any }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Extracto Histórico de Caja</Text>
        <Text style={styles.subtitle}>Caja: {data.caja.nombre} (ID: {data.caja.id})</Text>
      </View>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colId}>ID</Text>
          <Text style={styles.colFecha}>Fecha/Hora</Text>
          <Text style={styles.colSesion}>Sesión</Text>
          <Text style={styles.colTipo}>Tipo</Text>
          <Text style={styles.colMotivo}>Motivo</Text>
          <Text style={styles.colMonto}>Monto (Bs.)</Text>
        </View>
        {data.movimientos.map((m: any, i: number) => (
          <View style={styles.tableRow} key={i}>
            <Text style={styles.colId}>{m.id}</Text>
            <Text style={styles.colFecha}>{new Date(m.fecha).toLocaleString()}</Text>
            <Text style={styles.colSesion}>Sesión #{m.id_sesion}</Text>
            <View style={styles.colTipo}>
              <Text style={m.tipo === 'INGRESO' ? styles.badgeIngreso : styles.badgeEgreso}>{m.tipo}</Text>
            </View>
            <Text style={styles.colMotivo}>{m.motivo}</Text>
            <Text style={styles.colMonto}>{m.monto.toFixed(2)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.totalBox}>
        <View style={styles.totalRow}><Text>(+) Ingresos:</Text><Text>Bs. {data.totales.ingresos.toFixed(2)}</Text></View>
        <View style={styles.totalRow}><Text>(-) Egresos:</Text><Text>Bs. {data.totales.egresos.toFixed(2)}</Text></View>
        <View style={[styles.totalRow, styles.totalFinal]}><Text>Flujo Neto:</Text><Text>Bs. {data.totales.neto.toFixed(2)}</Text></View>
      </View>
    </Page>
  </Document>
);
