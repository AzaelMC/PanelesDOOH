export function validarCoordenadas(latitude, longitude) {
  const errors = []

  if (!Number.isFinite(latitude)) {
    errors.push('Latitud debe ser un numero valido')
  }

  if (!Number.isFinite(longitude)) {
    errors.push('Longitud debe ser un numero valido')
  }

  if (errors.length > 0) {
    return { isValid: false, errors }
  }

  if (latitude < -90 || latitude > 90) {
    errors.push('Latitud debe estar entre -90 y 90')
  }

  if (longitude < -180 || longitude > 180) {
    errors.push('Longitud debe estar entre -180 y 180')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validarArregloCoordenadas(coordenadas = []) {
  const valid = []
  const invalid = []

  coordenadas.forEach((coordenada, index) => {
    const lat = Array.isArray(coordenada) ? coordenada[0] : coordenada?.latitude ?? coordenada?.lat
    const lng = Array.isArray(coordenada) ? coordenada[1] : coordenada?.longitude ?? coordenada?.lng
    const validation = validarCoordenadas(lat, lng)

    if (validation.isValid) {
      valid.push({ index, coordinate: coordenada })
    } else {
      invalid.push({ index, coordinate: coordenada, errors: validation.errors })
    }
  })

  return { valid, invalid }
}
