import apiClient from '../../../services/apiClient'

export async function obtenerAlertasChat() {
  const payload = await apiClient.get('/alertas_chat.php')

  return Array.isArray(payload?.alertas) ? payload.alertas : []
}
