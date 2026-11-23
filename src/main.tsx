import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { SocketProvider } from "./context/SocketContext.tsx";
import axios from "axios";

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      // Avisamos al AuthContext para que limpie el estado sin recargar la
      // página: así no se pierde el mensaje de error del login y el router
      // lleva al usuario a la ruta limpia "/" de forma interna.
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    return Promise.reject(error);
  }
);

// En producción, el service worker evita el 404 de Render al recargar rutas
// del router (/agentes, /signin, ...). En desarrollo Vite ya las sirve.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
      console.error("No se pudo registrar el service worker:", error);
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AppWrapper>
        <SocketProvider>
          <App />
        </SocketProvider>
      </AppWrapper>
    </ThemeProvider>
  </StrictMode>,
);
