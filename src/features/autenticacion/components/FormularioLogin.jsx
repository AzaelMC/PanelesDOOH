import { useState } from 'react'
import Boton from '../../../components/ui/Boton'
import CampoTexto from '../../../components/ui/CampoTexto'
import Tarjeta from '../../../components/ui/Tarjeta'

export default function FormularioLogin({ onSubmit, error, loading, authMockEnabled }) {
  const [formData, setFormData] = useState({
    usuario: '',
    password: ''
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: value
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await onSubmit(formData)
  }

  return (
    <Tarjeta className="border-white/60 bg-white/90 p-8 sm:p-10">
      <div className="mb-8 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.36em] text-slate-500">
          Portal operativo
        </p>
        <h2 className="text-3xl font-semibold text-slate-950">Iniciar sesion</h2>
        <p className="text-sm text-slate-500">
          Acceso restringido a herramientas operacionales de NTP Media.
        </p>
        {authMockEnabled && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            Modo temporal de autenticacion mock habilitado para desarrollo. Debe desactivarse en produccion.
          </div>
        )}
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <CampoTexto
          label="Usuario"
          name="usuario"
          placeholder="usuario.operaciones"
          value={formData.usuario}
          onChange={handleChange}
          autoComplete="username"
        />

        <CampoTexto
          label="Contrasena"
          name="password"
          type="password"
          placeholder="Ingresa tu contrasena"
          value={formData.password}
          onChange={handleChange}
          autoComplete="current-password"
        />

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <Boton type="submit" fullWidth size="lg" loading={loading}>
          Iniciar sesion
        </Boton>
      </form>
    </Tarjeta>
  )
}
