export interface ProductoEditDto {
  nombre?: string;
  codigo_barras?: string | null;
  precio_venta?: number;
  costo_compra?: number;
  stock_actual?: number;
  stock_minimo?: number;
  id_categoria?: number;
  id_user_update?: number;
}
