import { API_BASE_URL } from '../../../config/env'

function stripTrailingSlash(value = '') {
  return value.replace(/\/+$/, '')
}

function ensureLeadingSlash(value = '') {
  return value.startsWith('/') ? value : `/${value}`
}

function buildRequestUrl(endpoint) {
  return `${stripTrailingSlash(API_BASE_URL)}${ensureLeadingSlash(endpoint)}`
}

function getBackendMessage(payload, fallbackMessage) {
  if (payload && typeof payload === 'object') {
    return payload.mensaje || payload.message || payload.error || fallbackMessage
  }

  if (typeof payload === 'string' && payload.trim()) {
    return payload
  }

  return fallbackMessage
}

function isHtmlResponseBody(value = '') {
  const normalized = String(value).trim().toLowerCase()
  return normalized.includes('<!doctype html') || normalized.includes('<html')
}

async function parseResponse(response) {
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
    throw new Error('La API publica devolvio HTML en lugar de JSON. Revisa la ruta del endpoint o reglas del servidor.')
  }

  return payload
}

async function publicRequest(endpoint) {
  const finalUrl = buildRequestUrl(endpoint)
  const response = await fetch(finalUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  })

  const payload = await parseResponse(response)

  if (!response.ok) {
    throw new Error(getBackendMessage(payload, `HTTP ${response.status}`))
  }

  if (payload && typeof payload === 'object' && payload.ok === false) {
    throw new Error(getBackendMessage(payload, 'La API publica devolvio un error.'))
  }

  return payload
}

export async function obtenerSnapshotPublico(token) {
  const tokenLimpio = String(token || '').trim()

  if (!tokenLimpio) {
    throw new Error('Token de propuesta requerido.')
  }

  const response = await publicRequest(`/snapshot_publico.php?token=${encodeURIComponent(tokenLimpio)}`)
  return response?.snapshot || response
}

export async function obtenerMapsPublicConfig() {
  const response = await publicRequest('/maps_public_config.php')
  const rawMapsConfig = response?.maps && typeof response.maps === 'object'
    ? response.maps
    : response

  const apiKey = String(rawMapsConfig?.apiKey || '').trim()
  const mapId = String(rawMapsConfig?.mapId || '').trim()

  if (!apiKey) {
    throw new Error('La API key publica de Google Maps no esta configurada.')
  }

  if (!mapId) {
    throw new Error('El Map ID publico de Google Maps no esta configurado.')
  }

  return {
    apiKey,
    mapId
  }
}
