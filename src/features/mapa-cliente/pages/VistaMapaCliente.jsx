import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Tarjeta from '../../../components/ui/Tarjeta'
import { cotizacionesMock } from '../../cotizaciones/data/cotizacionesMock'
import BuscadorPantallas from '../components/BuscadorPantallas'
import LienzoMapaPlaceholder from '../components/LienzoMapaPlaceholder'
import ModalStreetViewPlaceholder from '../components/ModalStreetViewPlaceholder'
import PanelListadoPantallas from '../components/PanelListadoPantallas'
import { pantallasMock } from '../data/pantallasMock'

export default function VistaMapaCliente() {
  const { cotizacionId } = useParams()
  const [busqueda, setBusqueda] = useState('')
  const [pantallaSeleccionadaId, setPantallaSeleccionadaId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const cotizacion =
    cotizacionesMock.find((item) => item.id === cotizacionId) ||
    cotizacionesMock.find((item) => item.id === 'cot-005') ||
    cotizacionesMock[0]

  const pantallasActivas = useMemo(() => {
    return pantallasMock.filter((pantalla) => pantalla.is_active)
  }, [])

  const pantallasFiltradas = useMemo(() => {
    const search = busqueda.trim().toLowerCase()

    return pantallasActivas.filter((pantalla) => {
      if (!search) {
        return true
      }

      return (
        pantalla.screenName.toLowerCase().includes(search) ||
        pantalla.city.toLowerCase().includes(search)
      )
    })
  }, [pantallasActivas, busqueda])

  const pantallaSeleccionada =
    pantallasFiltradas.find((pantalla) => pantalla.id === pantallaSeleccionadaId) ||
    pantallasFiltradas[0] ||
    null

  const seleccionarPantalla = (id) => {
    setPantallaSeleccionadaId(id)
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.36em] text-slate-500">
          Visualizacion dual cliente final
        </p>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950">
              {cotizacion.nombreCampana}
            </h2>
            <p className="text-base leading-8 text-slate-600">
              Split-layout preparado para validar pantallas activas, sincronizar seleccion entre listado y mapa,
              y abrir posteriormente Street View real por coordenadas.
            </p>
          </div>

          <Tarjeta className="min-w-[260px] space-y-2 bg-slate-950 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Cliente</p>
            <p className="text-2xl font-semibold">{cotizacion.cliente}</p>
            <p className="text-sm text-slate-300">
              Pantallas visibles: {pantallasFiltradas.length}
            </p>
          </Tarjeta>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-5">
          <BuscadorPantallas
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />

          <PanelListadoPantallas
            pantallas={pantallasFiltradas}
            pantallaSeleccionadaId={pantallaSeleccionadaId}
            seleccionarPantalla={seleccionarPantalla}
            onValidarEntorno={() => setModalOpen(true)}
          />
        </div>

        <LienzoMapaPlaceholder
          pantallas={pantallasFiltradas}
          pantallaSeleccionada={pantallaSeleccionada}
          seleccionarPantalla={seleccionarPantalla}
        />
      </div>

      <ModalStreetViewPlaceholder
        open={modalOpen}
        pantalla={pantallaSeleccionada}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
