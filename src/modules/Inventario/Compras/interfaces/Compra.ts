import { Producto } from "../../Productos/interfaces/Producto";
import { SesionCaja } from "../../../Cajas/interfaces/Caja"; // I will create Cajas interfaces soon

export interface BaseEntityAudit {
  estado: boolean;
  id_user_create: number | null;
  id_user_update?: number | null;
  created_at: string;
  updated_at: string;
}

export interface DetalleCompra extends BaseEntityAudit {
  id: number;
  cantidad: number;
  costo_unitario: number;
  subtotal: number;
  id_producto: number;
  producto?: Producto;
}

export interface Compra extends BaseEntityAudit {
  id: number;
  total: number;
  proveedor: string | null;
  pagado_con_caja: boolean;
  id_sesion_caja: number | null;
  fecha: string;
  detalles: DetalleCompra[];
}
