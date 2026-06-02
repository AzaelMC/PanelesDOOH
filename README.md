# DOOH Maps

Frontend administrativo construido con React, Vite, Tailwind CSS y React Router para operar cotizaciones DOOH, tratamiento de inventarios y validacion geografica de pantallas.

## Estado del repositorio

Este proyecto contiene unicamente el frontend. No existen carpetas `/api` ni `/database` dentro del repositorio.

## Backend externo

La autenticacion real y la persistencia viven fuera de este repositorio, en la API PHP disponible en:

- `https://www.ntpmedia.com.mx/Dooh/dooh_api`

El frontend se comunica con esa API mediante `VITE_API_BASE_URL`.

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

## Autenticacion real

El login real usa estos endpoints externos:

- `POST /login.php`
- `GET /session.php`
- `POST /logout.php`
- `GET /health.php`

Comportamiento actual:

- `VITE_AUTH_MOCK` solo activa el mock cuando su valor es exactamente `true`
- con `VITE_AUTH_MOCK=false`, el frontend no crea usuarios falsos ni tokens fake
- el token se guarda en `localStorage` con la clave `dooh_auth_token`
- el usuario autenticado se guarda en `localStorage` con la clave `dooh_auth_user`
- `apiClient` agrega `Authorization: Bearer <token>` automaticamente cuando existe token
- `/usuarios` solo permite acceso a `administrador`

## Persistencia real de cotizaciones

El flujo principal ya consume la API real:

- `GET /cotizaciones.php`
- `POST /cotizaciones.php`
- `GET /cotizacion.php?id=:id`
- `PUT /cotizacion.php?id=:id`
- `DELETE /cotizacion.php?id=:id`
- `GET /usuarios.php`
- `POST /usuarios.php`

Comportamiento actual:

- Nueva Cotizacion prepara el archivo localmente y despues intenta guardar la cotizacion real antes de navegar a tratamiento.
- Historial carga cotizaciones reales desde backend.
- Tratamiento abre una cotizacion real por `cotizacionId` y guarda cambios con `PUT`.
- Usuarios del sistema carga usuarios reales desde backend.
- `sessionStorage` deja de ser el flujo principal y solo queda como respaldo cuando `VITE_AUTH_MOCK=true`.

## Parser frontend de Excel y CSV

La carga de archivos se ejecuta completamente en el navegador.

Flujo actual:

1. El usuario carga un archivo `.xlsx`, `.xls` o `.csv`.
2. El frontend detecta la hoja `Inventory - Screens` o la mejor alternativa disponible.
3. El parser localiza la fila de encabezados aunque no este en la primera fila.
4. Se detectan columnas clave, se elimina `Maps`, se convierten coordenadas e impresiones y se calcula el punto cardinal.
5. Se muestra una vista previa antes de continuar.
6. Puede desplegarse un diagnostico tecnico discreto para revisar hoja, score, columnas y errores frecuentes.
7. En modo real, la cotizacion se envía a la API al continuar.
8. En modo mock, puede mantenerse una `cotizacionTemporal` en `sessionStorage` con la clave `dooh_cotizacion_temporal`.

Importante:

- `xlsx` se carga con import dinamico para no inflar el bundle inicial.
- `sessionStorage` ya no es el mecanismo principal de guardado.
- el payload temporal evita guardar el workbook completo y omite datos crudos innecesarios.

## Configuracion de entorno

Usa un archivo `.env.local` en la raiz:

```env
VITE_API_BASE_URL=https://www.ntpmedia.com.mx/Dooh/dooh_api
VITE_AUTH_MOCK=false
```

`.env.local` ya esta ignorado en `.gitignore`.

### `VITE_AUTH_MOCK`

- `true`: activa el mock controlado de autenticacion y respaldos visuales de cotizaciones
- `false` o sin definir: usa autenticacion y persistencia reales

## Modulos disponibles

- Portal de autenticacion
- Dashboard administrativo
- Nueva cotizacion con parser real de Excel y CSV
- Historial de cotizaciones
- Usuarios del sistema
- Tratamiento de cotizacion con grilla y operaciones matematicas
- Vista cliente con placeholder de mapa y Street View

## Funcionalidades aun en mock

- respaldo de cotizaciones y usuarios solo cuando `VITE_AUTH_MOCK=true`
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

## Correccion de autenticacion real

### Modificado

- VITE_AUTH_MOCK ahora solo activa mock si su valor es exactamente true.
- Login real ya no permite fallback a mock.
- Si la API falla, el usuario no entra al sistema.
- apiClient agrega Authorization Bearer.
- Formulario de login usa correo.
- Encabezado y panel muestran Usuarios solo para rol administrador.
- Ruta /usuarios queda protegida por rol administrador.

### Restricciones respetadas

- Sin backend dentro del repositorio.
- Sin SQL.
- Sin credenciales reales hardcodeadas.
- Modo mock conservado solo cuando VITE_AUTH_MOCK=true.

## 2026-06-01 - Persistencia real de cotizaciones

### Agregado

- Integracion con GET /cotizaciones.php.
- Integracion con POST /cotizaciones.php.
- Integracion con GET /cotizacion.php?id=.
- Integracion con PUT /cotizacion.php?id=.
- Integracion con GET /usuarios.php.
- Nueva Cotizacion guarda en MySQL mediante API externa.
- Historial muestra cotizaciones reales.
- Tratamiento consume cotizacion real desde backend.
- Usuarios del sistema consume usuarios reales.

### Modificado

- sessionStorage deja de ser el flujo principal de guardado.
- Mocks de cotizaciones y usuarios quedan solo como respaldo de desarrollo.
- Grilla de tratamiento trabaja con cotizacion_id real.

### Restricciones respetadas

- Sin backend dentro del repositorio.
- Sin SQL.
- Sin tablas fisicas por cotizacion.
- Sin crear una cotizacion nueva por cada edicion.
