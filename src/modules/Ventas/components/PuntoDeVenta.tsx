import { useState, useEffect, useCallback } from "react";
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
import { useSocket } from "../../../context/SocketContext";
import Swal from "sweetalert2";

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
  const socket = useSocket();

  const fetchProductos = useCallback(async () => {
    try {
      const response = await ProductosService.getProducts();
      setProductos(response.data);
      setFilteredProductos(response.data);
    } catch (error) {
      console.error("Error al obtener productos:", error);
    }
  }, []);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  useEffect(() => {
    const handleDataChanged = (data: { entity: string; action: string }) => {
      if (data.entity === "producto" || data.entity === "venta" || data.entity === "product") {
        console.log(`📡 WebSocket detectado en PuntoDeVenta: ${data.entity} - ${data.action}`);
        fetchProductos();
      }
    };

    socket.on("dataChanged", handleDataChanged);
    return () => {
      socket.off("dataChanged", handleDataChanged);
    };
  }, [socket, fetchProductos]);

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
        Swal.fire({
          title: "Stock Insuficiente",
          text: `No hay suficiente stock para el producto "${producto.nombre}". Stock disponible: ${producto.stock_actual}`,
          icon: "error",
          confirmButtonColor: "#ef4444"
        });
        return;
      }
      const nuevaCantidad = existing.cantidad + 1;
      
      // Alerta de stock mínimo alcanzado
      if (producto.stock_actual - nuevaCantidad <= producto.stock_minimo) {
        Swal.fire({
          title: "¡Stock Mínimo!",
          text: `El producto "${producto.nombre}" está llegando a su nivel mínimo. Stock restante: ${producto.stock_actual - nuevaCantidad}`,
          icon: "warning",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      }

      setCart(cart.map(c =>
        c.id_producto === producto.id
          ? { ...c, cantidad: nuevaCantidad }
          : c
      ));
    } else {
      if (producto.stock_actual <= 0) {
        Swal.fire({
          title: "Producto Agotado",
          text: `El producto "${producto.nombre}" no cuenta con stock disponible para la venta.`,
          icon: "error",
          confirmButtonColor: "#ef4444"
        });
        return;
      }

      // Alerta de stock mínimo al agregar el primero
      if (producto.stock_actual - 1 <= producto.stock_minimo) {
        Swal.fire({
          title: "¡Stock Mínimo!",
          text: `El producto "${producto.nombre}" está en su nivel mínimo de stock. Stock restante: ${producto.stock_actual - 1}`,
          icon: "warning",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      }

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
    if (producto) {
      if (newQuantity > producto.stock_actual) {
        Swal.fire({
          title: "Stock Insuficiente",
          text: `La cantidad excede el stock disponible para "${producto.nombre}". Stock disponible: ${producto.stock_actual}`,
          icon: "error",
          confirmButtonColor: "#ef4444"
        });
        return;
      }

      // Alerta de stock mínimo
      if (producto.stock_actual - newQuantity <= producto.stock_minimo) {
        Swal.fire({
          title: "¡Stock Mínimo!",
          text: `El producto "${producto.nombre}" está llegando a su nivel mínimo. Stock restante: ${producto.stock_actual - newQuantity}`,
          icon: "warning",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
      }
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
        fetchProductos(); // Actualizar stock local de inmediato
        setTimeout(() => setShowAlert(false), 3000);
        openModal();
      }
    } catch (error: any) {
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);

      if (error.response) {
        const { status, data } = error.response;
        console.error(`🚨 [Error ${status}] El backend rechazó la venta:`, data);

        const apiMessage = data?.message || "Error desconocido en el servidor";
        console.log("Mensaje real del error:", apiMessage);

        Swal.fire({
          title: "Error al Procesar Venta",
          text: apiMessage,
          icon: "error",
          confirmButtonColor: "#ef4444"
        });
      } else if (error.request) {
        console.error("🌐 Error de red: El servidor no respondió a la petición de venta.");
        Swal.fire({
          title: "Error de Red",
          text: "El servidor no respondió a la petición de venta.",
          icon: "error",
          confirmButtonColor: "#ef4444"
        });
      } else {
        console.error("⚙️ Error al procesar la venta interna del frontend:", error.message);
        Swal.fire({
          title: "Error Interno",
          text: error.message,
          icon: "error",
          confirmButtonColor: "#ef4444"
        });
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
        <div className="lg:w-1/2 flex flex-col space-y-4">
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

          <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-200 dark:border-gray-700 overflow-y-auto max-h-[70vh]">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredProductos.map((p) => (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="flex items-center justify-between px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-950/20 cursor-pointer transition-all"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">{p.nombre}</h5>
                    <p className="text-xs text-gray-500 mt-0.5">Cod: {p.codigo_barras || "N/A"}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">Bs. {Number(p.precio_venta).toFixed(2)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                      p.stock_actual <= 0 
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 font-semibold"
                        : p.stock_actual <= p.stock_minimo
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    }`}>
                      {p.stock_actual <= 0 ? "Agotado" : `Stock: ${p.stock_actual}`}
                    </span>
                  </div>
                </div>
              ))}
              {filteredProductos.length === 0 && (
                <div className="py-10 text-center text-gray-500">
                  No se encontraron productos.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lado Derecho: Carrito de Compras */}
        <div className="lg:w-1/2 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-theme-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                <div key={item.id_producto} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                  {/* Fila superior: nombre + precio unitario + subtotal */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 mr-2">
                      <h5 className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate" title={item.producto_nombre}>{item.producto_nombre}</h5>
                      <div className="text-xs text-gray-500 mt-0.5">Bs. {Number(item.precio_unitario).toFixed(2)} c/u</div>
                    </div>
                    <div className="font-bold text-sm text-gray-800 dark:text-white whitespace-nowrap">
                      Bs. {(item.cantidad * item.precio_unitario).toFixed(2)}
                    </div>
                  </div>
                  {/* Fila inferior: controles de cantidad + botón eliminar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <button
                        className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        onClick={() => {
                          if (item.cantidad - 1 <= 0) {
                            Swal.fire({
                              title: "Cantidad Inválida",
                              text: "La cantidad mínima debe ser 1.",
                              icon: "warning",
                              confirmButtonColor: "#ef4444"
                            });
                          } else {
                            updateQuantity(item.id_producto, item.cantidad - 1);
                          }
                        }}
                      >-</button>
                      <input
                        type="number"
                        value={item.cantidad || ""}
                        min="1"
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            Swal.fire({
                              title: "Cantidad Vacía",
                              text: "No puede dejar el campo de cantidad vacío.",
                              icon: "warning",
                              confirmButtonColor: "#ef4444"
                            });
                            updateQuantity(item.id_producto, 1);
                          } else {
                            const newQty = parseInt(val);
                            if (!isNaN(newQty)) {
                              updateQuantity(item.id_producto, newQty);
                            }
                          }
                        }}
                        className="w-12 text-center text-sm border-x border-gray-200 dark:border-gray-700 bg-transparent focus:outline-none"
                      />
                      <button
                        className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        onClick={() => updateQuantity(item.id_producto, item.cantidad + 1)}
                      >+</button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id_producto)}
                      className="flex items-center gap-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-1 rounded-lg transition-all"
                    >
                      <TrashBinIcon className="w-4 h-4" color="currentColor" />
                      <span className="text-xs font-medium">Quitar</span>
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
