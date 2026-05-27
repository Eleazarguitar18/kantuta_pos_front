import { Producto } from "../../Inventario/Productos/interfaces/Producto";

export interface BaseEntityAudit {
  estado: boolean;
  id_user_create: number | null;
  id_user_update?: number | null;
  created_at: string;
  updated_at: string;
}

export interface DetalleVenta extends BaseEntityAudit {
  id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  id_venta: number;
  id_producto: number;
  producto?: Producto;
}

export interface Venta extends BaseEntityAudit {
  id: number;
  total: number;
  metodo_pago: "EFECTIVO" | "QR" | "TRANSFERENCIA";
  fecha: string;
  id_sesion_caja: number;
  estado_venta: "COMPLETADA" | "ANULADA" | "EDITADA";
  motivo_edicion: string | null;
  fecha_modificacion: string;
  detalles: DetalleVenta[];
}
