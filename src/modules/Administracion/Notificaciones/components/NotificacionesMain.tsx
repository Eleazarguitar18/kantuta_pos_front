import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import toast from "react-hot-toast";
import {
  NotificacionContacto,
  CreateContactoDto,
} from "../interfaces/NotificacionContacto";
import { NotificacionesService } from "../services/notificacionesService";
import ComponentCard from "../../../../components/common/ComponentCard";
import Button from "../../../../components/ui/button/Button";
import { PlusIcon } from "../../../../icons";

// ─────────────────────────────────────────────
// Toggle switch reutilizable
// ─────────────────────────────────────────────
const Toggle = ({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
      checked ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
    } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

// ─────────────────────────────────────────────
// Badge de estado
// ─────────────────────────────────────────────
const Badge = ({ activo }: { activo: boolean }) => (
  <span
    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
      activo
        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    }`}
  >
    {activo ? "Activo" : "Inactivo"}
  </span>
);

// ─────────────────────────────────────────────
// Formulario vacío
// ─────────────────────────────────────────────
const emptyForm = (): CreateContactoDto => ({
  nombre: "",
  codigo_pais: "591",
  telefono: "",
  recibe_stock_bajo: true,
  recibe_cierre_caja: false,
  activo: true,
});

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
const NotificacionesMain = () => {
  const [contactos, setContactos] = useState<NotificacionContacto[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<NotificacionContacto | null>(null);
  const [form, setForm] = useState<CreateContactoDto>(emptyForm());
  const [submitting, setSubmitting] = useState(false);

  // Confirmación de eliminación
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Cargar datos ─────────────────────────────
  const fetchContactos = async () => {
    try {
      setLoading(true);
      const res = await NotificacionesService.getContactos();
      setContactos(res.data);
    } catch {
      toast.error("Error al cargar los contactos de notificación.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactos();
  }, []);

  // ── Abrir modal ──────────────────────────────
  const abrirCrear = () => {
    setEditando(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const abrirEditar = (contacto: NotificacionContacto) => {
    setEditando(contacto);
    setForm({
      nombre: contacto.nombre,
      codigo_pais: contacto.codigo_pais,
      telefono: contacto.telefono,
      recibe_stock_bajo: contacto.recibe_stock_bajo,
      recibe_cierre_caja: contacto.recibe_cierre_caja,
      activo: contacto.activo,
    });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditando(null);
    setForm(emptyForm());
  };

  // ── Guardar (crear o actualizar) ─────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.telefono.trim()) {
      toast.error("Nombre y teléfono son obligatorios.");
      return;
    }
    setSubmitting(true);
    try {
      if (editando) {
        await NotificacionesService.updateContacto(editando.id, form);
        toast.success("Contacto actualizado correctamente.");
      } else {
        await NotificacionesService.createContacto(form);
        toast.success("Contacto creado correctamente.");
      }
      cerrarModal();
      fetchContactos();
    } catch {
      toast.error("Error al guardar el contacto. Intente de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Toggle rápido en tabla ───────────────────
  const handleToggle = async (
    contacto: NotificacionContacto,
    campo: "activo" | "recibe_stock_bajo",
  ) => {
    setTogglingId(`${contacto.id}-${campo}`);
    try {
      await NotificacionesService.updateContacto(contacto.id, {
        [campo]: !contacto[campo],
      });
      setContactos((prev) =>
        prev.map((c) =>
          c.id === contacto.id ? { ...c, [campo]: !c[campo] } : c,
        ),
      );
      toast.success("Estado actualizado.");
    } catch {
      toast.error("Error al actualizar el estado.");
    } finally {
      setTogglingId(null);
    }
  };

  // ── Eliminar ─────────────────────────────────
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await NotificacionesService.deleteContacto(id);
      toast.success("Contacto eliminado.");
      setContactos((prev) => prev.filter((c) => c.id !== id));
    } catch {
      toast.error("Error al eliminar el contacto.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Columnas de la tabla ─────────────────────
  const columns = [
    {
      name: "Nombre",
      selector: (row: NotificacionContacto) => row.nombre,
      sortable: true,
      grow: 2,
    },
    {
      name: "Teléfono",
      selector: (row: NotificacionContacto) =>
        `+${row.codigo_pais} ${row.telefono}`,
      sortable: true,
    },
    {
      name: "Stock Bajo",
      cell: (row: NotificacionContacto) => (
        <Toggle
          checked={row.recibe_stock_bajo}
          disabled={togglingId === `${row.id}-recibe_stock_bajo`}
          onChange={() => handleToggle(row, "recibe_stock_bajo")}
        />
      ),
      center: true,
      width: "120px",
    },
    {
      name: "Estado",
      cell: (row: NotificacionContacto) => (
        <div className="flex items-center gap-2">
          <Badge activo={row.activo} />
          <Toggle
            checked={row.activo}
            disabled={togglingId === `${row.id}-activo`}
            onChange={() => handleToggle(row, "activo")}
          />
        </div>
      ),
      width: "160px",
    },
    {
      name: "Acciones",
      cell: (row: NotificacionContacto) => (
        <div className="flex gap-2">
          <button
            id={`btn-edit-${row.id}`}
            onClick={() => abrirEditar(row)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 transition-colors"
          >
            Editar
          </button>
          <button
            id={`btn-delete-${row.id}`}
            onClick={() => handleDelete(row.id)}
            disabled={deletingId === row.id}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors disabled:opacity-50"
          >
            {deletingId === row.id ? "..." : "Eliminar"}
          </button>
        </div>
      ),
      ignoreRowClick: true,
      width: "160px",
    },
  ];

  // ─────────────────────────────────────────────
  return (
    <div>
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Contactos de Notificación
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Administra los números de WhatsApp que reciben alertas automáticas del sistema.
          </p>
        </div>
        <Button
          id="btn-nuevo-contacto"
          variant="primary"
          size="sm"
          onClick={abrirCrear}
          startIcon={<PlusIcon className="w-4 h-4" color="white" />}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Nuevo Contacto
        </Button>
      </div>

      {/* Tabla */}
      <ComponentCard title="Lista de Contactos WhatsApp">
        <DataTable
          columns={columns}
          data={contactos}
          pagination
          progressPending={loading}
          highlightOnHover
          noDataComponent="No hay contactos de notificación registrados."
          customStyles={{
            headCells: {
              style: {
                fontWeight: "bold",
                fontSize: "13px",
                backgroundColor: "#f9fafb",
              },
            },
          }}
        />
      </ComponentCard>

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                {editando ? "Editar Contacto" : "Nuevo Contacto"}
              </h3>
              <button
                id="btn-cerrar-modal"
                onClick={cerrarModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-nombre"
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej. Ruddy Medrano"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  required
                />
              </div>

              {/* Código de país + Teléfono */}
              <div className="flex gap-3">
                <div className="w-28">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    País
                  </label>
                  <input
                    id="input-codigo-pais"
                    type="text"
                    value={form.codigo_pais}
                    onChange={(e) =>
                      setForm({ ...form, codigo_pais: e.target.value })
                    }
                    placeholder="591"
                    maxLength={5}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-telefono"
                    type="text"
                    value={form.telefono}
                    onChange={(e) =>
                      setForm({ ...form, telefono: e.target.value })
                    }
                    placeholder="Ej. 79678667"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3 pt-1">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    id="check-recibe-stock"
                    type="checkbox"
                    checked={form.recibe_stock_bajo}
                    onChange={(e) =>
                      setForm({ ...form, recibe_stock_bajo: e.target.checked })
                    }
                    className="w-4 h-4 rounded accent-green-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Recibe alertas de <strong>Stock Bajo</strong>
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    id="check-recibe-cierre"
                    type="checkbox"
                    checked={form.recibe_cierre_caja}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        recibe_cierre_caja: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded accent-green-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Recibe alertas de <strong>Cierre de Caja</strong>
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    id="check-activo"
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) =>
                      setForm({ ...form, activo: e.target.checked })
                    }
                    className="w-4 h-4 rounded accent-green-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Contacto <strong>Activo</strong>
                  </span>
                </label>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  id="btn-cancelar-modal"
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  id="btn-guardar-contacto"
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-60"
                >
                  {submitting ? "Guardando..." : editando ? "Actualizar" : "Crear Contacto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificacionesMain;
