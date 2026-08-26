import apiClient from '../../../services/apiClient'
import { calcularCpmInversion, parseNumeroOpcional } from '../utils/calcularCpmInversion'

export const CPM_ESTADO_INICIAL = {
  presupuesto_cliente: '',
  cpm_base: '',
  rebate: '',
  extra_rebate: '',
  margen: '',
  fased: '',
  tarifa_cliente: '',
  usar_tp: false,
  tp: '',
  cpm_fuente: 'cliente',
  valor_cpm: '',
  divisor: '1000',
  impresiones_estimadas: ''
}

const CAMPOS_NUMERICOS_OPCIONALES = [
  'presupuesto_cliente',
  'cpm_base',
  'rebate',
  'extra_rebate',
  'margen',
  'fased',
  'total',
  'cpm_cliente',
  'tp',
  'cpm_tp',
  'valor_cpm',
  'divisor',
  'impresiones_estimadas'
]

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '')
}

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

function normalizarTarifaCliente(valor) {
  return ['ach', 'pepsico'].includes(valor) ? valor : ''
}

function extraerCpmDesdeRespuesta(response) {
  const cpm = response?.cpm ?? null
  const presupuestoCliente = pickFirst(
    cpm?.presupuesto_cliente,
    response?.cotizacion?.presupuesto_cliente,
    response?.resumen_estado?.presupuesto_cliente
  )

  if (!cpm && presupuestoCliente === undefined) {
    return null
  }

  return {
    ...(cpm || {}),
    presupuesto_cliente: presupuestoCliente ?? null
  }
}

export function mapearCpmApiAEstado(cpm, { presupuestoClienteInicial = '' } = {}) {
  if (!cpm) {
    return {
      ...CPM_ESTADO_INICIAL,
      presupuesto_cliente: numeroAInput(presupuestoClienteInicial)
    }
  }

  return {
    presupuesto_cliente: numeroAInput(pickFirst(cpm.presupuesto_cliente, presupuestoClienteInicial)),
    cpm_base: numeroAInput(cpm.cpm_base),
    rebate: numeroAInput(cpm.rebate),
    extra_rebate: numeroAInput(cpm.extra_rebate),
    margen: numeroAInput(cpm.margen),
    fased: numeroAInput(cpm.fased),
    tarifa_cliente: normalizarTarifaCliente(pickFirst(cpm.tarifa_cliente, cpm.tarifaCliente, '')),
    usar_tp: normalizarBooleano(cpm.usar_tp),
    tp: numeroAInput(cpm.tp),
    cpm_fuente: normalizarFuente(cpm.cpm_fuente),
    valor_cpm: numeroAInput(cpm.valor_cpm),
    divisor: numeroAInput(cpm.divisor) || '1000',
    impresiones_estimadas: numeroAInput(cpm.impresiones_estimadas)
  }
}

export function construirPayloadCpm(cotizacionId, estado) {
  const datosBase = {
    cotizacion_id: Number(cotizacionId),
    presupuesto_cliente: estado.presupuesto_cliente,
    cpm_base: estado.cpm_base,
    rebate: estado.rebate,
    extra_rebate: estado.extra_rebate,
    margen: estado.margen,
    fased: estado.fased,
    tarifa_cliente: normalizarTarifaCliente(estado.tarifa_cliente) || null,
    usar_tp: Boolean(estado.usar_tp),
    tp: estado.usar_tp ? estado.tp : null,
    cpm_fuente: normalizarFuente(estado.cpm_fuente),
    valor_cpm: estado.valor_cpm,
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
  return extraerCpmDesdeRespuesta(response)
}

export async function guardarCpmCotizacion(datosCpm) {
  const response = await apiClient.post('/cpm.php', datosCpm)
  return extraerCpmDesdeRespuesta(response)
}
