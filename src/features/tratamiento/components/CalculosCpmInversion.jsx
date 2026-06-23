import { useEffect, useMemo, useRef, useState } from 'react'
import Tarjeta from '../../../components/ui/Tarjeta'
import {
  CPM_ESTADO_INICIAL,
  construirPayloadCpm,
  guardarCpmCotizacion,
  mapearCpmApiAEstado,
  obtenerCpmCotizacion
} from '../services/cpmApi'
import { calcularCpmInversion, parseNumeroOpcional } from '../utils/calcularCpmInversion'

const INPUT_CLASSES =
  'w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500'

const AUTOSAVE_DELAY_MS = 800

function formatCurrency(value) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0

  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(safeValue)
}

function formatFormulaNumber(value) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0

  return new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: 4
  }).format(safeValue)
}

function formatInputNumber(value, decimals = 2) {
  if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) {
    return ''
  }

  return Number(value).toFixed(decimals)
}

function CopyIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="8"
        y="7"
        width="10"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M6 14H5.5C4.67 14 4 13.33 4 12.5V5.5C4 4.67 4.67 4 5.5 4H12.5C13.33 4 14 4.67 14 5.5V6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CheckIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6.5 12.3L10.2 16L17.8 8.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FieldRow({ label, children }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(130px,1fr)_minmax(180px,1.25fr)] sm:items-center">
      <label className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  )
}

function NumericRow({ label, name, value, onChange, placeholder, disabled = false }) {
  return (
    <FieldRow label={label}>
      <input
        name={name}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={INPUT_CLASSES}
      />
    </FieldRow>
  )
}

function ResultadoCopiable({ id, label, value, copiedKey, onCopy, disabled = false }) {
  const formattedValue = formatCurrency(value)
  const copied = copiedKey === id

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950 px-5 py-5 text-white shadow-[0_18px_32px_-24px_rgba(15,23,42,0.75)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {formattedValue}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onCopy(id, value)}
          disabled={disabled}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-sm transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Copiar ${label}`}
          title={`Copiar ${label}`}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
    </div>
  )
}

export default function CalculosCpmInversion({ cotizacionId, disabled = false }) {
  const [formData, setFormData] = useState(CPM_ESTADO_INICIAL)
  const [cpmInicialCargado, setCpmInicialCargado] = useState(false)
  const [errorCpm, setErrorCpm] = useState('')
  const [copiedKey, setCopiedKey] = useState('')

  const copyTimeoutRef = useRef(null)
  const autosaveTimeoutRef = useRef(null)
  const ultimoPayloadPersistidoRef = useRef('')
  const usuarioModificoCpmRef = useRef(false)

  const calculos = useMemo(
    () => calcularCpmInversion(formData),
    [formData]
  )

  const cpmCliente = calculos.cpm_cliente ?? 0
  const cpmTp = calculos.cpm_tp ?? 0
  const inversionEstimada = calculos.inversion ?? 0
  const valorCpmCalculado = calculos.valor_cpm ?? 0
  const divisorFormula = parseNumeroOpcional(formData.divisor) || 1000
  const valorCpmInput = formData.cpm_fuente === 'manual'
    ? formData.valor_cpm
    : formatInputNumber(calculos.valor_cpm)

  useEffect(() => () => {
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current)
    }

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function cargarCpm() {
      if (!cotizacionId) {
        setFormData({ ...CPM_ESTADO_INICIAL })
        setCpmInicialCargado(true)
        return
      }

      setCpmInicialCargado(false)
      setErrorCpm('')
      usuarioModificoCpmRef.current = false
      ultimoPayloadPersistidoRef.current = ''

      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current)
      }

      try {
        const registro = await obtenerCpmCotizacion(cotizacionId)

        if (!active) {
          return
        }

        const siguienteEstado = mapearCpmApiAEstado(registro)
        setFormData(siguienteEstado)
        ultimoPayloadPersistidoRef.current = JSON.stringify(
          construirPayloadCpm(cotizacionId, siguienteEstado)
        )
      } catch (loadError) {
        if (!active) {
          return
        }

        setFormData({ ...CPM_ESTADO_INICIAL })
        setErrorCpm(loadError.message || 'No fue posible cargar CPM e inversion.')
      } finally {
        if (active) {
          setCpmInicialCargado(true)
        }
      }
    }

    cargarCpm()

    return () => {
      active = false
    }
  }, [cotizacionId])

  useEffect(() => {
    if (!cpmInicialCargado || disabled || !cotizacionId || !usuarioModificoCpmRef.current) {
      return undefined
    }

    const payload = construirPayloadCpm(cotizacionId, formData)
    const payloadSerializado = JSON.stringify(payload)

    if (payloadSerializado === ultimoPayloadPersistidoRef.current) {
      return undefined
    }

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current)
    }

    autosaveTimeoutRef.current = setTimeout(async () => {
      try {
        const registroGuardado = await guardarCpmCotizacion(payload)
        const estadoPersistido = mapearCpmApiAEstado(registroGuardado)

        ultimoPayloadPersistidoRef.current = JSON.stringify(
          construirPayloadCpm(cotizacionId, estadoPersistido)
        )
        setErrorCpm('')
      } catch (saveError) {
        setErrorCpm(saveError.message || 'No fue posible guardar CPM e inversion.')
      }
    }, AUTOSAVE_DELAY_MS)

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current)
      }
    }
  }, [cotizacionId, cpmInicialCargado, disabled, formData])

  const marcarCambioUsuario = () => {
    usuarioModificoCpmRef.current = true
    setErrorCpm('')
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target

    marcarCambioUsuario()

    if (name === 'usar_tp') {
      setFormData((current) => ({
        ...current,
        usar_tp: checked,
        tp: checked ? current.tp : '',
        cpm_fuente: !checked && current.cpm_fuente === 'tp' ? 'cliente' : current.cpm_fuente
      }))
      return
    }

    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSeleccionarCpm = (event) => {
    const selected = event.target.value

    marcarCambioUsuario()

    setFormData((current) => ({
      ...current,
      cpm_fuente: selected,
      valor_cpm: selected === 'manual' && current.valor_cpm === ''
        ? formatInputNumber(valorCpmCalculado)
        : current.valor_cpm
    }))
  }

  const handleCopy = async (key, value) => {
    if (disabled) {
      return
    }

    const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0
    const rawValue = safeValue.toFixed(2)

    try {
      await navigator.clipboard.writeText(rawValue)
    } catch {
      const tempInput = document.createElement('input')
      tempInput.value = rawValue
      document.body.appendChild(tempInput)
      tempInput.select()
      document.execCommand('copy')
      document.body.removeChild(tempInput)
    }

    setCopiedKey(key)

    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current)
    }

    copyTimeoutRef.current = setTimeout(() => {
      setCopiedKey('')
    }, 1600)
  }

  return (
    <Tarjeta className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-950">CPM e inversión</h3>
        {errorCpm && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorCpm}
          </div>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="space-y-5 rounded-[24px] border border-slate-200 bg-white p-5">
          <h4 className="text-base font-semibold text-slate-950">CPM</h4>

          <div className="space-y-4">
            <NumericRow
              label="CPM base"
              name="cpm_base"
              value={formData.cpm_base}
              onChange={handleChange}
              placeholder="0.00"
              disabled={disabled || !cpmInicialCargado}
            />
            <NumericRow
              label="Rebate %"
              name="rebate"
              value={formData.rebate}
              onChange={handleChange}
              placeholder="25"
              disabled={disabled || !cpmInicialCargado}
            />
            <NumericRow
              label="Extra rebate %"
              name="extra_rebate"
              value={formData.extra_rebate}
              onChange={handleChange}
              placeholder="5"
              disabled={disabled || !cpmInicialCargado}
            />
            <NumericRow
              label="Margen NTP %"
              name="margen"
              value={formData.margen}
              onChange={handleChange}
              placeholder="30"
              disabled={disabled || !cpmInicialCargado}
            />
            <NumericRow
              label="FASED %"
              name="fased"
              value={formData.fased}
              onChange={handleChange}
              placeholder="4"
              disabled={disabled || !cpmInicialCargado}
            />
          </div>

          <ResultadoCopiable
            id="cpm_cliente"
            label="CPM Cliente"
            value={cpmCliente}
            copiedKey={copiedKey}
            onCopy={handleCopy}
            disabled={disabled}
          />

          <label className="flex items-center gap-3 text-sm text-slate-600">
            <input
              type="checkbox"
              name="usar_tp"
              checked={formData.usar_tp}
              onChange={handleChange}
              disabled={disabled || !cpmInicialCargado}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200"
            />
            Agregar tarifa publicada
          </label>

          {formData.usar_tp && (
            <div className="space-y-5">
              <NumericRow
                label="Tarifa publicada %"
                name="tp"
                value={formData.tp}
                onChange={handleChange}
                placeholder="0"
                disabled={disabled || !cpmInicialCargado}
              />
              <ResultadoCopiable
                id="cpm_tp"
                label="CPM TP"
                value={cpmTp}
                copiedKey={copiedKey}
                onCopy={handleCopy}
                disabled={disabled}
              />
            </div>
          )}
        </section>

        <section className="space-y-5 rounded-[24px] border border-slate-200 bg-white p-5">
          <h4 className="text-base font-semibold text-slate-950">Inversión</h4>

          <div className="space-y-4">
            <FieldRow label="CPM a utilizar">
              <select
                name="cpm_fuente"
                value={formData.cpm_fuente}
                onChange={handleSeleccionarCpm}
                disabled={disabled || !cpmInicialCargado}
                className={INPUT_CLASSES}
              >
                <option value="cliente">CPM Cliente</option>
                {formData.usar_tp && <option value="tp">CPM TP</option>}
                <option value="manual">Manual</option>
              </select>
            </FieldRow>
            <NumericRow
              label="Valor CPM"
              name="valor_cpm"
              value={valorCpmInput}
              onChange={handleChange}
              placeholder={formatFormulaNumber(valorCpmCalculado)}
              disabled={disabled || !cpmInicialCargado || formData.cpm_fuente !== 'manual'}
            />
            <NumericRow
              label="Impresiones"
              name="impresiones"
              value={formData.impresiones}
              onChange={handleChange}
              placeholder="0"
              disabled={disabled || !cpmInicialCargado}
            />
            <NumericRow
              label="Divisor"
              name="divisor"
              value={formData.divisor}
              onChange={handleChange}
              placeholder="1000"
              disabled={disabled || !cpmInicialCargado}
            />
          </div>

          <ResultadoCopiable
            id="inversion"
            label="Inversión estimada"
            value={inversionEstimada}
            copiedKey={copiedKey}
            onCopy={handleCopy}
            disabled={disabled}
          />

          <p className="text-xs text-slate-500">
            CPM × impresiones / {formatFormulaNumber(divisorFormula)}
          </p>
        </section>
      </div>
    </Tarjeta>
  )
}
