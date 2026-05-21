const EXTENSIONES_PERMITIDAS = ['xlsx', 'xls', 'csv']

let xlsxModulePromise = null

function obtenerExtensionArchivo(nombre = '') {
  const parts = nombre.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : ''
}

function filaTieneContenido(fila = []) {
  return Array.isArray(fila) && fila.some((celda) => String(celda ?? '').trim() !== '')
}

function hojaTieneContenido(filas = []) {
  return Array.isArray(filas) && filas.some(filaTieneContenido)
}

function resolverMensajeLectura(error) {
  const mensaje = String(error?.message || '').toLowerCase()

  if (mensaje.includes('vacio')) {
    return 'El archivo esta vacio o no tiene estructura tabular.'
  }

  if (mensaje.includes('soportado')) {
    return 'Formato no soportado. Usa archivos .xlsx, .xls o .csv.'
  }

  if (mensaje.includes('sheet') || mensaje.includes('hoja')) {
    return 'No se encontraron hojas con datos.'
  }

  return 'No fue posible leer el archivo. Verifica que tenga hojas con datos tabulares.'
}

async function cargarModuloXlsx() {
  if (!xlsxModulePromise) {
    xlsxModulePromise = import('xlsx')
  }

  return xlsxModulePromise
}

export async function leerArchivoExcel(archivo) {
  if (!archivo) {
    throw new Error('No se recibio ningun archivo para procesar.')
  }

  if (archivo.size === 0) {
    throw new Error('El archivo esta vacio o no tiene estructura tabular.')
  }

  const extension = obtenerExtensionArchivo(archivo.name)

  if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
    throw new Error('Formato no soportado. Usa archivos .xlsx, .xls o .csv.')
  }

  try {
    const XLSX = await cargarModuloXlsx()
    const buffer = await archivo.arrayBuffer()
    const workbook = XLSX.read(buffer, {
      type: 'array',
      raw: false
    })

    if (!workbook?.SheetNames?.length) {
      throw new Error('No se encontraron hojas con datos.')
    }

    const hojas = workbook.SheetNames.map((nombreHoja) => {
      const hoja = workbook.Sheets[nombreHoja]
      const filas = XLSX.utils.sheet_to_json(hoja, {
        header: 1,
        defval: '',
        raw: false,
        blankrows: true
      })

      return {
        nombre: nombreHoja,
        filas: Array.isArray(filas) ? filas : []
      }
    })

    if (!hojas.some((hoja) => hojaTieneContenido(hoja.filas))) {
      throw new Error('No se encontraron hojas con datos.')
    }

    return {
      nombreArchivo: archivo.name,
      hojas
    }
  } catch (error) {
    console.error('[Parser Excel] Error al leer archivo', error)

    throw new Error(resolverMensajeLectura(error), {
      cause: error
    })
  }
}
