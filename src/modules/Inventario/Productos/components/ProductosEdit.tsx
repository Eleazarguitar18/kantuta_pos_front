import Button from "../../../../components/ui/button/Button";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import Label from "../../../../components/form/Label";
import Input from "../../../../components/form/input/InputField";
import Select from "../../../../components/form/Select";
import { useForm } from "react-hook-form";
import { ProductosService } from "../services/productosService";
import { CategoriasService } from "../../Categorias/services/categoriasService";
import Alert from "../../../../components/ui/alert/Alert";
import { useNavigate, useLocation, useParams } from "react-router";
import { useState, useEffect } from "react";
import { ProductoEditDto } from "../interfaces/ProductoEditDto";
import { Producto } from "../interfaces/Producto";

function ProductosEdit() {
  const [showAlert, setShowAlert] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { id_producto } = useParams();

  const form = useForm<ProductoEditDto>({
    defaultValues: {
      nombre: "",
      codigo_barras: "",
      precio_venta: 0,
      costo_compra: 0,
      stock_actual: 0,
      stock_minimo: 0,
      id_categoria: undefined,
    },
  });

  // Watch the entire form to trigger re-renders when setValue is called or when typing
  form.watch();

  const productoAEditar = location.state as Producto;

  // Cargar categorías para el selector
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await CategoriasService.getCategories();
        setCategorias(response.data);
      } catch (error) {
        console.error("Error al obtener categorías:", error);
      }
    };
    fetchCategorias();
  }, []);

  // Registrar campos en React Hook Form para que la validación funcione con setValue
  useEffect(() => {
    form.register("nombre", { required: "El nombre es requerido" });
    form.register("precio_venta", {
      required: "El precio de venta es requerido",
      min: { value: 0, message: "Debe ser mayor o igual a 0" },
    });
    form.register("costo_compra", {
      required: "El costo de compra es requerido",
      min: { value: 0, message: "Debe ser mayor o igual a 0" },
    });
    form.register("stock_actual", {
      required: "El stock actual es requerido",
      min: { value: 0, message: "Debe ser mayor o igual a 0" },
    });
    form.register("stock_minimo", {
      required: "El stock mínimo es requerido",
      min: { value: 0, message: "Debe ser mayor o igual a 0" },
    });
    form.register("id_categoria", { required: "La categoría es requerida" });
  }, [form]);

  // Llenar el formulario con los datos a editar
  useEffect(() => {
    if (productoAEditar) {
      form.setValue("nombre", productoAEditar.nombre);
      form.setValue("codigo_barras", productoAEditar.codigo_barras || "");
      form.setValue("precio_venta", Number(productoAEditar.precio_venta));
      form.setValue("costo_compra", Number(productoAEditar.costo_compra));
      form.setValue("stock_actual", Number(productoAEditar.stock_actual));
      form.setValue("stock_minimo", Number(productoAEditar.stock_minimo));
      const catId =
        productoAEditar.id_categoria || productoAEditar.categoria?.id;
      if (catId) {
        form.setValue("id_categoria", Number(catId));
      }
    } else if (id_producto) {
      const fetchProducto = async () => {
        try {
          const response = await ProductosService.getProductById(
            Number(id_producto),
          );
          const prod = response.data;
          form.setValue("nombre", prod.nombre);
          form.setValue("codigo_barras", prod.codigo_barras || "");
          form.setValue("precio_venta", Number(prod.precio_venta));
          form.setValue("costo_compra", Number(prod.costo_compra));
          form.setValue("stock_actual", Number(prod.stock_actual));
          form.setValue("stock_minimo", Number(prod.stock_minimo));
          const catId = prod.id_categoria || prod.categoria?.id;
          if (catId) {
            form.setValue("id_categoria", Number(catId));
          }
        } catch (error) {
          console.error("Error al obtener el producto", error);
        }
      };
      fetchProducto();
    }
  }, [productoAEditar, id_producto, form]);

  const onSubmit = async (data: ProductoEditDto) => {
    try {
      data.costo_compra = Number(data.costo_compra);
      data.precio_venta = Number(data.precio_venta);
      data.stock_actual = Number(data.stock_actual);
      data.stock_minimo = Number(data.stock_minimo);

      console.log("Datos que se enviarán a la API para actualizar:", data);
      const productId = id_producto ? parseInt(id_producto) : (productoAEditar?.id || 0);
      const response = await ProductosService.updateProduct(
        productId,
        data,
      );

      if (response.status === 200) {
        setShowAlert(true);
        setTimeout(() => {
          navigate("/inventario/productos");
        }, 2000);
      }
    } catch (error: any) {
      console.log("error", error.response);

      if (error.response && error.response.status === 409) {
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
      } else {
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
      }

      console.error("Error al actualizar el producto:", error);
    }
  };

  const selectOptions = categorias.map((cat) => ({
    value: cat.id.toString(),
    label: cat.nombre,
  }));

  const selectedCategoryValue = form.watch("id_categoria")?.toString() || "";

  return (
    <div>
      <PageBreadcrumb pageTitle="Edición de Producto" />

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-theme-sm border border-gray-200 dark:border-gray-700">
        {/* Header con botón */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
            Formulario de edición de producto
          </h3>
          <Button
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={() => navigate("/inventario/productos")}
          >
            Atras
          </Button>
        </div>
        {showAlert && (
          <div className="mb-4">
            <Alert
              variant="success"
              title="¡Guardado!"
              message="El producto se ha modificado correctamente en el sistema."
            />
          </div>
        )}
        {showError && (
          <div className="mb-4">
            <Alert
              variant="error"
              title="Error al guardar"
              message="Hubo un error al guardar el producto"
            />
          </div>
        )}
        {showWarning && (
          <div className="mb-4">
            <Alert
              variant="warning"
              title="¡Error al registrar!"
              message="El producto ya existe en el sistema."
            />
          </div>
        )}

        {/* Contenido del formulario */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                type="text"
                id="nombre"
                value={form.getValues("nombre")}
                onChange={(e) =>
                  form.setValue("nombre", e.target.value, {
                    shouldValidate: true,
                  })
                }
              />
              {form.formState.errors.nombre && (
                <span className="text-red-500 text-xs">
                  {form.formState.errors.nombre.message}
                </span>
              )}
            </div>

            {/* Código de barras */}
            <div>
              <Label htmlFor="codigo_barras">Código de Barras</Label>
              <Input
                type="text"
                id="codigo_barras"
                value={form.getValues("codigo_barras") || ""}
                onChange={(e) =>
                  form.setValue("codigo_barras", e.target.value, {
                    shouldValidate: true,
                  })
                }
              />
            </div>

            {/* Precio Venta */}
            <div>
              <Label htmlFor="precio_venta">Precio de Venta</Label>
              <Input
                type="number"
                id="precio_venta"
                step={0.01}
                value={form.getValues("precio_venta")}
                onChange={(e) =>
                  form.setValue("precio_venta", Number(e.target.value), {
                    shouldValidate: true,
                  })
                }
              />
              {form.formState.errors.precio_venta && (
                <span className="text-red-500 text-xs">
                  {form.formState.errors.precio_venta.message}
                </span>
              )}
            </div>

            {/* Costo Compra */}
            <div>
              <Label htmlFor="costo_compra">Costo de Compra</Label>
              <Input
                type="number"
                id="costo_compra"
                step={0.01}
                value={form.getValues("costo_compra")}
                onChange={(e) =>
                  form.setValue("costo_compra", Number(e.target.value), {
                    shouldValidate: true,
                  })
                }
              />
              {form.formState.errors.costo_compra && (
                <span className="text-red-500 text-xs">
                  {form.formState.errors.costo_compra.message}
                </span>
              )}
            </div>

            {/* Stock Actual */}
            <div>
              <Label htmlFor="stock_actual">Stock Actual</Label>
              <Input
                type="number"
                id="stock_actual"
                value={form.getValues("stock_actual")}
                onChange={(e) =>
                  form.setValue("stock_actual", Number(e.target.value), {
                    shouldValidate: true,
                  })
                }
              />
              {form.formState.errors.stock_actual && (
                <span className="text-red-500 text-xs">
                  {form.formState.errors.stock_actual.message}
                </span>
              )}
            </div>

            {/* Stock Mínimo */}
            <div>
              <Label htmlFor="stock_minimo">Stock Mínimo</Label>
              <Input
                type="number"
                id="stock_minimo"
                value={form.getValues("stock_minimo")}
                onChange={(e) =>
                  form.setValue("stock_minimo", Number(e.target.value), {
                    shouldValidate: true,
                  })
                }
              />
              {form.formState.errors.stock_minimo && (
                <span className="text-red-500 text-xs">
                  {form.formState.errors.stock_minimo.message}
                </span>
              )}
            </div>

            {/* Categoría */}
            <div>
              <Label htmlFor="id_categoria">Categoría</Label>
              {selectOptions.length > 0 && selectedCategoryValue !== "" ? (
                <Select
                  options={selectOptions}
                  placeholder="Seleccione una categoría"
                  onChange={(value) =>
                    form.setValue("id_categoria", Number(value), {
                      shouldValidate: true,
                    })
                  }
                  defaultValue={selectedCategoryValue}
                />
              ) : selectOptions.length > 0 ? (
                <Select
                  options={selectOptions}
                  placeholder="Seleccione una categoría"
                  onChange={(value) =>
                    form.setValue("id_categoria", Number(value), {
                      shouldValidate: true,
                    })
                  }
                  defaultValue=""
                />
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Cargando categorías...
                </p>
              )}
              {form.formState.errors.id_categoria && (
                <span className="text-red-500 text-xs">
                  {form.formState.errors.id_categoria.message}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer con botones de acción */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="primary"
            onClick={form.handleSubmit(onSubmit)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ProductosEdit;
