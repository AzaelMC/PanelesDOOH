export function normalizarFechaManual(value = '') {
  const fecha = String(value ?? '').trim()
  const match = fecha.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)

  if (!match) {
    return fecha
  }

  const [, dia, mes, anio] = match

  return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${anio}`
}
