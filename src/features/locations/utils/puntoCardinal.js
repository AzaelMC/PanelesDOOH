function esNumeroValido(valor) {
  return typeof valor === 'number' && Number.isFinite(valor)
}

export function obtenerPuntoCardinal(lat, lng, centerLat, centerLng) {
  if (
    !esNumeroValido(lat) ||
    !esNumeroValido(lng) ||
    !esNumeroValido(centerLat) ||
    !esNumeroValido(centerLng)
  ) {
    return 'Sin definir'
  }

  const latDiff = lat - centerLat
  const lngDiff = lng - centerLng
  const tolerancia = 0.01

  if (Math.abs(latDiff) <= tolerancia && Math.abs(lngDiff) <= tolerancia) {
    return 'Centro'
  }

  let punto = ''

  if (latDiff > tolerancia) {
    punto += 'N'
  } else if (latDiff < -tolerancia) {
    punto += 'S'
  }

  if (lngDiff > tolerancia) {
    punto += 'E'
  } else if (lngDiff < -tolerancia) {
    punto += 'O'
  }

  return punto || 'Sin definir'
}

export function obtenerPuntosCardinales() {
  return ['N', 'S', 'E', 'O', 'NE', 'NO', 'SE', 'SO', 'Centro', 'Sin definir']
}
