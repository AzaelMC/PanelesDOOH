import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Boton from '../../../components/ui/Boton'
import { normalizarEstadoPropuesta } from '../../cotizaciones/utils/estadoPropuesta'
import {
  aceptarPropuestaPublica,
  enviarMensajePublico,
  obtenerChatPublico
} from '../services/chatPublicoApi'
import {
  enviarMensajeInterno,
  obtenerChatInterno
} from '../services/chatInternoApi'
import { emitirChatAbierto, emitirChatLeido } from '../utils/eventosChat'

const POLLING_ABIERTO_MS = 5000
const POLLING_CERRADO_PUBLICO_MS = 30000
const DURACION_NOTIFICACION_MS = 8000
const TEXTAREA_MAX_HEIGHT = 112
const SCROLL_BOTTOM_THRESHOLD = 72
const SCROLL_TOP_HISTORY_THRESHOLD = 48
const LIMITE_MENSAJES = 100

function formatearHora(value) {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsed)
}

function obtenerIdMensaje(mensaje = {}) {
  return Number(mensaje.id || mensaje.chatId || 0)
}

function normalizarMensajes(mensajes = []) {
  if (!Array.isArray(mensajes)) {
    return []
  }

  return [...mensajes]
    .filter((mensaje) => mensaje && typeof mensaje === 'object')
    .sort((a, b) => obtenerIdMensaje(a) - obtenerIdMensaje(b))
}

function combinarMensajes(actuales = [], entrantes = []) {
  const mensajesPorId = new Map()
  const mensajesSinId = []

  normalizarMensajes(actuales).forEach((mensaje) => {
    const id = obtenerIdMensaje(mensaje)

    if (id > 0) {
      mensajesPorId.set(id, mensaje)
    } else {
      mensajesSinId.push(mensaje)
    }
  })

  normalizarMensajes(entrantes).forEach((mensaje) => {
    const id = obtenerIdMensaje(mensaje)

    if (id > 0) {
      mensajesPorId.set(id, {
        ...(mensajesPorId.get(id) || {}),
        ...mensaje
      })
    } else {
      mensajesSinId.push(mensaje)
    }
  })

  return [
    ...Array.from(mensajesPorId.values()).sort((a, b) => obtenerIdMensaje(a) - obtenerIdMensaje(b)),
    ...mensajesSinId
  ]
}

function obtenerPrimerIdMensajes(mensajes = []) {
  return mensajes.reduce((primerId, mensaje) => {
    const id = obtenerIdMensaje(mensaje)

    if (id <= 0) {
      return primerId
    }

    return primerId === 0 ? id : Math.min(primerId, id)
  }, 0)
}

function obtenerUltimoIdMensajes(mensajes = []) {
  return mensajes.reduce((ultimoId, mensaje) => Math.max(ultimoId, obtenerIdMensaje(mensaje)), 0)
}

function obtenerPrimerMensajeIdPayload(payload = {}) {
  return Number(payload.primerMensajeId || payload.primer_mensaje_id || 0)
}

function obtenerUltimoMensajeIdPayload(payload = {}) {
  return Number(payload.ultimoMensajeId || payload.ultimo_mensaje_id || 0)
}

function tieneMensajesAnterioresPayload(payload = {}) {
  return Boolean(payload.hayMensajesAnteriores || payload.hay_mensajes_anteriores)
}

function obtenerCursorLecturaPropio(payload = {}, origenPropio = 'cliente') {
  if (origenPropio === 'cliente') {
    return Number(
      payload.ultimoMensajeClienteLeidoPorInternoId ||
      payload.ultimo_mensaje_cliente_leido_por_interno_id ||
      0
    )
  }

  return Number(
    payload.ultimoMensajeInternoLeidoPorClienteId ||
    payload.ultimo_mensaje_interno_leido_por_cliente_id ||
    0
  )
}

function aplicarCursorLectura(mensajes = [], cursorLectura = 0, origenPropio = 'cliente') {
  if (cursorLectura <= 0) {
    return mensajes
  }

  return mensajes.map((mensaje) => {
    const id = obtenerIdMensaje(mensaje)

    if (mensaje.origen !== origenPropio || id <= 0 || id > cursorLectura) {
      return mensaje
    }

    if (origenPropio === 'cliente') {
      if (mensaje.leidoInterno || mensaje.leido_interno) {
        return mensaje
      }

      return {
        ...mensaje,
        leidoInterno: true,
        leido_interno: true
      }
    }

    if (mensaje.leidoCliente || mensaje.leido_cliente) {
      return mensaje
    }

    return {
      ...mensaje,
      leidoCliente: true,
      leido_cliente: true
    }
  })
}

function estaCercaDelFinal(element) {
  if (!element) {
    return true
  }

  return element.scrollHeight - element.scrollTop - element.clientHeight <= SCROLL_BOTTOM_THRESHOLD
}

function limpiarMensajeAlerta(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function obtenerIdAlertaPublica(payload = {}) {
  const alerta = payload.alerta || payload.ultimoMensaje || payload.ultimo_mensaje || payload

  return String(
    alerta.id ||
    alerta.chatId ||
    alerta.chat_id ||
    payload.ultimoMensajeInternoId ||
    payload.ultimo_mensaje_interno_id ||
    alerta.fechaCreacion ||
    alerta.fecha_creacion ||
    alerta.mensajeResumen ||
    alerta.mensaje_resumen ||
    alerta.mensaje ||
    'respuesta-nueva'
  )
}

function obtenerResumenAlertaPublica(payload = {}) {
  const alerta = payload.alerta || payload.ultimoMensaje || payload.ultimo_mensaje || payload

  return limpiarMensajeAlerta(
    alerta.mensajeResumen ||
    alerta.mensaje_resumen ||
    alerta.mensaje ||
    payload.mensajeResumen ||
    payload.mensaje_resumen ||
    ''
  )
}

function esMensajeLeidoPorReceptor(mensaje = {}, origenPropio = 'cliente') {
  if (mensaje.origen !== origenPropio) {
    return false
  }

  if (origenPropio === 'cliente') {
    return Boolean(mensaje.leidoInterno || mensaje.leido_interno)
  }

  if (origenPropio === 'interno') {
    return Boolean(mensaje.leidoCliente || mensaje.leido_cliente)
  }

  return false
}

function obtenerClaseBurbuja(mensaje = {}, origenPropio = 'cliente', destacado = false) {
  const resaltado = destacado ? ' ring-2 ring-[#9E6DF7]/25 animate-pulse' : ''

  if (mensaje.tipo === 'evento') {
    return `mx-auto max-w-[75%] rounded-full border border-[#bfa4ff] bg-[#f1eaff] px-4 py-2 text-center text-xs font-semibold text-[#411189] shadow-[0_14px_34px_-24px_rgba(65,17,137,0.6)]${resaltado}`
  }

  if (mensaje.origen === origenPropio) {
    return `ml-auto max-w-[82%] rounded-[24px] rounded-br-md bg-[#9E6DF7] px-4 py-3 text-sm text-white shadow-[0_18px_40px_-24px_rgba(65,17,137,0.7)]${resaltado}`
  }

  return `mr-auto max-w-[82%] rounded-[24px] rounded-bl-md border border-[#aebed3] bg-white px-4 py-3 text-sm text-slate-800 shadow-[0_18px_44px_-28px_rgba(15,23,42,0.52)]${resaltado}`
}

function obtenerClaseMeta(mensaje = {}, origenPropio = 'cliente') {
  return mensaje.origen === origenPropio ? 'text-white/72' : 'text-slate-500'
}

function obtenerTextoBoton({ abierto, modo, tieneMensajeNuevo, tieneRespuestaNueva }) {
  if (abierto) {
    return 'Cerrar'
  }

  if (modo === 'interno' && tieneMensajeNuevo) {
    return 'Mensaje nuevo'
  }

  if (modo === 'publico' && tieneRespuestaNueva) {
    return 'Mensaje nuevo'
  }

  return 'Chat'
}

function IconoEnviar() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12h13M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconoAbajo() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function ChatPropuesta({
  modo = 'publico',
  token = '',
  cotizacionId,
  nombreCampana = '',
  estadoPropuesta = 'en_revision',
  tieneMensajeNuevo = false,
  onEstadoAceptado,
  onMensajesLeidos
}) {
  const esPublico = modo === 'publico'
  const origenPropio = esPublico ? 'cliente' : 'interno'
  const contextoChat = esPublico
    ? `publico:${String(token || '').trim()}`
    : `interno:${Number(cotizacionId) || 0}`
  const [abierto, setAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [aceptando, setAceptando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [mensajes, setMensajes] = useState([])
  const [estadoActual, setEstadoActual] = useState(normalizarEstadoPropuesta(estadoPropuesta))
  const [respuestaNueva, setRespuestaNueva] = useState(false)
  const [mensajeNuevoInterno, setMensajeNuevoInterno] = useState(Boolean(tieneMensajeNuevo))
  const [mostrarPillNuevo, setMostrarPillNuevo] = useState(false)
  const [mostrarBajarFinal, setMostrarBajarFinal] = useState(false)
  const [mensajeDestacadoId, setMensajeDestacadoId] = useState(null)
  const [notificacionPublica, setNotificacionPublica] = useState(null)
  const [notificacionPublicaPausada, setNotificacionPublicaPausada] = useState(false)
  const mensajesRef = useRef(null)
  const textareaRef = useRef(null)
  const primerMensajeIdRef = useRef(0)
  const ultimoMensajeIdRef = useRef(0)
  const hayMensajesAnterioresRef = useRef(false)
  const cargadoInicialRef = useRef(false)
  const cargaInicialEnCursoRef = useRef(false)
  const consultaIncrementalEnCursoRef = useRef(false)
  const cargaAnterioresEnCursoRef = useRef(false)
  const usuarioEnFinalRef = useRef(true)
  const scrollPendienteRef = useRef(null)
  const historialAnclaRef = useRef(null)
  const timeoutDestacadoRef = useRef(null)
  const contextoChatRef = useRef(contextoChat)

  const propuestaAceptada = estadoActual === 'aceptada'
  const titulo = esPublico ? 'Conversación' : 'Chat'
  const subtitulo = nombreCampana
  const tieneAlertaBoton = esPublico ? respuestaNueva : mensajeNuevoInterno
  const textoBoton = obtenerTextoBoton({
    abierto,
    modo,
    tieneMensajeNuevo: mensajeNuevoInterno,
    tieneRespuestaNueva: respuestaNueva
  })

  const actualizarCursoresMensajes = useCallback((siguientesMensajes = []) => {
    primerMensajeIdRef.current = obtenerPrimerIdMensajes(siguientesMensajes)
    ultimoMensajeIdRef.current = obtenerUltimoIdMensajes(siguientesMensajes)
  }, [])

  const aplicarEstadoLectura = useCallback((siguientesMensajes = [], payload = {}) => {
    const cursorLectura = obtenerCursorLecturaPropio(payload, origenPropio)
    return aplicarCursorLectura(siguientesMensajes, cursorLectura, origenPropio)
  }, [origenPropio])

  const aplicarMetadatosPayload = useCallback((payload = {}) => {
    if (payload?.estadoPropuesta || payload?.estado_propuesta) {
      setEstadoActual(normalizarEstadoPropuesta(payload.estadoPropuesta || payload.estado_propuesta))
    }
  }, [])

  const confirmarMensajesLeidos = useCallback(() => {
    if (esPublico) {
      setRespuestaNueva(false)
      setNotificacionPublica(null)
      return
    }

    setMensajeNuevoInterno(false)
    emitirChatLeido(cotizacionId)

    if (typeof onMensajesLeidos === 'function') {
      onMensajesLeidos()
    }
  }, [cotizacionId, esPublico, onMensajesLeidos])

  const destacarMensajeTemporalmente = useCallback((mensajeId) => {
    if (!mensajeId) {
      return
    }

    setMensajeDestacadoId(mensajeId)

    if (timeoutDestacadoRef.current) {
      window.clearTimeout(timeoutDestacadoRef.current)
    }

    timeoutDestacadoRef.current = window.setTimeout(() => {
      setMensajeDestacadoId(null)
      timeoutDestacadoRef.current = null
    }, 1200)
  }, [])

  const irAlFinal = useCallback((behavior = 'smooth') => {
    const element = mensajesRef.current

    if (!element) {
      return
    }

    if (behavior === 'auto') {
      element.scrollTop = element.scrollHeight
    } else {
      element.scrollTo({
        top: element.scrollHeight,
        behavior
      })
    }

    usuarioEnFinalRef.current = true
    setMostrarPillNuevo(false)
    setMostrarBajarFinal(false)
  }, [])

  const obtenerChat = useCallback((opciones = {}) => {
    return esPublico
      ? obtenerChatPublico(token, opciones)
      : obtenerChatInterno(cotizacionId, opciones)
  }, [cotizacionId, esPublico, token])

  const integrarCargaInicial = useCallback((payload = {}) => {
    const normalizados = aplicarEstadoLectura(normalizarMensajes(payload?.mensajes || []), payload)
    const primerIdPayload = obtenerPrimerMensajeIdPayload(payload)
    const ultimoIdPayload = obtenerUltimoMensajeIdPayload(payload)
    const primerId = primerIdPayload > 0 ? primerIdPayload : obtenerPrimerIdMensajes(normalizados)
    const ultimoId = ultimoIdPayload > 0 ? ultimoIdPayload : obtenerUltimoIdMensajes(normalizados)
    const hayAnteriores = tieneMensajesAnterioresPayload(payload)

    primerMensajeIdRef.current = primerId
    ultimoMensajeIdRef.current = ultimoId
    hayMensajesAnterioresRef.current = hayAnteriores
    cargadoInicialRef.current = true
    scrollPendienteRef.current = 'auto'
    usuarioEnFinalRef.current = true

    setMensajes(normalizados)
    setMostrarPillNuevo(false)
    setMostrarBajarFinal(false)
  }, [aplicarEstadoLectura])

  const integrarMensajesPosteriores = useCallback((payload = {}, { forzarScrollFinal = false } = {}) => {
    const entrantes = normalizarMensajes(payload?.mensajes || [])
    const ultimoIdAnterior = ultimoMensajeIdRef.current
    const estabaEnFinal = usuarioEnFinalRef.current || estaCercaDelFinal(mensajesRef.current)
    const mensajesNuevos = entrantes.filter((item) => obtenerIdMensaje(item) > ultimoIdAnterior)
    const mensajesNuevosPropios = mensajesNuevos.filter((item) => item.origen === origenPropio && item.tipo !== 'evento')
    const mensajesNuevosRecibidos = mensajesNuevos.filter((item) => item.origen !== origenPropio && item.tipo !== 'evento')
    const ultimoMensajeRecibido = mensajesNuevosRecibidos[mensajesNuevosRecibidos.length - 1]

    setMensajes((actuales) => {
      const combinados = combinarMensajes(actuales, entrantes)
      const conLectura = aplicarEstadoLectura(combinados, payload)
      actualizarCursoresMensajes(conLectura)
      return conLectura
    })

    if (forzarScrollFinal || mensajesNuevosPropios.length > 0 || (mensajesNuevosRecibidos.length > 0 && estabaEnFinal)) {
      scrollPendienteRef.current = 'smooth'
      setMostrarPillNuevo(false)
      setMostrarBajarFinal(false)

      if (ultimoMensajeRecibido) {
        destacarMensajeTemporalmente(obtenerIdMensaje(ultimoMensajeRecibido))
      }
      return
    }

    if (mensajesNuevosRecibidos.length > 0) {
      setMostrarPillNuevo(true)
      setMostrarBajarFinal(true)
    }
  }, [actualizarCursoresMensajes, aplicarEstadoLectura, destacarMensajeTemporalmente, origenPropio])

  const integrarMensajesAnteriores = useCallback((payload = {}) => {
    const entrantes = normalizarMensajes(payload?.mensajes || [])
    const hayAnteriores = tieneMensajesAnterioresPayload(payload)

    setMensajes((actuales) => {
      const combinados = combinarMensajes(entrantes, actuales)
      const conLectura = aplicarEstadoLectura(combinados, payload)
      actualizarCursoresMensajes(conLectura)
      return conLectura
    })

    hayMensajesAnterioresRef.current = hayAnteriores
  }, [actualizarCursoresMensajes, aplicarEstadoLectura])

  const cargarMensajesIniciales = useCallback(async () => {
    if (cargaInicialEnCursoRef.current) {
      return
    }

    if (!esPublico && (!cotizacionId || Number(cotizacionId) <= 0)) {
      return
    }

    if (esPublico && !String(token || '').trim()) {
      return
    }

    const contextoSolicitud = contextoChatRef.current
    cargaInicialEnCursoRef.current = true
    setCargando(true)
    setError('')

    try {
      const payload = await obtenerChat({
        marcarLeidos: true,
        limite: LIMITE_MENSAJES
      })

      if (contextoSolicitud !== contextoChatRef.current) {
        return
      }

      integrarCargaInicial(payload)
      aplicarMetadatosPayload(payload)
      confirmarMensajesLeidos()
    } catch (loadError) {
      if (contextoSolicitud === contextoChatRef.current) {
        setError(loadError.message || 'No se pudo cargar')
      }
    } finally {
      if (contextoSolicitud === contextoChatRef.current) {
        setCargando(false)
      }
      cargaInicialEnCursoRef.current = false
    }
  }, [aplicarMetadatosPayload, confirmarMensajesLeidos, cotizacionId, esPublico, integrarCargaInicial, obtenerChat, token])

  const cargarMensajesNuevos = useCallback(async ({ forzarScrollFinal = false } = {}) => {
    if (!cargadoInicialRef.current || consultaIncrementalEnCursoRef.current) {
      return
    }

    const contextoSolicitud = contextoChatRef.current
    const despuesId = ultimoMensajeIdRef.current
    consultaIncrementalEnCursoRef.current = true

    try {
      const payload = await obtenerChat({
        marcarLeidos: true,
        despuesId,
        limite: LIMITE_MENSAJES
      })

      if (contextoSolicitud !== contextoChatRef.current) {
        return
      }

      integrarMensajesPosteriores(payload, { forzarScrollFinal })
      aplicarMetadatosPayload(payload)
      confirmarMensajesLeidos()
    } catch (loadError) {
      if (contextoSolicitud === contextoChatRef.current) {
        setError(loadError.message || 'No se pudo cargar')
      }
    } finally {
      consultaIncrementalEnCursoRef.current = false
    }
  }, [aplicarMetadatosPayload, confirmarMensajesLeidos, integrarMensajesPosteriores, obtenerChat])

  const cargarMensajesAnteriores = useCallback(async () => {
    if (
      !abierto ||
      !cargadoInicialRef.current ||
      cargaAnterioresEnCursoRef.current ||
      !hayMensajesAnterioresRef.current ||
      primerMensajeIdRef.current <= 0
    ) {
      return
    }

    const element = mensajesRef.current
    const primerIdActual = primerMensajeIdRef.current
    const ancla = element?.querySelector(`[data-chat-id="${primerIdActual}"]`)

    historialAnclaRef.current = ancla && element
      ? {
          id: primerIdActual,
          posicionVisual: ancla.offsetTop - element.scrollTop
        }
      : null

    const contextoSolicitud = contextoChatRef.current
    cargaAnterioresEnCursoRef.current = true

    try {
      const payload = await obtenerChat({
        marcarLeidos: true,
        antesId: primerIdActual,
        limite: LIMITE_MENSAJES
      })

      if (contextoSolicitud !== contextoChatRef.current) {
        return
      }

      integrarMensajesAnteriores(payload)
      aplicarMetadatosPayload(payload)
      confirmarMensajesLeidos()
    } catch (loadError) {
      historialAnclaRef.current = null

      if (contextoSolicitud === contextoChatRef.current) {
        setError(loadError.message || 'No se pudo cargar')
      }
    } finally {
      cargaAnterioresEnCursoRef.current = false
    }
  }, [abierto, aplicarMetadatosPayload, confirmarMensajesLeidos, integrarMensajesAnteriores, obtenerChat])

  const consultarAlertaPublica = useCallback(async () => {
    if (!esPublico || abierto || !String(token || '').trim()) {
      return
    }

    try {
      const payload = await obtenerChatPublico(token, { alerta: true })
      const tieneNuevaRespuesta = Boolean(payload?.tieneRespuestaNueva || payload?.tiene_respuesta_nueva)
      setRespuestaNueva(tieneNuevaRespuesta)

      if (payload?.estadoPropuesta || payload?.estado_propuesta) {
        setEstadoActual(normalizarEstadoPropuesta(payload.estadoPropuesta || payload.estado_propuesta))
      }

      if (!tieneNuevaRespuesta) {
        setNotificacionPublica(null)
        return
      }

      const alertaId = obtenerIdAlertaPublica(payload)

      setNotificacionPublica({
        id: alertaId,
        titulo: 'Mensaje nuevo',
        mensaje: obtenerResumenAlertaPublica(payload)
      })
      setNotificacionPublicaPausada(false)
    } catch {
      // La vista publica no debe romperse por una consulta pasiva.
    }
  }, [abierto, esPublico, token])

  useEffect(() => {
    setEstadoActual(normalizarEstadoPropuesta(estadoPropuesta))
  }, [estadoPropuesta])

  useEffect(() => {
    setMensajeNuevoInterno(Boolean(tieneMensajeNuevo))
  }, [tieneMensajeNuevo])

  useEffect(() => {
    contextoChatRef.current = contextoChat
    primerMensajeIdRef.current = 0
    ultimoMensajeIdRef.current = 0
    hayMensajesAnterioresRef.current = false
    cargadoInicialRef.current = false
    cargaInicialEnCursoRef.current = false
    consultaIncrementalEnCursoRef.current = false
    cargaAnterioresEnCursoRef.current = false
    historialAnclaRef.current = null
    scrollPendienteRef.current = null
    usuarioEnFinalRef.current = true

    setMensajes([])
    setMostrarPillNuevo(false)
    setMostrarBajarFinal(false)
    setMensajeDestacadoId(null)
    setError('')
  }, [contextoChat])

  useEffect(() => {
    return () => {
      if (timeoutDestacadoRef.current) {
        window.clearTimeout(timeoutDestacadoRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const id = !esPublico ? cotizacionId : null

    if (id) {
      emitirChatAbierto(id, abierto)
    }

    return () => {
      if (id) {
        emitirChatAbierto(id, false)
      }
    }
  }, [abierto, cotizacionId, esPublico])

  useEffect(() => {
    if (!abierto) {
      return undefined
    }

    let active = true
    let intervalId = null

    setMostrarPillNuevo(false)
    setMostrarBajarFinal(false)
    scrollPendienteRef.current = 'auto'

    async function iniciarChat() {
      await cargarMensajesIniciales()

      if (!active) {
        return
      }

      intervalId = window.setInterval(() => {
        cargarMensajesNuevos()
      }, POLLING_ABIERTO_MS)
    }

    const timeoutId = window.setTimeout(() => {
      iniciarChat()
    }, 0)

    return () => {
      active = false
      window.clearTimeout(timeoutId)

      if (intervalId) {
        window.clearInterval(intervalId)
      }
    }
  }, [abierto, cargarMensajesIniciales, cargarMensajesNuevos])

  useEffect(() => {
    if (!esPublico || abierto) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      consultarAlertaPublica()
    }, 0)

    const intervalId = window.setInterval(() => {
      consultarAlertaPublica()
    }, POLLING_CERRADO_PUBLICO_MS)

    return () => {
      window.clearTimeout(timeoutId)
      window.clearInterval(intervalId)
    }
  }, [abierto, consultarAlertaPublica, esPublico])

  useLayoutEffect(() => {
    if (!abierto || !mensajesRef.current) {
      return
    }

    const anclaHistorial = historialAnclaRef.current

    if (anclaHistorial) {
      const element = mensajesRef.current
      const ancla = element.querySelector(`[data-chat-id="${anclaHistorial.id}"]`)

      if (ancla) {
        element.scrollTop = ancla.offsetTop - anclaHistorial.posicionVisual
      }

      historialAnclaRef.current = null
      return
    }

    const modoScroll = scrollPendienteRef.current

    if (!modoScroll) {
      return
    }

    irAlFinal(modoScroll === 'smooth' ? 'smooth' : 'auto')
    scrollPendienteRef.current = null
  }, [abierto, irAlFinal, mensajes])

  useEffect(() => {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    textarea.style.height = 'auto'
    const siguienteAltura = Math.min(textarea.scrollHeight, TEXTAREA_MAX_HEIGHT)
    textarea.style.height = `${siguienteAltura}px`
    textarea.style.overflowY = textarea.scrollHeight > TEXTAREA_MAX_HEIGHT ? 'auto' : 'hidden'
  }, [mensaje])

  useEffect(() => {
    if (!notificacionPublica || notificacionPublicaPausada || abierto) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setNotificacionPublica(null)
    }, DURACION_NOTIFICACION_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [abierto, notificacionPublica, notificacionPublicaPausada])

  const enviarMensaje = async (event) => {
    event.preventDefault()

    const mensajeLimpio = mensaje.replace(/\s+/g, ' ').trim()

    if (!mensajeLimpio) {
      return
    }

    setEnviando(true)
    setError('')

    try {
      const payload = await (esPublico
        ? enviarMensajePublico(token, mensajeLimpio)
        : enviarMensajeInterno(cotizacionId, mensajeLimpio))
      const mensajeGuardado = payload?.chat

      setMensaje('')

      if (mensajeGuardado) {
        integrarMensajesPosteriores({ mensajes: [mensajeGuardado] }, { forzarScrollFinal: true })
      } else {
        await cargarMensajesNuevos({ forzarScrollFinal: true })
      }
    } catch (sendError) {
      setError(sendError.message || 'No se pudo enviar')
    } finally {
      setEnviando(false)
    }
  }

  const aceptarPropuesta = async () => {
    if (!esPublico || propuestaAceptada) {
      return
    }

    setAceptando(true)
    setError('')

    try {
      const payload = await aceptarPropuestaPublica(token)
      const siguienteEstado = normalizarEstadoPropuesta(payload?.estadoPropuesta || payload?.estado_propuesta || 'aceptada')
      setEstadoActual(siguienteEstado)

      if (typeof onEstadoAceptado === 'function') {
        onEstadoAceptado(siguienteEstado)
      }

      await cargarMensajesNuevos({ forzarScrollFinal: true })
    } catch (acceptError) {
      setError(acceptError.message || 'No se pudo aceptar')
    } finally {
      setAceptando(false)
    }
  }

  const cerrarChat = () => {
    setAbierto(false)
  }

  const abrirDesdeNotificacionPublica = () => {
    setNotificacionPublica(null)
    setAbierto(true)
  }

  const manejarScrollMensajes = () => {
    const element = mensajesRef.current

    if (!element) {
      return
    }

    const estaAlFinal = estaCercaDelFinal(element)
    usuarioEnFinalRef.current = estaAlFinal
    setMostrarBajarFinal(!estaAlFinal)

    if (estaAlFinal) {
      setMostrarPillNuevo(false)
    }

    if (
      element.scrollTop <= SCROLL_TOP_HISTORY_THRESHOLD &&
      hayMensajesAnterioresRef.current &&
      !cargaAnterioresEnCursoRef.current
    ) {
      cargarMensajesAnteriores()
    }
  }

  const manejarClickBotonFlotante = () => {
    setAbierto((current) => {
      const siguiente = !current

      if (siguiente) {
        scrollPendienteRef.current = 'auto'
        setRespuestaNueva(false)
        setNotificacionPublica(null)
        setMensajeNuevoInterno(false)
      }

      return siguiente
    })
  }

  return (
    <>
      {esPublico && !abierto && notificacionPublica && typeof document !== 'undefined' && createPortal(
        <div className="pointer-events-none fixed right-5 top-28 z-[90] w-[min(360px,calc(100vw-2.5rem))] sm:right-8">
          <button
            type="button"
            className="pointer-events-auto w-full rounded-[26px] border border-white/80 bg-white/96 p-4 text-left shadow-[0_24px_70px_-36px_rgba(39,11,43,0.78)] backdrop-blur-[18px] transition hover:-translate-y-0.5 hover:bg-white"
            onClick={abrirDesdeNotificacionPublica}
            onMouseEnter={() => setNotificacionPublicaPausada(true)}
            onMouseLeave={() => setNotificacionPublicaPausada(false)}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9E6DF7]">
              {notificacionPublica.titulo}
            </p>
            {subtitulo && (
              <p className="mt-1 text-sm font-bold text-slate-950">
                {subtitulo}
              </p>
            )}
            {notificacionPublica.mensaje && (
              <p className="mt-2 line-clamp-3 text-sm leading-5 text-slate-600">
                {notificacionPublica.mensaje}
              </p>
            )}
          </button>
        </div>,
        document.body
      )}

      <div className="fixed bottom-6 right-5 z-[80] flex max-w-[calc(100vw-2.5rem)] flex-col items-end gap-3 sm:right-8">
        {abierto && (
        <section
          className="flex w-[min(420px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[32px] border border-white/80 bg-white/96 shadow-[0_32px_90px_-42px_rgba(39,11,43,0.78)] backdrop-blur-[18px]"
          style={{ height: 'min(680px, calc(100vh - 8rem))' }}
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9E6DF7]">
                {titulo}
              </p>
              {subtitulo && (
                <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                  {subtitulo}
                </p>
              )}
            </div>

            <button
              type="button"
              className="shrink-0 text-sm font-medium text-slate-500 transition hover:text-[#411189]"
              onClick={cerrarChat}
            >
              Cerrar
            </button>
          </div>

          {esPublico && (
            <div className="shrink-0 border-b border-slate-100 px-5 py-4">
              <Boton
                type="button"
                size="sm"
                loading={aceptando}
                onClick={aceptarPropuesta}
                aria-disabled={propuestaAceptada ? 'true' : undefined}
                className="min-w-[150px] !bg-[#9E6DF7] !text-white hover:!bg-[#8a56f2] disabled:!bg-[#9E6DF7]"
              >
                {propuestaAceptada ? 'Aceptado' : 'Aceptar propuesta'}
              </Boton>
            </div>
          )}

          <div
            ref={mensajesRef}
            className="relative flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-slate-50/80 px-5 py-4"
            onScroll={manejarScrollMensajes}
          >
            {cargando ? (
              <p className="py-8 text-center text-sm text-slate-500">Cargando</p>
            ) : mensajes.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">Sin mensajes</p>
            ) : (
              <>
                {mensajes.map((item) => {
                  const hora = formatearHora(item.fechaCreacion || item.fecha_creacion)
                  const esPropio = item.origen === origenPropio
                  const textoLectura = esPropio ? (esMensajeLeidoPorReceptor(item, origenPropio) ? 'Leído' : 'Enviado') : ''
                  const meta = [hora, textoLectura].filter(Boolean).join(' · ')
                  const itemId = obtenerIdMensaje(item)

                  return (
                    <div
                      key={item.id || `${item.fechaCreacion}-${item.mensaje}`}
                      data-chat-id={itemId > 0 ? itemId : undefined}
                      className={obtenerClaseBurbuja(item, origenPropio, itemId === mensajeDestacadoId)}
                    >
                      <p className="whitespace-pre-line break-words">{item.mensaje}</p>
                      {(item.tipo === 'evento' || meta) && (
                        <p className={`mt-1 text-[11px] ${item.tipo === 'evento' ? 'text-[#411189]/70' : obtenerClaseMeta(item, origenPropio)}`}>
                          {item.tipo === 'evento' ? hora : meta}
                        </p>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </div>

          <form className="shrink-0 border-t border-slate-100 px-5 py-4" onSubmit={enviarMensaje}>
            {(mostrarPillNuevo || mostrarBajarFinal) && (
              <div className="mb-3 flex justify-center">
                <button
                  type="button"
                  className={`inline-flex items-center justify-center gap-2 rounded-full border border-[#bfa4ff] bg-[#f3edff] text-xs font-semibold text-[#411189] shadow-[0_14px_30px_-24px_rgba(65,17,137,0.6)] transition hover:-translate-y-0.5 hover:bg-[#ece1ff] ${mostrarPillNuevo ? 'px-4 py-2' : 'h-9 w-9'}`}
                  onClick={() => irAlFinal('smooth')}
                  aria-label={mostrarPillNuevo ? 'Nuevo mensaje' : 'Bajar al final'}
                >
                  {mostrarPillNuevo ? 'Nuevo mensaje' : <IconoAbajo />}
                </button>
              </div>
            )}

            <div className="relative rounded-[24px] border border-[#aebed3] bg-white shadow-[inset_0_0_0_1px_rgba(148,163,184,0.22)] transition focus-within:border-[#9E6DF7] focus-within:ring-4 focus-within:ring-[#9E6DF7]/16">
              <textarea
                ref={textareaRef}
                value={mensaje}
                onChange={(event) => setMensaje(event.target.value)}
                rows={1}
                maxLength={2000}
                placeholder="Mensaje"
                className="min-h-[48px] max-h-[112px] w-full resize-none overflow-hidden rounded-[24px] border-0 bg-transparent py-3 pl-4 pr-16 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400"
              />

              <button
                type="submit"
                disabled={!mensaje.trim() || enviando}
                className="absolute bottom-2.5 right-2.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#9E6DF7] text-white shadow-[0_16px_34px_-22px_rgba(65,17,137,0.9)] transition hover:bg-[#8a56f2] disabled:cursor-not-allowed disabled:bg-[#9E6DF7]/55"
                aria-label="Enviar mensaje"
              >
                <IconoEnviar />
              </button>
            </div>

            {error && (
              <p className="mt-3 text-sm font-medium text-rose-700">{error}</p>
            )}
          </form>
        </section>
      )}

      <button
        type="button"
        className={`rounded-full px-5 py-3 text-sm font-semibold text-white shadow-[0_24px_60px_-30px_rgba(65,17,137,0.85)] transition hover:-translate-y-0.5 ${
          textoBoton === 'Chat' || textoBoton === 'Cerrar'
            ? 'bg-[#9E6DF7] hover:bg-[#8a56f2]'
            : 'bg-[#411189] hover:bg-[#35106f]'
        }`}
        onClick={manejarClickBotonFlotante}
      >
        {textoBoton}
        {tieneAlertaBoton && !abierto && (
          <span className="ml-2 inline-block h-2 w-2 rounded-full bg-white/90 align-middle" />
        )}
        </button>
      </div>
    </>
  )
}
