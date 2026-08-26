import { API_BASE_URL } from '../../../config/env'
import { normalizarPantallasMapa } from '../../mapa-cliente/utils/prepararPantallasMapa'
import { normalizarEstadoPropuesta, obtenerTextoEstadoPropuesta } from '../../cotizaciones/utils/estadoPropuesta'

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

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '')
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
    throw new Error(getBackendMessage(payload, 'No se pudo cargar'))
  }

  return payload
}

function normalizarCotizacionPublica(propuesta = {}) {
  const cotizacion = propuesta?.cotizacion && typeof propuesta.cotizacion === 'object'
    ? propuesta.cotizacion
    : {}
  const resumen = propuesta?.resumen && typeof propuesta.resumen === 'object'
    ? propuesta.resumen
    : {}

  const estadoPropuesta = normalizarEstadoPropuesta(
    pickFirst(cotizacion.estadoPropuesta, resumen.estadoPropuesta, cotizacion.estado_propuesta, resumen.estado_propuesta, 'en_revision')
  )

  return {
    ...cotizacion,
    ...resumen,
    id: pickFirst(cotizacion.id, resumen.id, null),
    nombreCampana: pickFirst(cotizacion.nombreCampana, resumen.nombreCampana, cotizacion.nombre_campana, resumen.nombre_campana, ''),
    cliente: pickFirst(cotizacion.cliente, resumen.cliente, cotizacion.nombreCliente, cotizacion.nombre_cliente, ''),
    fechaInicio: pickFirst(cotizacion.fechaInicio, resumen.fechaInicio, cotizacion.fecha_inicio, resumen.fecha_inicio, ''),
    fechaTermino: pickFirst(cotizacion.fechaTermino, resumen.fechaTermino, cotizacion.fecha_termino, resumen.fecha_termino, ''),
    formato: pickFirst(cotizacion.formato, resumen.formato, ''),
    tipoCompra: pickFirst(cotizacion.tipoCompra, resumen.tipoCompra, cotizacion.tipo_compra, resumen.tipo_compra, ''),
    presupuestoCliente: pickFirst(cotizacion.presupuestoCliente, resumen.presupuestoCliente, cotizacion.presupuesto_cliente, resumen.presupuesto_cliente, ''),
    pantallasActivas: pickFirst(cotizacion.pantallasActivas, resumen.pantallas, resumen.screens, cotizacion.pantallas_activas, ''),
    estadoPropuesta,
    estado_propuesta: estadoPropuesta,
    estadoPropuestaTexto: obtenerTextoEstadoPropuesta(estadoPropuesta),
    fechaEstadoPropuesta: pickFirst(cotizacion.fechaEstadoPropuesta, resumen.fechaEstadoPropuesta, cotizacion.fecha_estado_propuesta, resumen.fecha_estado_propuesta, ''),
    fecha_estado_propuesta: pickFirst(cotizacion.fecha_estado_propuesta, resumen.fecha_estado_propuesta, cotizacion.fechaEstadoPropuesta, resumen.fechaEstadoPropuesta, '')
  }
}

function normalizarCpmPublico(propuesta = {}) {
  const cpm = propuesta?.cpm && typeof propuesta.cpm === 'object' ? propuesta.cpm : {}
  const resumen = propuesta?.resumen && typeof propuesta.resumen === 'object' ? propuesta.resumen : {}
  const presentacionBase = cpm?.presentacion && typeof cpm.presentacion === 'object'
    ? cpm.presentacion
    : (resumen?.presentacion && typeof resumen.presentacion === 'object' ? resumen.presentacion : {})
  const cpmCliente = pickFirst(cpm.cpmCliente, cpm.cpm_cliente, '')
  const cpmTp = pickFirst(cpm.cpmTp, cpm.cpm_tp, '')
  const usarTp = pickFirst(cpm.usarTp, cpm.usar_tp, false)
  const tarifaCliente = pickFirst(cpm.tarifaCliente, cpm.tarifa_cliente, '')

  return {
    ...cpm,
    presentacion: presentacionBase,
    tarifaCliente,
    tarifa_cliente: tarifaCliente,
    cpmCliente,
    cpm_cliente: cpmCliente,
    cpmTp,
    cpm_tp: cpmTp,
    usarTp,
    usar_tp: usarTp,
    valorCpm: pickFirst(cpm.valorCpm, cpm.valor_cpm, ''),
    valor_cpm: pickFirst(cpm.valor_cpm, cpm.valorCpm, ''),
    cpmFuente: pickFirst(cpm.cpmFuente, cpm.cpm_fuente, ''),
    cpm_fuente: pickFirst(cpm.cpm_fuente, cpm.cpmFuente, ''),
    presupuesto_cliente: pickFirst(cpm.presupuesto_cliente, cpm.presupuestoCliente, resumen.presupuesto_cliente, resumen.presupuestoCliente, ''),
    presupuestoCliente: pickFirst(cpm.presupuestoCliente, cpm.presupuesto_cliente, resumen.presupuestoCliente, resumen.presupuesto_cliente, ''),
    impresiones_estimadas: pickFirst(cpm.impresiones_estimadas, cpm.impresionesEstimadas, resumen.impresiones_estimadas, resumen.impresionesEstimadas, ''),
    impresionesEstimadas: pickFirst(cpm.impresionesEstimadas, cpm.impresiones_estimadas, resumen.impresionesEstimadas, resumen.impresiones_estimadas, '')
  }
}

export function obtenerUrlExcelPublico(token) {
  const tokenLimpio = String(token || '').trim()

  if (!tokenLimpio) {
    return ''
  }

  return buildRequestUrl(`/excel.php?token=${encodeURIComponent(tokenLimpio)}`)
}

export async function obtenerPropuestaPublica(token) {
  const tokenLimpio = String(token || '').trim()

  if (!tokenLimpio) {
    throw new Error('No se pudo cargar')
  }

  const response = await publicRequest(`/propuesta_publica.php?token=${encodeURIComponent(tokenLimpio)}`)
  const propuesta = response?.propuesta && typeof response.propuesta === 'object'
    ? response.propuesta
    : response
  const pantallas = normalizarPantallasMapa(propuesta?.pantallas || propuesta?.ubicaciones || [])

  return {
    ...propuesta,
    cotizacion: normalizarCotizacionPublica(propuesta),
    cpm: normalizarCpmPublico(propuesta),
    pantallas,
    ubicaciones: pantallas,
    resumen: propuesta?.resumen || {}
  }
}

export async function obtenerMapsPublicConfig() {
  const response = await publicRequest('/maps_public_config.php')
  const rawMapsConfig = response?.maps && typeof response.maps === 'object'
    ? response.maps
    : response

  const apiKey = String(rawMapsConfig?.apiKey || '').trim()
  const mapId = String(rawMapsConfig?.mapId || '').trim()

  if (!apiKey || !mapId) {
    throw new Error('No se pudo cargar el mapa')
  }

  return {
    apiKey,
    mapId
  }
}
