import { validarCoordenadas } from '../../locations/utils/validarCoordenadas'

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '')
}

function convertirNumero(value) {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value !== 'string') {
    return Number.NaN
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return Number.NaN
  }

  const normalized = trimmed.includes('.')
    ? trimmed.replace(/,/g, '')
    : trimmed.replace(',', '.')

  return Number(normalized)
}

function convertirNumeroOpcional(value) {
  const parsed = convertirNumero(value)
  return Number.isFinite(parsed) ? parsed : null
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

function normalizarPantallaMapa(pantalla = {}, index = 0) {
  const id = pickFirst(pantalla.id, pantalla.pantallaId, pantalla.idTemporal, `pantalla-${index + 1}`)
  const latitude = convertirNumero(pickFirst(pantalla.latitude, pantalla.latitud))
  const longitude = convertirNumero(pickFirst(pantalla.longitude, pantalla.longitud))
  const impressions = convertirNumeroOpcional(pickFirst(pantalla.impressions, pantalla.impresiones))
  const isActive = normalizarBooleano(pickFirst(pantalla.is_active, pantalla.estaActiva, pantalla.esta_activa), true)

  return {
    ...pantalla,
    id,
    pantallaId: pickFirst(pantalla.pantallaId, pantalla.id, id),
    screenName: pickFirst(pantalla.screenName, pantalla.nombrePantalla, pantalla.nombre_pantalla, `Pantalla ${index + 1}`),
    city: pickFirst(pantalla.city, pantalla.ciudad, ''),
    venueType: pickFirst(pantalla.venueType, pantalla.tipoVenue, pantalla.tipo_venue, ''),
    dimensions: pickFirst(pantalla.dimensions, pantalla.dimensiones, ''),
    impressions,
    latitude,
    longitude,
    cardinalPoint: pickFirst(pantalla.cardinalPoint, pantalla.puntoCardinal, pantalla.punto_cardinal, null),
    is_active: isActive,
    estaActiva: isActive
  }
}

export function normalizarPantallasMapa(pantallas = []) {
  return pantallas
    .map(normalizarPantallaMapa)
    .filter((pantalla) => pantalla.is_active)
}

export function prepararPantallasMapa(pantallas = []) {
  const pantallasValidas = []
  const pantallasInvalidas = []

  pantallas.forEach((pantalla, index) => {
    const pantallaNormalizada = normalizarPantallaMapa(pantalla, index)
    const latitude = convertirNumero(pantallaNormalizada.latitude)
    const longitude = convertirNumero(pantallaNormalizada.longitude)
    const validation = validarCoordenadas(latitude, longitude)

    const pantallaPreparada = {
      ...pantallaNormalizada,
      latitude,
      longitude,
      latLng: {
        lat: latitude,
        lng: longitude
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
