import CampoTexto from '../../../components/ui/CampoTexto'

export default function BuscadorPropuestaPublica({ value, onChange }) {
  return (
    <CampoTexto
      name="busquedaPantallaPropuesta"
      placeholder="Buscar pantalla o ciudad"
      value={value}
      onChange={onChange}
    />
  )
}
