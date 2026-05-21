import { useMemo, useState } from 'react'
import { calcularCentroCoordenadas } from '../../locations/utils/calcularCentroCoordenadas'
import { obtenerPuntoCardinal } from '../../locations/utils/puntoCardinal'
import { detectarColumnas } from '../utils/detectarColumnas'
import { detectarFilaEncabezados } from '../utils/detectarFilaEncabezados'
import { detectarHojaInventario } from '../utils/detectarHojaInventario'
import { leerArchivoExcel } from '../utils/leerArchivoExcel'
import { mapearFilasAUbicaciones } from '../utils/mapearFilasAUbicaciones'
import { prepararCotizacionDesdeExcel } from '../utils/prepararCotizacionDesdeExcel'

function buildAdvertencias({ deteccionHoja, deteccionEncabezados, columnasDetectadas, resumen }) {
  const warnings = []

  if (deteccionHoja?.motivo && deteccionHoja.motivo !== 'coincidencia_exacta') {
    warnings.push(`Se uso la hoja "${deteccionHoja.nombreHoja}" por ${deteccionHoja.motivo}.`)
  }

  if (deteccionEncabezados?.indiceFila === -1) {
    warnings.push('No se detecto una fila de encabezados confiable.')
  }

  if (!columnasDetectadas.screenName) {
    warnings.push('No se detecto Screen name.')
  }

  if (!columnasDetectadas.latitude || !columnasDetectadas.longitude) {
    warnings.push('No se detectaron columnas de latitud y longitud.')
  }

  if (resumen?.filasInvalidas > 0) {
    warnings.push(`Hay ${resumen.filasInvalidas} filas invalidas que requieren revision.`)
  }

  return warnings
}

function getMensajeHojaNoUtilizable(hojas = []) {
  if (!hojas.length) {
    return 'No se encontraron hojas con datos.'
  }

  return 'No se encontro una hoja utilizable con columnas clave de inventario.'
}

export function useAnalizadorExcel() {
  const [archivoProcesado, setArchivoProcesado] = useState(null)
  const [nombreArchivo, setNombreArchivo] = useState('')
  const [hojas, setHojas] = useState([])
  const [nombreHojaSeleccionada, setNombreHojaSeleccionada] = useState('')
  const [deteccionHoja, setDeteccionHoja] = useState(null)
  const [deteccionEncabezados, setDeteccionEncabezados] = useState({
    indiceFila: -1,
    encabezados: [],
    score: 0
  })
  const [columnasDetectadas, setColumnasDetectadas] = useState({
    screenName: null,
    city: null,
    venueType: null,
    latitude: null,
    longitude: null,
    dimensions: null,
    impressions: null,
    maps: null
  })
  const [ubicaciones, setUbicaciones] = useState([])
  const [ubicacionesValidas, setUbicacionesValidas] = useState([])
  const [ubicacionesInvalidas, setUbicacionesInvalidas] = useState([])
  const [resumen, setResumen] = useState(null)
  const [diagnostico, setDiagnostico] = useState({
    hojaDetectada: '',
    motivoDeteccionHoja: '',
    filaEncabezados: -1,
    scoreEncabezados: 0,
    columnasDetectadas: {},
    centro: { latitude: null, longitude: null },
    advertencias: []
  })
  const [cotizacionTemporal, setCotizacionTemporal] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const hojaSeleccionada = useMemo(
    () => hojas.find((hoja) => hoja.nombre === nombreHojaSeleccionada) || null,
    [hojas, nombreHojaSeleccionada]
  )

  const reiniciarAnalizador = () => {
    setArchivoProcesado(null)
    setNombreArchivo('')
    setHojas([])
    setNombreHojaSeleccionada('')
    setDeteccionHoja(null)
    setDeteccionEncabezados({
      indiceFila: -1,
      encabezados: [],
      score: 0
    })
    setColumnasDetectadas({
      screenName: null,
      city: null,
      venueType: null,
      latitude: null,
      longitude: null,
      dimensions: null,
      impressions: null,
      maps: null
    })
    setUbicaciones([])
    setUbicacionesValidas([])
    setUbicacionesInvalidas([])
    setResumen(null)
    setDiagnostico({
      hojaDetectada: '',
      motivoDeteccionHoja: '',
      filaEncabezados: -1,
      scoreEncabezados: 0,
      columnasDetectadas: {},
      centro: { latitude: null, longitude: null },
      advertencias: []
    })
    setCotizacionTemporal(null)
    setError('')
  }

  const analizarHoja = (hoja, hojaMeta) => {
    const deteccion = detectarFilaEncabezados(hoja?.filas || [])
    const columnas = detectarColumnas(deteccion.encabezados || [])

    const mapeo = mapearFilasAUbicaciones({
      filas: hoja?.filas || [],
      indiceFilaEncabezados: deteccion.indiceFila,
      columnasDetectadas: columnas,
      nombreCampana: '',
      cliente: '',
      nombreHoja: hoja?.nombre || ''
    })

    const centro = calcularCentroCoordenadas(mapeo.ubicaciones)
    const ubicacionesConCardinal = mapeo.ubicaciones.map((ubicacion) => ({
      ...ubicacion,
      cardinalPoint: obtenerPuntoCardinal(
        ubicacion.latitude,
        ubicacion.longitude,
        centro.latitude,
        centro.longitude
      )
    }))

    const validas = ubicacionesConCardinal.filter((ubicacion) => ubicacion.isValid)
    const invalidas = ubicacionesConCardinal.filter((ubicacion) => !ubicacion.isValid)

    setDeteccionEncabezados(deteccion)
    setColumnasDetectadas(columnas)
    setUbicaciones(ubicacionesConCardinal)
    setUbicacionesValidas(validas)
    setUbicacionesInvalidas(invalidas)
    setResumen(mapeo.resumen)
    setDiagnostico({
      hojaDetectada: hoja?.nombre || '',
      motivoDeteccionHoja: hojaMeta?.motivo || '',
      filaEncabezados: deteccion.indiceFila,
      scoreEncabezados: deteccion.score,
      columnasDetectadas: columnas,
      centro,
      advertencias: buildAdvertencias({
        deteccionHoja: hojaMeta,
        deteccionEncabezados: deteccion,
        columnasDetectadas: columnas,
        resumen: mapeo.resumen
      })
    })
  }

  const manejarArchivo = async (archivo) => {
    setCargando(true)
    setError('')
    setCotizacionTemporal(null)

    try {
      const procesado = await leerArchivoExcel(archivo)
      const hojaDetectada = detectarHojaInventario(procesado.hojas)

      if (!hojaDetectada?.hoja) {
        throw new Error(getMensajeHojaNoUtilizable(procesado.hojas))
      }

      setArchivoProcesado(procesado)
      setNombreArchivo(procesado.nombreArchivo)
      setHojas(procesado.hojas)
      setNombreHojaSeleccionada(hojaDetectada.nombreHoja)
      setDeteccionHoja(hojaDetectada)
      analizarHoja(hojaDetectada.hoja, hojaDetectada)
    } catch (readError) {
      console.error('[Parser Excel] Error procesando archivo', readError)
      reiniciarAnalizador()
      setError(readError.message || 'No fue posible procesar el archivo.')
    } finally {
      setCargando(false)
    }
  }

  const seleccionarHoja = (nombreHoja) => {
    setNombreHojaSeleccionada(nombreHoja)
    const hoja = hojas.find((item) => item.nombre === nombreHoja)

    if (hoja) {
      const meta = {
        hoja,
        nombreHoja,
        motivo: 'seleccion_manual'
      }

      setDeteccionHoja(meta)
      analizarHoja(hoja, meta)
    }
  }

  const prepararCotizacion = ({ nombreCampana, cliente }) => {
    if (!archivoProcesado) {
      throw new Error('No hay archivo cargado para preparar una cotizacion temporal.')
    }

    const resultado = prepararCotizacionDesdeExcel({
      archivoProcesado: {
        ...archivoProcesado,
        hojaPreferida: nombreHojaSeleccionada
      },
      nombreCampana,
      cliente
    })

    setCotizacionTemporal(resultado.cotizacionTemporal)
    setDiagnostico(resultado.diagnostico)
    setUbicaciones(resultado.cotizacionTemporal.ubicaciones)
    setUbicacionesValidas(
      resultado.cotizacionTemporal.ubicaciones.filter((ubicacion) => ubicacion.isValid)
    )
    setUbicacionesInvalidas(
      resultado.cotizacionTemporal.ubicaciones.filter((ubicacion) => !ubicacion.isValid)
    )
    setResumen(resultado.cotizacionTemporal.resumen)

    return resultado
  }

  return {
    nombreArchivo,
    hojas,
    nombreHojaSeleccionada,
    hojaSeleccionada,
    deteccionHoja,
    deteccionEncabezados,
    columnasDetectadas,
    ubicaciones,
    ubicacionesValidas,
    ubicacionesInvalidas,
    resumen,
    diagnostico,
    cotizacionTemporal,
    cargando,
    error,
    manejarArchivo,
    seleccionarHoja,
    prepararCotizacion,
    reiniciarAnalizador
  }
}
