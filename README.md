# 🛒 Kantuta POS - Frontend

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Axios](https://img.shields.io/badge/axios-671ddf?&style=for-the-badge&logo=axios&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![Debian](https://img.shields.io/badge/Debian-A81D33?style=for-the-badge&logo=debian&logoColor=white)

---

## 📖 Descripción del Proyecto

**Kantuta POS** es una interfaz moderna de Punto de Venta desarrollada en **React** y **TypeScript**. Está diseñada específicamente para ejecutarse de forma ágil y eficiente en entornos **Debian 12**. Este sistema centraliza la gestión comercial y las operaciones de corresponsalía bancaria en una única plataforma robusta y fácil de usar.

---

## 📑 Tabla de Contenidos

- [Módulos Implementados](#-módulos-implementados)
- [Especificaciones Técnicas](#-especificaciones-técnicas)
- [Arquitectura de Carpetas](#-arquitectura-de-carpetas)
- [Instalación y Configuración](#-instalación-y-configuración-en-debian-12)
- [Mejores Prácticas](#-mejores-prácticas)

---

## 📦 Módulos Implementados

El Frontend de Kantuta POS está dividido en los siguientes módulos principales:

### 👥 Administración de Usuarios
- Gestión de roles (Admin/Cajero).
- Perfiles de usuario y gestión de cuentas.
- Control de permisos de acceso.

### 📦 Inventario Completo
- **Productos:** Catálogo completo con funciones de búsqueda avanzada, filtrado por categorías y alertas de stock bajo.
- **Compras:** Registro de entrada de nueva mercadería y gestión integral de proveedores.

### 🏦 Módulo de Agentes
- Interfaz dedicada para transacciones bancarias (BCP).
- Manejo ágil de depósitos y retiros.
- Conciliación de caja de agente.

### 📊 Reportes y Estadísticas
- Visualización interactiva de ventas diarias.
- Seguimiento de movimientos de inventario.
- Panel completo para el cierre de caja.

---

## ⚙️ Especificaciones Técnicas

- **Stack Principal:** React + TypeScript.
- **Gestión de Estado:** Context API.
- **Peticiones HTTP:** Axios.
- **Conectividad API:** Este Frontend se conecta a una API REST preexistente. La configuración de conectividad se gestiona dinámicamente mediante variables de entorno (`VITE_API_URL`), permitiendo transiciones seguras entre entornos de desarrollo y producción.

---

## 📂 Arquitectura de Carpetas

El proyecto sigue una estructura modular y escalable para facilitar su mantenimiento:

```text
src/
├── components/   # Componentes reutilizables de UI (Botones, Modales, Inputs).
├── modules/      # Lógica específica agrupada por módulo de negocio (Inventario, Agentes, Auth, etc.).
├── types/        # Definiciones de interfaces y tipos estrictos de TypeScript para cada entidad.
└── services/     # Llamadas a la API organizadas por servicios, utilizando Axios.
```

---

## 🚀 Instalación y Configuración (en Debian 12)

Para ejecutar el proyecto en un entorno local (Debian 12), sigue estos pasos:

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd kantuta_pos_front
   ```

2. **Instalar las dependencias:**
   ```bash
   npm install
   ```

3. **Configurar las variables de entorno:**
   Crea un archivo `.env` en la raíz del proyecto y añade la URL de la API:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

4. **Ejecutar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   El proyecto estará disponible en `http://localhost:5173` (o el puerto que indique Vite).

---

## 🌟 Mejores Prácticas

En el desarrollo de **Kantuta POS** se han aplicado rigurosas mejores prácticas para asegurar un código mantenible y libre de errores en tiempo de ejecución:

- **Tipado Estricto:** Uso extensivo de TypeScript para definir interfaces claras en `src/types/`, evitando errores de tipado y mejorando el autocompletado en el IDE.
- **Validación de Formularios:** Implementación de validaciones robustas en el cliente antes de enviar datos a la API, mejorando la experiencia del usuario y la integridad de los datos.
- **Modularidad:** Separación clara de responsabilidades entre la capa de servicios (`src/services/`), la interfaz (`src/components/` y `src/modules/`) y el estado (`Context API`).
