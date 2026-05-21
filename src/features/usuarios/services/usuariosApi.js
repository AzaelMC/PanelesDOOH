import apiClient from '../../../services/apiClient'

export async function obtenerUsuarios() {
  return apiClient.get('/users.php')
}
