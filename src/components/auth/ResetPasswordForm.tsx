import { useState } from "react";
import { Link, useNavigate } from "react-router";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import axios from "axios";
import { API_BASE_URL } from "./services/urlBase";

export default function ResetPasswordForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg("El correo electrónico es requerido");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await axios.post(`${API_BASE_URL}/auth/reset/code`, { email });
      setStep(2);
      setSuccessMsg("Código enviado. Por favor revisa tu correo.");
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || "Error al solicitar código");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMsg("El código de verificación es requerido");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await axios.post(`${API_BASE_URL}/auth/confirm-code`, { email, code });
      setStep(3);
      setSuccessMsg("Código verificado correctamente. Ingresa tu nueva contraseña.");
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || "Código incorrecto");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setErrorMsg("La nueva contraseña es requerida");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await axios.post(`${API_BASE_URL}/auth/reset-confirm`, { email, newPassword });
      setSuccessMsg("Contraseña actualizada exitosamente.");
      setTimeout(() => navigate("/signin"), 2000);
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || "Error al cambiar contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Recuperar Contraseña
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sigue los pasos para restablecer tu contraseña.
            </p>
          </div>
          <div>
            {step === 1 && (
              <form onSubmit={handleRequestCode}>
                <div className="space-y-6">
                  <div>
                    <Label>Correo Electrónico <span className="text-error-500">*</span></Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ingresa tu correo"
                    />
                  </div>
                  {errorMsg && <div className="text-error-600 text-sm font-medium bg-error-50 p-3 rounded-lg">{errorMsg}</div>}
                  {successMsg && <div className="text-success-600 text-sm font-medium bg-success-50 p-3 rounded-lg">{successMsg}</div>}
                  <Button className="w-full" disabled={loading}>
                    {loading ? "Enviando..." : "Enviar Código"}
                  </Button>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleConfirmCode}>
                <div className="space-y-6">
                  <div>
                    <Label>Código de Verificación <span className="text-error-500">*</span></Label>
                    <Input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Ingresa el código enviado a tu correo"
                    />
                  </div>
                  {errorMsg && <div className="text-error-600 text-sm font-medium bg-error-50 p-3 rounded-lg">{errorMsg}</div>}
                  {successMsg && <div className="text-success-600 text-sm font-medium bg-success-50 p-3 rounded-lg">{successMsg}</div>}
                  <Button className="w-full" disabled={loading}>
                    {loading ? "Verificando..." : "Verificar Código"}
                  </Button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword}>
                <div className="space-y-6">
                  <div>
                    <Label>Nueva Contraseña <span className="text-error-500">*</span></Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Ingresa tu nueva contraseña"
                    />
                  </div>
                  {errorMsg && <div className="text-error-600 text-sm font-medium bg-error-50 p-3 rounded-lg">{errorMsg}</div>}
                  {successMsg && <div className="text-success-600 text-sm font-medium bg-success-50 p-3 rounded-lg">{successMsg}</div>}
                  <Button className="w-full" disabled={loading}>
                    {loading ? "Guardando..." : "Guardar Contraseña"}
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-5 text-center">
              <Link to="/signin" className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400">
                Volver a Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}