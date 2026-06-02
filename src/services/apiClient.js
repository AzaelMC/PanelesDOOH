import { API_BASE_URL } from '../config/env'

const AUTH_TOKEN_STORAGE_KEY = 'dooh_auth_token'

function getBackendMessage(payload, fallbackMessage) {
  if (payload && typeof payload === 'object') {
    return payload.mensaje || payload.message || payload.error || fallbackMessage
  }

  if (typeof payload === 'string' && payload.trim()) {
    return payload
  }

  return fallbackMessage
}

/**
 * Cliente HTTP base para hacer peticiones a la API externa.
 */
class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL
  }

  getToken() {
    return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  }

  async parseResponse(response) {
    const contentType = response.headers.get('content-type') || ''
    const contentLength = response.headers.get('content-length')

    if (contentLength === '0' || response.status === 204) {
      return null
    }

    if (contentType.includes('application/json')) {
      return response.json()
    }

    return response.text()
  }

  async request(endpoint, options = {}) {
    const token = this.getToken()

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {})
        },
        ...options
      })

      const payload = await this.parseResponse(response)

      if (!response.ok) {
        throw new Error(getBackendMessage(payload, `HTTP ${response.status}`))
      }

      if (payload && typeof payload === 'object' && payload.ok === false) {
        throw new Error(getBackendMessage(payload, 'La API devolvio un error.'))
      }

      return payload
    } catch (error) {
      console.error(`HTTP ${options.method || 'GET'} ${endpoint}:`, error)
      throw error
    }
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options
    })
  }

  async post(endpoint, payload, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
      ...options
    })
  }

  async put(endpoint, payload, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(payload),
      ...options
    })
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options
    })
  }
}

export default new ApiClient()
