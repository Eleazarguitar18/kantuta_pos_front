import { Categoria } from "../../Categorias/interfaces/Categoria";

export interface Producto {
  id?: number;
  nombre: string;
  codigo_barras?: string | null;
  precio_venta: number;
  costo_compra: number;
  stock_actual: number;
  stock_minimo: number;
  id_categoria: number;
  categoria?: Categoria;
  id_user_create?: number;
  id_user_update?: number;
  createdAt?: string;
  updatedAt?: string;
}
