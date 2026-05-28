import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { GOOGLE_MAPS_API_KEY } from '../config/env'

let mapsPromise = null
let optionsConfigured = false

function validarApiKey() {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('No se encontro VITE_GOOGLE_MAPS_API_KEY. Revisa tu archivo .env.local.')
  }
}

function configurarLoader() {
  if (optionsConfigured) {
    return
  }

  validarApiKey()

  setOptions({
    key: GOOGLE_MAPS_API_KEY,
    v: 'weekly',
    language: 'es',
    region: 'MX'
  })

  optionsConfigured = true
}

export async function cargarGoogleMaps() {
  if (mapsPromise) {
    return mapsPromise
  }

  mapsPromise = (async () => {
    configurarLoader()
    await importLibrary('maps')

    if (!window.google?.maps) {
      throw new Error('Google Maps no quedo disponible despues de cargar la libreria.')
    }

    return window.google.maps
  })()

  return mapsPromise
}

export function tieneGoogleMapsApiKey() {
  return Boolean(GOOGLE_MAPS_API_KEY)
}
