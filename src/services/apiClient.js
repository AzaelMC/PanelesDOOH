import { API_BASE_URL } from '../config/env'

/**
 * Cliente HTTP base para hacer peticiones a la API externa.
 */
class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL
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
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        },
        ...options
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return await this.parseResponse(response)
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
