export function normalizarEstadoPropuesta(value = '') {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')

  if (['aceptada', 'aceptado', 'accepted'].includes(normalized)) {
    return 'aceptada'
  }

  return 'en_revision'
}

export function obtenerTextoEstadoPropuesta(value = '') {
  const estado = normalizarEstadoPropuesta(value)

  if (estado === 'aceptada') {
    return 'Aceptada'
  }

  return 'En revisión'
}

export function obtenerStatusEstadoPropuesta(value = '') {
  const estado = normalizarEstadoPropuesta(value)

  if (estado === 'aceptada') {
    return 'success'
  }

  return 'pending'
}

export function tieneMensajeNuevo(cotizacion = {}) {
  return Boolean(
    cotizacion.tieneMensajeNuevo ||
    cotizacion.tiene_mensaje_nuevo ||
    cotizacion.mensajeNuevo ||
    cotizacion.mensaje_nuevo
  )
}

export function obtenerTextoEstadoOperativo(value = '') {
  const text = String(value || '').trim()

  if (!text) {
    return 'Borrador'
  }

  return text.charAt(0).toUpperCase() + text.slice(1)
}
