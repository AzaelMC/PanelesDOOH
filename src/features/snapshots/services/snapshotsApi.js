import apiClient from '../../../services/apiClient'

export async function obtenerSnapshotCotizacion(cotizacionId) {
  const id = String(cotizacionId || '').trim()

  if (!id) {
    throw new Error('ID de cotizacion requerido para consultar la liga publica.')
  }

  const response = await apiClient.get(`/snapshots.php?cotizacion_id=${encodeURIComponent(id)}`)
  return response?.snapshot || null
}

export async function generarSnapshotCotizacion(cotizacionId) {
  const id = String(cotizacionId || '').trim()

  if (!id) {
    throw new Error('ID de cotizacion requerido para generar la liga publica.')
  }

  return apiClient.post('/snapshots.php', {
    cotizacion_id: id
  })
}

export async function revocarSnapshotCotizacion(cotizacionId) {
  const id = String(cotizacionId || '').trim()

  if (!id) {
    throw new Error('ID de cotizacion requerido para revocar la liga publica.')
  }

  return apiClient.delete(`/snapshots.php?cotizacion_id=${encodeURIComponent(id)}`)
}
