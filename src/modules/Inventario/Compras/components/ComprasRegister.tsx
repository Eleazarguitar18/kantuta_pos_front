import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useCaja } from "../../../../context/CajaContext";
import { PlusIcon, TrashBinIcon } from "../../../../icons";
import Button from "../../../../components/ui/button/Button";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import Label from "../../../../components/form/Label";
import Input from "../../../../components/form/input/InputField";
import Select from "../../../../components/form/Select";
import { ComprasService } from "../services/comprasService";
import { ProductosService } from "../../Productos/services/productosService";
import { Producto } from "../../Productos/interfaces/Producto";
import { DetalleCompraInput, CrearCompraRequest } from "../interfaces/CrearCompraRequest";
import Alert from "../../../../components/ui/alert/Alert";

interface DetalleCompraUi extends DetalleCompraInput {
  producto_nombre: string;
}

const ComprasRegister = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [detalles, setDetalles] = useState<DetalleCompraUi[]>([]);
  const [proveedor, setProveedor] = useState("");
  const [pagarConCaja, setPagarConCaja] = useState(false);
  const { sesionActiva } = useCaja();

  // UI States para agregar al carrito
  const [selectedProductId, setSelectedProductId] = useState<number | "">("");
  const [cantidad, setCantidad] = useState<number>(1);
  const [costoUnitario, setCostoUnitario] = useState<number>(0);

  const [showAlert, setShowAlert] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await ProductosService.getProducts();
        setProductos(response.data);
      } catch (error) {
        console.error("Error al obtener productos:", error);
      }
    };
    fetchProductos();
  }, []);

  const handleAddProduct = () => {
    if (!selectedProductId || cantidad <= 0 || costoUnitario < 0) {
      alert("Por favor ingrese un producto válido, cantidad mayor a 0 y costo válido.");
      return;
    }

    const producto = productos.find((p) => p.id === Number(selectedProductId));
    if (!producto) return;

    // Verificar si ya existe en detalles
    const existingIndex = detalles.findIndex((d) => d.id_producto === producto.id);
    if (existingIndex >= 0) {
      const updated = [...detalles];
      updated[existingIndex].cantidad += Number(cantidad);
      updated[existingIndex].costo_unitario = Number(costoUnitario); // Update cost
      setDetalles(updated);
    } else {
      setDetalles([
        ...detalles,
        {
          id_producto: producto.id!,
          producto_nombre: producto.nombre,
          cantidad: Number(cantidad),
          costo_unitario: Number(costoUnitario),
        },
      ]);
    }

    // Reset fields
    setSelectedProductId("");
    setCantidad(1);
    setCostoUnitario(0);
  };

  const handleRemoveProduct = (id_producto: number) => {
    setDetalles(detalles.filter((d) => d.id_producto !== id_producto));
  };

  const totalCompra = detalles.reduce((acc, d) => acc + d.cantidad * d.costo_unitario, 0);

  const onSubmit = async () => {
    if (detalles.length === 0) {
      alert("Debe agregar al menos un producto a la compra.");
      return;
    }

    if (pagarConCaja && !sesionActiva) {
      alert("Para pagar con caja debe tener una sesión de caja activa abierta.");
      return;
    }

    try {
      const payload: CrearCompraRequest = {
        proveedor: proveedor || undefined,
        pagar_con_caja: pagarConCaja,
        id_sesion_caja: pagarConCaja ? sesionActiva.id : undefined,
        detalles: detalles.map(({ id_producto, cantidad, costo_unitario }) => ({
          id_producto,
          cantidad,
          costo_unitario,
        })),
        id_user_create: 0, // Service handles this
      };

      const response = await ComprasService.createCompra(payload);
      if (response.status === 201) {
        setShowAlert(true);
        setTimeout(() => {
          navigate("/inventario/compras");
        }, 2000);
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || "Hubo un error al guardar la compra.");
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      console.error("Error al registrar compra:", error);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Registro de Compra" />

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-theme-sm border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
            Nueva Compra / Ingreso de Mercadería
          </h3>
          <Button
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={() => navigate("/inventario/compras")}
          >
            Atras
          </Button>
        </div>

        {showAlert && (
          <div className="mb-4">
            <Alert variant="success" title="¡Compra Guardada!" message="El ingreso se registró correctamente." />
          </div>
        )}
        {showError && (
          <div className="mb-4">
            <Alert variant="error" title="Error" message={errorMessage} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario Principal */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">Datos Generales</h4>
              
              <div className="mb-4">
                <Label htmlFor="proveedor">Proveedor (Opcional)</Label>
                <Input
                  type="text"
                  id="proveedor"
                  placeholder="Ej: Distribuidora XYZ"
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    className="rounded text-blue-600 focus:ring-blue-500 bg-white border-gray-300"
                    checked={pagarConCaja}
                    onChange={(e) => setPagarConCaja(e.target.checked)}
                  />
                  <span>Pagar en efectivo (desde Caja POS)</span>
                </label>
              </div>

              {pagarConCaja && (
                <div className="mb-4">
                  {sesionActiva ? (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        <span className="font-semibold">Caja Activa:</span> {sesionActiva.caja?.nombre || `Caja #${sesionActiva.id_caja}`} (Sesión #{sesionActiva.id})
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-red-500 font-medium">
                      No hay sesión de caja abierta. Abre una caja antes de marcar esta opción.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">Agregar Producto</h4>
              
              <div className="mb-3">
                <Label>Producto</Label>
                <Select
                  options={productos.map((p) => ({ value: p.id!.toString(), label: p.nombre }))}
                  placeholder="Seleccione un producto..."
                  onChange={(val) => {
                    setSelectedProductId(Number(val));
                    const p = productos.find(x => x.id === Number(val));
                    if (p) setCostoUnitario(p.costo_compra);
                  }}
                  defaultValue={selectedProductId.toString()}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Costo Unit.</Label>
                  <Input
                    type="number"
                    step={0.01}
                    min="0"
                    value={costoUnitario}
                    onChange={(e) => setCostoUnitario(Number(e.target.value))}
                  />
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleAddProduct}
                startIcon={<PlusIcon className="w-4 h-4" color={"white"} />}
              >
                Agregar
              </Button>
            </div>
          </div>

          {/* Carrito de Detalles */}
          <div className="lg:col-span-2">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">Detalle de Ingreso</h4>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cant.</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Costo U.</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quitar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {detalles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                        No hay productos agregados. Utilice el formulario de la izquierda.
                      </td>
                    </tr>
                  ) : (
                    detalles.map((d) => (
                      <tr key={d.id_producto} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300">{d.producto_nombre}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-800 dark:text-gray-300">{d.cantidad}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">Bs. {d.costo_unitario.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600 dark:text-green-400">
                          Bs. {(d.cantidad * d.costo_unitario).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleRemoveProduct(d.id_producto)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                          >
                            <TrashBinIcon className="w-5 h-5" color="currentColor" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Total a Pagar:</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-500">Bs. {totalCompra.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                variant="primary"
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                onClick={onSubmit}
              >
                Confirmar Compra
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprasRegister;
