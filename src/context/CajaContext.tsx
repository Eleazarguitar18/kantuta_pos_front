import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./auth/AuthContext";
import { CajasService } from "../modules/Cajas/services/cajasService";

interface CajaActivaInfo {
  id: number;
  nombre: string;
}

interface CajaContextType {
  sesionActiva: any | null;
  cajaActiva: CajaActivaInfo | null;
  loading: boolean;
  checkSesion: () => Promise<void>;
  abrirCaja: (idCaja: number, montoInicial: number) => Promise<any>;
  cerrarCaja: (montoFinalReal: number, idSesion?: number) => Promise<any>;
}

const CajaContext = createContext<CajaContextType | undefined>(undefined);

export const CajaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [sesionActiva, setSesionActiva] = useState<any | null>(() => {
    const saved = localStorage.getItem("sesion_caja");
    return saved ? JSON.parse(saved) : null;
  });
  const [cajaActiva, setCajaActiva] = useState<CajaActivaInfo | null>(() => {
    const saved = localStorage.getItem("caja_activa");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  const checkSesion = async () => {
    if (!user) {
      setSesionActiva(null);
      setCajaActiva(null);
      localStorage.removeItem("sesion_caja");
      localStorage.removeItem("caja_activa");
      setLoading(false);
      return;
    }
    try {
      const response = await CajasService.getSesionActivaUsuario(user.id);
      const data = response.data || null;
      setSesionActiva(data);
      if (data) {
        localStorage.setItem("sesion_caja", JSON.stringify(data));
        // Fetch caja info para obtener el nombre
        try {
          const cajaRes = await CajasService.getCajaById(data.id_caja);
          const cajaData = cajaRes.data;
          const info: CajaActivaInfo = { id: cajaData.id, nombre: cajaData.nombre };
          setCajaActiva(info);
          localStorage.setItem("caja_activa", JSON.stringify(info));
        } catch {
          // Si falla el fetch de la caja, mantener datos mínimos
          const info: CajaActivaInfo = { id: data.id_caja, nombre: `Caja #${data.id_caja}` };
          setCajaActiva(info);
          localStorage.setItem("caja_activa", JSON.stringify(info));
        }
      } else {
        localStorage.removeItem("sesion_caja");
        setCajaActiva(null);
        localStorage.removeItem("caja_activa");
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setSesionActiva(null);
        setCajaActiva(null);
        localStorage.removeItem("sesion_caja");
        localStorage.removeItem("caja_activa");
      }
      // Keep local storage if request fails to be offline-resilient or fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSesion();
  }, [user]);

  const abrirCaja = async (idCaja: number, montoInicial: number) => {
    console.log("montoInicial", montoInicial);
    console.log("idCaja", idCaja);
    if (!user) return;
    const response = await CajasService.abrirSesion({
      id_caja: idCaja,
      monto_inicial: Number(montoInicial),
      id_usuario: user.id,
      id_user_create: user.id,
    });
    // console.log("response", response);
    const data = response.data;
    setSesionActiva(data);
    localStorage.setItem("sesion_caja", JSON.stringify(data));

    // Fetch caja info para el nombre
    try {
      const cajaRes = await CajasService.getCajaById(idCaja);
      const cajaData = cajaRes.data;
      const info: CajaActivaInfo = { id: cajaData.id, nombre: cajaData.nombre };
      setCajaActiva(info);
      localStorage.setItem("caja_activa", JSON.stringify(info));
    } catch {
      const info: CajaActivaInfo = { id: idCaja, nombre: `Caja #${idCaja}` };
      setCajaActiva(info);
      localStorage.setItem("caja_activa", JSON.stringify(info));
    }

    return data;
  };

  const cerrarCaja = async (montoFinalReal: number, idSesion?: number) => {
    const targetId = idSesion || sesionActiva?.id;
    if (!targetId || !user) return;
    const response = await CajasService.cerrarSesion(targetId, {
      monto_final_real: montoFinalReal,
      id_user_update: user.id,
    });
    setSesionActiva(null);
    setCajaActiva(null);
    localStorage.removeItem("sesion_caja");
    localStorage.removeItem("caja_activa");
    return response.data;
  };

  return (
    <CajaContext.Provider
      value={{
        sesionActiva,
        cajaActiva,
        loading,
        checkSesion,
        abrirCaja,
        cerrarCaja,
      }}
    >
      {children}
    </CajaContext.Provider>
  );
};

export const useCaja = () => {
  const context = useContext(CajaContext);
  if (!context) {
    throw new Error("useCaja debe usarse dentro de CajaProvider");
  }
  return context;
};
