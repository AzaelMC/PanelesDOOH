import { Navigate, Route, Routes } from 'react-router-dom'
import PantallaLogin from '../features/autenticacion/pages/PantallaLogin'
import PanelPrincipal from '../features/panel/pages/PanelPrincipal'
import NuevaCotizacion from '../features/cotizaciones/pages/NuevaCotizacion'
import HistorialCotizaciones from '../features/cotizaciones/pages/HistorialCotizaciones'
import UsuariosSistema from '../features/usuarios/pages/UsuariosSistema'
import TratamientoCotizacion from '../features/tratamiento/pages/TratamientoCotizacion'
import VistaMapaCliente from '../features/mapa-cliente/pages/VistaMapaCliente'
import RutaPrivada from './RutaPrivada'
import { useAutenticacion } from '../features/autenticacion/context/useAutenticacion'

function RedireccionRaiz() {
  const { autenticado, cargandoSesion } = useAutenticacion()

  if (cargandoSesion) {
    return null
  }

  return <Navigate to={autenticado ? '/panel' : '/login'} replace />
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RedireccionRaiz />} />
      <Route path="/login" element={<PantallaLogin />} />

      <Route element={<RutaPrivada />}>
        <Route path="/panel" element={<PanelPrincipal />} />
        <Route path="/cotizaciones/nueva" element={<NuevaCotizacion />} />
        <Route path="/cotizaciones/historial" element={<HistorialCotizaciones />} />
        <Route
          path="/cotizaciones/:cotizacionId/tratamiento"
          element={<TratamientoCotizacion />}
        />
        <Route
          path="/cotizaciones/:cotizacionId/mapa"
          element={<VistaMapaCliente />}
        />
      </Route>

      <Route
        path="/usuarios"
        element={(
          <RutaPrivada rolesPermitidos={['administrador']}>
            <UsuariosSistema />
          </RutaPrivada>
        )}
      />

      <Route path="*" element={<RedireccionRaiz />} />
    </Routes>
  )
}
