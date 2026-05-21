import CampoTexto from '../../../components/ui/CampoTexto'

export default function SelectorUsuarioCotizaciones({ value, usuarios, onChange }) {
  return (
    <CampoTexto
      as="select"
      label="Usuario creador"
      name="usuario"
      value={value}
      onChange={onChange}
    >
      <option value="">Todos los usuarios</option>
      {usuarios.map((usuario) => (
        <option key={usuario.id} value={usuario.id}>
          {usuario.nombre}
        </option>
      ))}
    </CampoTexto>
  )
}
