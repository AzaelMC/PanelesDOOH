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
    <Tarjeta className="ntp-glass-card-strong p-8 sm:p-10">
      <div className="mb-8 space-y-3">
        <p className="ntp-page-eyebrow">
          Portal operativo
        </p>
        <h2 className="ntp-page-title text-3xl">Iniciar sesion</h2>
        <p className="ntp-body-copy text-sm">
          Acceso restringido a herramientas operacionales de NTP Media.
        </p>
        {authMockEnabled && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            Modo temporal de autenticacion mock habilitado. Desactivalo para probar la API real.
          </div>
        )}
        {import.meta.env.DEV && (
          <p className="text-xs text-slate-500">
            Usa una cuenta autorizada del sistema.
          </p>
        )}
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <CampoTexto
          label="Correo"
          name="usuario"
          type="email"
          placeholder="usuario@empresa.com"
          value={formData.usuario}
          onChange={handleChange}
          autoComplete="username"
          required
        />

        <CampoTexto
          label="Contraseña"
          name="password"
          type="password"
          placeholder="Ingresa tu contraseña"
          value={formData.password}
          onChange={handleChange}
          autoComplete="current-password"
          required
        />

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <Boton type="submit" variant="brand" fullWidth size="lg" loading={loading}>
          Iniciar sesion
        </Boton>
      </form>
    </Tarjeta>
  )
}
