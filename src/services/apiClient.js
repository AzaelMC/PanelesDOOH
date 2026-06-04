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

function stripTrailingSlash(value = '') {
  return value.replace(/\/+$/, '')
}

function ensureLeadingSlash(value = '') {
  return value.startsWith('/') ? value : `/${value}`
}

function buildRequestUrl(baseURL, endpoint) {
  const normalizedBaseURL = stripTrailingSlash(baseURL)
  const normalizedEndpoint = ensureLeadingSlash(endpoint)

  return `${normalizedBaseURL}${normalizedEndpoint}`
}

function buildBodyPreview(value = '') {
  return String(value).replace(/\s+/g, ' ').trim().slice(0, 300)
}

function isHtmlResponseBody(value = '') {
  const normalized = String(value).trim().toLowerCase()
  return normalized.includes('<!doctype html') || normalized.includes('<html')
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

  async parseResponse(response, requestMeta = {}) {
    const contentType = response.headers.get('content-type') || ''
    const contentLength = response.headers.get('content-length')

    if (contentLength === '0' || response.status === 204) {
      return null
    }

    if (contentType.includes('application/json')) {
      return response.json()
    }

    const payload = await response.text()

    if (isHtmlResponseBody(payload)) {
      if (import.meta.env.DEV) {
        console.error('[DOOH API HTML Response]', {
          status: response.status,
          contentType,
          finalUrl: requestMeta.finalUrl || '',
          bodyPreview: buildBodyPreview(payload)
        })
      }

      throw new Error('La API devolvio HTML en lugar de JSON. Es probable que el servidor haya bloqueado la peticion o que el proxy no haya llegado al endpoint PHP.')
    }

    return payload
  }

  async request(endpoint, options = {}) {
    const token = this.getToken()
    const finalUrl = buildRequestUrl(this.baseURL, endpoint)
    const method = options.method || 'GET'

    if (import.meta.env.DEV) {
      console.info('[DOOH API Request]', {
        endpoint,
        finalUrl,
        method
      })
    }

    try {
      const response = await fetch(finalUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {})
        },
        ...options
      })

      const payload = await this.parseResponse(response, {
        endpoint,
        finalUrl,
        method
      })

      if (!response.ok) {
        throw new Error(getBackendMessage(payload, `HTTP ${response.status}`))
      }

      if (payload && typeof payload === 'object' && payload.ok === false) {
        throw new Error(getBackendMessage(payload, 'La API devolvio un error.'))
      }

      return payload
    } catch (error) {
      console.error(`HTTP ${method} ${endpoint}:`, error)
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
