import { detectarColumnas } from './detectarColumnas'
import { detectarFilaEncabezados } from './detectarFilaEncabezados'
import { normalizarEncabezado } from './normalizarEncabezados'

function tieneContenido(filas = []) {
  return Array.isArray(filas) && filas.some(
    (fila) => Array.isArray(fila) && fila.some((celda) => String(celda ?? '').trim() !== '')
  )
}

function evaluarNombreHoja(nombreHoja = '') {
  const normalizado = normalizarEncabezado(nombreHoja)
  const esInventoryScreensNormalizado = normalizado === 'inventory_screens'
  const esScreens = normalizado === 'screens' || normalizado.startsWith('screens_')
  const esInventory = normalizado === 'inventory' || normalizado.startsWith('inventory_')
  const esPantallas = normalizado === 'pantallas' || normalizado.startsWith('pantallas_')
  const esInventario = normalizado === 'inventario' || normalizado.startsWith('inventario_')

  let score = 0

  if (esInventoryScreensNormalizado) {
    score = 95
  } else if (esScreens) {
    score = 78
  } else if (esPantallas) {
    score = 74
  } else if (esInventory || esInventario) {
    score = 62
  } else if (normalizado.includes('inventory') && normalizado.includes('screen')) {
    score = 72
  } else if (normalizado.includes('screen') || normalizado.includes('pantalla')) {
    score = 42
  } else if (normalizado.includes('inventory') || normalizado.includes('inventario')) {
    score = 34
  }

  return {
    normalizado,
    esInventoryScreensNormalizado,
    esScreens,
    esInventory,
    esPantallas,
    esInventario,
    score
  }
}

export function detectarHojaInventario(hojas = []) {
  if (!Array.isArray(hojas) || hojas.length === 0) {
    return {
      hoja: null,
      nombreHoja: '',
      indiceHoja: -1,
      motivo: 'sin_hojas'
    }
  }

  const exacta = hojas.findIndex((hoja) => hoja?.nombre?.trim() === 'Inventory - Screens')

  if (exacta !== -1) {
    return {
      hoja: hojas[exacta],
      nombreHoja: hojas[exacta].nombre,
      indiceHoja: exacta,
      motivo: 'coincidencia_exacta'
    }
  }

  const normalizada = hojas.findIndex(
    (hoja) => normalizarEncabezado(hoja?.nombre || '') === 'inventory_screens'
  )

  if (normalizada !== -1) {
    return {
      hoja: hojas[normalizada],
      nombreHoja: hojas[normalizada].nombre,
      indiceHoja: normalizada,
      motivo: 'coincidencia_normalizada'
    }
  }

  const evaluaciones = hojas.map((hoja, indiceHoja) => {
    const filas = Array.isArray(hoja?.filas) ? hoja.filas : []
    const deteccionEncabezados = detectarFilaEncabezados(filas)
    const columnasDetectadas = detectarColumnas(deteccionEncabezados.encabezados || [])
    const nombre = evaluarNombreHoja(hoja?.nombre || '')
    const tieneColumnasClave = Boolean(
      columnasDetectadas.screenName &&
      columnasDetectadas.latitude &&
      columnasDetectadas.longitude
    )

    let scoreTotal = nombre.score + deteccionEncabezados.score

    if (tieneColumnasClave) {
      scoreTotal += 14
    }

    if (nombre.esScreens && tieneColumnasClave) {
      scoreTotal += 12
    }

    if ((nombre.esInventory || nombre.esInventario) && tieneColumnasClave) {
      scoreTotal += 6
    }

    return {
      hoja,
      indiceHoja,
      nombreHoja: hoja?.nombre || `Hoja ${indiceHoja + 1}`,
      deteccionEncabezados,
      columnasDetectadas,
      tieneColumnasClave,
      tieneDatos: tieneContenido(filas),
      nombre,
      scoreTotal
    }
  })

  const evaluacionesConDatos = evaluaciones.filter((evaluacion) => evaluacion.tieneDatos)

  if (!evaluacionesConDatos.length) {
    return {
      hoja: null,
      nombreHoja: '',
      indiceHoja: -1,
      motivo: 'sin_hojas_con_datos'
    }
  }

  const mejor = evaluacionesConDatos.reduce((currentBest, evaluation) => {
    if (!currentBest || evaluation.scoreTotal > currentBest.scoreTotal) {
      return evaluation
    }

    return currentBest
  }, null)

  let motivo = 'primera_hoja_con_datos'

  if (mejor.nombre.esScreens && mejor.tieneColumnasClave) {
    motivo = 'screens_priorizada'
  } else if (mejor.nombre.score >= 60) {
    motivo = 'variante_preferida'
  } else if (mejor.deteccionEncabezados.score > 0) {
    motivo = 'mejor_score_encabezados'
  }

  return {
    hoja: mejor.hoja,
    nombreHoja: mejor.nombreHoja,
    indiceHoja: mejor.indiceHoja,
    motivo
  }
}
