# AGENTS.md

## Overview & Architecture

Kantuta POS Frontend is a React 19 + TypeScript + Vite POS client.
- **Entry Points:** `src/main.tsx` (app setup & global Axios interceptors) and `src/App.tsx` (routing & top-level providers).
- **Router:** `react-router` v7 (imports come directly from `react-router`, not `react-router-dom`).
- **State & Context:** Managed via React Context API (`AuthContext`, `CajaContext`, `SocketContext`, `ThemeContext`).
- **Modular Structure:** Feature code lives in domain folders under `src/modules/` (`Administracion`, `Agentes`, `Cajas`, `Inventario`, `Recargas`, `Reportes`, `Ventas`, `WhatsApp`).
- **Backend API Reference:** Refer to `api_integration_guide.md` for backend endpoint specifications and TypeScript interface definitions.

## Environment & Framework Quirks

- **API Base URL Variable:** The frontend code uses `VITE_API_BASE_URL` (in `src/components/auth/services/urlBase.ts`), **not** `VITE_API_URL` mentioned in `README.md`.
- **Socket.io Endpoint:** `SocketContext.tsx` strips trailing `/api` from `VITE_API_BASE_URL` when instantiating the socket.
- **SVG Imports:** Configured via `vite-plugin-svgr` with named exports (`import { ReactComponent } from './file.svg'`).

## Developer Commands & Quality Checks

- **Development:** `npm run dev`
- **Typecheck & Build:** `npm run build` (runs `tsc -b && vite build`) — primary validation command before submitting code.
- **Linting:** `npm run lint` (`eslint .`) — Note: existing codebase contains pre-existing `@typescript-eslint/no-explicit-any` and unused variable lint errors.
- **Testing:** No automated test runner (Jest/Vitest) is configured in this repository.

## Auth & Session Gotchas

- **Local Storage:** Auth state relies on `localStorage` keys `access_token`, `refresh_token`, and `user`.
- **Automatic Logout:** `AuthContext.tsx` handles client-side JWT expiration checks and logs out after 45 minutes of user inactivity (`mousemove`, `keydown`, `scroll`, `click`).
- **401 Handling:** Global Axios interceptor in `src/main.tsx` clears local storage and redirects to `/signin` on HTTP 401 errors.
- **Route Authorization:** Role restrictions are enforced using `ProtectedRoute` with `allowedRoles={['Administrador']}`.
