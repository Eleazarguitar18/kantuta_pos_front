import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import ProtectedRoute from "./router/ProtectedRoute";
import { AuthContextProvider } from "./context/auth/AuthContext";
import CategoriasRegister from "./modules/Inventario/Categorias/components/CategoriasRegister";
import CategoriasMain from "./modules/Inventario/Categorias/components/CategoriasMain";
import ProductosMain from "./modules/Inventario/Productos/components/ProductosMain";
import ProductosRegister from "./modules/Inventario/Productos/components/ProductosRegister";
import ProductosEdit from "./modules/Inventario/Productos/components/ProductosEdit";
import CategoriasEdit from "./modules/Inventario/Categorias/components/CategoriasEdit";
import ComprasMain from "./modules/Inventario/Compras/components/ComprasMain";
import ComprasRegister from "./modules/Inventario/Compras/components/ComprasRegister";
import CajasMain from "./modules/Cajas/components/CajasMain";
import CajasRegister from "./modules/Cajas/components/CajasRegister";
import CajasEdit from "./modules/Cajas/components/CajasEdit";
import CajasControl from "./modules/Cajas/components/CajasControl";
import VentasMain from "./modules/Ventas/components/VentasMain";
import PuntoDeVenta from "./modules/Ventas/components/PuntoDeVenta";
import UsuariosMain from "./modules/Administracion/Usuarios/components/UsuariosMain";
import UsuariosRegister from "./modules/Administracion/Usuarios/components/UsuariosRegister";

export default function App() {
  return (
    <>
      <AuthContextProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<ProtectedRoute />}>
              {/* Dashboard Layout */}
              <Route element={<AppLayout />}>
                <Route index path="/" element={<Home />} />
                {/* Inventario */}
                <Route path="/inventario">
                  <Route path="productos">
                    <Route index element={<ProductosMain />} />
                    <Route path="registrar" element={<ProductosRegister />} />
                    <Route path="editar/:id_producto" element={<ProductosEdit />} />
                  </Route>
                  <Route path="categorias">
                    <Route index element={<CategoriasMain />} />
                    <Route path="registrar" element={<CategoriasRegister />} />
                    <Route path="editar/:id_categoria" element={<CategoriasEdit />} />
                  </Route>
                  <Route path="compras">
                    <Route index element={<ComprasMain />} />
                    <Route path="registrar" element={<ComprasRegister />} />
                  </Route>
                </Route>

                {/* Cajas */}
                <Route path="/cajas">
                  <Route index element={<CajasMain />} />
                  <Route path="registrar" element={<CajasRegister />} />
                  <Route path="editar/:id" element={<CajasEdit />} />
                  <Route path="control/:id" element={<CajasControl />} />
                </Route>

                {/* Ventas */}
                <Route path="/ventas">
                  <Route index element={<VentasMain />} />
                  <Route path="pos" element={<PuntoDeVenta />} />
                </Route>

                {/* Usuarios (Administracion) */}
                <Route path="/administracion">
                  <Route path="usuarios">
                    <Route index element={<UsuariosMain />} />
                    <Route path="registrar" element={<UsuariosRegister />} />
                    <Route path="editar/:id" element={<UserProfiles />} />
                  </Route>
                </Route>

                {/* Others Page */}
                <Route path="/profile" element={<UserProfiles />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/blank" element={<Blank />} />

                {/* Forms */}
                <Route path="/form-elements" element={<FormElements />} />

                {/* Tables */}
                <Route path="/basic-tables" element={<BasicTables />} />

                {/* Ui Elements */}
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/avatars" element={<Avatars />} />
                <Route path="/badge" element={<Badges />} />
                <Route path="/buttons" element={<Buttons />} />
                <Route path="/images" element={<Images />} />
                <Route path="/videos" element={<Videos />} />

                {/* Charts */}
                <Route path="/line-chart" element={<LineChart />} />
                <Route path="/bar-chart" element={<BarChart />} />
              </Route>
            </Route>
            {/* Auth Layout */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Fallback Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthContextProvider>
    </>
  );
}
