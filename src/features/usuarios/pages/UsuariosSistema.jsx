import Tarjeta from '../../../components/ui/Tarjeta'
import TablaUsuarios from '../components/TablaUsuarios'
import TarjetaUsuario from '../components/TarjetaUsuario'
import { usuariosMock } from '../data/usuariosMock'

export default function UsuariosSistema() {
  const usuariosVigentes = usuariosMock.filter((usuario) => usuario.estadoCredenciales === 'Vigentes').length

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.36em] text-slate-500">
          Gobierno de accesos
        </p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-950">
              Usuarios del Sistema
            </h2>
            <p className="text-base leading-8 text-slate-600">
              Visualiza el estado de credenciales del equipo, revisa el ultimo acceso registrado
              y monitorea el volumen de cotizaciones creadas por cada perfil.
            </p>
          </div>

          <Tarjeta className="min-w-[240px] bg-white/80 text-right">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Credenciales vigentes
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{usuariosVigentes}</p>
          </Tarjeta>
        </div>
      </section>

      <TablaUsuarios usuarios={usuariosMock} />

      <div className="grid gap-5 lg:hidden">
        {usuariosMock.map((usuario) => (
          <TarjetaUsuario key={usuario.id} usuario={usuario} />
        ))}
      </div>
    </div>
  )
}
