import Tarjeta from '../../../components/ui/Tarjeta'

function getMarkerPosition(screen, screens) {
  const latitudes = screens.map((item) => item.latitude)
  const longitudes = screens.map((item) => item.longitude)
  const minLat = Math.min(...latitudes)
  const maxLat = Math.max(...latitudes)
  const minLng = Math.min(...longitudes)
  const maxLng = Math.max(...longitudes)
  const latRange = maxLat - minLat || 1
  const lngRange = maxLng - minLng || 1

  return {
    top: `${12 + ((maxLat - screen.latitude) / latRange) * 70}%`,
    left: `${10 + ((screen.longitude - minLng) / lngRange) * 78}%`
  }
}

export default function LienzoMapaPlaceholder({
  pantallas,
  pantallaSeleccionada,
  seleccionarPantalla
}) {
  return (
    <Tarjeta className="flex h-full min-h-[620px] flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-950">Validacion Geografica</h3>
          <p className="text-sm text-slate-500">
            Google Maps se integrara en la siguiente fase.
          </p>
        </div>

        {pantallaSeleccionada && (
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Seleccion</p>
            <p className="mt-2 font-semibold text-slate-950">{pantallaSeleccionada.screenName}</p>
            <p className="text-sm text-slate-500">{pantallaSeleccionada.city}</p>
          </div>
        )}
      </div>

      <div className="relative flex-1 overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_#e2e8f0_0%,_#cbd5e1_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.65),_transparent_22%),linear-gradient(135deg,_rgba(15,23,42,0.06)_0%,_transparent_30%,_rgba(15,23,42,0.08)_100%)]" />
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:54px_54px]" />

        {pantallas.map((pantalla) => {
          const position = getMarkerPosition(pantalla, pantallas)
          const isSelected = pantallaSeleccionada?.id === pantalla.id

          return (
            <button
              key={pantalla.id}
              type="button"
              onClick={() => seleccionarPantalla(pantalla.id)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-4 transition ${
                isSelected
                  ? 'border-white bg-slate-950 text-white shadow-[0_20px_45px_-20px_rgba(15,23,42,0.65)]'
                  : 'border-white/70 bg-white text-slate-900 shadow-lg'
              }`}
              style={position}
            >
              <span className="inline-flex h-11 w-11 items-center justify-center text-xs font-semibold">
                {pantalla.city.slice(0, 2).toUpperCase()}
              </span>
            </button>
          )
        })}

        <div className="absolute bottom-6 left-6 right-6 rounded-[24px] border border-white/60 bg-white/85 p-5 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.35)] backdrop-blur">
          {pantallaSeleccionada ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Pantalla seleccionada</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {pantallaSeleccionada.screenName}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {pantallaSeleccionada.city} · {pantallaSeleccionada.venueType}
                </p>
              </div>

              <div className="grid gap-2 text-sm text-slate-600">
                <p>Coordenadas: {pantallaSeleccionada.latitude}, {pantallaSeleccionada.longitude}</p>
                <p>Dimension: {pantallaSeleccionada.dimensions}</p>
                <p>Impresiones: {pantallaSeleccionada.impressions.toLocaleString('es-MX')}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              Selecciona una pantalla desde el listado o desde un marcador mock para inspeccionar su contexto.
            </p>
          )}
        </div>
      </div>
    </Tarjeta>
  )
}
