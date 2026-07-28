import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { obtenerAlertasChat } from '../services/alertasChatApi'
import { emitirAlertasChat, escucharChatAbierto, escucharChatLeido } from '../utils/eventosChat'

const POLLING_ALERTAS_MS = 30000
const DURACION_ALERTA_MS = 8000

function obtenerIdAlerta(alerta = {}) {
  return String(alerta.id || `${alerta.cotizacionId || alerta.cotizacion_id}-${alerta.fechaCreacion || alerta.fecha_creacion}`)
}

function limpiarMensaje(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

export default function AlertasChat() {
  const navigate = useNavigate()
  const [alertas, setAlertas] = useState([])
  const [alertasOcultasCiclo, setAlertasOcultasCiclo] = useState(() => new Set())
  const [alertasPausadas, setAlertasPausadas] = useState(() => new Set())
  const [chatsAbiertos, setChatsAbiertos] = useState(() => new Set())

  useEffect(() => {
    let active = true

    async function cargarAlertas() {
      try {
        const nextAlertas = await obtenerAlertasChat()

        if (active) {
          setAlertas(nextAlertas)
          setAlertasOcultasCiclo(new Set())
          emitirAlertasChat(nextAlertas)
        }
      } catch {
        if (active) {
          setAlertas([])
          emitirAlertasChat([])
        }
      }
    }

    const timeoutId = window.setTimeout(() => {
      cargarAlertas()
    }, 0)

    const intervalId = window.setInterval(() => {
      cargarAlertas()
    }, POLLING_ALERTAS_MS)

    return () => {
      active = false
      window.clearTimeout(timeoutId)
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    const limpiarChatAbierto = escucharChatAbierto(({ cotizacionId, abierto }) => {
      if (!cotizacionId) {
        return
      }

      setChatsAbiertos((current) => {
        const next = new Set(current)

        if (abierto) {
          next.add(String(cotizacionId))
        } else {
          next.delete(String(cotizacionId))
        }

        return next
      })
    })

    const limpiarChatLeido = escucharChatLeido(({ cotizacionId }) => {
      if (!cotizacionId) {
        return
      }

      setAlertas((current) => {
        const nextAlertas = current.filter((alerta) => String(alerta.cotizacionId || alerta.cotizacion_id) !== String(cotizacionId))
        emitirAlertasChat(nextAlertas)
        return nextAlertas
      })
    })

    return () => {
      limpiarChatAbierto()
      limpiarChatLeido()
    }
  }, [])

  const alertasVisibles = useMemo(() => {
    return alertas
      .filter((alerta) => {
        const cotizacionId = String(alerta.cotizacionId || alerta.cotizacion_id || '')
        return !alertasOcultasCiclo.has(obtenerIdAlerta(alerta)) && !chatsAbiertos.has(cotizacionId)
      })
      .slice(0, 3)
  }, [alertas, alertasOcultasCiclo, chatsAbiertos])

  useEffect(() => {
    if (alertasVisibles.length === 0) {
      return undefined
    }

    const ids = alertasVisibles
      .map(obtenerIdAlerta)
      .filter((id) => !alertasPausadas.has(id))

    if (ids.length === 0) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setAlertasOcultasCiclo((current) => {
        const next = new Set(current)
        ids.forEach((id) => next.add(id))
        return next
      })
    }, DURACION_ALERTA_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [alertasPausadas, alertasVisibles])

  if (alertasVisibles.length === 0 || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div className="pointer-events-none fixed right-5 top-28 z-[90] flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-3 sm:right-8">
      {alertasVisibles.map((alerta) => {
        const alertaId = obtenerIdAlerta(alerta)
        const cotizacionId = alerta.cotizacionId || alerta.cotizacion_id
        const nombreCampana = alerta.nombreCampana || alerta.nombre_campana || 'Cotización'
        const mensaje = limpiarMensaje(alerta.mensajeResumen || alerta.mensaje_resumen || alerta.mensaje)

        return (
          <button
            key={alertaId}
            type="button"
            className="pointer-events-auto rounded-[26px] border border-white/80 bg-white/96 p-4 text-left shadow-[0_24px_70px_-36px_rgba(39,11,43,0.78)] backdrop-blur-[18px] transition hover:-translate-y-0.5 hover:bg-white"
            onMouseEnter={() => {
              setAlertasPausadas((current) => {
                const next = new Set(current)
                next.add(alertaId)
                return next
              })
            }}
            onMouseLeave={() => {
              setAlertasPausadas((current) => {
                const next = new Set(current)
                next.delete(alertaId)
                return next
              })
            }}
            onClick={() => {
              setAlertasOcultasCiclo((current) => {
                const next = new Set(current)
                next.add(alertaId)
                return next
              })

              if (cotizacionId) {
                navigate(`/cotizaciones/${cotizacionId}/mapa`)
              }
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9E6DF7]">
              Mensaje nuevo
            </p>
            <p className="mt-1 text-sm font-bold text-slate-950">
              {nombreCampana}
            </p>
            {mensaje && (
              <p className="mt-2 line-clamp-3 text-sm leading-5 text-slate-600">
                {mensaje}
              </p>
            )}
          </button>
        )
      })}
    </div>,
    document.body
  )
}
