import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { BoxIcon, PlusIcon, TrashBinIcon} from "../../../icons";
import Button from "../../../components/ui/button/Button";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import { VentasService } from "../services/ventasService";
import { ProductosService } from "../../Inventario/Productos/services/productosService";
import { Producto } from "../../Inventario/Productos/interfaces/Producto";
import { DetalleVentaInput, CrearVentaRequest } from "../interfaces/VentaDTO";
import Alert from "../../../components/ui/alert/Alert";
import Label from "../../../components/form/Label";

interface CartItem extends DetalleVentaInput {
  producto_nombre: string;
}

const PuntoDeVenta = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [metodoPago, setMetodoPago] = useState<"EFECTIVO" | "QR" | "TRANSFERENCIA">("EFECTIVO");
  const [idSesionCaja, setIdSesionCaja] = useState<number | "">("");

  const [showAlert, setShowAlert] = useState(false);
  const [showError, setShowError] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await ProductosService.getProducts();
        // Filtramos solo los productos activos y con stock
        const disponibles = response.data.filter((p: Producto) => p.stock_actual > 0);
        setProductos(disponibles);
        setFilteredProductos(disponibles);
      } catch (error) {
        console.error("Error al obtener productos:", error);
      }
    };
    fetchProductos();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProductos(productos);
    } else {
      const lower = searchTerm.toLowerCase();
      setFilteredProductos(
        productos.filter((p) => p.nombre.toLowerCase().includes(lower) || p.codigo_barras?.includes(lower))
      );
    }
  }, [searchTerm, productos]);

  const addToCart = (producto: Producto) => {
    const existing = cart.find(c => c.id_producto === producto.id);
    if (existing) {
      if (existing.cantidad + 1 > producto.stock_actual) {
        alert("No hay suficiente stock para este producto.");
        return;
      }
      setCart(cart.map(c => 
        c.id_producto === producto.id 
          ? { ...c, cantidad: c.cantidad + 1 } 
          : c
      ));
    } else {
      setCart([...cart, {
        id_producto: producto.id!,
        producto_nombre: producto.nombre,
        cantidad: 1,
        precio_unitario: producto.precio_venta
      }]);
    }
  };

  const removeFromCart = (id_producto: number) => {
    setCart(cart.filter(c => c.id_producto !== id_producto));
  };

  const updateQuantity = (id_producto: number, newQuantity: number) => {
    if (newQuantity <= 0) return;
    const producto = productos.find(p => p.id === id_producto);
    if (producto && newQuantity > producto.stock_actual) {
      alert("La cantidad excede el stock disponible.");
      return;
    }
    setCart(cart.map(c => 
      c.id_producto === id_producto 
        ? { ...c, cantidad: newQuantity } 
        : c
    ));
  };

  const total = cart.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("El carrito está vacío.");
    if (!idSesionCaja) return alert("Debe especificar la sesión de caja activa (ID) para procesar la venta.");

    try {
      const payload: CrearVentaRequest = {
        metodo_pago: metodoPago,
        id_sesion_caja: Number(idSesionCaja),
        detalles: cart.map(({ id_producto, cantidad, precio_unitario }) => ({
          id_producto,
          cantidad,
          precio_unitario
        })),
        id_user_create: 0
      };

      const response = await VentasService.createVenta(payload);
      if (response.status === 201 || response.status === 200) {
        setShowAlert(true);
        setCart([]); // limpiar carrito
        setTimeout(() => setShowAlert(false), 3000);
      }
    } catch (error) {
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      console.error("Error al registrar venta", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <PageBreadcrumb pageTitle="Terminal POS" />
        <Button
          className="bg-gray-500 hover:bg-gray-600 text-white"
          onClick={() => navigate("/ventas")}
        >
          Ver Historial
        </Button>
      </div>

      {showAlert && (
        <div className="mb-4">
          <Alert variant="success" title="¡Venta Exitosa!" message="El ticket se ha generado correctamente." />
        </div>
      )}
      {showError && (
        <div className="mb-4">
          <Alert variant="error" title="Error" message="No se pudo procesar la venta. Verifique la sesión de caja." />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        
        {/* Lado Izquierdo: Buscador y Lista de Productos */}
        <div className="lg:w-2/3 flex flex-col space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-theme-sm border border-gray-200 dark:border-gray-700">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <BoxIcon className="w-5 h-5" color="currentColor" />
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre o código de barras..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-theme-sm border border-gray-200 dark:border-gray-700 overflow-y-auto max-h-[70vh]">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProductos.map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => addToCart(p)}
                  className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md cursor-pointer transition-all flex flex-col"
                >
                  <div className="mb-2 flex-1">
                    <h5 className="font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 leading-tight">{p.nombre}</h5>
                    <p className="text-xs text-gray-500 mt-1">Cod: {p.codigo_barras || "N/A"}</p>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">Bs. {Number(p.precio_venta).toFixed(2)}</span>
                    <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                      Stock: {p.stock_actual}
                    </span>
                  </div>
                </div>
              ))}
              {filteredProductos.length === 0 && (
                <div className="col-span-full py-10 text-center text-gray-500">
                  No se encontraron productos.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lado Derecho: Carrito de Compras */}
        <div className="lg:w-1/3 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
            <h3 className="font-bold text-lg text-gray-800 dark:text-white">Ticket de Venta</h3>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
              {cart.length} items
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                <TrashBinIcon className="w-12 h-12 opacity-20" color="currentColor" />
                <p>El carrito está vacío</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id_producto} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div className="flex-1 mr-3">
                    <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate" title={item.producto_nombre}>{item.producto_nombre}</h5>
                    <div className="text-xs text-gray-500 mt-1">Bs. {Number(item.precio_unitario).toFixed(2)} c/u</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <button 
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        onClick={() => updateQuantity(item.id_producto, item.cantidad - 1)}
                      >-</button>
                      <input 
                        type="number" 
                        value={item.cantidad} 
                        onChange={(e) => updateQuantity(item.id_producto, parseInt(e.target.value) || 1)}
                        className="w-10 text-center text-sm border-x border-gray-200 dark:border-gray-700 bg-transparent focus:outline-none" 
                      />
                      <button 
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        onClick={() => updateQuantity(item.id_producto, item.cantidad + 1)}
                      >+</button>
                    </div>
                    <div className="font-bold text-gray-800 dark:text-white w-16 text-right">
                      Bs. {(item.cantidad * item.precio_unitario).toFixed(2)}
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id_producto)}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <TrashBinIcon className="w-4 h-4" color="currentColor" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-5 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                <span>Subtotal:</span>
                <span>Bs. {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold text-green-600 dark:text-green-500">
                <span>TOTAL A PAGAR:</span>
                <span>Bs. {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Método de Pago</Label>
                <Select
                  options={[
                    { value: "EFECTIVO", label: "Efectivo" },
                    { value: "QR", label: "Pago QR / Transferencia" },
                    { value: "TRANSFERENCIA", label: "Transferencia Bancaria" }
                  ]}
                  onChange={(v) => setMetodoPago(v as any)}
                  defaultValue={metodoPago}
                />
              </div>
              <div>
                <Label>ID Sesión de Caja Activa</Label>
                <Input
                  type="number"
                  placeholder="Ej: 1"
                  value={idSesionCaja}
                  onChange={(e) => setIdSesionCaja(e.target.value === "" ? "" : Number(e.target.value))}
                />
                <p className="text-xs text-gray-500 mt-1">Obligatorio para que ingrese a caja</p>
              </div>
              
              <Button
                variant="primary"
                className="w-full py-4 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-xl hover:shadow-green-500/30 transition-all text-white rounded-xl mt-4"
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                Cobrar Bs. {total.toFixed(2)}
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PuntoDeVenta;
