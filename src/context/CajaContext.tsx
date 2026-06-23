import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./auth/AuthContext";
import { CajasService } from "../modules/Cajas/services/cajasService";

interface CajaContextType {
  sesionActiva: any | null;
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
  const [loading, setLoading] = useState(true);

  const checkSesion = async () => {
    if (!user) {
      setSesionActiva(null);
      localStorage.removeItem("sesion_caja");
      setLoading(false);
      return;
    }
    try {
      const response = await CajasService.getSesionActivaUsuario(user.id);
      const data = response.data || null;
      setSesionActiva(data);
      if (data) {
        localStorage.setItem("sesion_caja", JSON.stringify(data));
      } else {
        localStorage.removeItem("sesion_caja");
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setSesionActiva(null);
        localStorage.removeItem("sesion_caja");
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
    localStorage.removeItem("sesion_caja");
    return response.data;
  };

  return (
    <CajaContext.Provider
      value={{
        sesionActiva,
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
