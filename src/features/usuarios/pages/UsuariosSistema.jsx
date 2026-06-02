import { useEffect, useMemo, useState } from 'react'
import Boton from '../../../components/ui/Boton'
import Tarjeta from '../../../components/ui/Tarjeta'
import TablaUsuarios from '../components/TablaUsuarios'
import TarjetaUsuario from '../components/TarjetaUsuario'
import { obtenerUsuarios } from '../services/usuariosApi'

function esCredencialActiva(usuario) {
  return usuario.estaActivo || String(usuario.estadoCredenciales).toLowerCase() === 'activo'
}

export default function UsuariosSistema() {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function cargarUsuarios() {
      setCargando(true)
      setError('')

      try {
        const response = await obtenerUsuarios()

        if (active) {
          setUsuarios(response.usuarios)
        }
      } catch (loadError) {
        if (active) {
          setUsuarios([])
          setError(loadError.message || 'No fue posible cargar los usuarios.')
        }
      } finally {
        if (active) {
          setCargando(false)
        }
      }
    }

    cargarUsuarios()

    return () => {
      active = false
    }
  }, [])

  const usuariosVigentes = useMemo(() => {
    return usuarios.filter(esCredencialActiva).length
  }, [usuarios])

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.36em] text-slate-500">
          Gobierno de accesos
        </p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950">
              Usuarios del Sistema
            </h2>
            <p className="text-base leading-8 text-slate-600">
              Visualiza usuarios reales, revisa el ultimo acceso registrado y monitorea el volumen de cotizaciones creadas por cada perfil.
            </p>
          </div>

          <Tarjeta className="min-w-[240px] bg-white/80 text-right">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Credenciales vigentes
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {cargando ? '...' : usuariosVigentes}
            </p>
          </Tarjeta>
        </div>
      </section>

      {cargando && (
        <Tarjeta className="text-center">
          <p className="text-lg font-medium text-slate-900">Cargando usuarios...</p>
          <p className="mt-2 text-sm text-slate-500">
            Consultando GET /usuarios.php para recuperar el catalogo real.
          </p>
        </Tarjeta>
      )}

      {!cargando && error && (
        <Tarjeta className="space-y-4 text-center">
          <p className="text-lg font-medium text-slate-900">No fue posible cargar los usuarios.</p>
          <p className="text-sm text-rose-700">{error}</p>
          <div className="flex justify-center">
            <Boton onClick={() => window.location.reload()}>
              Reintentar
            </Boton>
          </div>
        </Tarjeta>
      )}

      {!cargando && !error && usuarios.length > 0 && (
        <>
          <TablaUsuarios usuarios={usuarios} />

          <div className="grid gap-5 lg:hidden">
            {usuarios.map((usuario) => (
              <TarjetaUsuario key={usuario.id} usuario={usuario} />
            ))}
          </div>
        </>
      )}

      {!cargando && !error && usuarios.length === 0 && (
        <Tarjeta className="text-center">
          <p className="text-lg font-medium text-slate-900">No hay usuarios disponibles todavia.</p>
          <p className="mt-2 text-sm text-slate-500">
            Cuando la API registre usuarios apareceran aqui.
          </p>
        </Tarjeta>
      )}
    </div>
  )
}
