export function normalizarUbicacion(ubicacionCruda = {}) {
  return {
    idTemporal: ubicacionCruda.idTemporal || '',
    campaignName: ubicacionCruda.campaignName || '',
    cliente: ubicacionCruda.cliente || '',
    sheetName: ubicacionCruda.sheetName || '',
    screenName: ubicacionCruda.screenName || '',
    city: ubicacionCruda.city || '',
    venueType: ubicacionCruda.venueType || '',
    latitude: ubicacionCruda.latitude ?? null,
    longitude: ubicacionCruda.longitude ?? null,
    dimensions: ubicacionCruda.dimensions || '',
    impressions: Number.isFinite(ubicacionCruda.impressions) ? ubicacionCruda.impressions : 0,
    cardinalPoint: ubicacionCruda.cardinalPoint || 'Sin definir',
    isValid: Boolean(ubicacionCruda.isValid),
    is_active: ubicacionCruda.is_active ?? true,
    errors: Array.isArray(ubicacionCruda.errors) ? ubicacionCruda.errors : [],
    rawPayload: ubicacionCruda.rawPayload && typeof ubicacionCruda.rawPayload === 'object'
      ? ubicacionCruda.rawPayload
      : {}
  }
}

export function normalizarUbicaciones(ubicaciones = []) {
  if (!Array.isArray(ubicaciones)) {
    return []
  }

  return ubicaciones.map(normalizarUbicacion)
}
