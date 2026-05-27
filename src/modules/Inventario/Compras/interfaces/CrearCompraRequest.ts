export interface DetalleCompraInput {
  id_producto: number;
  cantidad: number;
  costo_unitario: number;
}

export interface CrearCompraRequest {
  proveedor?: string;
  pagar_con_caja: boolean;
  id_sesion_caja?: number;
  detalles: DetalleCompraInput[];
  id_user_create: number;
}
