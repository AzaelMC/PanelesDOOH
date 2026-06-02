import apiClient from '../../../services/apiClient'
import { AUTH_MOCK_ENABLED } from '../../../config/env'

const MOCK_SESSION_KEY = 'dooh_maps_auth_mock_session'
const AUTH_TOKEN_STORAGE_KEY = 'dooh_auth_token'
const AUTH_USER_STORAGE_KEY = 'dooh_auth_user'

function wait(time = 450) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, time)
  })
}

function getDisplayName(usuario) {
  const localPart = usuario.split('@')[0] || usuario
  const [firstPart] = localPart.split(/[._-]/)
  return firstPart ? `${firstPart.charAt(0).toUpperCase()}${firstPart.slice(1)}` : usuario
}

function buildMockSession(usuario) {
  return {
    ok: true,
    autenticado: true,
    usuario: {
      id: `mock-${usuario.toLowerCase().replace(/\s+/g, '-')}`,
      nombre: getDisplayName(usuario),
      correo: usuario,
      rol: 'administrador',
      area: 'NTP Media',
      estaActivo: true
    },
    token: 'mock-session-token',
    source: 'mock',
    issuedAt: new Date().toISOString()
  }
}

function persistAuthSession(session) {
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, session.token)
  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(session.usuario))
}

function clearAuthSession() {
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY)
}

export async function iniciarSesion({ usuario, password }) {
  if (AUTH_MOCK_ENABLED) {
    await wait()

    if (!usuario?.trim() || !password?.trim()) {
      throw new Error('Completa correo y contrasena para iniciar sesion.')
    }

    const session = buildMockSession(usuario.trim())
    window.localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session))
    return session
  }

  try {
    const session = await apiClient.post('/login.php', {
      usuario,
      password
    })

    if (!session?.token || !session?.usuario) {
      throw new Error('La API no devolvio una sesion valida.')
    }

    persistAuthSession(session)
    return session
  } catch (error) {
    clearAuthSession()
    throw error
  }
}

export async function cerrarSesion() {
  if (AUTH_MOCK_ENABLED) {
    window.localStorage.removeItem(MOCK_SESSION_KEY)
    return { ok: true }
  }

  try {
    return await apiClient.post('/logout.php', {})
  } catch (error) {
    return {
      ok: false,
      mensaje: error.message
    }
  } finally {
    clearAuthSession()
  }
}

export async function obtenerSesionActual() {
  if (AUTH_MOCK_ENABLED) {
    const rawSession = window.localStorage.getItem(MOCK_SESSION_KEY)
    return rawSession ? JSON.parse(rawSession) : null
  }

  const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)

  if (!token) {
    clearAuthSession()
    return null
  }

  try {
    const session = await apiClient.get('/session.php')

    if (session?.autenticado === true && session?.usuario) {
      window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(session.usuario))
      return session
    }

    clearAuthSession()
    return null
  } catch (error) {
    clearAuthSession()
    throw error
  }
}
