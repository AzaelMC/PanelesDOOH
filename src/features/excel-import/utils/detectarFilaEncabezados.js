import { detectarColumnas } from './detectarColumnas'

function filaVacia(fila = []) {
  return !fila.some((cell) => String(cell ?? '').trim() !== '')
}

function esFilaTituloGeneral(encabezados = [], columnasDetectadas = {}) {
  const celdasConTexto = encabezados.filter(Boolean)

  if (celdasConTexto.length <= 1) {
    return true
  }

  const coincidencias = Object.values(columnasDetectadas).filter(Boolean).length
  const promedioLongitud = celdasConTexto.reduce((total, celda) => total + celda.length, 0) / celdasConTexto.length

  return coincidencias <= 1 && promedioLongitud > 24
}

function puntuarFila(encabezados = [], columnasDetectadas = {}) {
  let score = 0
  const celdasConTexto = encabezados.filter((header) => header.trim() !== '')
  const coincidencias = Object.values(columnasDetectadas).filter(Boolean).length

  if (columnasDetectadas.latitude) {
    score += 12
  }

  if (columnasDetectadas.longitude) {
    score += 12
  }

  if (columnasDetectadas.latitude && columnasDetectadas.longitude) {
    score += 10
  }

  if (columnasDetectadas.screenName) {
    score += 8
  }

  if (columnasDetectadas.city) {
    score += 5
  }

  if (columnasDetectadas.venueType) {
    score += 4
  }

  if (columnasDetectadas.dimensions) {
    score += 3
  }

  if (columnasDetectadas.impressions) {
    score += 4
  }

  if (columnasDetectadas.maps) {
    score += 1
  }

  if (celdasConTexto.length >= 5 && celdasConTexto.length <= 20) {
    score += 2
  }

  if (coincidencias >= 4) {
    score += 2
  }

  if (coincidencias <= 1) {
    score -= 4
  }

  if (esFilaTituloGeneral(encabezados, columnasDetectadas)) {
    score -= 8
  }

  return score
}

export function detectarFilaEncabezados(filas = []) {
  const limite = Math.min(filas.length, 50)
  let mejor = {
    indiceFila: -1,
    encabezados: [],
    score: 0
  }

  for (let index = 0; index < limite; index += 1) {
    const fila = Array.isArray(filas[index]) ? filas[index] : []

    if (filaVacia(fila)) {
      continue
    }

    const encabezados = fila.map((cell) => String(cell ?? '').trim())
    const celdasConTexto = encabezados.filter(Boolean)

    if (celdasConTexto.length < 2) {
      continue
    }

    const columnasDetectadas = detectarColumnas(encabezados)
    const score = puntuarFila(encabezados, columnasDetectadas)

    if (score > mejor.score) {
      mejor = {
        indiceFila: index,
        encabezados,
        score
      }
    }
  }

  if (mejor.score < 12) {
    return {
      indiceFila: -1,
      encabezados: [],
      score: 0
    }
  }

  return mejor
}
