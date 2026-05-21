import AppRouter from './routes/AppRouter'
import { ProveedorAutenticacion } from './features/autenticacion/context/ContextoAutenticacion'

function App() {
  return (
    <ProveedorAutenticacion>
      <AppRouter />
    </ProveedorAutenticacion>
  )
}

export default App
