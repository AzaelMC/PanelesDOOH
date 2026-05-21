import Boton from '../../../components/ui/Boton'

export default function ModalStreetViewPlaceholder({ open, pantalla, onClose }) {
  if (!open || !pantalla) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[32px] border border-white/60 bg-white p-8 shadow-[0_30px_65px_-28px_rgba(15,23,42,0.55)]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.36em] text-slate-500">
              Street View placeholder
            </p>
            <h3 className="text-2xl font-semibold text-slate-950">{pantalla.screenName}</h3>
            <p className="text-sm text-slate-500">{pantalla.city}</p>
          </div>

          <Boton variant="ghost" onClick={onClose}>
            Cerrar
          </Boton>
        </div>

        <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-6">
          <div className="space-y-3 text-sm text-slate-600">
            <p><span className="font-semibold text-slate-900">Coordenadas:</span> {pantalla.latitude}, {pantalla.longitude}</p>
            <p><span className="font-semibold text-slate-900">Tipo de venue:</span> {pantalla.venueType}</p>
            <p><span className="font-semibold text-slate-900">Dimensiones:</span> {pantalla.dimensions}</p>
          </div>

          <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-500">
            Google Street View se integrara posteriormente con las coordenadas de la pantalla.
          </div>
        </div>
      </div>
    </div>
  )
}
