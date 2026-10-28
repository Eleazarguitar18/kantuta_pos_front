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
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'dashed',
    paddingBottom: 10,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#555',
  },
  info: {
    marginBottom: 20,
    lineHeight: 1.5,
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 10,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    borderBottomStyle: 'dotted',
  },
  tableHeader: {
    margin: 'auto',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    fontWeight: 'bold',
  },
  tableColProduct: {
    width: '40%',
  },
  tableColCant: {
    width: '15%',
    textAlign: 'center',
  },
  tableColUnit: {
    width: '20%',
    textAlign: 'right',
  },
  tableColSub: {
    width: '25%',
    textAlign: 'right',
  },
  tableCell: {
    margin: 5,
    fontSize: 10,
  },
  totalBox: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#000',
    borderTopStyle: 'dashed',
    paddingTop: 10,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

interface VentaData {
  id: number;
  fecha: string;
  cajero: string;
  metodo_pago: string;
  estado_venta: string;
  detalles?: Array<{
    id_producto?: number;
    nombre?: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }>;
  total: number;
}

export const TicketVentaPdf: React.FC<{ data: VentaData }> = ({ data }) => (
  <Document>
    <Page size="A5" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>TICKET DE VENTA</Text>
        <Text style={styles.subtitle}>Kantuta POS</Text>
      </View>

      <View style={styles.info}>
        <Text>Nro. Ticket: {data.id}</Text>
        <Text>Fecha: {new Date(data.fecha).toLocaleString()}</Text>
        <Text>Cajero: {data.cajero}</Text>
        <Text>Método Pago: {data.metodo_pago}</Text>
        <Text>Estado: {data.estado_venta}</Text>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <View style={styles.tableColProduct}>
            <Text style={styles.tableCell}>Producto</Text>
          </View>
          <View style={styles.tableColCant}>
            <Text style={styles.tableCell}>Cant.</Text>
          </View>
          <View style={styles.tableColUnit}>
            <Text style={styles.tableCell}>P. Unit</Text>
          </View>
          <View style={styles.tableColSub}>
            <Text style={styles.tableCell}>Subtotal</Text>
          </View>
        </View>

        {(data.detalles || []).map((d, i) => (
          <View style={styles.tableRow} key={i}>
            <View style={styles.tableColProduct}>
              <Text style={styles.tableCell}>
                {d.nombre?.trim() || `Producto #${d.id_producto ?? 's/n'}`}
              </Text>
            </View>
            <View style={styles.tableColCant}>
              <Text style={styles.tableCell}>{d.cantidad}</Text>
            </View>
            <View style={styles.tableColUnit}>
              <Text style={styles.tableCell}>Bs. {Number(d.precio_unitario || 0).toFixed(2)}</Text>
            </View>
            <View style={styles.tableColSub}>
              <Text style={styles.tableCell}>Bs. {Number(d.subtotal || 0).toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.totalBox}>
        <Text>TOTAL: Bs. {Number(data.total || 0).toFixed(2)}</Text>
      </View>
    </Page>
  </Document>
);
