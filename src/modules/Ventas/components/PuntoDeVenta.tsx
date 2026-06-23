import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { BoxIcon, TrashBinIcon } from "../../../icons";
import { useCaja } from "../../../context/CajaContext";
import Button from "../../../components/ui/button/Button";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import Select from "../../../components/form/Select";
import { VentasService } from "../services/ventasService";
import { ProductosService } from "../../Inventario/Productos/services/productosService";
import { Producto } from "../../Inventario/Productos/interfaces/Producto";
import { DetalleVentaInput, CrearVentaRequest } from "../interfaces/VentaDTO";
import Alert from "../../../components/ui/alert/Alert";
import Label from "../../../components/form/Label";
import { Modal } from "../../../components/ui/modal";
import { useModal } from "../../../hooks/useModal";
import { useAuth } from "../../../context/auth/AuthContext";

interface CartItem extends DetalleVentaInput {
  producto_nombre: string;
}

const PuntoDeVenta = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [metodoPago, setMetodoPago] = useState<"EFECTIVO" | "QR" | "TRANSFERENCIA">("EFECTIVO");
  const { sesionActiva, loading: loadingCaja } = useCaja();
  const { isOpen, openModal, closeModal } = useModal();
  const [createdVenta, setCreatedVenta] = useState<any | null>(null);

  const [showAlert, setShowAlert] = useState(false);
  const [showError, setShowError] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();
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
    if (!sesionActiva) return alert("Debe tener una sesión de caja activa abierta para procesar la venta.");

    try {
      const payload: CrearVentaRequest = {
        metodo_pago: metodoPago,
        id_sesion_caja: sesionActiva.id,
        detalles: cart.map(({ id_producto, cantidad, precio_unitario }) => ({
          id_producto,
          cantidad,
          precio_unitario: Number(precio_unitario) || 0
        })),
        id_user_create: user?.id || 0,
        // total: total,
      };

      const response = await VentasService.createVenta(payload);
      console.log('response de la venta', response);
      if (response.status === 201 || response.status === 200) {
        setCreatedVenta({
          ...response.data,
          // Guardamos una copia de los nombres de los productos para mostrarlos en el modal
          detalles_con_nombre: cart.map(item => ({
            nombre: item.producto_nombre,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.cantidad * item.precio_unitario
          }))
        });
        setShowAlert(true);
        setCart([]); // limpiar carrito
        setTimeout(() => setShowAlert(false), 3000);
        openModal();
      }
    } catch (error: any) {
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);

      if (error.response) {
        const { status, data } = error.response;
        console.error(`🚨 [Error ${status}] El backend rechazó la venta:`, data);

        // Si tu NestJS manda un mensaje específico (ej: "No hay suficiente stock de Coca-Cola")
        const apiMessage = data?.message || "Error desconocido en el servidor";
        console.log("Mensaje real del error:", apiMessage);

      } else if (error.request) {
        // La petición se hizo pero el backend nunca respondió (servidor caído o problemas de red)
        console.error("🌐 Error de red: El servidor no respondió a la petición de venta.");
      } else {
        // Algo pasó al armar la petición antes de enviarla
        console.error("⚙️ Error al procesar la venta interna del frontend:", error.message);
      }
    }
  };

  const handleModalClose = () => {
    closeModal();
    navigate("/ventas");
  };

  if (loadingCaja) {
    return <div className="p-6 text-center">Cargando datos de caja...</div>;
  }

  if (!sesionActiva) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
            <TrashBinIcon className="w-8 h-8" color="currentColor" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Caja Cerrada o Inactiva</h2>
          <p className="text-gray-600 dark:text-gray-400">
            No tienes un turno de caja abierto en este momento. Es obligatorio iniciar la sesión de caja e ingresar el saldo inicial antes de registrar cualquier venta.
          </p>
          <div className="flex flex-col space-y-3">
            <Button
              variant="primary"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => navigate("/cajas")}
            >
              Ir a Control de Cajas
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  <span className="font-semibold">Caja Activa:</span> {sesionActiva.caja?.nombre || `Caja #${sesionActiva.id_caja}`} (Sesión #{sesionActiva.id})
                </p>
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

      {/* Modal de Ticket Exitoso */}
      <Modal
        isOpen={isOpen}
        onClose={handleModalClose}
        className="max-w-md p-6"
      >
        {createdVenta && (
          <div className="space-y-6">
            <div className="text-center pb-4 border-b border-dashed border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                ¡Venta Registrada!
              </h3>
              <p className="text-sm text-gray-500 mt-1">Ticket #{createdVenta.id}</p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {new Date(createdVenta.fecha || new Date()).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Método de Pago:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{createdVenta.metodo_pago}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Caja / Turno:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">Sesión #{createdVenta.id_sesion_caja}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">Productos</h4>
              <div className="space-y-3">
                {createdVenta.detalles_con_nombre?.map((det: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div className="flex-1 pr-4">
                      <p className="font-medium text-gray-800 dark:text-gray-200">{det.nombre}</p>
                      <p className="text-xs text-gray-500">
                        {det.cantidad} x Bs. {Number(det.precio_unitario).toFixed(2)}
                      </p>
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-white">
                      Bs. {Number(det.subtotal).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between items-center text-lg font-bold text-green-600 dark:text-green-500">
              <span>Total:</span>
              <span>Bs. {Number(createdVenta.total).toFixed(2)}</span>
            </div>

            <div className="pt-4">
              <Button
                variant="primary"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
                onClick={handleModalClose}
              >
                Aceptar / Ir al Historial
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PuntoDeVenta;
