# Control de Cambios

## 2026-05-20 - Nomenclatura en espanol

### Agregado
- Renombrado de componentes base a espanol.
- Renombrado de utilidades propias del dominio a espanol.
- Ajuste de imports y exports del frontend existente.

### Modificado
- `src/App.jsx`
- `src/components/layout/DisenoAplicacion.jsx`
- `src/components/layout/Encabezado.jsx`
- `src/components/ui/Boton.jsx`
- `src/components/ui/Tarjeta.jsx`
- `src/components/ui/CampoTexto.jsx`
- `src/components/ui/EtiquetaEstado.jsx`
- `src/features/excel-import/components/CajaCargaExcel.jsx`
- `src/features/excel-import/components/VistaColumnas.jsx`
- `src/features/excel-import/components/ResumenImportacion.jsx`
- `src/features/excel-import/utils/normalizarEncabezados.js`
- `src/features/excel-import/utils/detectarColumnas.js`
- `src/features/excel-import/utils/obtenerFilasVistaPrevia.js`
- `src/features/locations/utils/normalizarUbicacion.js`
- `src/features/locations/utils/validarCoordenadas.js`
- `src/features/locations/utils/puntoCardinal.js`
- `README.md`
- `docs/project-structure.md`
- `docs/api-contract.md`

### Restricciones respetadas
- Sin backend dentro del repositorio.
- Sin SQL.
- Sin parser avanzado todavia.

## 2026-05-20 - Arquitectura de pantallas operacionales

### Agregado
- Pantalla de login.
- Dashboard principal.
- Modulo de nueva cotizacion.
- Historial de cotizaciones con filtro por usuario creador.
- Modulo de usuarios del sistema.
- Pantalla base de tratamiento de cotizacion.
- Utilidad para eliminar columna Maps.
- Motor matematico visual y utilidad base.
- Vista cliente en split-layout con placeholder de mapa.
- Modal placeholder para Street View.
- Rutas protegidas y contexto de autenticacion frontend.

### Modificado
- App.jsx para usar sistema de rutas.
- Encabezado para navegacion interna.
- Documentacion de estructura del proyecto.

### Restricciones respetadas
- Sin backend dentro del repositorio.
- Sin SQL.
- Sin Google Maps real.
- Sin Street View real.
- Sin parser avanzado todavia.
- Sin credenciales reales.

## 2026-05-20 - Parser real e integracion de cotizacion temporal

### Agregado
- Lectura real de archivos Excel/CSV con SheetJS.
- Deteccion automatica de hoja Inventory - Screens.
- Deteccion automatica de fila de encabezados.
- Deteccion de columnas relevantes.
- Eliminacion automatica de columna Maps.
- Vista previa de ubicaciones procesadas.
- Generacion de cotizacion temporal.
- Envio temporal a tratamiento mediante sessionStorage.
- Grilla de tratamiento con datos reales del archivo.
- Borrado logico de pantallas activas/inactivas.

### Modificado
- Nueva Cotizacion integra parser real.
- Tratamiento de Cotizacion consume cotizacion temporal.
- Resumen de presupuesto usa datos reales si estan disponibles.

### Restricciones respetadas
- Sin backend dentro del repositorio.
- Sin SQL.
- Sin guardado real en API.
- Sin Google Maps real.
- Sin Street View real.

## 2026-05-20 - QA de parser y optimizacion SheetJS

### Agregado
- Diagnostico tecnico del parser.
- Mejoras de aliases para archivos reales de proveedores.
- Validaciones mas claras para errores de lectura.

### Modificado
- Carga de SheetJS mediante import dinamico.
- Deteccion de hoja de inventario y encabezados.
- Limpieza de payload temporal en sessionStorage.

### Restricciones respetadas
- Sin backend dentro del repositorio.
- Sin SQL.
- Sin Google Maps real.
- Sin Street View real.
- Sin credenciales reales.
