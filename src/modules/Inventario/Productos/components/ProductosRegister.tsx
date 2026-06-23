import { useNavigate } from "react-router";
import Button from "../../../../components/ui/button/Button";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import Label from "../../../../components/form/Label";
import Input from "../../../../components/form/input/InputField";
import Select from "../../../../components/form/Select";
import { useForm } from "react-hook-form";
import { ProductosService } from "../services/productosService";
import { CategoriasService } from "../../Categorias/services/categoriasService";
import { Producto } from "../interfaces/Producto";
import Alert from "../../../../components/ui/alert/Alert";
import { useState, useEffect } from "react";

function ProductosRegister() {
  const [showAlert, setShowAlert] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const navigate = useNavigate();

  const form = useForm<Producto>({
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

  const onSubmit = async (data: Producto) => {
    try {
      console.log("Datos que se enviarán a la API:", data);
      const response = await ProductosService.createProduct(data);
      if (response.status === 201) {
        setShowAlert(true);
        setTimeout(() => {
          navigate("/inventario/productos");
        }, 2000);
      }
    } catch (error: any) {
      if (error.response && error.response.status === 409) {
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
      } else {
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
      }
      console.error("Error al guardar el producto:", error);
    }
  };

  const selectOptions = categorias.map((cat) => ({
    value: cat.id.toString(),
    label: cat.nombre,
  }));
  const generarCodigoUnico = (categoriaNombre: string) => {
    if (!categoriaNombre) return "";

    // 1. Tomamos las primeras 3 letras de la categoría en mayúsculas (ej: "Accesorios" -> "ACC")
    const prefijo = categoriaNombre.substring(0, 3).toUpperCase();

    // 2. Obtenemos la fecha y hora actual exacta en formato numérico YYYYMMDDHHMMSS
    const ahora = new Date();
    const año = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const hora = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    const segundos = String(ahora.getSeconds()).padStart(2, '0');

    // Resultado: ACC-20260622212530
    return `${prefijo}-${año}${mes}${dia}${hora}${minutos}${segundos}`;
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Registro de Producto" />

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-theme-sm border border-gray-200 dark:border-gray-700">
        {/* Header con botón */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
            Formulario de registro de producto
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
              message="El producto se ha registrado correctamente en el sistema."
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
                value={generarCodigoUnico(form.getValues("nombre"))}
                onChange={(e) =>
                  form.setValue("codigo_barras", e.target.value, {
                    shouldValidate: true,
                  })
                }
                disabled
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
              {selectOptions.length > 0 ? (
                <Select
                  options={selectOptions}
                  placeholder="Seleccione una categoría"
                  onChange={(value) =>
                    form.setValue("id_categoria", Number(value), {
                      shouldValidate: true,
                    })
                  }
                  defaultValue={
                    form.getValues("id_categoria")?.toString() || ""
                  }
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

export default ProductosRegister;
