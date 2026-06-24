import Button from "../../../../components/ui/button/Button";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import Label from "../../../../components/form/Label";
import Input from "../../../../components/form/input/InputField";
import { useForm } from "react-hook-form";
import { CategoriasService } from "../services/categoriasService";
import Alert from "../../../../components/ui/alert/Alert";
import { useNavigate, useLocation, useParams } from "react-router";
import { useState, useEffect } from "react";
import { CategoriaEditDto } from "../interfaces/CategoriaEditDto";
import { UsuarioDto } from "../../../Administracion/Usuarios/types/interfaces/usuarioDto";

function CategoriasEdit() {
  const [showAlert, setShowAlert] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const navigate = useNavigate();
  const form = useForm<CategoriaEditDto>({
    defaultValues: {
      nombre: "",
    },
  });
  
  form.watch();

  useEffect(() => {
    form.register("nombre", { required: "El nombre es requerido" });
  }, [form]);
  const location = useLocation();
  const categoriaAEditar: CategoriaEditDto = location.state as CategoriaEditDto; // Aquí atrapamos el objeto
  const { id_categoria } = useParams();

  // Este useEffect se encargará de llenar el input si existe la data
  useEffect(() => {
    if (categoriaAEditar) {
      form.setValue("nombre", categoriaAEditar.nombre);
    } else if (id_categoria) {
      // Si categoriaAEditar es null (ej. recargaron la página), hacemos la petición
      const fetchCategoria = async () => {
        try {
          const response = await CategoriasService.getCategoryById(Number(id_categoria));
          form.setValue("nombre", response.data.nombre);
        } catch (error) {
          console.error("Error al obtener la categoría", error);
        }
      };
      fetchCategoria();
    }
  }, [categoriaAEditar, id_categoria, form]);

  const onSubmit = async (data: CategoriaEditDto) => {
    try {
      const user: UsuarioDto = JSON.parse(localStorage.getItem("user")!);
      data.id_user_update = user.id!;

      console.log("Datos que se enviarán a la API:", data);

      const response = await CategoriasService.updateCategory(
        parseInt(id_categoria!),
        data,
      );

      if (response.status === 200) {
        setShowAlert(true); // <--- Activamos la alerta
        // Esperamos 2 segundos y redirigimos
        setTimeout(() => {
          navigate("/inventario/categorias");
        }, 2000);
      }
    } catch (error: any) {
      console.log("error", error.response);

      // AQUÍ capturamos los errores de la API (409, 400, 500, etc.)
      if (error.response && error.response.status === 409) {
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
      } else {
        // Si no es un 409, mostramos el error general
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
      }

      console.error("Error al guardar la categoría:", error);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Edicion de Categoria" />

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-theme-sm border border-gray-200 dark:border-gray-700">
        {/* Header con botón */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
            Formulario de edición de categoria
          </h3>
          <Button
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={() => navigate("/inventario/categorias")}
          >
            Atras
          </Button>
        </div>
        {showAlert && (
          <div className="mb-4">
            <Alert
              variant="success"
              title="¡Guardado!"
              message="La categoría se ha registrado correctamente en el sistema."
            />
          </div>
        )}
        {showError && (
          <div className="mb-4">
            <Alert
              variant="error"
              title="Error al guardar"
              message="Hubo un error al guardar la categoría"
            />
          </div>
        )}
        {showWarning && (
          <div className="mb-4">
            <Alert
              variant="warning"
              title="¡Error al registrar!"
              message="La categoría ya existe en el sistema."
            />
          </div>
        )}

        {/* Contenido del formulario */}
        <div className="space-y-4">
          {/* Aquí puedes agregar tus inputs, selects, etc. */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

export default CategoriasEdit;
