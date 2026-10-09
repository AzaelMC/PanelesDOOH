import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Boton from '../../../components/ui/Boton'

export default function ModalEliminarCotizacion({
  open,
  cotizacion,
  procesando = false,
  error = '',
  onClose,
  onConfirm
}) {
  const [confirmado, setConfirmado] = useState(false)

  useEffect(() => {
    if (open) {
      setConfirmado(false)
    }
  }, [open, cotizacion?.id])

  if (!open || !cotizacion || typeof document === 'undefined') {
    return null
  }

  const modal = (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-eliminar-cotizacion-titulo"
    >
      <div className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white p-6 shadow-2xl sm:p-7">
        <div className="space-y-2">
          <h3 id="modal-eliminar-cotizacion-titulo" className="ntp-page-title text-2xl text-slate-950">
            Eliminar cotización
          </h3>
          <p className="text-sm leading-6 text-slate-600">
            Esta acción no se puede deshacer.
          </p>
        </div>

        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-red-600"
            checked={confirmado}
            disabled={procesando}
            onChange={(event) => setConfirmado(event.target.checked)}
          />
          <span>Sí, quiero eliminar esta cotización.</span>
        </label>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Boton variant="secondary" onClick={onClose} disabled={procesando}>
            Cancelar
          </Boton>
          <Boton
            variant="danger"
            onClick={onConfirm}
            disabled={!confirmado || procesando}
            loading={procesando}
            className="disabled:opacity-50"
          >
            Eliminar cotización
          </Boton>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
