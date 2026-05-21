import CampoTexto from '../../../components/ui/CampoTexto'

export default function BuscadorPantallas({ value, onChange }) {
  return (
    <CampoTexto
      label="Buscador predictivo"
      name="busquedaPantalla"
      placeholder="Buscar por screen name o ciudad"
      value={value}
      onChange={onChange}
    />
  )
}
