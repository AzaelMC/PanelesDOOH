import { useEffect, useMemo, useRef, useState } from 'react'
import Tarjeta from '../../../components/ui/Tarjeta'

const ESTADO_INICIAL = {
  cpmBase: '',
  rebate: '',
  extraRebate: '',
  ganancia: '',
  fased: '',
  incluirCpmTp: false,
  tarifaPublicada: '',
  cpmSeleccionado: 'cliente',
  valorCpmInversion: '',
  impresiones: '',
  divisor: '1000'
}

const INPUT_CLASSES =
  'w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500'

function parseDecimal(value) {
  if (value === null || value === undefined || value === '') {
    return 0
  }

  const parsed = Number(String(value).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

function formatFormulaNumber(value) {
  return new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: 4
  }).format(value)
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

export default function CalculosCpmInversion({ disabled = false }) {
  const [formData, setFormData] = useState(ESTADO_INICIAL)
  const [sincronizarValorCpm, setSincronizarValorCpm] = useState(true)
  const [copiedKey, setCopiedKey] = useState('')
  const copyTimeoutRef = useRef(null)

  const cpmCliente = useMemo(() => {
    const cpmBase = parseDecimal(formData.cpmBase)
    const porcentajeTotal =
      parseDecimal(formData.rebate) +
      parseDecimal(formData.extraRebate) +
      parseDecimal(formData.ganancia) +
      parseDecimal(formData.fased)

    return cpmBase * (1 + porcentajeTotal / 100)
  }, [formData.cpmBase, formData.rebate, formData.extraRebate, formData.ganancia, formData.fased])

  const cpmTp = useMemo(() => {
    const tarifaPublicada = parseDecimal(formData.tarifaPublicada)
    return cpmCliente * (1 + tarifaPublicada / 100)
  }, [cpmCliente, formData.tarifaPublicada])

  const cpmSugerido = formData.incluirCpmTp ? cpmTp : cpmCliente

  const inversionEstimada = useMemo(() => {
    const valorCpm = parseDecimal(formData.valorCpmInversion)
    const impresiones = parseDecimal(formData.impresiones)
    const divisor = parseDecimal(formData.divisor)

    if (divisor === 0) {
      return 0
    }

    return (valorCpm * impresiones) / divisor
  }, [formData.valorCpmInversion, formData.impresiones, formData.divisor])

  useEffect(() => () => {
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    setFormData((current) => {
      if (current.incluirCpmTp || current.cpmSeleccionado !== 'tp') {
        return current
      }

      return {
        ...current,
        cpmSeleccionado: 'cliente',
        valorCpmInversion: sincronizarValorCpm ? cpmCliente.toFixed(2) : current.valorCpmInversion
      }
    })
  }, [cpmCliente, sincronizarValorCpm])

  useEffect(() => {
    setFormData((current) => {
      if (!sincronizarValorCpm) {
        return current
      }

      const nextValue = current.cpmSeleccionado === 'tp' && current.incluirCpmTp
        ? cpmTp
        : cpmCliente

      return {
        ...current,
        valorCpmInversion: nextValue.toFixed(2)
      }
    })
  }, [cpmCliente, cpmTp, sincronizarValorCpm])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target

    if (name === 'valorCpmInversion') {
      setSincronizarValorCpm(false)
    }

    if (name === 'incluirCpmTp') {
      setSincronizarValorCpm(true)
      setFormData((current) => ({
        ...current,
        incluirCpmTp: checked,
        cpmSeleccionado: checked ? 'tp' : 'cliente',
        valorCpmInversion: checked ? cpmTp.toFixed(2) : cpmCliente.toFixed(2)
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
    const nextValue = selected === 'tp' ? cpmTp : cpmCliente

    setSincronizarValorCpm(true)
    setFormData((current) => ({
      ...current,
      cpmSeleccionado: selected,
      valorCpmInversion: nextValue.toFixed(2)
    }))
  }

  const handleCopy = async (key, value) => {
    if (disabled) {
      return
    }

    const rawValue = value.toFixed(2)

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
      <h3 className="text-lg font-semibold text-slate-950">CPM e inversión</h3>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="space-y-5 rounded-[24px] border border-slate-200 bg-white p-5">
          <h4 className="text-base font-semibold text-slate-950">CPM</h4>

          <div className="space-y-4">
            <NumericRow
              label="CPM base"
              name="cpmBase"
              value={formData.cpmBase}
              onChange={handleChange}
              placeholder="0.00"
              disabled={disabled}
            />
            <NumericRow
              label="Rebate %"
              name="rebate"
              value={formData.rebate}
              onChange={handleChange}
              placeholder="25"
              disabled={disabled}
            />
            <NumericRow
              label="Extra rebate %"
              name="extraRebate"
              value={formData.extraRebate}
              onChange={handleChange}
              placeholder="5"
              disabled={disabled}
            />
            <NumericRow
              label="Ganancia NTP %"
              name="ganancia"
              value={formData.ganancia}
              onChange={handleChange}
              placeholder="30"
              disabled={disabled}
            />
            <NumericRow
              label="FASED %"
              name="fased"
              value={formData.fased}
              onChange={handleChange}
              placeholder="4"
              disabled={disabled}
            />
          </div>

          <ResultadoCopiable
            id="cpmCliente"
            label="CPM Cliente"
            value={cpmCliente}
            copiedKey={copiedKey}
            onCopy={handleCopy}
            disabled={disabled}
          />

          <label className="flex items-center gap-3 text-sm text-slate-600">
            <input
              type="checkbox"
              name="incluirCpmTp"
              checked={formData.incluirCpmTp}
              onChange={handleChange}
              disabled={disabled}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200"
            />
            Agregar tarifa publicada
          </label>

          {formData.incluirCpmTp && (
            <div className="space-y-5">
              <NumericRow
                label="Tarifa publicada %"
                name="tarifaPublicada"
                value={formData.tarifaPublicada}
                onChange={handleChange}
                placeholder="0"
                disabled={disabled}
              />
              <ResultadoCopiable
                id="cpmTp"
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
                name="cpmSeleccionado"
                value={formData.cpmSeleccionado}
                onChange={handleSeleccionarCpm}
                disabled={disabled}
                className={INPUT_CLASSES}
              >
                <option value="cliente">CPM Cliente</option>
                {formData.incluirCpmTp && <option value="tp">CPM TP</option>}
              </select>
            </FieldRow>
            <NumericRow
              label="Valor CPM"
              name="valorCpmInversion"
              value={formData.valorCpmInversion}
              onChange={handleChange}
              placeholder={formatFormulaNumber(cpmSugerido)}
              disabled={disabled}
            />
            <NumericRow
              label="Impresiones"
              name="impresiones"
              value={formData.impresiones}
              onChange={handleChange}
              placeholder="0"
              disabled={disabled}
            />
            <NumericRow
              label="Divisor"
              name="divisor"
              value={formData.divisor}
              onChange={handleChange}
              placeholder="1000"
              disabled={disabled}
            />
          </div>

          <ResultadoCopiable
            id="inversionEstimada"
            label="Inversión estimada"
            value={inversionEstimada}
            copiedKey={copiedKey}
            onCopy={handleCopy}
            disabled={disabled}
          />

          <p className="text-xs text-slate-500">
            CPM × impresiones / {formatFormulaNumber(parseDecimal(formData.divisor) || 1000)}
          </p>
        </section>
      </div>
    </Tarjeta>
  )
}
