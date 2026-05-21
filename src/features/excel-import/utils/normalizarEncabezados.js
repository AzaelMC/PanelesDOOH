/**
 * Normaliza un encabezado de Excel a una llave estable.
 *
 * @param {unknown} valor
 * @returns {string}
 */
export function normalizarEncabezado(valor) {
  return String(valor ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[/\-()]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/[^\w]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function normalizarEncabezados(encabezados = []) {
  if (!Array.isArray(encabezados)) {
    return []
  }

  return encabezados.map(normalizarEncabezado)
}
