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
    throw new Error('No se pudo cargar')
  }

  return payload
}

async function publicRequest(endpoint, options = {}) {
  const response = await fetch(buildRequestUrl(endpoint), {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  })

  const payload = await parseResponse(response)

  if (!response.ok) {
    throw new Error(getBackendMessage(payload, `HTTP ${response.status}`))
  }

  if (payload && typeof payload === 'object' && payload.ok === false) {
    throw new Error(getBackendMessage(payload, 'No se pudo cargar'))
  }

  return payload
}

function limpiarToken(token = '') {
  return String(token || '').trim()
}

function limpiarMensaje(mensaje = '') {
  return String(mensaje || '').replace(/\s+/g, ' ').trim()
}

export async function obtenerChatPublico(
  token,
  {
    marcarLeidos = false,
    alerta = false,
    despuesId = 0,
    antesId = 0,
    limite = 100
  } = {}
) {
  const tokenLimpio = limpiarToken(token)

  if (!tokenLimpio) {
    throw new Error('No se pudo cargar')
  }

  const params = new URLSearchParams({ token: tokenLimpio })

  if (marcarLeidos) {
    params.set('marcar_leidos', '1')
  }

  if (alerta) {
    params.set('alerta', '1')
  }

  if (Number(despuesId) > 0) {
    params.set('despues_id', String(despuesId))
  }

  if (Number(antesId) > 0) {
    params.set('antes_id', String(antesId))
  }

  if (Number(despuesId) > 0 && Number(antesId) > 0) {
    throw new Error('Usa solo un cursor de chat')
  }

  if (Number(limite) > 0) {
    params.set('limite', String(Math.min(Number(limite), 100)))
  }

  return publicRequest(`/chat_publico.php?${params.toString()}`)
}

export async function enviarMensajePublico(token, mensaje) {
  const tokenLimpio = limpiarToken(token)
  const mensajeLimpio = limpiarMensaje(mensaje)

  if (!tokenLimpio || !mensajeLimpio) {
    throw new Error('No se pudo enviar')
  }

  return publicRequest('/chat_publico.php', {
    method: 'POST',
    body: JSON.stringify({
      token: tokenLimpio,
      mensaje: mensajeLimpio
    })
  })
}

export async function aceptarPropuestaPublica(token) {
  const tokenLimpio = limpiarToken(token)

  if (!tokenLimpio) {
    throw new Error('No se pudo aceptar')
  }

  return publicRequest('/aceptar_propuesta.php', {
    method: 'POST',
    body: JSON.stringify({ token: tokenLimpio })
  })
}
