import apiClient from '../../../services/apiClient'

export async function enviarCorreoPropuesta({ token, respuesta, comentario = null }) {
  return apiClient.post('/correo_propuesta.php', {
    token,
    respuesta,
    comentario
  })
}
