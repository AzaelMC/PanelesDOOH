import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AUTH_MOCK_ENABLED } from '../../../config/env'
import Boton from '../../../components/ui/Boton'
import CampoTexto from '../../../components/ui/CampoTexto'
import Tarjeta from '../../../components/ui/Tarjeta'
import CajaCargaExcel from '../../excel-import/components/CajaCargaExcel'
import DiagnosticoParser from '../../excel-import/components/DiagnosticoParser'
import EstadoParser from '../../excel-import/components/EstadoParser'
import ResumenImportacion from '../../excel-import/components/ResumenImportacion'
import SelectorHoja from '../../excel-import/components/SelectorHoja'
import TablaVistaUbicaciones from '../../excel-import/components/TablaVistaUbicaciones'
import VistaColumnas from '../../excel-import/components/VistaColumnas'
import { useAnalizadorExcel } from '../../excel-import/hooks/useAnalizadorExcel'
import { crearCotizacion } from '../services/cotizacionesApi'

const STORAGE_KEY = 'dooh_cotizacion_temporal'

export default function NuevaCotizacion() {
  const navigate = useNavigate()
  const [errorFormulario, setErrorFormulario] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [formData, setFormData] = useState({
    nombreCampana: '',
    cliente: '',
    notasInternas: ''
  })

  const {
    nombreArchivo,
    hojas,
    nombreHojaSeleccionada,
    deteccionHoja,
    deteccionEncabezados,
    columnasDetectadas,
    ubicaciones,
    ubicacionesValidas,
    ubicacionesInvalidas,
    resumen,
    diagnostico,
    cargando,
    error,
    manejarArchivo,
    seleccionarHoja,
    prepararCotizacion,
    reiniciarAnalizador
  } = useAnalizadorExcel()

  const puedeContinuar =
    formData.nombreCampana.trim() &&
    formData.cliente.trim() &&
    ubicacionesValidas.length > 0 &&
    !cargando &&
    !guardando

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: value
    }))

    if (errorFormulario) {
      setErrorFormulario('')
    }
  }

  const handleContinue = async () => {
    if (!puedeContinuar) {
      setErrorFormulario('Completa campana, cliente y aseguremos al menos una ubicacion valida.')
      return
    }

    try {
      const resultado = prepararCotizacion({
        nombreCampana: formData.nombreCampana.trim(),
        cliente: formData.cliente.trim()
      })

      const cotizacionTemporal = {
        ...resultado.cotizacionTemporal,
        notasInternas: formData.notasInternas.trim(),
        diagnostico: resultado.diagnostico
      }

      if (AUTH_MOCK_ENABLED) {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cotizacionTemporal))
        navigate(`/cotizaciones/${cotizacionTemporal.id}/tratamiento`)
        return
      }

      setGuardando(true)

      const response = await crearCotizacion(cotizacionTemporal)
      const cotizacionId = response.cotizacionId || response.cotizacion?.id

      if (!cotizacionId) {
        throw new Error('La API no devolvio un cotizacionId valido.')
      }

      window.sessionStorage.removeItem(STORAGE_KEY)
      navigate(`/cotizaciones/${cotizacionId}/tratamiento`)
    } catch (prepareError) {
      console.error('[Nueva Cotizacion] Error preparando o guardando la cotizacion', prepareError)
      setErrorFormulario(prepareError.message || 'No fue posible guardar la cotizacion.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="ntp-aurora-bg--upload space-y-8">
      <section className="max-w-3xl space-y-4">
        <p className="ntp-page-eyebrow">
          Pipeline de ingesta
        </p>
        <h2 className="ntp-page-title text-4xl">
          Cargar Nueva Cotizacion
        </h2>
        <p className="ntp-body-copy text-base leading-8">
          El parser se ejecuta completamente en el navegador, detecta la hoja de inventario,
          localiza encabezados y ahora guarda la cotizacion real en la API antes de pasar al tratamiento.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)]">
        <div className="space-y-6">
          <Tarjeta className="ntp-glass-card space-y-6">
            <div className="space-y-2">
              <h3 className="ntp-page-title text-xl">Carga inicial del archivo</h3>
              <p className="ntp-body-copy text-sm">
                Se soportan archivos `.xlsx`, `.xls` y `.csv`. El analisis es local y solo se envia a backend al confirmar la cotizacion.
              </p>
            </div>

            <CajaCargaExcel onFileSelect={manejarArchivo} disabled={cargando || guardando} />

            <div className="flex flex-wrap gap-3">
              <Boton
                variant="brandSecondary"
                onClick={reiniciarAnalizador}
                disabled={!nombreArchivo || cargando || guardando}
              >
                Limpiar archivo
              </Boton>
            </div>
          </Tarjeta>

          <EstadoParser
            nombreArchivo={nombreArchivo}
            hojas={hojas}
            cargando={cargando}
            error={error}
            resumen={resumen}
          />

          {hojas.length > 0 && (
            <SelectorHoja
              hojas={hojas}
              nombreHojaSeleccionada={nombreHojaSeleccionada}
              onSeleccionarHoja={seleccionarHoja}
              motivoDeteccion={deteccionHoja?.motivo || ''}
            />
          )}

          {hojas.length > 0 && (
            <VistaColumnas
              columnasDetectadas={columnasDetectadas}
              mapsEliminada={Boolean(resumen?.columnaMapsEliminada)}
            />
          )}

          {resumen && (
            <ResumenImportacion
              nombreArchivo={nombreArchivo}
              nombreHoja={nombreHojaSeleccionada}
              deteccionEncabezados={deteccionEncabezados}
              resumen={resumen}
            />
          )}

          {ubicaciones.length > 0 && <TablaVistaUbicaciones ubicaciones={ubicaciones} />}
        </div>

        <div className="space-y-6">
          <Tarjeta className="ntp-glass-card-strong space-y-5">
            <div className="space-y-2">
              <h3 className="ntp-page-title text-xl">Datos preliminares</h3>
              <p className="ntp-body-copy text-sm">
                Se incorporaran a la cotizacion real junto con el archivo ya analizado.
              </p>
            </div>

            <CampoTexto
              label="Nombre de campana"
              name="nombreCampana"
              placeholder="Ej. Lanzamiento Andromeda"
              value={formData.nombreCampana}
              onChange={handleChange}
            />

            <CampoTexto
              label="Cliente"
              name="cliente"
              placeholder="Ej. Aurea Telecom"
              value={formData.cliente}
              onChange={handleChange}
            />

            <CampoTexto
              as="textarea"
              rows={5}
              label="Notas internas"
              name="notasInternas"
              placeholder="Comentarios operativos, prioridades o notas de curaduria."
              value={formData.notasInternas}
              onChange={handleChange}
            />

            {errorFormulario && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorFormulario}
              </div>
            )}

            <Boton variant="brand" size="lg" onClick={handleContinue} disabled={!puedeContinuar} loading={guardando}>
              Continuar a tratamiento
            </Boton>

            {guardando && (
              <p className="ntp-body-copy text-sm">
                Guardando pantallas por lotes...
              </p>
            )}
          </Tarjeta>

          {diagnostico.advertencias.length > 0 && (
            <Tarjeta className="ntp-glass-card space-y-4">
              <h3 className="ntp-page-title text-lg">Advertencias del parser</h3>
              <ul className="space-y-3 text-sm leading-7 text-slate-600">
                {diagnostico.advertencias.map((advertencia) => (
                  <li key={advertencia}>{advertencia}</li>
                ))}
              </ul>
            </Tarjeta>
          )}

          <DiagnosticoParser
            nombreArchivo={nombreArchivo}
            hojas={hojas}
            deteccionHoja={deteccionHoja}
            deteccionEncabezados={deteccionEncabezados}
            columnasDetectadas={columnasDetectadas}
            resumen={resumen}
            ubicacionesInvalidas={ubicacionesInvalidas}
          />
        </div>
      </div>
    </div>
  )
}
