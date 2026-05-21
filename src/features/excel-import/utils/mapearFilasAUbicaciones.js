import { normalizarUbicacion } from '../../locations/utils/normalizarUbicacion'
import { validarCoordenadas } from '../../locations/utils/validarCoordenadas'
import { eliminarColumnaMaps } from '../../tratamiento/utils/eliminarColumnaMaps'
import { normalizarEncabezado } from './normalizarEncabezados'

function filaVacia(fila = []) {
  return !fila.some((cell) => String(cell ?? '').trim() !== '')
}

function crearIdTemporal(prefix = 'tmp') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function parsearNumero(valor) {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : null
  }

  const rawValue = String(valor ?? '').trim()

  if (!rawValue) {
    return null
  }

  const sanitized = rawValue.replace(/[^\d,.-]/g, '')

  if (!sanitized) {
    return null
  }

  let normalized = sanitized

  if (normalized.includes(',') && normalized.includes('.')) {
    normalized = normalized.lastIndexOf(',') > normalized.lastIndexOf('.')
      ? normalized.replace(/\./g, '').replace(',', '.')
      : normalized.replace(/,/g, '')
  } else if (normalized.includes(',') && !normalized.includes('.')) {
    normalized = /^-?\d{1,3}(,\d{3})+$/.test(normalized)
      ? normalized.replace(/,/g, '')
      : normalized.replace(',', '.')
  }

  const number = Number.parseFloat(normalized)
  return Number.isFinite(number) ? number : null
}

function construirEncabezadosUnicos(encabezados = []) {
  const tracker = new Map()

  return encabezados.map((encabezado, index) => {
    const limpio = String(encabezado ?? '').trim() || `Columna ${index + 1}`
    const total = tracker.get(limpio) || 0
    tracker.set(limpio, total + 1)
    return total === 0 ? limpio : `${limpio} (${total + 1})`
  })
}

function construirRawRows(filas = [], encabezados = []) {
  return filas.map((fila) =>
    Object.fromEntries(encabezados.map((encabezado, index) => [encabezado, fila[index] ?? '']))
  )
}

function compactarRawPayload(rawPayload = {}) {
  return Object.fromEntries(
    Object.entries(rawPayload).filter(([, value]) => String(value ?? '').trim() !== '')
  )
}

export function mapearFilasAUbicaciones({
  filas,
  indiceFilaEncabezados,
  columnasDetectadas,
  nombreCampana,
  cliente,
  nombreHoja
}) {
  if (!Array.isArray(filas) || indiceFilaEncabezados < 0 || !columnasDetectadas) {
    return {
      ubicaciones: [],
      ubicacionesValidas: [],
      ubicacionesInvalidas: [],
      columnasOriginales: [],
      columnasLimpias: [],
      resumen: {
        totalFilas: 0,
        filasProcesadas: 0,
        filasValidas: 0,
        filasInvalidas: 0,
        columnaMapsEliminada: false
      }
    }
  }

  const encabezadosCrudos = Array.isArray(filas[indiceFilaEncabezados])
    ? filas[indiceFilaEncabezados]
    : []

  const columnasOriginales = construirEncabezadosUnicos(encabezadosCrudos)
  const filasPosteriores = filas.slice(indiceFilaEncabezados + 1)
  const filasConContenido = filasPosteriores.filter((fila) => Array.isArray(fila) && !filaVacia(fila))
  const rawRows = construirRawRows(filasConContenido, columnasOriginales)

  const limpiezaMaps = eliminarColumnaMaps(
    columnasOriginales.map((encabezado) => ({
      key: normalizarEncabezado(encabezado),
      label: encabezado
    })),
    rawRows
  )

  const columnasLimpias = limpiezaMaps.columnasLimpias.map((columna) => columna.label || columna.key)

  const ubicaciones = limpiezaMaps.filasLimpias.map((rawPayloadOriginal) => {
    const rawPayload = compactarRawPayload(rawPayloadOriginal)
    const screenName = String(rawPayload[columnasDetectadas.screenName] ?? '').trim()
    const city = String(rawPayload[columnasDetectadas.city] ?? '').trim()
    const venueType = String(rawPayload[columnasDetectadas.venueType] ?? '').trim()
    const dimensions = String(rawPayload[columnasDetectadas.dimensions] ?? '').trim()
    const latitude = parsearNumero(rawPayload[columnasDetectadas.latitude])
    const longitude = parsearNumero(rawPayload[columnasDetectadas.longitude])
    const impressions = parsearNumero(rawPayload[columnasDetectadas.impressions]) ?? 0

    const errors = []

    if (!screenName) {
      errors.push('Falta Screen name')
    }

    if (latitude === null || longitude === null) {
      errors.push('Coordenadas incompletas')
    } else {
      const validacion = validarCoordenadas(latitude, longitude)

      if (!validacion.isValid) {
        errors.push(...validacion.errors)
      }
    }

    return normalizarUbicacion({
      idTemporal: crearIdTemporal('ubicacion'),
      campaignName: nombreCampana,
      cliente,
      sheetName: nombreHoja,
      screenName,
      city,
      venueType,
      latitude,
      longitude,
      dimensions,
      impressions,
      cardinalPoint: 'Sin definir',
      isValid: errors.length === 0,
      is_active: true,
      errors,
      rawPayload
    })
  })

  const ubicacionesValidas = ubicaciones.filter((ubicacion) => ubicacion.isValid)
  const ubicacionesInvalidas = ubicaciones.filter((ubicacion) => !ubicacion.isValid)

  return {
    ubicaciones,
    ubicacionesValidas,
    ubicacionesInvalidas,
    columnasOriginales,
    columnasLimpias,
    resumen: {
      totalFilas: filasPosteriores.length,
      filasProcesadas: filasConContenido.length,
      filasValidas: ubicacionesValidas.length,
      filasInvalidas: ubicacionesInvalidas.length,
      columnaMapsEliminada: limpiezaMaps.columnaEliminada
    }
  }
}
