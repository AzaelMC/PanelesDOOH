export function calcularCentroCoordenadas(ubicaciones = []) {
  const validas = ubicaciones.filter((ubicacion) => (
    ubicacion?.isValid &&
    Number.isFinite(ubicacion?.latitude) &&
    Number.isFinite(ubicacion?.longitude)
  ))

  if (validas.length === 0) {
    return {
      latitude: null,
      longitude: null
    }
  }

  const totals = validas.reduce((acc, ubicacion) => ({
    latitude: acc.latitude + ubicacion.latitude,
    longitude: acc.longitude + ubicacion.longitude
  }), { latitude: 0, longitude: 0 })

  return {
    latitude: Number((totals.latitude / validas.length).toFixed(6)),
    longitude: Number((totals.longitude / validas.length).toFixed(6))
  }
}
