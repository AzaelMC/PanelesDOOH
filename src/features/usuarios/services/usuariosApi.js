import { AUTH_MOCK_ENABLED } from '../../../config/env'
import apiClient from '../../../services/apiClient'
import { usuariosMock } from '../data/usuariosMock'

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '')
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value
  }

  return []
}

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value !== 0
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()

    if (['1', 'true', 'si', 'yes', 'activo', 'activa', 'vigente'].includes(normalized)) {
      return true
    }

    if (['0', 'false', 'no', 'inactivo', 'inactiva', 'suspendido'].includes(normalized)) {
      return false
    }
  }

  return fallback
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizarUsuario(rawUsuario = {}) {
  const estaActivo = toBoolean(pickFirst(rawUsuario.estaActivo, rawUsuario.esta_activo), true)

  return {
    id: String(pickFirst(rawUsuario.id, rawUsuario.usuarioId, rawUsuario.usuario_id, '')),
    nombre: String(pickFirst(rawUsuario.nombre, '')),
    correo: String(pickFirst(rawUsuario.correo, rawUsuario.email, '')),
    area: String(pickFirst(rawUsuario.area, '')),
    rol: String(pickFirst(rawUsuario.rol, '')),
    estaActivo,
    estadoCredenciales: String(
      pickFirst(rawUsuario.estadoCredenciales, rawUsuario.estado_credenciales, estaActivo ? 'Activo' : 'Inactivo')
    ),
    ultimoAcceso: String(pickFirst(rawUsuario.ultimoAcceso, rawUsuario.ultimo_acceso, '')),
    totalCotizacionesCreadas: toNumber(
      pickFirst(rawUsuario.totalCotizacionesCreadas, rawUsuario.total_cotizaciones_creadas),
      0
    ),
    fechaCreacion: String(pickFirst(rawUsuario.fechaCreacion, rawUsuario.fecha_creacion, '')),
    fechaActualizacion: String(pickFirst(rawUsuario.fechaActualizacion, rawUsuario.fecha_actualizacion, ''))
  }
}

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    searchParams.set(key, String(value))
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

export async function obtenerUsuarios(params = {}) {
  const endpoint = `/usuarios.php${buildQueryString(params)}`

  try {
    const response = await apiClient.get(endpoint)
    const usuarios = toArray(Array.isArray(response) ? response : response?.usuarios).map(normalizarUsuario)

    return {
      usuarios,
      total: usuarios.length,
      source: 'api'
    }
  } catch (error) {
    if (!AUTH_MOCK_ENABLED) {
      throw error
    }

    const usuarios = usuariosMock.map(normalizarUsuario)

    return {
      usuarios,
      total: usuarios.length,
      source: 'mock'
    }
  }
}

export async function crearUsuario(payload) {
  if (AUTH_MOCK_ENABLED) {
    return {
      ok: true,
      mensaje: 'Usuario creado en modo mock.',
      usuario: normalizarUsuario({
        id: `usr-mock-${Date.now()}`,
        ...payload
      })
    }
  }

  const response = await apiClient.post('/usuarios.php', payload)

  return {
    ok: response?.ok ?? true,
    mensaje: response?.mensaje || 'Usuario creado correctamente.',
    usuario: response?.usuario ? normalizarUsuario(response.usuario) : null,
    raw: response
  }
}
