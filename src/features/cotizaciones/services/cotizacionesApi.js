import { AUTH_MOCK_ENABLED } from '../../../config/env'
import apiClient from '../../../services/apiClient'
import { cotizacionesMock } from '../data/cotizacionesMock'
import { tratamientoCotizacionMock } from '../../tratamiento/data/tratamientoCotizacionMock'

const COLUMNAS_BASE = [
  { key: 'screenName', label: 'Screen name', editable: false, origen: 'base' },
  { key: 'city', label: 'City', editable: false, origen: 'base' },
  { key: 'venueType', label: 'Venue type', editable: false, origen: 'base' },
  { key: 'latitude', label: 'Latitude', editable: false, origen: 'base' },
  { key: 'longitude', label: 'Longitude', editable: false, origen: 'base' },
  { key: 'dimensions', label: 'Dimension', editable: false, origen: 'base' },
  { key: 'impressions', label: 'Impressions', editable: false, origen: 'base' },
  { key: 'cardinalPoint', label: 'Cardinal point', editable: false, origen: 'base' },
  { key: 'status', label: 'Status', editable: false, origen: 'base' }
]

const CAMPOS_RESERVADOS_PANTALLA = new Set([
  'id',
  'idTemporal',
  'campaignName',
  'cliente',
  'sheetName',
  'screenName',
  'city',
  'venueType',
  'latitude',
  'longitude',
  'dimensions',
  'impressions',
  'cardinalPoint',
  'status',
  'isValid',
  'is_active',
  'errors',
  'rawPayload'
])

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '')
}

function safeJsonParse(value, fallback) {
  if (typeof value !== 'string') {
    return fallback
  }

  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = safeJsonParse(value, [])
    return Array.isArray(parsed) ? parsed : []
  }

  return []
}

function toObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = safeJsonParse(value, {})
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  }

  return {}
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value !== 0
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()

    if (['1', 'true', 'si', 'yes', 'activo', 'activa', 'vigente'].includes(normalized)) {
      return true
    }

    if (['0', 'false', 'no', 'inactivo', 'inactiva', 'suspendido'].includes(normalized)) {
      return false
    }
  }

  return fallback
}

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    searchParams.set(key, String(value))
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

function normalizeColumn(rawColumn) {
  if (typeof rawColumn === 'string') {
    return {
      key: rawColumn,
      label: rawColumn,
      editable: false,
      origen: 'base'
    }
  }

  return {
    key: String(
      pickFirst(rawColumn?.key, rawColumn?.campo, rawColumn?.id, rawColumn?.nombre, 'columna')
    ),
    label: String(
      pickFirst(rawColumn?.label, rawColumn?.nombre, rawColumn?.titulo, rawColumn?.key, 'Columna')
    ),
    editable: toBoolean(rawColumn?.editable, false),
    origen: pickFirst(rawColumn?.origen, rawColumn?.source, 'base')
  }
}

function buildColumnsFromLocations(ubicaciones = []) {
  const columnasMap = new Map(COLUMNAS_BASE.map((columna) => [columna.key, columna]))

  ubicaciones.forEach((ubicacion) => {
    Object.keys(ubicacion || {}).forEach((key) => {
      if (CAMPOS_RESERVADOS_PANTALLA.has(key) || columnasMap.has(key)) {
        return
      }

      columnasMap.set(key, {
        key,
        label: key,
        editable: true,
        origen: 'manual'
      })
    })
  })

  return Array.from(columnasMap.values())
}

function normalizeColumns(rawColumns, ubicaciones) {
  const columnas = toArray(rawColumns).map(normalizeColumn).filter((columna) => columna.key)

  if (columnas.length > 0) {
    return columnas
  }

  return buildColumnsFromLocations(ubicaciones)
}

function normalizeErrors(raw) {
  const errors = pickFirst(raw?.errors, raw?.errores)
  return Array.isArray(errors) ? errors : []
}

function normalizePantalla(rawPantalla = {}, index = 0, cotizacion = {}) {
  const id = String(
    pickFirst(
      rawPantalla.id,
      rawPantalla.pantallaId,
      rawPantalla.idPantalla,
      rawPantalla.id_pantalla,
      rawPantalla.idTemporal,
      `pantalla-${index + 1}`
    )
  )

  const isActive = toBoolean(
    pickFirst(rawPantalla.is_active, rawPantalla.isActive, rawPantalla.estaActiva, rawPantalla.activa),
    true
  )

  return {
    ...rawPantalla,
    id,
    idTemporal: String(pickFirst(rawPantalla.idTemporal, id)),
    campaignName: String(
      pickFirst(
        rawPantalla.campaignName,
        rawPantalla.nombreCampana,
        rawPantalla.nombre_campana,
        cotizacion.nombreCampana,
        ''
      )
    ),
    cliente: String(pickFirst(rawPantalla.cliente, cotizacion.cliente, '')),
    sheetName: String(
      pickFirst(rawPantalla.sheetName, rawPantalla.nombreHoja, rawPantalla.nombre_hoja, cotizacion.nombreHoja, '')
    ),
    screenName: String(
      pickFirst(rawPantalla.screenName, rawPantalla.nombrePantalla, rawPantalla.nombre_pantalla, '')
    ),
    city: String(pickFirst(rawPantalla.city, rawPantalla.ciudad, '')),
    venueType: String(
      pickFirst(rawPantalla.venueType, rawPantalla.tipoVenue, rawPantalla.tipo_venue, '')
    ),
    latitude: toNullableNumber(pickFirst(rawPantalla.latitude, rawPantalla.latitud)),
    longitude: toNullableNumber(pickFirst(rawPantalla.longitude, rawPantalla.longitud)),
    dimensions: String(pickFirst(rawPantalla.dimensions, rawPantalla.dimension, rawPantalla.dimensiones, '')),
    impressions: toNumber(pickFirst(rawPantalla.impressions, rawPantalla.impresiones), 0),
    cardinalPoint: String(
      pickFirst(rawPantalla.cardinalPoint, rawPantalla.puntoCardinal, rawPantalla.punto_cardinal, 'Sin definir')
    ),
    status: String(pickFirst(rawPantalla.status, rawPantalla.estado, rawPantalla.estatus, isActive ? 'Lista' : 'Inactiva')),
    isValid: toBoolean(pickFirst(rawPantalla.isValid, rawPantalla.esValida, rawPantalla.valida), true),
    is_active: isActive,
    errors: normalizeErrors(rawPantalla),
    rawPayload: toObject(pickFirst(rawPantalla.rawPayload, rawPantalla.raw_payload, {}))
  }
}

function normalizeCotizacionResumen(rawCotizacion = {}) {
  const totalPantallas = toNumber(
    pickFirst(rawCotizacion.totalPantallas, rawCotizacion.total_pantallas, rawCotizacion.totalPantallasRegistradas),
    0
  )
  const totalPantallasActivas = toNumber(
    pickFirst(rawCotizacion.totalPantallasActivas, rawCotizacion.total_pantallas_activas, rawCotizacion.totalActivas),
    0
  )

  return {
    id: String(pickFirst(rawCotizacion.id, rawCotizacion.cotizacionId, rawCotizacion.cotizacion_id, '')),
    nombreCampana: String(
      pickFirst(rawCotizacion.nombreCampana, rawCotizacion.nombre_campana, rawCotizacion.campaignName, '')
    ),
    cliente: String(pickFirst(rawCotizacion.cliente, rawCotizacion.clienteNombre, '')),
    nombreArchivo: String(pickFirst(rawCotizacion.nombreArchivo, rawCotizacion.nombre_archivo, '')),
    nombreHoja: String(pickFirst(rawCotizacion.nombreHoja, rawCotizacion.nombre_hoja, '')),
    notasInternas: String(pickFirst(rawCotizacion.notasInternas, rawCotizacion.notas_internas, '')),
    usuarioCreadorId: String(
      pickFirst(rawCotizacion.usuarioCreadorId, rawCotizacion.usuario_creador_id, rawCotizacion.creadoPorId, '')
    ),
    usuarioCreadorNombre: String(
      pickFirst(
        rawCotizacion.usuarioCreadorNombre,
        rawCotizacion.usuario_creador_nombre,
        rawCotizacion.creadoPorNombre,
        rawCotizacion.nombreUsuarioCreador,
        ''
      )
    ),
    fechaCreacion: String(
      pickFirst(rawCotizacion.fechaCreacion, rawCotizacion.fecha_creacion, rawCotizacion.createdAt, new Date().toISOString())
    ),
    fechaActualizacion: String(
      pickFirst(rawCotizacion.fechaActualizacion, rawCotizacion.fecha_actualizacion, rawCotizacion.updatedAt, '')
    ),
    estado: String(pickFirst(rawCotizacion.estado, rawCotizacion.estatus, 'borrador')),
    totalPantallas,
    totalPantallasActivas,
    puedeEditar: pickFirst(rawCotizacion.puedeEditar, rawCotizacion.puede_editar, rawCotizacion.canEdit)
  }
}

function normalizeCotizacionDetalle(rawBody = {}) {
  const cotizacionCruda = rawBody?.cotizacion && typeof rawBody.cotizacion === 'object'
    ? rawBody.cotizacion
    : rawBody

  const resumenCotizacion = normalizeCotizacionResumen(cotizacionCruda)
  const ubicacionesCrudas = toArray(
    pickFirst(
      cotizacionCruda.ubicaciones,
      cotizacionCruda.pantallas,
      rawBody.ubicaciones,
      rawBody.pantallas
    )
  )
  const ubicaciones = ubicacionesCrudas.map((pantalla, index) =>
    normalizePantalla(pantalla, index, resumenCotizacion)
  )
  const columnas = normalizeColumns(
    pickFirst(cotizacionCruda.columnas, rawBody.columnas),
    ubicaciones
  )

  const totalPantallas = resumenCotizacion.totalPantallas || ubicaciones.length
  const totalPantallasActivas =
    resumenCotizacion.totalPantallasActivas || ubicaciones.filter((ubicacion) => ubicacion.is_active).length

  return {
    ...resumenCotizacion,
    diagnostico: toObject(pickFirst(cotizacionCruda.diagnostico, rawBody.diagnostico, {})),
    resumen: toObject(pickFirst(cotizacionCruda.resumen, rawBody.resumen, {})),
    columnas,
    ubicaciones,
    totalPantallas,
    totalPantallasActivas,
    puedeEditar:
      resumenCotizacion.puedeEditar === undefined
        ? undefined
        : toBoolean(resumenCotizacion.puedeEditar, false)
  }
}

function serializePantallaForApi(pantalla = {}) {
  const rawPayload = toObject(pantalla.rawPayload)

  return {
    id: pickFirst(pantalla.id, pantalla.idTemporal, null),
    idTemporal: String(pickFirst(pantalla.idTemporal, pantalla.id, '')),
    campaignName: String(pickFirst(pantalla.campaignName, pantalla.nombreCampana, '')),
    cliente: String(pickFirst(pantalla.cliente, '')),
    sheetName: String(pickFirst(pantalla.sheetName, pantalla.nombreHoja, '')),
    screenName: String(pickFirst(pantalla.screenName, '')),
    city: String(pickFirst(pantalla.city, '')),
    venueType: String(pickFirst(pantalla.venueType, '')),
    latitude: toNullableNumber(pickFirst(pantalla.latitude, null)),
    longitude: toNullableNumber(pickFirst(pantalla.longitude, null)),
    dimensions: String(pickFirst(pantalla.dimensions, '')),
    impressions: toNumber(pickFirst(pantalla.impressions, 0), 0),
    cardinalPoint: String(pickFirst(pantalla.cardinalPoint, 'Sin definir')),
    status: String(pickFirst(pantalla.status, pantalla.estado, 'Lista')),
    isValid: toBoolean(pickFirst(pantalla.isValid, true), true),
    is_active: toBoolean(pickFirst(pantalla.is_active, true), true),
    errors: normalizeErrors(pantalla),
    rawPayload
  }
}

export function construirPayloadCotizacion(cotizacion = {}) {
  const ubicaciones = toArray(cotizacion.ubicaciones).map(serializePantallaForApi)
  const columnas = normalizeColumns(cotizacion.columnas, ubicaciones)
  const payloadBase = {
    id: pickFirst(cotizacion.id, cotizacion.cotizacionId, cotizacion.cotizacion_id, null),
    nombreCampana: String(pickFirst(cotizacion.nombreCampana, '')),
    cliente: String(pickFirst(cotizacion.cliente, '')),
    nombreArchivo: String(pickFirst(cotizacion.nombreArchivo, '')),
    nombreHoja: String(pickFirst(cotizacion.nombreHoja, '')),
    notasInternas: String(pickFirst(cotizacion.notasInternas, '')),
    fechaCreacion: String(pickFirst(cotizacion.fechaCreacion, new Date().toISOString())),
    estado: String(pickFirst(cotizacion.estado, 'borrador')),
    diagnostico: toObject(pickFirst(cotizacion.diagnostico, {})),
    resumen: {
      ...toObject(pickFirst(cotizacion.resumen, {})),
      totalPantallas: ubicaciones.length,
      totalPantallasActivas: ubicaciones.filter((ubicacion) => ubicacion.is_active).length
    },
    columnas,
    ubicaciones
  }

  return {
    ...payloadBase,
    pantallas: ubicaciones,
    cotizacionTemporal: {
      ...payloadBase,
      totalPantallas: ubicaciones.length,
      totalPantallasActivas: ubicaciones.filter((ubicacion) => ubicacion.is_active).length
    }
  }
}

function extractCotizacionId(rawBody = {}, fallbackDetail = null) {
  return String(
    pickFirst(
      rawBody.cotizacionId,
      rawBody.cotizacion_id,
      rawBody.id,
      rawBody?.cotizacion?.id,
      rawBody?.cotizacion?.cotizacionId,
      fallbackDetail?.id,
      ''
    )
  )
}

function buildMockCotizacionDetalle(cotizacionId) {
  const cotizacionResumen =
    cotizacionesMock.find((item) => String(item.id) === String(cotizacionId)) || cotizacionesMock[0]

  const ubicaciones = tratamientoCotizacionMock.filas.map((fila, index) =>
    normalizePantalla(
      {
        ...fila,
        campaignName: cotizacionResumen.nombreCampana,
        cliente: cotizacionResumen.cliente,
        sheetName: 'Inventory - Screens'
      },
      index,
      cotizacionResumen
    )
  )

  return {
    ...normalizeCotizacionResumen({
      ...cotizacionResumen,
      nombreArchivo: 'demo-operativo.xlsx',
      nombreHoja: 'Inventory - Screens',
      totalPantallas: ubicaciones.length,
      totalPantallasActivas: ubicaciones.filter((ubicacion) => ubicacion.is_active).length,
      puedeEditar: true
    }),
    diagnostico: {},
    resumen: {},
    columnas: normalizeColumns(tratamientoCotizacionMock.columnas, ubicaciones),
    ubicaciones
  }
}

export async function obtenerCotizaciones(params = {}) {
  const endpoint = `/cotizaciones.php${buildQueryString(params)}`

  try {
    const response = await apiClient.get(endpoint)
    const cotizaciones = toArray(Array.isArray(response) ? response : response?.cotizaciones).map(normalizeCotizacionResumen)

    return {
      cotizaciones,
      total: toNumber(response?.total, cotizaciones.length),
      limit: toNumber(response?.limit, cotizaciones.length),
      offset: toNumber(response?.offset, 0),
      source: 'api'
    }
  } catch (error) {
    if (!AUTH_MOCK_ENABLED) {
      throw error
    }

    const cotizaciones = cotizacionesMock.map(normalizeCotizacionResumen)

    return {
      cotizaciones,
      total: cotizaciones.length,
      limit: cotizaciones.length,
      offset: 0,
      source: 'mock'
    }
  }
}

export async function obtenerCotizacionPorId(id) {
  try {
    const response = await apiClient.get(`/cotizacion.php?id=${encodeURIComponent(id)}`)
    return normalizeCotizacionDetalle(response)
  } catch (error) {
    if (!AUTH_MOCK_ENABLED) {
      throw error
    }

    return buildMockCotizacionDetalle(id)
  }
}

export async function obtenerCotizacion(id) {
  return obtenerCotizacionPorId(id)
}

export async function crearCotizacion(payload) {
  const serializedPayload = construirPayloadCotizacion(payload)

  if (AUTH_MOCK_ENABLED) {
    const cotizacion = normalizeCotizacionDetalle({
      cotizacion: {
        ...serializedPayload.cotizacionTemporal,
        id: pickFirst(payload.id, `cot-temp-${Date.now()}`),
        puedeEditar: true
      },
      ubicaciones: serializedPayload.ubicaciones
    })

    return {
      ok: true,
      mensaje: 'Cotizacion temporal creada en modo mock.',
      cotizacionId: cotizacion.id,
      cotizacion
    }
  }

  const response = await apiClient.post('/cotizaciones.php', serializedPayload)
  const cotizacion =
    response?.cotizacion || response?.ubicaciones || response?.pantallas || response?.id
      ? normalizeCotizacionDetalle(response)
      : null

  return {
    ok: response?.ok ?? true,
    mensaje: response?.mensaje || 'Cotizacion creada correctamente.',
    cotizacionId: extractCotizacionId(response, cotizacion),
    cotizacion,
    raw: response
  }
}

export async function actualizarCotizacion(id, payload) {
  const serializedPayload = construirPayloadCotizacion(payload)

  if (AUTH_MOCK_ENABLED) {
    const cotizacion = normalizeCotizacionDetalle({
      cotizacion: {
        ...serializedPayload.cotizacionTemporal,
        id,
        puedeEditar: true
      },
      ubicaciones: serializedPayload.ubicaciones
    })

    return {
      ok: true,
      mensaje: 'Cotizacion temporal actualizada en modo mock.',
      cotizacionId: String(id),
      cotizacion
    }
  }

  const response = await apiClient.put(`/cotizacion.php?id=${encodeURIComponent(id)}`, serializedPayload)
  const cotizacion =
    response?.cotizacion || response?.ubicaciones || response?.pantallas || response?.id
      ? normalizeCotizacionDetalle(response)
      : null

  return {
    ok: response?.ok ?? true,
    mensaje: response?.mensaje || 'Cotizacion actualizada correctamente.',
    cotizacionId: extractCotizacionId(response, cotizacion) || String(id),
    cotizacion,
    raw: response
  }
}

export async function archivarCotizacion(id) {
  if (AUTH_MOCK_ENABLED) {
    return {
      ok: true,
      mensaje: 'Cotizacion archivada en modo mock.'
    }
  }

  const response = await apiClient.delete(`/cotizacion.php?id=${encodeURIComponent(id)}`)

  return {
    ok: response?.ok ?? true,
    mensaje: response?.mensaje || 'Cotizacion archivada correctamente.',
    raw: response
  }
}
