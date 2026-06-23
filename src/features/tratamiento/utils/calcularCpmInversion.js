const DECIMALES_RESULTADO = 4

export function parseNumeroOpcional(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return null
  }

  const normalizado = typeof valor === 'string' ? valor.replace(',', '.') : valor
  const numero = Number(normalizado)

  return Number.isFinite(numero) ? numero : null
}

export function redondearNumero(valor, decimales = DECIMALES_RESULTADO) {
  if (!Number.isFinite(valor)) {
    return null
  }

  const factor = 10 ** decimales
  return Math.round((valor + Number.EPSILON) * factor) / factor
}

function porcentajeParaCalculo(valor) {
  return parseNumeroOpcional(valor) ?? 0
}

export function calcularCpmInversion(datos = {}) {
  const cpmBase = parseNumeroOpcional(datos.cpm_base)
  const rebate = porcentajeParaCalculo(datos.rebate)
  const extraRebate = porcentajeParaCalculo(datos.extra_rebate)
  const margen = porcentajeParaCalculo(datos.margen)
  const fased = porcentajeParaCalculo(datos.fased)
  const usarTp = Boolean(datos.usar_tp)
  const tp = parseNumeroOpcional(datos.tp)
  const divisor = parseNumeroOpcional(datos.divisor)
  const impresiones = parseNumeroOpcional(datos.impresiones)

  const total = redondearNumero(rebate + extraRebate + margen + fased)
  const cpmCliente = cpmBase !== null && total !== null && total < 100
    ? redondearNumero(cpmBase / (1 - total / 100))
    : null

  const cpmTp = usarTp && tp !== null && tp < 100 && cpmCliente !== null
    ? redondearNumero(cpmCliente / (1 - tp / 100))
    : null

  let valorCpm = null

  if (datos.cpm_fuente === 'tp') {
    valorCpm = cpmTp
  } else if (datos.cpm_fuente === 'manual') {
    valorCpm = parseNumeroOpcional(datos.valor_cpm)
  } else {
    valorCpm = cpmCliente
  }

  const inversion = valorCpm !== null && impresiones !== null && divisor !== null && divisor > 0
    ? redondearNumero((valorCpm * impresiones) / divisor)
    : null

  return {
    total,
    cpm_cliente: cpmCliente,
    cpm_tp: cpmTp,
    valor_cpm: valorCpm,
    inversion
  }
}
