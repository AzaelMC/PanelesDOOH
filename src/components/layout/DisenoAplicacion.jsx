import Encabezado from './Encabezado'

export default function DisenoAplicacion({ children }) {
  return (
    <div className="ntp-shell ntp-aurora-bg">
      <Encabezado />
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1440px]">
          {children}
        </div>
      </main>
    </div>
  )
}
