import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from './authContext'
import {
  cerrarSesion as cerrarSesionApi,
  iniciarSesion as iniciarSesionApi,
  obtenerSesionActual
} from '../services/autenticacionApi'

export function ProveedorAutenticacion({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargandoSesion, setCargandoSesion] = useState(true)

  useEffect(() => {
    let active = true

    async function hydrateSession() {
      setCargandoSesion(true)

      try {
        const session = await obtenerSesionActual()

        if (active) {
          setUsuario(session?.usuario || null)
        }
      } catch {
        if (active) {
          setUsuario(null)
        }
      } finally {
        if (active) {
          setCargandoSesion(false)
        }
      }
    }

    hydrateSession()

    return () => {
      active = false
    }
  }, [])

  const iniciarSesion = async (credentials) => {
    const session = await iniciarSesionApi(credentials)
    const nextUsuario = session?.usuario || null

    if (!nextUsuario) {
      setUsuario(null)
      throw new Error('No fue posible recuperar la sesion del usuario.')
    }

    setUsuario(nextUsuario)
    return session
  }

  const cerrarSesion = async () => {
    try {
      await cerrarSesionApi()
    } finally {
      setUsuario(null)
    }
  }

  const value = useMemo(
    () => ({
      usuario,
      autenticado: Boolean(usuario),
      cargandoSesion,
      iniciarSesion,
      cerrarSesion
    }),
    [usuario, cargandoSesion]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
