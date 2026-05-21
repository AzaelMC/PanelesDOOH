# DOOH Maps - Estructura del Proyecto

## Resumen

DOOH Maps es una base administrativa frontend-only preparada para conectar con una API PHP 8 externa. La app ya incluye autenticacion mock temporal, rutas protegidas, parser frontend de Excel y CSV, modulos operativos y placeholders para integraciones futuras.

## Estructura de directorios

```text
src/
|-- App.jsx
|-- main.jsx
|-- index.css
|-- assets/
|-- components/
|   |-- layout/
|   |   |-- DisenoAplicacion.jsx
|   |   `-- Encabezado.jsx
|   `-- ui/
|       |-- Boton.jsx
|       |-- Tarjeta.jsx
|       |-- CampoTexto.jsx
|       `-- EtiquetaEstado.jsx
|-- config/
|   `-- env.js
|-- routes/
|   |-- AppRouter.jsx
|   `-- RutaPrivada.jsx
|-- services/
|   |-- apiClient.js
|   `-- locationsApi.js
`-- features/
    |-- autenticacion/
    |   |-- components/
    |   |   `-- FormularioLogin.jsx
    |   |-- context/
    |   |   |-- ContextoAutenticacion.jsx
    |   |   |-- authContext.js
    |   |   `-- useAutenticacion.js
    |   |-- pages/
    |   |   `-- PantallaLogin.jsx
    |   `-- services/
    |       `-- autenticacionApi.js
    |-- panel/
    |   |-- components/
    |   |   `-- TarjetaModulo.jsx
    |   `-- pages/
    |       `-- PanelPrincipal.jsx
    |-- cotizaciones/
    |   |-- components/
    |   |   |-- FiltrosCotizaciones.jsx
    |   |   |-- SelectorUsuarioCotizaciones.jsx
    |   |   `-- TarjetaCotizacion.jsx
    |   |-- data/
    |   |   `-- cotizacionesMock.js
    |   |-- pages/
    |   |   |-- HistorialCotizaciones.jsx
    |   |   `-- NuevaCotizacion.jsx
    |   `-- services/
    |       `-- cotizacionesApi.js
    |-- usuarios/
    |   |-- components/
    |   |   |-- TablaUsuarios.jsx
    |   |   `-- TarjetaUsuario.jsx
    |   |-- data/
    |   |   `-- usuariosMock.js
    |   |-- pages/
    |   |   `-- UsuariosSistema.jsx
    |   `-- services/
    |       `-- usuariosApi.js
    |-- tratamiento/
    |   |-- components/
    |   |   |-- BarraOperaciones.jsx
    |   |   |-- BotonAgregarColumna.jsx
    |   |   |-- GrillaTratamiento.jsx
    |   |   `-- ResumenPresupuesto.jsx
    |   |-- data/
    |   |   `-- tratamientoCotizacionMock.js
    |   |-- pages/
    |   |   `-- TratamientoCotizacion.jsx
    |   `-- utils/
    |       |-- aplicarOperacionMatematica.js
    |       `-- eliminarColumnaMaps.js
    |-- mapa-cliente/
    |   |-- components/
    |   |   |-- BuscadorPantallas.jsx
    |   |   |-- LienzoMapaPlaceholder.jsx
    |   |   |-- ModalStreetViewPlaceholder.jsx
    |   |   `-- PanelListadoPantallas.jsx
    |   |-- data/
    |   |   `-- pantallasMock.js
    |   `-- pages/
    |       `-- VistaMapaCliente.jsx
    |-- excel-import/
    |   |-- components/
    |   |   |-- CajaCargaExcel.jsx
    |   |   |-- DiagnosticoParser.jsx
    |   |   |-- EstadoParser.jsx
    |   |   |-- ResumenImportacion.jsx
    |   |   |-- SelectorHoja.jsx
    |   |   |-- TablaVistaUbicaciones.jsx
    |   |   `-- VistaColumnas.jsx
    |   |-- hooks/
    |   |   `-- useAnalizadorExcel.js
    |   `-- utils/
    |       |-- detectarColumnas.js
    |       |-- detectarFilaEncabezados.js
    |       |-- detectarHojaInventario.js
    |       |-- leerArchivoExcel.js
    |       |-- mapearFilasAUbicaciones.js
    |       |-- normalizarEncabezados.js
    |       |-- obtenerFilasVistaPrevia.js
    |       `-- prepararCotizacionDesdeExcel.js
    `-- locations/
        `-- utils/
            |-- calcularCentroCoordenadas.js
            |-- normalizarUbicacion.js
            |-- puntoCardinal.js
            `-- validarCoordenadas.js
```

## Capas principales

### `routes`

- define las rutas publicas y privadas del sistema
- protege las pantallas internas con `RutaPrivada`

### `features/autenticacion`

- encapsula login, contexto de sesion y servicio de autenticacion
- soporta `VITE_AUTH_MOCK=true` para desarrollo controlado

### `features/cotizaciones`

- administra la captura preliminar de campana y cliente
- integra el parser real de Excel y CSV
- genera cotizaciones temporales antes de enviarlas al backend real

### `features/excel-import`

- lee archivos `.xlsx`, `.xls` y `.csv` en navegador con SheetJS
- carga `xlsx` mediante import dinamico para reducir el bundle inicial
- detecta hoja de inventario y fila de encabezados
- identifica columnas clave del proveedor
- elimina la columna `Maps`
- produce una vista previa operativa de ubicaciones
- expone un diagnostico tecnico visible para QA con archivos reales

### `features/tratamiento`

- consume cotizaciones temporales desde `sessionStorage`
- prepara la grilla editable visual
- permite borrado logico activo/inactivo
- contiene el motor matematico base para columnas derivadas

### `features/mapa-cliente`

- resuelve la visualizacion dual cliente final
- mantiene placeholders de mapa y Street View hasta la siguiente fase

## Integracion con backend externo

Los servicios frontend esperan una API PHP 8 externa y no crean backend dentro del repo.

Puntos clave:

1. `apiClient.js` centraliza la comunicacion HTTP.
2. `autenticacionApi.js`, `cotizacionesApi.js`, `usuariosApi.js` y `locationsApi.js` apuntan a endpoints futuros.
3. La persistencia final de cotizaciones reemplazara el uso temporal de `sessionStorage`.
4. Los archivos reales de proveedor pueden revisarse localmente en `tmp/` sin formar parte del repositorio.
