import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import RutaPrivada from './RutaPrivada'
import { useAutenticacion } from '../features/autenticacion/context/useAutenticacion'

const PantallaLogin = lazy(() => import('../features/autenticacion/pages/PantallaLogin'))
const PanelPrincipal = lazy(() => import('../features/panel/pages/PanelPrincipal'))
const NuevaCotizacion = lazy(() => import('../features/cotizaciones/pages/NuevaCotizacion'))
const HistorialCotizaciones = lazy(() => import('../features/cotizaciones/pages/HistorialCotizaciones'))
const UsuariosSistema = lazy(() => import('../features/usuarios/pages/UsuariosSistema'))
const TratamientoCotizacion = lazy(() => import('../features/tratamiento/pages/TratamientoCotizacion'))
const VistaMapaCliente = lazy(() => import('../features/mapa-cliente/pages/VistaMapaCliente'))
const VistaPropuestaPublica = lazy(() => import('../features/propuesta/pages/VistaPropuestaPublica'))

function RedireccionRaiz() {
  const { autenticado, cargandoSesion } = useAutenticacion()

  if (cargandoSesion) {
    return null
  }

  return <Navigate to={autenticado ? '/panel' : '/login'} replace />
}

export default function AppRouter() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<RedireccionRaiz />} />
        <Route path="/login" element={<PantallaLogin />} />
        <Route path="/propuesta/:token" element={<VistaPropuestaPublica />} />
        <Route path="/Dooh/propuesta/:token" element={<VistaPropuestaPublica />} />

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
    </Suspense>
  )
}
