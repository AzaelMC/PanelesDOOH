import { useState } from 'react'
import Boton from '../../../components/ui/Boton'
import Tarjeta from '../../../components/ui/Tarjeta'
import { enviarCorreoPropuesta } from '../services/correoPropuestaApi'

const BOTON_PUBLICO_SOLIDO = 'min-h-12 min-w-[176px] !border-transparent !bg-[#9E6DF7] px-8 !text-white shadow-[0_14px_32px_-22px_rgba(158,109,247,0.72)] hover:!bg-[#8c5be6]'
const BOTON_PUBLICO_SECUNDARIO = 'min-h-12 border border-[rgba(158,109,247,0.32)] bg-white/70 px-6 text-[#411189] hover:bg-[rgba(158,109,247,0.10)]'

export default function RespuestaPropuesta({ token }) {
  const [comentario, setComentario] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [modoComentarios, setModoComentarios] = useState(false)

  const enviar = async (respuesta) => {
    const comentarioLimpio = comentario.trim()

    if (respuesta === 'comentario' && !comentarioLimpio) {
      setError('No se pudo enviar')
      setMensaje('')
      return
    }

    setProcesando(true)
    setError('')
    setMensaje('')

    try {
      const payload = await enviarCorreoPropuesta({
        token,
        respuesta,
        comentario: respuesta === 'comentario' ? comentarioLimpio : null
      })

      setMensaje(payload?.mensaje || (respuesta === 'aceptada' ? 'Aceptado' : 'Enviado'))

      if (respuesta === 'comentario') {
        setComentario('')
        setModoComentarios(false)
      }
    } catch {
      setError('No se pudo enviar')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <Tarjeta className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h3 className="text-lg font-semibold text-slate-950">Aceptar propuesta</h3>

        {!modoComentarios && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Boton
              type="button"
              variant="secondary"
              onClick={() => {
                setModoComentarios(true)
                setMensaje('')
                setError('')
              }}
              disabled={!token || procesando}
              className={BOTON_PUBLICO_SECUNDARIO}
            >
              Enviar comentarios
            </Boton>
            <Boton
              type="button"
              variant="secondary"
              onClick={() => enviar('aceptada')}
              loading={procesando}
              disabled={!token}
              className={BOTON_PUBLICO_SOLIDO}
            >
              Aceptar
            </Boton>
          </div>
        )}
      </div>

      {modoComentarios && (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700" htmlFor="comentariosPropuesta">
            Comentarios
          </label>
          <textarea
            id="comentariosPropuesta"
            value={comentario}
            onChange={(event) => setComentario(event.target.value)}
            rows={4}
            className="w-full resize-y rounded-[22px] border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--ntp-purple-brand)] focus:ring-4 focus:ring-[rgba(var(--ntp-purple-brand-rgb),0.14)]"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Boton
              type="button"
              variant="secondary"
              onClick={() => {
                setModoComentarios(false)
                setComentario('')
                setMensaje('')
                setError('')
              }}
              disabled={procesando}
              className={BOTON_PUBLICO_SECUNDARIO}
            >
              Cerrar
            </Boton>
            <Boton
              type="button"
              variant="secondary"
              onClick={() => enviar('comentario')}
              loading={procesando}
              disabled={!token}
              className={BOTON_PUBLICO_SOLIDO}
            >
              Enviar
            </Boton>
          </div>
        </div>
      )}

      {mensaje && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
    </Tarjeta>
  )
}
