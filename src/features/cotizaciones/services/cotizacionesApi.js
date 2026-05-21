import apiClient from '../../../services/apiClient'

export async function obtenerCotizaciones(params = {}) {
  const queryString = new URLSearchParams(params).toString()
  const endpoint = queryString ? `/quotations.php?${queryString}` : '/quotations.php'
  return apiClient.get(endpoint)
}

export async function obtenerCotizacion(id) {
  return apiClient.get(`/quotation.php?id=${id}`)
}

export async function crearCotizacion(payload) {
  return apiClient.post('/quotations.php', payload)
}

export async function actualizarCotizacion(id, payload) {
  return apiClient.put(`/quotation.php?id=${id}`, payload)
}
