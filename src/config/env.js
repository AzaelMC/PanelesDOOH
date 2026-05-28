/**
 * Configuracion del entorno.
 * Lee variables de Vite para apuntar a una API externa,
 * controlar el modo temporal de autenticacion mock y cargar Google Maps.
 */

function parseBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value !== 'string') {
    return fallback
  }

  const normalized = value.trim().toLowerCase()
  return ['1', 'true', 'yes', 'on'].includes(normalized)
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const AUTH_MOCK_ENABLED = parseBoolean(import.meta.env.VITE_AUTH_MOCK, import.meta.env.DEV)
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

export {
  API_BASE_URL,
  AUTH_MOCK_ENABLED,
  GOOGLE_MAPS_API_KEY
}

export default {
  API_BASE_URL,
  AUTH_MOCK_ENABLED,
  GOOGLE_MAPS_API_KEY
}
