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
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#9a3412', marginTop: 18, marginBottom: 8, textTransform: 'uppercase' },
  detailHeader: { flexDirection: 'row', backgroundColor: '#ea580c', padding: 6, borderRadius: 3, alignItems: 'center' },
  detailRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingVertical: 4, paddingHorizontal: 4, alignItems: 'flex-start' },
  colDetalleCompra: { width: '12%', fontSize: 8, textAlign: 'center' },
  colDetalleProducto: { width: '40%', fontSize: 8, textAlign: 'left', paddingRight: 4 },
  colDetalleCant: { width: '10%', fontSize: 8, textAlign: 'center' },
  colDetalleCosto: { width: '19%', fontSize: 8, textAlign: 'right' },
  colDetalleSub: { width: '19%', fontSize: 8, textAlign: 'right' },
  textHeader: { color: '#ffffff', fontWeight: 'bold', fontSize: 9 },
  textCell: { color: '#374151' },
  grandTotal: { marginTop: 20, textAlign: 'right', fontSize: 16, fontWeight: 'bold', color: '#c2410c' },
});

export const ComprasRangoPdf: React.FC<{ data: any }> = ({ data }) => {
  const detallesComprados = (data.compras || []).flatMap((compra: any) =>
    (compra.detalles || []).map((detalle: any) => ({
      compra: compra.id,
      ...detalle,
    })),
  );

  return (
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
              <Text style={styles.colTotal}>Bs. {Number(c.total).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Detalle de Productos Comprados</Text>

        <View style={styles.table}>
          <View style={styles.detailHeader}>
            <Text style={[styles.colDetalleCompra, styles.textHeader]}>ID Compra</Text>
            <Text style={[styles.colDetalleProducto, styles.textHeader]}>Producto</Text>
            <Text style={[styles.colDetalleCant, styles.textHeader]}>Cant.</Text>
            <Text style={[styles.colDetalleCosto, styles.textHeader]}>Costo Unit.</Text>
            <Text style={[styles.colDetalleSub, styles.textHeader]}>Subtotal</Text>
          </View>

          {detallesComprados.length > 0 ? (
            detallesComprados.map((detalle: any, index: number) => (
              <View style={styles.detailRow} key={`${detalle.compra}-${detalle.id_producto}-${index}`} wrap={false}>
                <Text style={[styles.colDetalleCompra, styles.textCell]}>{detalle.compra}</Text>
                <Text style={[styles.colDetalleProducto, styles.textCell]}>{detalle.nombre}</Text>
                <Text style={[styles.colDetalleCant, styles.textCell]}>{detalle.cantidad}</Text>
                <Text style={[styles.colDetalleCosto, styles.textCell]}>Bs. {Number(detalle.costo_unitario).toFixed(2)}</Text>
                <Text style={[styles.colDetalleSub, styles.textCell]}>Bs. {Number(detalle.subtotal).toFixed(2)}</Text>
              </View>
            ))
          ) : (
            <View style={{ padding: 15, textAlign: 'center' }}>
              <Text style={{ fontSize: 10, color: '#6b7280' }}>No hay detalle de productos para este período.</Text>
            </View>
          )}
        </View>

        <Text style={styles.grandTotal}>Total Invertido: Bs. {Number(data.totalInvertido).toFixed(2)}</Text>
      </Page>
    </Document>
  );
};
