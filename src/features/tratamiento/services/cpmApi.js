import apiClient from '../../../services/apiClient'
import { calcularCpmInversion, parseNumeroOpcional } from '../utils/calcularCpmInversion'

export const CPM_ESTADO_INICIAL = {
  cpm_base: '',
  rebate: '',
  extra_rebate: '',
  margen: '',
  fased: '',
  usar_tp: false,
  tp: '',
  cpm_fuente: 'cliente',
  valor_cpm: '',
  impresiones: '',
  divisor: '1000'
}

const CAMPOS_NUMERICOS_OPCIONALES = [
  'cpm_base',
  'rebate',
  'extra_rebate',
  'margen',
  'fased',
  'tp',
  'valor_cpm',
  'impresiones'
]

function numeroAInput(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return ''
  }

  return String(valor)
}

function normalizarBooleano(valor) {
  return valor === true || valor === 1 || valor === '1' || valor === 'true'
}

function normalizarFuente(valor) {
  return ['cliente', 'tp', 'manual'].includes(valor) ? valor : 'cliente'
}

export function mapearCpmApiAEstado(cpm) {
  if (!cpm) {
    return { ...CPM_ESTADO_INICIAL }
  }

  return {
    cpm_base: numeroAInput(cpm.cpm_base),
    rebate: numeroAInput(cpm.rebate),
    extra_rebate: numeroAInput(cpm.extra_rebate),
    margen: numeroAInput(cpm.margen),
    fased: numeroAInput(cpm.fased),
    usar_tp: normalizarBooleano(cpm.usar_tp),
    tp: numeroAInput(cpm.tp),
    cpm_fuente: normalizarFuente(cpm.cpm_fuente),
    valor_cpm: numeroAInput(cpm.valor_cpm),
    impresiones: numeroAInput(cpm.impresiones),
    divisor: numeroAInput(cpm.divisor) || '1000'
  }
}

export function construirPayloadCpm(cotizacionId, estado) {
  const datosBase = {
    cotizacion_id: Number(cotizacionId),
    cpm_base: estado.cpm_base,
    rebate: estado.rebate,
    extra_rebate: estado.extra_rebate,
    margen: estado.margen,
    fased: estado.fased,
    usar_tp: Boolean(estado.usar_tp),
    tp: estado.usar_tp ? estado.tp : null,
    cpm_fuente: normalizarFuente(estado.cpm_fuente),
    valor_cpm: estado.valor_cpm,
    impresiones: estado.impresiones,
    divisor: estado.divisor === '' || estado.divisor === null || estado.divisor === undefined
      ? 1000
      : estado.divisor
  }

  if (!datosBase.usar_tp && datosBase.cpm_fuente === 'tp') {
    datosBase.cpm_fuente = 'cliente'
  }

  const calculos = calcularCpmInversion(datosBase)
  const payload = {
    ...datosBase,
    ...calculos
  }

  CAMPOS_NUMERICOS_OPCIONALES.forEach((campo) => {
    payload[campo] = parseNumeroOpcional(payload[campo])
  })

  payload.divisor = parseNumeroOpcional(payload.divisor) ?? 1000
  payload.usar_tp = Boolean(payload.usar_tp)

  if (!payload.usar_tp) {
    payload.tp = null
    payload.cpm_tp = null
  }

  return payload
}

export async function obtenerCpmCotizacion(cotizacionId) {
  const response = await apiClient.get(`/cpm.php?cotizacion_id=${encodeURIComponent(cotizacionId)}`)
  return response?.cpm ?? null
}

export async function guardarCpmCotizacion(datosCpm) {
  const response = await apiClient.post('/cpm.php', datosCpm)
  return response?.cpm ?? null
}
