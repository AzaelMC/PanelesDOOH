import apiClient from '../../../services/apiClient'

function limpiarMensaje(mensaje = '') {
  return String(mensaje || '').replace(/\s+/g, ' ').trim()
}

export async function obtenerChatInterno(
  cotizacionId,
  {
    marcarLeidos = false,
    despuesId = 0,
    antesId = 0,
    limite = 100
  } = {}
) {
  const id = Number(cotizacionId)

  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('ID de cotizacion requerido')
  }

  const params = new URLSearchParams({ cotizacion_id: String(id) })

  if (marcarLeidos) {
    params.set('marcar_leidos', '1')
  }

  if (Number(despuesId) > 0) {
    params.set('despues_id', String(despuesId))
  }

  if (Number(antesId) > 0) {
    params.set('antes_id', String(antesId))
  }

  if (Number(despuesId) > 0 && Number(antesId) > 0) {
    throw new Error('Usa solo un cursor de chat')
  }

  if (Number(limite) > 0) {
    params.set('limite', String(Math.min(Number(limite), 100)))
  }

  return apiClient.get(`/chat_interno.php?${params.toString()}`)
}

export async function enviarMensajeInterno(cotizacionId, mensaje) {
  const id = Number(cotizacionId)
  const mensajeLimpio = limpiarMensaje(mensaje)

  if (!Number.isFinite(id) || id <= 0 || !mensajeLimpio) {
    throw new Error('No se pudo enviar')
  }

  return apiClient.post('/chat_interno.php', {
    cotizacion_id: id,
    mensaje: mensajeLimpio
  })
}
