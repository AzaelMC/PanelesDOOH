import apiClient from '../../../services/apiClient'

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '')
}

function stripTrailingSlash(value = '') {
  return value.replace(/\/+$/, '')
}

function getAppBaseUrl() {
  if (typeof window === 'undefined') {
    return stripTrailingSlash(import.meta.env.BASE_URL || '/')
  }

  const basePath = import.meta.env.BASE_URL || '/'
  const normalizedBasePath = basePath.startsWith('/') ? basePath : `/${basePath}`

  return `${window.location.origin}${stripTrailingSlash(normalizedBasePath)}`
}

function buildHashRouteUrl(token) {
  const tokenLimpio = String(token || '').trim().replace(/^\/+/, '')

  if (!tokenLimpio) {
    return ''
  }

  return `${getAppBaseUrl()}/#/propuesta/${tokenLimpio}`
}

function extraerTokenDesdeUrl(urlPublica = '', rutaPublica = '') {
  const candidatos = [urlPublica, rutaPublica]

  for (const candidato of candidatos) {
    if (!candidato) {
      continue
    }

    const texto = String(candidato).trim()
    const hashMatch = texto.match(/#\/propuesta\/([^/?#]+)/)

    if (hashMatch?.[1]) {
      return decodeURIComponent(hashMatch[1])
    }

    const pathMatch = texto.match(/(?:\/Dooh)?\/propuesta\/([^/?#]+)/)

    if (pathMatch?.[1]) {
      return decodeURIComponent(pathMatch[1])
    }
  }

  return ''
}

function normalizarUrlPublica(urlPublica = '', rutaPublica = '', tokenPublico = '') {
  const token = pickFirst(tokenPublico, extraerTokenDesdeUrl(urlPublica, rutaPublica), '')

  if (token) {
    return buildHashRouteUrl(token)
  }

  return urlPublica || ''
}

function normalizarLink(rawLink = {}, rawResponse = {}) {
  const link = rawLink && typeof rawLink === 'object' ? rawLink : {}

  const rutaPublica = pickFirst(rawResponse.rutaPublica, rawResponse.ruta_publica, link.rutaPublica, link.ruta_publica, '')
  const urlPublicaOriginal = pickFirst(rawResponse.urlPublica, rawResponse.url_publica, link.urlPublica, link.url_publica, '')
  const token = pickFirst(rawResponse.token, rawResponse.token_publico, link.token, link.token_publico, extraerTokenDesdeUrl(urlPublicaOriginal, rutaPublica), '')

  if (!Object.keys(link).length && !urlPublicaOriginal && !rutaPublica && !token) {
    return null
  }

  return {
    id: pickFirst(link.id, rawResponse.id, null),
    cotizacionId: pickFirst(link.cotizacionId, link.cotizacion_id, rawResponse.cotizacionId, rawResponse.cotizacion_id, null),
    vigente: Boolean(pickFirst(link.vigente, false)),
    revocado: Boolean(pickFirst(link.revocado, false)),
    expirado: Boolean(pickFirst(link.expirado, false)),
    fechaExpiracion: pickFirst(link.fechaExpiracion, link.fecha_expiracion, rawResponse.fechaExpiracion, rawResponse.fecha_expiracion, ''),
    ultimoAcceso: pickFirst(link.ultimoAcceso, link.ultimo_acceso, rawResponse.ultimoAcceso, rawResponse.ultimo_acceso, ''),
    token,
    urlPublica: normalizarUrlPublica(urlPublicaOriginal, rutaPublica, token),
    rutaPublica
  }
}

export async function consultarLinkPublico(cotizacionId) {
  const response = await apiClient.get(`/links.php?cotizacion_id=${encodeURIComponent(cotizacionId)}`)
  return normalizarLink(response?.link, response)
}

export async function generarLinkPublico(cotizacionId) {
  const response = await apiClient.post('/links.php', {
    cotizacion_id: Number(cotizacionId)
  })

  return normalizarLink(response?.link, response)
}

export async function revocarLinkPublico(cotizacionId) {
  const response = await apiClient.delete(`/links.php?cotizacion_id=${encodeURIComponent(cotizacionId)}`)
  return normalizarLink(response?.link, response)
}
