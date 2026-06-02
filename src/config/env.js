/**
 * Configuracion del entorno.
 * Lee variables de Vite para apuntar a una API externa,
 * controlar el modo temporal de autenticacion mock y cargar Google Maps.
 */

const rawAuthMock = import.meta.env.VITE_AUTH_MOCK

export const AUTH_MOCK_ENABLED = rawAuthMock === 'true'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

if (import.meta.env.DEV) {
  console.info('[DOOH Auth]', {
    API_BASE_URL,
    AUTH_MOCK_ENABLED
  })
}

export default {
  API_BASE_URL,
  AUTH_MOCK_ENABLED,
  GOOGLE_MAPS_API_KEY
}
