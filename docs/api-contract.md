# DOOH Maps - Contrato de API del Frontend

## Objetivo

Este documento resume los endpoints que el frontend consume o espera consumir desde una API PHP 8 externa. Ninguno de estos endpoints forma parte del repositorio React actual.

## Base URL

Todas las peticiones parten de:

- `VITE_API_BASE_URL`
- fallback local: `/api`

Configuracion recomendada:

```env
VITE_API_BASE_URL=https://www.ntpmedia.com.mx/Dooh/dooh_api
VITE_AUTH_MOCK=false
```

## Autenticacion

### Modo mock

`VITE_AUTH_MOCK` solo activa el modo mock cuando su valor es exactamente `true`.

Si vale `false` o no existe:

- el frontend usa autenticacion real
- no se crean usuarios mock
- no se generan tokens fake

### Endpoints reales

- `POST /login.php`
- `GET /session.php`
- `POST /logout.php`
- `GET /health.php`

### Login

Request:

```json
{
  "usuario": "elena@ntpmedia.com.mx",
  "password": "********"
}
```

Respuesta esperada:

```json
{
  "ok": true,
  "mensaje": "Inicio de sesion correcto",
  "token": "jwt-o-token-equivalente",
  "expiraEn": "2026-06-01 18:00:00",
  "usuario": {
    "id": 1,
    "nombre": "Elena",
    "correo": "elena@ntpmedia.com.mx",
    "rol": "editor",
    "estaActivo": true,
    "ultimoAcceso": "2026-06-01 10:00:00"
  }
}
```

Comportamiento del frontend:

- guarda el token en `localStorage` con la clave `dooh_auth_token`
- guarda el usuario en `localStorage` con la clave `dooh_auth_user`
- envia `Authorization: Bearer <token>` en llamadas autenticadas
- si el login falla, no guarda token ni usuario

## Cotizaciones

### GET `/cotizaciones.php`

Respuesta observada:

```json
{
  "ok": true,
  "cotizaciones": [],
  "total": 0,
  "limit": 50,
  "offset": 0
}
```

Filtros soportados por frontend:

- `q`
- `usuarioId`
- `estatus`
- `limit`
- `offset`

### GET `/cotizacion.php?id=:id`

- requiere `Authorization: Bearer TOKEN`
- cuando no existe devuelve `404` con `mensaje`

El frontend normaliza tanto `ubicaciones` como `pantallas` si el backend usa cualquiera de esos nombres.

### POST `/cotizaciones.php`

Payload que envia el frontend:

```json
{
  "nombreCampana": "Campana Q2 2026",
  "cliente": "Cliente Demo",
  "nombreArchivo": "inventario.xlsx",
  "nombreHoja": "Inventory - Screens",
  "notasInternas": "Observaciones operativas",
  "diagnostico": {},
  "resumen": {},
  "columnas": [],
  "ubicaciones": [],
  "pantallas": [],
  "cotizacionTemporal": {
    "nombreCampana": "Campana Q2 2026",
    "cliente": "Cliente Demo",
    "nombreArchivo": "inventario.xlsx",
    "nombreHoja": "Inventory - Screens",
    "columnas": [],
    "ubicaciones": []
  }
}
```

Notas:

- el frontend envia `ubicaciones` y `pantallas` para tolerar contratos equivalentes
- si la API responde con `cotizacionId`, `id` o `cotizacion.id`, el frontend navega a `/cotizaciones/{id}/tratamiento`
- si la API falla, no navega ni guarda como definitivo en `sessionStorage`

### PUT `/cotizacion.php?id=:id`

El frontend reenvia la misma cotizacion, con sus `ubicaciones` actualizadas, sobre el mismo `cotizacion_id`.

Objetivo:

- no crear una nueva cotizacion por cada edicion
- conservar el mismo `cotizacion_id`

### DELETE `/cotizacion.php?id=:id`

Preparado para archivar cotizaciones desde servicio. La UI actual prioriza la edicion por `PUT`.

## Usuarios

### GET `/usuarios.php`

Respuesta observada:

```json
{
  "ok": true,
  "usuarios": [
    {
      "id": 3,
      "nombre": "Administrador",
      "correo": "admin@ntpmedia.com.mx",
      "area": "",
      "rol": "administrador",
      "estaActivo": true,
      "estadoCredenciales": "Activo",
      "ultimoAcceso": "2026-06-01 14:06:58",
      "totalCotizacionesCreadas": 0
    }
  ]
}
```

### POST `/usuarios.php`

El servicio frontend ya esta preparado para enviar altas de usuarios aunque la UI actual solo consume listado.

## Pantallas

El backend tambien expone:

- `PUT /pantalla.php?id=:id`
- `DELETE /pantalla.php?id=:id`

La integracion actual del frontend actualiza pantallas en bloque mediante `PUT /cotizacion.php?id=:id` para mantener consistente el estado de una misma cotizacion.

## Flujo temporal del parser

Mientras `VITE_AUTH_MOCK=true`:

1. El parser procesa el archivo en frontend.
2. El resultado se convierte en una `cotizacionTemporal`.
3. Esa cotizacion puede guardarse en `sessionStorage` bajo la clave `dooh_cotizacion_temporal`.
4. La pantalla de tratamiento puede consumir ese respaldo temporal.

Con `VITE_AUTH_MOCK=false`, ese respaldo deja de ser el flujo principal.

## Reglas de integracion

- la API externa debe aceptar `Content-Type: application/json`
- si la API vive en otro dominio, debe habilitar CORS
- si cambian nombres de rutas o payloads, deben ajustarse los servicios frontend
- no hay backend PHP dentro de este repositorio

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
