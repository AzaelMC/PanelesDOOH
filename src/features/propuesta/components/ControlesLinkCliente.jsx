import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Boton from '../../../components/ui/Boton'
import Tarjeta from '../../../components/ui/Tarjeta'
import {
  consultarLinkPublico,
  generarLinkPublico,
  revocarLinkPublico
} from '../services/linksPublicosApi'

function CopyIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="8" y="7" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function obtenerEstadoLink(link) {
  if (!link) {
    return 'Sin liga'
  }

  if (link.revocado) {
    return 'Revocada'
  }

  if (link.expirado) {
    return 'Expirada'
  }

  if (link.vigente) {
    return 'Vigente'
  }

  return 'Sin liga'
}

export default function ControlesLinkCliente({ cotizacionId }) {
  const [link, setLink] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [ligaCopiada, setLigaCopiada] = useState(false)
  const copiarTimeoutRef = useRef(null)

  const cargarLink = useCallback(async () => {
    if (!cotizacionId) {
      setLink(null)
      setCargando(false)
      return
    }

    setCargando(true)
    setError('')

    try {
      const estado = await consultarLinkPublico(cotizacionId)
      setLink(estado)
    } catch (loadError) {
      setError(loadError.message || 'No se pudo cargar')
    } finally {
      setCargando(false)
    }
  }, [cotizacionId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      cargarLink()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [cargarLink])

  useEffect(() => () => {
    if (copiarTimeoutRef.current) {
      window.clearTimeout(copiarTimeoutRef.current)
    }
  }, [])

  const estado = useMemo(() => obtenerEstadoLink(link), [link])

  const generar = async () => {
    setProcesando(true)
    setError('')
    setMensaje('')
    setLigaCopiada(false)

    try {
      const siguienteLink = await generarLinkPublico(cotizacionId)
      setLink(siguienteLink)
      setMensaje(siguienteLink?.urlPublica ? 'Liga generada' : 'Liga renovada')
    } catch (saveError) {
      setError(saveError.message || 'No se pudo guardar')
    } finally {
      setProcesando(false)
    }
  }

  const revocar = async () => {
    setProcesando(true)
    setError('')
    setMensaje('')
    setLigaCopiada(false)

    try {
      const siguienteLink = await revocarLinkPublico(cotizacionId)
      setLink(siguienteLink)
      setMensaje('Liga revocada')
    } catch (saveError) {
      setError(saveError.message || 'No se pudo guardar')
    } finally {
      setProcesando(false)
    }
  }

  const copiar = async () => {
    if (!link?.urlPublica) {
      return
    }

    try {
      await navigator.clipboard.writeText(link.urlPublica)
      setMensaje('Liga copiada')
      setLigaCopiada(true)

      if (copiarTimeoutRef.current) {
        window.clearTimeout(copiarTimeoutRef.current)
      }

      copiarTimeoutRef.current = window.setTimeout(() => {
        setLigaCopiada(false)
      }, 1600)
    } catch {
      setError('No se pudo copiar')
    }
  }

  return (
    <Tarjeta className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Liga pública</h3>
          <p className="mt-1 text-sm font-medium text-slate-500">{cargando ? 'Cargando' : estado}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Boton variant="brand" onClick={generar} loading={procesando || cargando} disabled={!cotizacionId}>
            {link ? 'Renovar liga' : 'Generar liga'}
          </Boton>

          {link && !link.revocado && (
            <Boton variant="danger" onClick={revocar} loading={procesando}>
              Revocar liga
            </Boton>
          )}
        </div>
      </div>

      {link?.urlPublica && (
        <div className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center">
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{link.urlPublica}</p>
          <Boton variant="brandSecondary" size="sm" onClick={copiar} className="gap-2">
            {ligaCopiada ? <CheckIcon /> : <CopyIcon />}
            Copiar liga
          </Boton>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {mensaje}
        </div>
      )}
    </Tarjeta>
  )
}
