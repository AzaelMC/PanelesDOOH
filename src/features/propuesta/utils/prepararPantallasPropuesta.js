import { validarCoordenadas } from '../../locations/utils/validarCoordenadas'

function convertirNumero(value) {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value !== 'string') {
    return Number.NaN
  }

  const normalized = value.trim().replace(',', '.')
  return Number(normalized)
}

function normalizarBooleano(value, fallback = true) {
  if (typeof value === 'boolean') {
    return value
  }

  if (value === 1 || value === '1') {
    return true
  }

  if (value === 0 || value === '0') {
    return false
  }

  return fallback
}

function normalizarPantallaPublica(pantalla = {}, index = 0) {
  const id = pantalla.id ?? pantalla.pantallaId ?? pantalla.idTemporal ?? `snapshot-${index}`
  const latitude = convertirNumero(pantalla.latitude ?? pantalla.latitud)
  const longitude = convertirNumero(pantalla.longitude ?? pantalla.longitud)
  const impressions = Number(pantalla.impressions ?? pantalla.impresiones)

  return {
    id,
    pantallaId: pantalla.pantallaId ?? pantalla.id ?? id,
    screenName: pantalla.screenName || pantalla.nombrePantalla || pantalla.nombre_pantalla || `Pantalla ${index + 1}`,
    city: pantalla.city || pantalla.ciudad || 'Sin ciudad',
    venueType: pantalla.venueType || pantalla.tipoVenue || pantalla.tipo_venue || 'Sin dato',
    dimensions: pantalla.dimensions || pantalla.dimensiones || 'Sin dato',
    impressions: Number.isFinite(impressions) ? impressions : null,
    latitude,
    longitude,
    is_active: normalizarBooleano(pantalla.is_active ?? pantalla.estaActiva ?? pantalla.esta_activa, true),
    estaActiva: normalizarBooleano(pantalla.is_active ?? pantalla.estaActiva ?? pantalla.esta_activa, true),
    cardinalPoint: pantalla.cardinalPoint || pantalla.puntoCardinal || pantalla.punto_cardinal || null
  }
}

export function normalizarPantallasSnapshot(snapshot = {}) {
  const pantallas = Array.isArray(snapshot?.pantallas)
    ? snapshot.pantallas
    : Array.isArray(snapshot?.ubicaciones)
      ? snapshot.ubicaciones
      : []

  return pantallas
    .map(normalizarPantallaPublica)
    .filter((pantalla) => pantalla.is_active)
}

export function prepararPantallasPropuesta(pantallas = []) {
  const pantallasValidas = []
  const pantallasInvalidas = []

  pantallas.forEach((pantalla, index) => {
    const pantallaNormalizada = normalizarPantallaPublica(pantalla, index)
    const validation = validarCoordenadas(pantallaNormalizada.latitude, pantallaNormalizada.longitude)

    const pantallaPreparada = {
      ...pantallaNormalizada,
      latLng: {
        lat: pantallaNormalizada.latitude,
        lng: pantallaNormalizada.longitude
      },
      erroresMapa: validation.errors
    }

    if (validation.isValid) {
      pantallasValidas.push(pantallaPreparada)
      return
    }

    pantallasInvalidas.push(pantallaPreparada)
  })

  return {
    pantallasValidas,
    pantallasInvalidas
  }
}
