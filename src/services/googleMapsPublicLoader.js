import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { obtenerMapsPublicConfig } from '../features/propuesta/services/propuestaPublicaApi'

let mapsConfigPromise = null
let mapsPromise = null
let markerPromise = null
let loaderOptionsPromise = null
let optionsConfigured = false
let mapsConfig = null

export async function obtenerGoogleMapsPublicConfig() {
  if (mapsConfig) {
    return mapsConfig
  }

  if (!mapsConfigPromise) {
    mapsConfigPromise = obtenerMapsPublicConfig()
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

async function configurarLoaderPublico() {
  if (optionsConfigured) {
    return obtenerGoogleMapsPublicConfig()
  }

  if (!loaderOptionsPromise) {
    loaderOptionsPromise = obtenerGoogleMapsPublicConfig()
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

export async function cargarGoogleMapsPublico() {
  if (mapsPromise) {
    return mapsPromise
  }

  mapsPromise = (async () => {
    await configurarLoaderPublico()
    await importLibrary('maps')

    if (!window.google?.maps) {
      throw new Error('Google Maps no quedo disponible despues de cargar la libreria publica.')
    }

    return window.google.maps
  })().catch((error) => {
    mapsPromise = null
    throw error
  })

  return mapsPromise
}

export async function cargarGoogleMapsMarkerPublico() {
  if (markerPromise) {
    return markerPromise
  }

  markerPromise = (async () => {
    await configurarLoaderPublico()
    const markerLibrary = await importLibrary('marker')

    if (!markerLibrary?.AdvancedMarkerElement) {
      throw new Error('Google Maps Marker Library no quedo disponible despues de cargar la libreria publica.')
    }

    return markerLibrary
  })().catch((error) => {
    markerPromise = null
    throw error
  })

  return markerPromise
}
