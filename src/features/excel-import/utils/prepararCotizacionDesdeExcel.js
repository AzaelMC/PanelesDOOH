import { calcularCentroCoordenadas } from '../../locations/utils/calcularCentroCoordenadas'
import { obtenerPuntoCardinal } from '../../locations/utils/puntoCardinal'
import { detectarColumnas } from './detectarColumnas'
import { detectarFilaEncabezados } from './detectarFilaEncabezados'
import { detectarHojaInventario } from './detectarHojaInventario'
import { mapearFilasAUbicaciones } from './mapearFilasAUbicaciones'

function crearIdTemporalCotizacion() {
  return `cot-temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function construirColumnasTratamiento() {
  return [
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
}

function compactarUbicacionTemporal(ubicacion = {}) {
  const ubicacionCompacta = { ...ubicacion }
  delete ubicacionCompacta.rawPayload
  return ubicacionCompacta
}

function construirAdvertencias({ hojaInfo, resumen, columnasDetectadas }) {
  const warnings = []

  if (hojaInfo.motivo !== 'coincidencia_exacta') {
    warnings.push(`Se utilizo la hoja "${hojaInfo.nombreHoja}" por criterio ${hojaInfo.motivo}.`)
  }

  if (!columnasDetectadas.city) {
    warnings.push('No se detecto la columna City o Site location.')
  }

  if (!columnasDetectadas.venueType) {
    warnings.push('No se detecto la columna Venue type.')
  }

  if (!columnasDetectadas.dimensions) {
    warnings.push('No se detecto la columna Dimension.')
  }

  if (!columnasDetectadas.impressions) {
    warnings.push('No se detecto la columna Impressions.')
  }

  if (resumen.filasInvalidas > 0) {
    warnings.push(`Se detectaron ${resumen.filasInvalidas} filas invalidas.`)
  }

  return warnings
}

function resolverErrorColumnas(columnasDetectadas) {
  if (!columnasDetectadas.latitude || !columnasDetectadas.longitude) {
    return 'No se detectaron columnas de latitud y longitud.'
  }

  if (!columnasDetectadas.screenName) {
    return 'No se detecto una columna confiable para Screen name.'
  }

  return 'No se detectaron columnas clave del inventario.'
}

export function prepararCotizacionDesdeExcel({
  archivoProcesado,
  nombreCampana,
  cliente
}) {
  const hojas = archivoProcesado?.hojas || []
  const hojaPreferida = archivoProcesado?.hojaPreferida
  const hojaInfo = hojaPreferida
    ? {
        hoja: hojas.find((hoja) => hoja.nombre === hojaPreferida) || null,
        nombreHoja: hojaPreferida,
        indiceHoja: hojas.findIndex((hoja) => hoja.nombre === hojaPreferida),
        motivo: 'seleccion_manual'
      }
    : detectarHojaInventario(hojas)

  if (!hojaInfo.hoja) {
    throw new Error('No se encontraron hojas con datos.')
  }

  const deteccionEncabezados = detectarFilaEncabezados(hojaInfo.hoja.filas)

  if (deteccionEncabezados.indiceFila === -1) {
    throw new Error('No se detecto una fila de encabezados confiable.')
  }

  const columnasDetectadas = detectarColumnas(deteccionEncabezados.encabezados)

  if (!columnasDetectadas.screenName || !columnasDetectadas.latitude || !columnasDetectadas.longitude) {
    throw new Error(resolverErrorColumnas(columnasDetectadas))
  }

  const mapeo = mapearFilasAUbicaciones({
    filas: hojaInfo.hoja.filas,
    indiceFilaEncabezados: deteccionEncabezados.indiceFila,
    columnasDetectadas,
    nombreCampana,
    cliente,
    nombreHoja: hojaInfo.nombreHoja
  })

  const centro = calcularCentroCoordenadas(mapeo.ubicaciones)

  const ubicaciones = mapeo.ubicaciones.map((ubicacion) => {
    const cardinalPoint = obtenerPuntoCardinal(
      ubicacion.latitude,
      ubicacion.longitude,
      centro.latitude,
      centro.longitude
    )

    return {
      ...ubicacion,
      id: ubicacion.idTemporal,
      status: ubicacion.isValid ? 'Lista' : 'Revisar',
      cardinalPoint
    }
  })

  const totalPantallasActivas = ubicaciones.filter((ubicacion) => ubicacion.is_active).length
  const cotizacionTemporal = {
    id: crearIdTemporalCotizacion(),
    nombreCampana,
    cliente,
    nombreArchivo: archivoProcesado.nombreArchivo,
    nombreHoja: hojaInfo.nombreHoja,
    fechaCreacion: new Date().toISOString(),
    estado: 'borrador',
    totalPantallas: ubicaciones.length,
    totalPantallasActivas,
    resumen: mapeo.resumen,
    columnas: construirColumnasTratamiento(),
    ubicaciones: ubicaciones.map(compactarUbicacionTemporal)
  }

  return {
    cotizacionTemporal,
    diagnostico: {
      hojaDetectada: hojaInfo.nombreHoja,
      motivoDeteccionHoja: hojaInfo.motivo,
      filaEncabezados: deteccionEncabezados.indiceFila,
      scoreEncabezados: deteccionEncabezados.score,
      columnasDetectadas,
      centro,
      advertencias: construirAdvertencias({
        hojaInfo,
        resumen: mapeo.resumen,
        columnasDetectadas
      })
    }
  }
}
