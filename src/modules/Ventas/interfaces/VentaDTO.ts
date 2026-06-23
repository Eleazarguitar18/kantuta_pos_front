export interface DetalleVentaInput {
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
}

export interface CrearVentaRequest {
  metodo_pago: "EFECTIVO" | "QR" | "TRANSFERENCIA";
  id_sesion_caja: number;
  detalles: DetalleVentaInput[];
  id_user_create: number;
  // total: number;
}

export interface ActualizarVentaRequest {
  metodo_pago?: "EFECTIVO" | "QR" | "TRANSFERENCIA";
  id_sesion_caja?: number;
  estado_venta?: "COMPLETADA" | "ANULADA" | "EDITADA";
  motivo_edicion?: string;
  id_user_update?: number;
}
