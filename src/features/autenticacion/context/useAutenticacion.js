import { useContext } from 'react'
import { AuthContext } from './authContext'

export function useAutenticacion() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAutenticacion debe usarse dentro de ProveedorAutenticacion.')
  }

  return context
}
