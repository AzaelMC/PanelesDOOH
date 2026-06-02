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

export function prepararPantallasMapa(pantallas = []) {
  const pantallasValidas = []
  const pantallasInvalidas = []

  pantallas.forEach((pantalla) => {
    const latitude = convertirNumero(pantalla?.latitude)
    const longitude = convertirNumero(pantalla?.longitude)
    const validation = validarCoordenadas(latitude, longitude)

    const pantallaPreparada = {
      ...pantalla,
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
