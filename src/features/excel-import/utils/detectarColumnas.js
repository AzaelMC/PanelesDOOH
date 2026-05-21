import { normalizarEncabezado } from './normalizarEncabezados'

const ALIASES_GENERICOS = new Set([
  'screen',
  'name',
  'nombre',
  'pantalla',
  'city',
  'ciudad',
  'location',
  'market',
  'mercado',
  'venue',
  'format',
  'formato',
  'size',
  'lat',
  'lng',
  'lon',
  'long',
  'map',
  'maps'
])

export const ALIASES_COLUMNAS = {
  screenName: [
    'screen_name',
    'screen',
    'name',
    'nombre',
    'nombre_pantalla',
    'pantalla',
    'site_name',
    'screen_name_id',
    'screen_id',
    'screen_name_screen_id'
  ],
  city: [
    'city',
    'ciudad',
    'site_location_city',
    'location_city',
    'ubicacion_ciudad',
    'site_location',
    'location',
    'market',
    'mercado'
  ],
  venueType: [
    'venue_type',
    'tipo_venue',
    'tipo_de_venue',
    'recinto',
    'tipo_lugar',
    'tipo_locacion',
    'environment',
    'placement_type',
    'venue'
  ],
  latitude: ['latitude', 'lat', 'latitud', 'geo_lat', 'geo_latitude'],
  longitude: ['longitude', 'lng', 'lon', 'long', 'longitud', 'geo_lng', 'geo_longitude'],
  dimensions: ['dimension', 'dimensions', 'dimensiones', 'size', 'tamano', 'format', 'formato'],
  impressions: [
    'impressions',
    'impresiones',
    'impacts',
    'impactos',
    'estimated_impressions',
    'monthly_impressions',
    'weekly_impressions'
  ],
  maps: ['maps', 'map', 'mapa', 'mapas', 'google_maps', 'google_map', 'maps_url', 'url_maps']
}

function contieneSecuencia(tokens = [], aliasTokens = []) {
  if (!aliasTokens.length || aliasTokens.length > tokens.length) {
    return false
  }

  for (let index = 0; index <= tokens.length - aliasTokens.length; index += 1) {
    const coinciden = aliasTokens.every(
      (token, aliasIndex) => tokens[index + aliasIndex] === token
    )

    if (coinciden) {
      return true
    }
  }

  return false
}

function coincideAlias(encabezadoNormalizado, alias) {
  if (!encabezadoNormalizado || !alias) {
    return false
  }

  if (encabezadoNormalizado === alias) {
    return true
  }

  const tokens = encabezadoNormalizado.split('_').filter(Boolean)
  const aliasTokens = alias.split('_').filter(Boolean)

  if (aliasTokens.length > 1) {
    return contieneSecuencia(tokens, aliasTokens)
  }

  if (ALIASES_GENERICOS.has(alias)) {
    return false
  }

  return (
    tokens.includes(alias) ||
    encabezadoNormalizado.startsWith(`${alias}_`) ||
    encabezadoNormalizado.endsWith(`_${alias}`)
  )
}

export function detectarColumnas(encabezados = []) {
  const resultado = {
    screenName: null,
    city: null,
    venueType: null,
    latitude: null,
    longitude: null,
    dimensions: null,
    impressions: null,
    maps: null
  }

  encabezados.forEach((encabezadoOriginal) => {
    const encabezadoNormalizado = normalizarEncabezado(encabezadoOriginal)

    Object.entries(ALIASES_COLUMNAS).forEach(([field, aliases]) => {
      if (!resultado[field] && aliases.some((alias) => coincideAlias(encabezadoNormalizado, alias))) {
        resultado[field] = String(encabezadoOriginal ?? '').trim()
      }
    })
  })

  return resultado
}
