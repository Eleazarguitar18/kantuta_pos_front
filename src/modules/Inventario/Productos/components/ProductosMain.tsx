import { GridIcon } from "../../../../icons";

const ProductosMain = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Productos</h2>
          <p className="text-gray-600 mt-1">
            Lista de productos registrados en el sistema
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-primary px-4 py-2 flex items-center gap-2">
            <GridIcon />
            <span className="hidden sm:inline">Agregar Producto</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductosMain;
