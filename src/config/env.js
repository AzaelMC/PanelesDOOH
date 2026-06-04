/**
 * Configuracion del entorno.
 * Lee variables de Vite para apuntar a una API externa,
 * controlar el modo temporal de autenticacion mock y cargar Google Maps.
 */

const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, '') || '/api'
}

function resolveApiBaseUrl(baseUrl) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)

  if (
    import.meta.env.DEV &&
    normalizedBaseUrl.includes('ntpmedia.com.mx/Dooh/dooh_api')
  ) {
    return '/dooh-api'
  }

  return normalizedBaseUrl
}

export const AUTH_MOCK_ENABLED = import.meta.env.VITE_AUTH_MOCK === 'true'

export const API_BASE_URL = resolveApiBaseUrl(RAW_API_BASE_URL)

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

if (import.meta.env.DEV) {
  console.info('[DOOH Auth]', {
    API_BASE_URL_RAW: RAW_API_BASE_URL,
    API_BASE_URL,
    AUTH_MOCK_ENABLED
  })
}

export default {
  API_BASE_URL,
  AUTH_MOCK_ENABLED,
  GOOGLE_MAPS_API_KEY
}
