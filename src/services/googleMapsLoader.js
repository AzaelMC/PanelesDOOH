import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import apiClient from './apiClient'

let mapsConfigPromise = null
let mapsPromise = null
let markerPromise = null
let loaderOptionsPromise = null
let optionsConfigured = false
let mapsConfig = null

function normalizarConfigMaps(response = {}) {
  const rawMapsConfig = response?.maps && typeof response.maps === 'object'
    ? response.maps
    : response

  const apiKey = String(rawMapsConfig?.apiKey || '').trim()
  const mapId = String(rawMapsConfig?.mapId || '').trim()

  if (!apiKey) {
    throw new Error('La API key de Google Maps no esta configurada en el servidor.')
  }

  if (!mapId) {
    throw new Error('El Map ID de Google Maps no esta configurado en el servidor.')
  }

  return {
    apiKey,
    mapId
  }
}

export async function obtenerGoogleMapsConfig() {
  if (mapsConfig) {
    return mapsConfig
  }

  if (!mapsConfigPromise) {
    mapsConfigPromise = apiClient.get('/maps_config.php')
      .then(normalizarConfigMaps)
      .then((config) => {
        mapsConfig = config
        return config
      })
      .catch((error) => {
        mapsConfigPromise = null
        mapsConfig = null
        throw error
      })
  }

  return mapsConfigPromise
}

async function configurarLoader() {
  if (optionsConfigured) {
    return obtenerGoogleMapsConfig()
  }

  if (!loaderOptionsPromise) {
    loaderOptionsPromise = obtenerGoogleMapsConfig()
      .then((config) => {
        setOptions({
          key: config.apiKey,
          v: 'weekly',
          language: 'es',
          region: 'MX'
        })

        optionsConfigured = true
        return config
      })
      .catch((error) => {
        loaderOptionsPromise = null
        optionsConfigured = false
        throw error
      })
  }

  return loaderOptionsPromise
}

export async function cargarGoogleMaps() {
  if (mapsPromise) {
    return mapsPromise
  }

  mapsPromise = (async () => {
    await configurarLoader()
    await importLibrary('maps')

    if (!window.google?.maps) {
      throw new Error('Google Maps no quedo disponible despues de cargar la libreria.')
    }

    return window.google.maps
  })().catch((error) => {
    mapsPromise = null
    throw error
  })

  return mapsPromise
}

export async function cargarGoogleMapsMarker() {
  if (markerPromise) {
    return markerPromise
  }

  markerPromise = (async () => {
    await configurarLoader()
    const markerLibrary = await importLibrary('marker')

    if (!markerLibrary?.AdvancedMarkerElement) {
      throw new Error('Google Maps Marker Library no quedo disponible despues de cargar la libreria.')
    }

    return markerLibrary
  })().catch((error) => {
    markerPromise = null
    throw error
  })

  return markerPromise
}
