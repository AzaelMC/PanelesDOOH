const EVENTO_ALERTAS_CHAT = 'ntp-dooh-alertas-chat'
const EVENTO_CHAT_ABIERTO = 'ntp-dooh-chat-abierto'
const EVENTO_CHAT_LEIDO = 'ntp-dooh-chat-leido'

function dispatch(nombreEvento, detalle = {}) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new CustomEvent(nombreEvento, { detail: detalle }))
}

function escuchar(nombreEvento, callback) {
  if (typeof window === 'undefined' || typeof callback !== 'function') {
    return () => {}
  }

  const handler = (event) => callback(event.detail || {})
  window.addEventListener(nombreEvento, handler)

  return () => {
    window.removeEventListener(nombreEvento, handler)
  }
}

export function emitirAlertasChat(alertas = []) {
  dispatch(EVENTO_ALERTAS_CHAT, { alertas: Array.isArray(alertas) ? alertas : [] })
}

export function escucharAlertasChat(callback) {
  return escuchar(EVENTO_ALERTAS_CHAT, callback)
}

export function emitirChatAbierto(cotizacionId, abierto) {
  dispatch(EVENTO_CHAT_ABIERTO, {
    cotizacionId: cotizacionId ? String(cotizacionId) : '',
    abierto: Boolean(abierto)
  })
}

export function escucharChatAbierto(callback) {
  return escuchar(EVENTO_CHAT_ABIERTO, callback)
}

export function emitirChatLeido(cotizacionId) {
  dispatch(EVENTO_CHAT_LEIDO, { cotizacionId: cotizacionId ? String(cotizacionId) : '' })
}

export function escucharChatLeido(callback) {
  return escuchar(EVENTO_CHAT_LEIDO, callback)
}
