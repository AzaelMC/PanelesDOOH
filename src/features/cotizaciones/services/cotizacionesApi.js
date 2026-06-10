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
  'pantallaId',
  'pantalla_id',
  'cotizacionId',
  'cotizacion_id',
  'orden',
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
  'esValida',
  'es_valida',
  'is_active',
  'estaActiva',
  'esta_activa',
  'errors',
  'rawPayload',
  'fechaCreacion',
  'fecha_creacion',
  'fechaActualizacion',
  'fecha_actualizacion'
])

const COLUMNAS_API_LIGERAS = [
  'screenName',
  'city',
  'venueType',
  'latitude',
  'longitude',
  'dimensions',
  'impressions',
  'cardinalPoint'
]

const TAMANO_LOTE_COTIZACION = 50
const TAMANO_LOTE_CAMBIOS = 50

const CAMPOS_EDITABLES_ACTUALIZACION = [
  'screenName',
  'city',
  'venueType',
  'latitude',
  'longitude',
  'dimensions',
  'impressions',
  'cardinalPoint',
  'is_active',
  'isValid',
  'errors'
]

function removeControlCharacters(value = '') {
  return Array.from(String(value)).filter((character) => {
    const codePoint = character.charCodeAt(0)
    return codePoint >= 32 && codePoint !== 127
  }).join('')
}

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

export function limpiarTextoParaApi(value, { fallback = '', maxLength = 255 } = {}) {
  if (value === null || value === undefined) {
    return fallback
  }

  const sanitized = removeControlCharacters(value)
    .replace(/[<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!sanitized) {
    return fallback
  }

  return sanitized.slice(0, maxLength)
}

function getRawPayloadValue(rawPayload = {}, keys = []) {
  return pickFirst(...keys.map((key) => rawPayload[key]))
}

function sanitizeErrorMessages(errors = []) {
  return errors
    .map((error) => limpiarTextoParaApi(error, { maxLength: 160 }))
    .filter(Boolean)
    .slice(0, 10)
}

function buildSafeDimensions(pantalla = {}, rawPayload = {}) {
  const explicitDimensions = limpiarTextoParaApi(
    pickFirst(
      pantalla.dimensions,
      getRawPayloadValue(rawPayload, ['Dimension.dimensionsWxH', 'Dimensions'])
    ),
    { maxLength: 120 }
  )

  if (explicitDimensions) {
    return explicitDimensions
  }

  const width = limpiarTextoParaApi(
    getRawPayloadValue(rawPayload, ['Screen width (px)', 'Screen width']),
    { maxLength: 32 }
  )
  const height = limpiarTextoParaApi(
    getRawPayloadValue(rawPayload, ['Screen height (px)', 'Screen height']),
    { maxLength: 32 }
  )

  if (!width || !height) {
    return ''
  }

  return limpiarTextoParaApi(`${width}x${height}`, { maxLength: 120 })
}

function buildSafeLocationIdentifier(pantalla = {}, rawPayload = {}, index = 0) {
  return limpiarTextoParaApi(
    pickFirst(
      getRawPayloadValue(rawPayload, ['Unit ID', 'Screen ID']),
      pantalla.idTemporal,
      pantalla.id,
      `ubicacion-${index + 1}`
    ),
    { maxLength: 120 }
  )
}

function normalizarUbicacionParaApi(pantalla = {}, index = 0) {
  const rawPayload = toObject(pickFirst(pantalla.rawPayload, pantalla.raw_payload, {}))
  const latitude = toNullableNumber(
    pickFirst(pantalla.latitude, getRawPayloadValue(rawPayload, ['Screen latitude', 'Latitude']))
  )
  const longitude = toNullableNumber(
    pickFirst(pantalla.longitude, getRawPayloadValue(rawPayload, ['Screen longitude', 'Longitude']))
  )
  const sanitizedErrors = sanitizeErrorMessages(normalizeErrors(pantalla))
  const cardinalPoint = limpiarTextoParaApi(
    pickFirst(pantalla.cardinalPoint, getRawPayloadValue(rawPayload, ['Cardinal point']), ''),
    { maxLength: 80 }
  )
  const isValid = toBoolean(
    pickFirst(pantalla.isValid, pantalla.esValida, latitude !== null && longitude !== null && sanitizedErrors.length === 0),
    latitude !== null && longitude !== null && sanitizedErrors.length === 0
  )

  return {
    idTemporal: buildSafeLocationIdentifier(pantalla, rawPayload, index),
    screenName: limpiarTextoParaApi(
      pickFirst(pantalla.screenName, getRawPayloadValue(rawPayload, ['Screen name'])),
      { maxLength: 255 }
    ),
    city: limpiarTextoParaApi(
      pickFirst(pantalla.city, getRawPayloadValue(rawPayload, ['Site location (city)', 'City'])),
      { maxLength: 255 }
    ),
    venueType: limpiarTextoParaApi(
      pickFirst(pantalla.venueType, getRawPayloadValue(rawPayload, ['Venue type'])),
      { maxLength: 255 }
    ),
    latitude,
    longitude,
    cardinalPoint: cardinalPoint === 'Sin definir' ? '' : cardinalPoint,
    dimensions: buildSafeDimensions(pantalla, rawPayload),
    impressions: toNumber(
      pickFirst(pantalla.impressions, getRawPayloadValue(rawPayload, ['Screen max impressions capacity', 'Impressions'])),
      0
    ),
    isValid,
    is_active: toBoolean(pickFirst(pantalla.is_active, true), true),
    errors: sanitizedErrors
  }
}

function normalizarColumnasParaApi(columnas, ubicaciones = []) {
  const columnasDisponibles = new Set()

  toArray(columnas).forEach((columna) => {
    const normalized = normalizeColumn(columna)
    if (COLUMNAS_API_LIGERAS.includes(normalized.key)) {
      columnasDisponibles.add(normalized.key)
    }
  })

  if (columnasDisponibles.size === 0) {
    COLUMNAS_API_LIGERAS.forEach((key) => {
      if (ubicaciones.some((ubicacion) => Object.prototype.hasOwnProperty.call(ubicacion, key))) {
        columnasDisponibles.add(key)
      }
    })
  }

  return Array.from(columnasDisponibles)
}

function normalizarResumenParaApi(cotizacion = {}, ubicaciones = []) {
  const resumen = toObject(pickFirst(cotizacion.resumen, {}))
  const totalValidas = ubicaciones.filter((ubicacion) => ubicacion.isValid).length
  const totalInvalidas = ubicaciones.length - totalValidas

  return {
    totalPantallas: ubicaciones.length,
    totalPantallasActivas: ubicaciones.filter((ubicacion) => ubicacion.is_active).length,
    totalFilasProcesadas: toNumber(
      pickFirst(resumen.totalFilasProcesadas, resumen.filasProcesadas, resumen.totalFilas, ubicaciones.length),
      ubicaciones.length
    ),
    totalValidas: toNumber(pickFirst(resumen.totalValidas, resumen.filasValidas, totalValidas), totalValidas),
    totalInvalidas: toNumber(pickFirst(resumen.totalInvalidas, resumen.filasInvalidas, totalInvalidas), totalInvalidas),
    mapsEliminada: toBoolean(pickFirst(resumen.mapsEliminada, resumen.columnaMapsEliminada, false), false)
  }
}

function normalizarDiagnosticoParaApi(cotizacion = {}, resumen = {}) {
  const diagnostico = toObject(pickFirst(cotizacion.diagnostico, {}))

  return {
    hojaDetectada: limpiarTextoParaApi(
      pickFirst(diagnostico.hojaDetectada, cotizacion.nombreHoja, ''),
      { maxLength: 255 }
    ),
    filaEncabezados: toNumber(
      pickFirst(diagnostico.filaEncabezados, diagnostico.indiceFila, -1),
      -1
    ),
    totalFilasProcesadas: toNumber(pickFirst(diagnostico.totalFilasProcesadas, resumen.totalFilasProcesadas), resumen.totalFilasProcesadas || 0),
    totalValidas: toNumber(pickFirst(diagnostico.totalValidas, resumen.totalValidas), resumen.totalValidas || 0),
    totalInvalidas: toNumber(pickFirst(diagnostico.totalInvalidas, resumen.totalInvalidas), resumen.totalInvalidas || 0),
    mapsEliminada: toBoolean(pickFirst(diagnostico.mapsEliminada, resumen.mapsEliminada, false), false)
  }
}

function buildCotizacionPayloadDebugInfo(payload = {}) {
  const body = JSON.stringify(payload)
  const ubicaciones = toArray(payload.ubicaciones)
  const firstLocation = ubicaciones[0] && typeof ubicaciones[0] === 'object' ? ubicaciones[0] : {}

  return {
    sizeKb: Number((new TextEncoder().encode(body).length / 1024).toFixed(2)),
    totalUbicaciones: ubicaciones.length,
    payloadKeys: Object.keys(payload),
    firstLocationKeys: Object.keys(firstLocation),
    hasRawPayload: ubicaciones.some((ubicacion) => Object.prototype.hasOwnProperty.call(ubicacion || {}, 'rawPayload')),
    hasCotizacionTemporal: Object.prototype.hasOwnProperty.call(payload, 'cotizacionTemporal'),
    hasPantallasDuplicadas: Object.prototype.hasOwnProperty.call(payload, 'pantallas'),
    hasUbicaciones: Object.prototype.hasOwnProperty.call(payload, 'ubicaciones'),
    hasWorkbook: Object.prototype.hasOwnProperty.call(payload, 'workbook'),
    hasRowsOriginales:
      Object.prototype.hasOwnProperty.call(payload, 'rows') ||
      Object.prototype.hasOwnProperty.call(payload, 'filas')
  }
}

function dividirEnLotes(items = [], batchSize = TAMANO_LOTE_COTIZACION) {
  if (!Array.isArray(items) || items.length === 0) {
    return []
  }

  const safeBatchSize =
    Number.isFinite(batchSize) && batchSize > 0
      ? Math.max(1, Math.floor(batchSize))
      : TAMANO_LOTE_COTIZACION
  const lotes = []

  for (let index = 0; index < items.length; index += safeBatchSize) {
    lotes.push(items.slice(index, index + safeBatchSize))
  }

  return lotes
}

function logCotizacionBatchProgress({ cotizacionId, loteActual, totalLotes, pantallasEnLote }) {
  if (!import.meta.env.DEV) {
    return
  }

  console.info('[DOOH Cotizacion Batch]', {
    cotizacionId,
    loteActual,
    totalLotes,
    pantallasEnLote
  })
}

function validarRespuestaLote(response, { cotizacionId, loteActual, pantallasEsperadas }) {
  const responseCotizacionId = extractCotizacionId(response)

  if (responseCotizacionId && String(responseCotizacionId) !== String(cotizacionId)) {
    throw new Error(`El lote ${loteActual} regreso un cotizacionId distinto al esperado.`)
  }

  if (response?.recibidas !== undefined && toNumber(response.recibidas, pantallasEsperadas) !== pantallasEsperadas) {
    throw new Error(`El lote ${loteActual} no reporto la cantidad esperada de pantallas recibidas.`)
  }

  if (response?.insertadas !== undefined && toNumber(response.insertadas, pantallasEsperadas) !== pantallasEsperadas) {
    throw new Error(`El lote ${loteActual} no se guardo completo en la API.`)
  }
}

function obtenerPantallaId(pantalla = {}) {
  return pickFirst(pantalla.pantallaId, pantalla.id)
}

function esIdNumericoValido(value) {
  return value !== null && value !== undefined && /^\d+$/.test(String(value))
}

function normalizarValorComparable(campo, value) {
  if (campo === 'latitude' || campo === 'longitude') {
    return toNullableNumber(value)
  }

  if (campo === 'impressions') {
    return toNumber(value, 0)
  }

  if (campo === 'is_active' || campo === 'isValid') {
    return toBoolean(value, campo === 'is_active')
  }

  if (campo === 'errors') {
    return JSON.stringify(normalizeErrors({ errors: value }))
  }

  return String(value ?? '').trim()
}

function prepararValorCambio(campo, value) {
  if (campo === 'latitude' || campo === 'longitude') {
    return toNullableNumber(value)
  }

  if (campo === 'impressions') {
    return toNumber(value, 0)
  }

  if (campo === 'is_active' || campo === 'isValid') {
    return toBoolean(value, campo === 'is_active')
  }

  if (campo === 'errors') {
    return normalizeErrors({ errors: value })
  }

  return String(value ?? '').trim()
}

function detectarCambiosPantallas(filasOriginales = [], filasActuales = []) {
  const indiceOriginales = new Map()

  toArray(filasOriginales).forEach((fila) => {
    const id = obtenerPantallaId(fila)

    if (esIdNumericoValido(id)) {
      indiceOriginales.set(String(id), fila)
    }
  })

  const cambios = []

  toArray(filasActuales).forEach((filaActual) => {
    const pantallaId = obtenerPantallaId(filaActual)

    if (!esIdNumericoValido(pantallaId)) {
      return
    }

    const filaOriginal = indiceOriginales.get(String(pantallaId))

    if (!filaOriginal) {
      return
    }

    const campos = {}

    CAMPOS_EDITABLES_ACTUALIZACION.forEach((campo) => {
      const valorOriginal = normalizarValorComparable(campo, filaOriginal[campo])
      const valorActual = normalizarValorComparable(campo, filaActual[campo])

      if (valorOriginal !== valorActual) {
        campos[campo] = prepararValorCambio(campo, filaActual[campo])
      }
    })

    if (Object.keys(campos).length === 0) {
      return
    }

    const soloCambioActivo =
      Object.keys(campos).length === 1 &&
      Object.prototype.hasOwnProperty.call(campos, 'is_active')

    let tipo = 'actualizar'

    if (soloCambioActivo && campos.is_active === false) {
      tipo = 'desactivar'
    }

    if (soloCambioActivo && campos.is_active === true) {
      tipo = 'reactivar'
    }

    cambios.push({
      tipo,
      pantallaId: Number(pantallaId),
      campos
    })
  })

  return cambios
}

function construirPayloadInicioActualizacion(cotizacion = {}, totalCambios = 0) {
  return {
    cotizacionId: String(pickFirst(cotizacion.id, cotizacion.cotizacionId, '')),
    totalCambios,
    nombreCampana: limpiarTextoParaApi(pickFirst(cotizacion.nombreCampana, ''), { maxLength: 255 }),
    cliente: limpiarTextoParaApi(pickFirst(cotizacion.cliente, ''), { maxLength: 255 }),
    nombreArchivo: limpiarTextoParaApi(pickFirst(cotizacion.nombreArchivo, ''), { maxLength: 255 }),
    nombreHoja: limpiarTextoParaApi(pickFirst(cotizacion.nombreHoja, ''), { maxLength: 255 }),
    notasInternas: limpiarTextoParaApi(pickFirst(cotizacion.notasInternas, ''), { maxLength: 4000 }),
    estatus: limpiarTextoParaApi(pickFirst(cotizacion.estatus, cotizacion.estado, 'borrador'), { maxLength: 80 })
  }
}

function logCotizacionCambiosBatchProgress({ cotizacionId, loteActual, totalLotes, cambiosEnLote }) {
  if (!import.meta.env.DEV) {
    return
  }

  console.info('[DOOH Actualizacion Cambios Batch]', {
    cotizacionId,
    loteActual,
    totalLotes,
    cambiosEnLote
  })
}

function validarRespuestaLoteCambios(response, { cotizacionId, loteActual, cambiosEsperados }) {
  const responseCotizacionId = extractCotizacionId(response)

  if (responseCotizacionId && String(responseCotizacionId) !== String(cotizacionId)) {
    throw new Error(`El lote ${loteActual} regreso un cotizacionId distinto al esperado.`)
  }

  if (response?.recibidos !== undefined && toNumber(response.recibidos, cambiosEsperados) !== cambiosEsperados) {
    throw new Error(`El lote ${loteActual} no reporto la cantidad esperada de cambios recibidos.`)
  }

  if (response?.omitidos !== undefined && toNumber(response.omitidos, 0) > 0) {
    throw new Error(response?.errores?.[0] || `El lote ${loteActual} omitio uno o mas cambios.`)
  }

  if (response?.actualizados !== undefined && toNumber(response.actualizados, cambiosEsperados) !== cambiosEsperados) {
    throw new Error(`El lote ${loteActual} no aplico todos los cambios esperados.`)
  }

  if (response?.ok === false) {
    throw new Error(response?.mensaje || `El lote ${loteActual} no se pudo aplicar.`)
  }
}

async function actualizarCotizacionPorCambios(id, payload = {}) {
  const cotizacionId = String(id)
  const cotizacion = toObject(pickFirst(payload.cotizacion, payload, {}))
  const filasOriginales = toArray(payload.filasOriginales)
  const filasActuales = toArray(pickFirst(payload.filasActuales, payload.ubicaciones, []))
  const cambios = detectarCambiosPantallas(filasOriginales, filasActuales)

  if (import.meta.env.DEV) {
    console.info('[DOOH Actualizacion Cambios Debug]', {
      cotizacionId,
      cambios: cambios.length,
      filasOriginales: filasOriginales.length,
      filasActuales: filasActuales.length
    })
  }

  if (cambios.length === 0) {
    return {
      ok: true,
      mensaje: 'No hay cambios de pantallas por guardar.',
      cotizacionId,
      cotizacion: null,
      raw: {
        sinCambios: true
      }
    }
  }

  const inicioResponse = await apiClient.post(
    '/cotizaciones_actualizar_iniciar.php',
    construirPayloadInicioActualizacion(
      {
        ...cotizacion,
        id: cotizacionId
      },
      cambios.length
    )
  )

  const lotes = dividirEnLotes(cambios, TAMANO_LOTE_CAMBIOS)
  const responsesLotes = []

  for (let loteIndice = 0; loteIndice < lotes.length; loteIndice += 1) {
    const cambiosLote = lotes[loteIndice]
    const loteActual = loteIndice + 1

    logCotizacionCambiosBatchProgress({
      cotizacionId,
      loteActual,
      totalLotes: lotes.length,
      cambiosEnLote: cambiosLote.length
    })

    const loteResponse = await apiClient.post('/pantallas_cambios_lote.php', {
      cotizacionId,
      loteIndice: loteActual,
      totalLotes: lotes.length,
      cambios: cambiosLote
    })

    validarRespuestaLoteCambios(loteResponse, {
      cotizacionId,
      loteActual,
      cambiosEsperados: cambiosLote.length
    })

    responsesLotes.push(loteResponse)
  }

  const finalizacionResponse = await apiClient.post('/cotizaciones_finalizar.php', {
    cotizacionId
  })
  const detalleResponse = await apiClient.get(
    `/cotizacion.php?id=${encodeURIComponent(cotizacionId)}&_ts=${Date.now()}`
  )
  const cotizacionActualizada = normalizeCotizacionDetalle(detalleResponse)

  return {
    ok: finalizacionResponse?.ok ?? true,
    mensaje: finalizacionResponse?.mensaje || 'Cambios guardados correctamente.',
    cotizacionId: extractCotizacionId(detalleResponse, cotizacionActualizada) || cotizacionId,
    cotizacion: cotizacionActualizada,
    raw: {
      inicio: inicioResponse,
      lotes: responsesLotes,
      finalizacion: finalizacionResponse,
      detalle: detalleResponse
    }
  }
}

export function normalizarPayloadCotizacionParaApi(cotizacion = {}) {
  const ubicaciones = toArray(pickFirst(cotizacion.ubicaciones, cotizacion.pantallas, []))
    .map((ubicacion, index) => normalizarUbicacionParaApi(ubicacion, index))
  const resumen = normalizarResumenParaApi(cotizacion, ubicaciones)
  const diagnostico = normalizarDiagnosticoParaApi(cotizacion, resumen)
  const columnas = normalizarColumnasParaApi(cotizacion.columnas, ubicaciones)

  return {
    nombreCampana: limpiarTextoParaApi(pickFirst(cotizacion.nombreCampana, ''), { maxLength: 255 }),
    cliente: limpiarTextoParaApi(pickFirst(cotizacion.cliente, ''), { maxLength: 255 }),
    nombreArchivo: limpiarTextoParaApi(pickFirst(cotizacion.nombreArchivo, ''), { maxLength: 255 }),
    nombreHoja: limpiarTextoParaApi(pickFirst(cotizacion.nombreHoja, ''), { maxLength: 255 }),
    notasInternas: limpiarTextoParaApi(pickFirst(cotizacion.notasInternas, ''), { maxLength: 4000 }),
    diagnostico,
    resumen,
    columnas,
    ubicaciones
  }
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

async function crearCotizacionPorLotes(serializedPayload = {}) {
  const { ubicaciones = [], ...metadata } = serializedPayload
  const inicioResponse = await apiClient.post('/cotizaciones_iniciar.php', metadata)
  const cotizacionId = extractCotizacionId(inicioResponse)

  if (!cotizacionId) {
    throw new Error('La API no devolvio un cotizacionId valido al iniciar la cotizacion.')
  }

  const lotes = dividirEnLotes(ubicaciones, TAMANO_LOTE_COTIZACION)
  const responsesLotes = []

  for (let loteIndice = 0; loteIndice < lotes.length; loteIndice += 1) {
    const pantallas = lotes[loteIndice]
    const loteActual = loteIndice + 1

    logCotizacionBatchProgress({
      cotizacionId,
      loteActual,
      totalLotes: lotes.length,
      pantallasEnLote: pantallas.length
    })

    const loteResponse = await apiClient.post('/pantallas_lote.php', {
      cotizacionId,
      loteIndice: loteActual,
      totalLotes: lotes.length,
      pantallas
    })

    validarRespuestaLote(loteResponse, {
      cotizacionId,
      loteActual,
      pantallasEsperadas: pantallas.length
    })

    responsesLotes.push(loteResponse)
  }

  const finalizacionResponse = await apiClient.post('/cotizaciones_finalizar.php', {
    cotizacionId
  })
  const cotizacion =
    finalizacionResponse?.cotizacion ||
    finalizacionResponse?.ubicaciones ||
    finalizacionResponse?.pantallas ||
    finalizacionResponse?.id
      ? normalizeCotizacionDetalle(finalizacionResponse)
      : null

  return {
    ok: finalizacionResponse?.ok ?? true,
    mensaje: finalizacionResponse?.mensaje || 'Cotizacion creada correctamente.',
    cotizacionId: extractCotizacionId(finalizacionResponse, cotizacion) || String(cotizacionId),
    cotizacion,
    raw: {
      inicio: inicioResponse,
      lotes: responsesLotes,
      finalizacion: finalizacionResponse
    }
  }
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
    const response = await apiClient.get(`/cotizacion.php?id=${encodeURIComponent(id)}&_ts=${Date.now()}`)
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
  const serializedPayload = normalizarPayloadCotizacionParaApi(payload)

  if (import.meta.env.DEV) {
    console.info('[DOOH Cotizacion Payload Debug]', buildCotizacionPayloadDebugInfo(serializedPayload))
  }

  if (AUTH_MOCK_ENABLED) {
    const cotizacion = normalizeCotizacionDetalle({
      cotizacion: {
        ...serializedPayload,
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

  return crearCotizacionPorLotes(serializedPayload)
}

export async function actualizarCotizacion(id, payload) {
  if (AUTH_MOCK_ENABLED) {
    const filasActuales = toArray(pickFirst(payload?.filasActuales, payload?.ubicaciones, []))
    const cotizacion = normalizeCotizacionDetalle({
      cotizacion: {
        ...(payload?.cotizacion || payload || {}),
        id,
        puedeEditar: true
      },
      ubicaciones: filasActuales
    })

    return {
      ok: true,
      mensaje: 'Cambios temporales guardados en modo mock.',
      cotizacionId: String(id),
      cotizacion
    }
  }

  return actualizarCotizacionPorCambios(id, payload)
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
