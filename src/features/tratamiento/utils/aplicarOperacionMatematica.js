function roundValue(value) {
  return Number(value.toFixed(2))
}

function resolveOperation(baseValue, numericValue, operation) {
  switch (operation) {
    case 'suma':
      return baseValue + numericValue
    case 'resta':
      return baseValue - numericValue
    case 'multiplicacion':
      return baseValue * numericValue
    case 'division':
      return numericValue === 0 ? null : baseValue / numericValue
    case 'porcentaje':
      return baseValue * (numericValue / 100)
    default:
      return null
  }
}

export function aplicarOperacionMatematica({
  filas,
  columnaOrigen,
  operacion,
  valor,
  columnaResultado,
  aplicarInactivas = false
}) {
  if (!Array.isArray(filas) || !columnaOrigen || !columnaResultado) {
    return Array.isArray(filas) ? filas : []
  }

  const numericValue = Number(valor)

  if (!Number.isFinite(numericValue)) {
    return filas
  }

  return filas.map((fila) => {
    if (!fila.is_active && !aplicarInactivas) {
      return fila
    }

    const sourceValue = Number(fila[columnaOrigen])

    if (!Number.isFinite(sourceValue)) {
      return fila
    }

    const result = resolveOperation(sourceValue, numericValue, operacion)

    if (!Number.isFinite(result)) {
      return fila
    }

    return {
      ...fila,
      [columnaResultado]: roundValue(result)
    }
  })
}
