import Encabezado from './Encabezado'

export default function DisenoAplicacion({ children }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.18),_transparent_36%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)]">
      <Encabezado />
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1440px]">
          {children}
        </div>
      </main>
    </div>
  )
}
