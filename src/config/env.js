/**
 * Configuracion del entorno para autenticacion y API externa.
 */

const rawAuthMock = import.meta.env.VITE_AUTH_MOCK

export const AUTH_MOCK_ENABLED = rawAuthMock === 'true'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

if (import.meta.env.DEV) {
  console.info('[DOOH Auth]', {
    API_BASE_URL,
    AUTH_MOCK_ENABLED
  })
}

export default {
  API_BASE_URL,
  AUTH_MOCK_ENABLED
}
