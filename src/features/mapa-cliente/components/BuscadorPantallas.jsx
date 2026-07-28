import CampoTexto from '../../../components/ui/CampoTexto'

export default function BuscadorPantallas({ value, onChange, name = 'busquedaPantalla' }) {
  return (
    <CampoTexto
      name={name}
      placeholder="Buscar pantalla o ciudad"
      value={value}
      onChange={onChange}
    />
  )
}
