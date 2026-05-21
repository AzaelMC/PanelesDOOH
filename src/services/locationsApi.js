import apiClient from './apiClient'

/**
 * Guarda un array de localizaciones en la API externa.
 *
 * @param {Array} locations - Array de objetos de ubicacion
 * @returns {Promise<Object>} Respuesta del servidor
 */
export async function saveLocations(locations) {
  try {
    const response = await apiClient.post('/save_locations.php', {
      locations
    })
    return response
  } catch (error) {
    console.error('Error saving locations:', error)
    throw error
  }
}

/**
 * Obtiene las localizaciones guardadas.
 *
 * @param {Object} params - Parametros de query (campaignId, city, etc.)
 * @returns {Promise<Array>} Array de localizaciones
 */
export async function getLocations(params = {}) {
  try {
    const queryString = new URLSearchParams(params).toString()
    const endpoint = queryString ? `/get_locations.php?${queryString}` : '/get_locations.php'
    
    const response = await apiClient.get(endpoint)
    return response.locations || []
  } catch (error) {
    console.error('Error fetching locations:', error)
    throw error
  }
}

/**
 * Obtiene una campana especifica.
 *
 * @param {number} campaignId - ID de la campana
 * @returns {Promise<Object>} Datos de la campana
 */
export async function getCampaign(campaignId) {
  try {
    const response = await apiClient.get(`/get_campaign.php?id=${campaignId}`)
    return response.campaign || null
  } catch (error) {
    console.error('Error fetching campaign:', error)
    throw error
  }
}

/**
 * Elimina una localizacion.
 *
 * @param {number} locationId - ID de la localizacion
 * @returns {Promise<Object>} Respuesta del servidor
 */
export async function deleteLocation(locationId) {
  try {
    const response = await apiClient.delete(`/delete_location.php?id=${locationId}`)
    return response
  } catch (error) {
    console.error('Error deleting location:', error)
    throw error
  }
}
