import apiClient from '../../../services/apiClient'
import { AUTH_MOCK_ENABLED } from '../../../config/env'

const MOCK_SESSION_KEY = 'dooh_maps_auth_mock_session'

function wait(time = 450) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, time)
  })
}

function buildMockSession(usuario) {
  return {
    usuario: {
      id: `mock-${usuario.toLowerCase().replace(/\s+/g, '-')}`,
      nombre: usuario,
      rol: 'Operaciones',
      area: 'NTP Media'
    },
    token: 'mock-session-token',
    source: 'mock',
    issuedAt: new Date().toISOString()
  }
}

export async function iniciarSesion({ usuario, password }) {
  if (AUTH_MOCK_ENABLED) {
    await wait()

    if (!usuario?.trim() || !password?.trim()) {
      throw new Error('Completa usuario y contrasena para iniciar sesion.')
    }

    const session = buildMockSession(usuario.trim())
    window.localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session))
    return session
  }

  return apiClient.post('/login.php', {
    usuario,
    password
  })
}

export async function cerrarSesion() {
  if (AUTH_MOCK_ENABLED) {
    window.localStorage.removeItem(MOCK_SESSION_KEY)
    return { ok: true }
  }

  return apiClient.post('/logout.php', {})
}

export async function obtenerSesionActual() {
  if (AUTH_MOCK_ENABLED) {
    const rawSession = window.localStorage.getItem(MOCK_SESSION_KEY)
    return rawSession ? JSON.parse(rawSession) : null
  }

  return apiClient.get('/session.php')
}
