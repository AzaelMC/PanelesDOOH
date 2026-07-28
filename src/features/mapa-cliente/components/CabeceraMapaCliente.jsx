import { useMemo, useState } from 'react'
import Boton from '../../../components/ui/Boton'
import EtiquetaEstado from '../../../components/ui/EtiquetaEstado'
import Tarjeta from '../../../components/ui/Tarjeta'
import {
  obtenerStatusEstadoPropuesta,
  obtenerTextoEstadoPropuesta
} from '../../cotizaciones/utils/estadoPropuesta'

const EMPTY_TEXT_VALUES = new Set(['undefined', 'null', 'nan', 'invalid date'])

function tieneValor(value) {
  if (value === undefined || value === null) {
    return false
  }

  if (typeof value === 'number') {
    return Number.isFinite(value)
  }

  const textValue = String(value).trim()

  if (!textValue) {
    return false
  }

  return !EMPTY_TEXT_VALUES.has(textValue.toLowerCase())
}

function pickFirst(...values) {
  return values.find((value) => tieneValor(value))
}

function toNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value !== 'string' || !tieneValor(value)) {
    return null
  }

  const normalized = value.trim().replace(/\s+/g, '').replace(/\$/g, '').replace(/,/g, '')
  const parsed = Number(normalized)

  return Number.isFinite(parsed) ? parsed : null
}

function normalizarBooleano(value) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value !== 0
  }

  if (typeof value === 'string') {
    return ['1', 'true', 'si', 'sí', 'yes'].includes(value.trim().toLowerCase())
  }

  return false
}

function esCpmValido(value) {
  const number = toNumber(value)
  return number !== null && number > 0
}

function resolverTarifas(cpm = {}) {
  const tarifas = cpm?.tarifas && typeof cpm.tarifas === 'object'
    ? cpm.tarifas
    : {}
  const ach = [
    tarifas?.ach,
    cpm?.cpm_cliente,
    cpm?.cpmCliente
  ].find(esCpmValido) ?? null
  const publicadaBase = [
    tarifas?.publicada,
    cpm?.cpm_tp,
    cpm?.cpmTp
  ].find(esCpmValido) ?? null
  const usarTp = normalizarBooleano(pickFirst(cpm?.usar_tp, cpm?.usarTp, false))

  return {
    ach,
    publicada: usarTp ? publicadaBase : null
  }
}

function formatearMoneda(value) {
  const number = toNumber(value)

  if (number === null) {
    return ''
  }

  return number.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function formatearNumero(value) {
  const number = toNumber(value)

  if (number === null) {
    return ''
  }

  return number.toLocaleString('es-MX', {
    maximumFractionDigits: 4
  })
}

function formatearFecha(value) {
  if (!tieneValor(value)) {
    return ''
  }

  const textValue = String(value).trim()

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(textValue)) {
    return textValue
  }

  const parsed = new Date(textValue)

  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(parsed)
}

function limpiarCampos(campos = []) {
  return campos.filter((campo) => tieneValor(campo.value))
}

function construirCampos({ cotizacion = {}, cpm = {}, pantallas = [], regiones = [] }) {
  const presupuesto = pickFirst(
    cpm?.presupuesto_cliente,
    cpm?.presupuestoCliente,
    cotizacion?.presupuestoCliente,
    cotizacion?.presupuesto_cliente
  )
  const tarifas = resolverTarifas(cpm)
  const impresiones = pickFirst(
    cpm?.impresionesEstimadas,
    cpm?.impresiones_estimadas,
    cotizacion?.impresionesEstimadas,
    cotizacion?.impresiones_estimadas
  )
  const pantallasValor = pickFirst(
    cotizacion?.pantallasActivas,
    cotizacion?.pantallas_activas,
    cotizacion?.totalPantallasActivas,
    cotizacion?.total_pantallas_activas,
    cotizacion?.totalPantallas,
    cotizacion?.total_pantallas,
    pantallas.length
  )
  const regionesTexto = Array.isArray(regiones) && regiones.length > 0 ? regiones.join(', ') : ''

  return {
    principales: limpiarCampos([
      { label: 'Cliente', value: pickFirst(cotizacion?.cliente, cotizacion?.nombreCliente, cotizacion?.nombre_cliente) },
      { label: 'Presupuesto', value: formatearMoneda(presupuesto) },
      { label: 'CPM (Tarifa ACH)', value: formatearMoneda(tarifas.ach) },
      { label: 'CPM (Tarifa Publicada)', value: formatearMoneda(tarifas.publicada) },
      { label: 'Impresiones', value: formatearNumero(impresiones) },
      { label: 'Pantallas', value: formatearNumero(pantallasValor) },
      { label: 'Regiones', value: regionesTexto }
    ]),
    secundarios: limpiarCampos([
      { label: 'Inicio', value: formatearFecha(pickFirst(cotizacion?.fechaInicio, cotizacion?.fecha_inicio)) },
      { label: 'Fin', value: formatearFecha(pickFirst(cotizacion?.fechaTermino, cotizacion?.fecha_termino)) },
      { label: 'Formato', value: 'DOOH' },
      { label: 'Tipo de compra', value: pickFirst(cotizacion?.tipoCompra, cotizacion?.tipo_compra) }
    ])
  }
}

function ListaCampos({ campos, accionFinal = null }) {
  if (!campos.length) {
    return null
  }

  return (
    <dl className="space-y-3 text-sm">
      {campos.map((campo, index) => {
        const mostrarAccion = accionFinal && index === campos.length - 1

        return (
          <div
            key={campo.label}
            className={`grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)] ${mostrarAccion ? 'sm:items-center' : 'sm:items-start'}`}
          >
            <dt className="font-semibold leading-6 text-slate-500">
              {campo.label}:
            </dt>
            <dd className="min-w-0 font-medium leading-6 text-slate-950">
              {mostrarAccion ? (
                <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                  <span className="min-w-0 leading-6">{campo.value}</span>
                  {accionFinal}
                </div>
              ) : (
                campo.value
              )}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

export default function CabeceraMapaCliente({
  cotizacion,
  cpm,
  pantallas,
  regiones,
  mostrarEstadoPropuesta = false
}) {
  const [expandida, setExpandida] = useState(false)
  const nombreCampana = pickFirst(cotizacion?.nombreCampana, cotizacion?.nombre_campana, 'Cotización sin nombre')
  const estadoPropuesta = pickFirst(cotizacion?.estadoPropuesta, cotizacion?.estado_propuesta, 'en_revision')
  const campos = construirCampos({ cotizacion, cpm, pantallas, regiones })

  const camposVisibles = useMemo(() => {
    if (expandida) {
      return campos
    }

    return {
      principales: campos.principales.slice(0, 2),
      secundarios: campos.secundarios.slice(0, 2)
    }
  }, [campos, expandida])

  const tieneCamposOcultos = campos.principales.length > 2 || campos.secundarios.length > 2

  const botonExpansion = tieneCamposOcultos ? (
    <Boton
      type="button"
      variant="brandSecondary"
      size="sm"
      onClick={() => setExpandida((current) => !current)}
    >
      {expandida ? 'Ver menos' : 'Ver más'}
    </Boton>
  ) : null

  return (
    <Tarjeta className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {nombreCampana}
        </h2>

        {mostrarEstadoPropuesta && (
          <div className="flex flex-wrap justify-end gap-2">
            <EtiquetaEstado status={obtenerStatusEstadoPropuesta(estadoPropuesta)}>
              {obtenerTextoEstadoPropuesta(estadoPropuesta)}
            </EtiquetaEstado>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)]">
        <ListaCampos campos={camposVisibles.principales} />
        <ListaCampos
          campos={camposVisibles.secundarios}
          accionFinal={botonExpansion}
        />
      </div>
    </Tarjeta>
  )
}
