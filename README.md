# DOOH Maps

Frontend administrativo construido con React, Vite, Tailwind CSS y React Router para operar cotizaciones DOOH, tratamiento de inventarios y validacion geografica de pantallas.

## Estado del repositorio

Este proyecto contiene unicamente el frontend. No existen carpetas `/api` ni `/database` dentro del repositorio.

## Backend externo

La API PHP 8 y la base de datos MySQL seran alojadas fuera de este repositorio, directamente en el servidor o cPanel. El frontend se comunicara con esa API mediante la variable `VITE_API_BASE_URL`.

## Stack actual

- React 19
- Vite
- Tailwind CSS 4
- react-router-dom
- xlsx
- JavaScript

## Rutas principales

- `/login`
- `/panel`
- `/cotizaciones/nueva`
- `/cotizaciones/historial`
- `/cotizaciones/:cotizacionId/tratamiento`
- `/cotizaciones/:cotizacionId/mapa`
- `/usuarios`

## Parser frontend de Excel y CSV

La carga de archivos se ejecuta completamente en el navegador.

Flujo actual:

1. El usuario carga un archivo `.xlsx`, `.xls` o `.csv`.
2. El frontend detecta la hoja `Inventory - Screens` o la mejor alternativa disponible.
3. El parser localiza la fila de encabezados aunque no este en la primera fila.
4. Se detectan columnas clave, se elimina `Maps`, se convierten coordenadas e impresiones y se calcula el punto cardinal.
5. Se muestra una vista previa antes de continuar.
6. Puede desplegarse un diagnostico tecnico discreto para revisar hoja, score, columnas y errores frecuentes.
7. La cotizacion temporal se guarda en `sessionStorage` con la clave `dooh_cotizacion_temporal`.
8. La pantalla de tratamiento consume esa cotizacion temporal mientras no exista backend real.

Importante:

- `xlsx` se carga con import dinamico para no inflar el bundle inicial.
- `sessionStorage` es solo un mecanismo temporal de frontend.
- El payload temporal evita guardar el workbook completo y omite datos crudos innecesarios.
- La persistencia definitiva sera reemplazada por la API PHP 8 externa.

## Configuracion de entorno

Ejemplo minimo:

```env
VITE_API_BASE_URL=https://tu-dominio.com/api
VITE_AUTH_MOCK=true
```

### `VITE_AUTH_MOCK`

Mientras no exista backend real, el login puede funcionar en modo controlado:

- no usa credenciales reales
- genera una sesion simulada solo para navegar
- debe desactivarse en produccion

## Modulos disponibles

- Portal de autenticacion
- Dashboard administrativo
- Nueva cotizacion con parser real de Excel y CSV
- Historial de cotizaciones
- Usuarios del sistema
- Tratamiento de cotizacion con grilla y operaciones matematicas
- Vista cliente con placeholder de mapa y Street View

## Funcionalidades aun en mock

- autenticacion real con PHP
- persistencia real de cotizaciones
- historial cargado desde backend
- usuarios cargados desde backend
- Google Maps real
- Google Street View real

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

## Documentacion

- `docs/project-structure.md`
- `docs/api-contract.md`
- `CONTROL_DE_CAMBIOS.md`
