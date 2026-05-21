# DOOH Maps - Contrato de API del Frontend

## Objetivo

Este documento resume los endpoints que el frontend espera consumir desde una API PHP 8 externa. Ninguno de estos endpoints forma parte del repositorio React actual.

## Base URL

Todas las peticiones parten de:

- `VITE_API_BASE_URL`
- fallback local de desarrollo: `/api`

Ejemplo:

```env
VITE_API_BASE_URL=https://tu-dominio.com/api
```

## Nota sobre autenticacion mock

Durante desarrollo puede usarse:

```env
VITE_AUTH_MOCK=true
```

Con esta bandera:

- el login funciona en modo frontend controlado
- no se usan credenciales reales
- la sesion simulada solo sirve para navegar
- debe desactivarse en produccion

## Flujo temporal actual del parser

Mientras no exista persistencia real:

1. El parser procesa el archivo en frontend.
2. El resultado se convierte en una `cotizacionTemporal`.
3. Esa cotizacion se guarda en `sessionStorage` bajo la clave `dooh_cotizacion_temporal`.
4. La pantalla de tratamiento consume ese estado temporal.

Este mecanismo sera reemplazado por la API PHP 8 externa.

## Endpoints esperados por modulo

### Autenticacion

Endpoints futuros esperados:

- `POST /login.php`
- `POST /logout.php`
- `GET /session.php`

Payload esperado para login:

```json
{
  "usuario": "operaciones.ntp",
  "password": "********"
}
```

Respuesta esperada de sesion:

```json
{
  "ok": true,
  "usuario": {
    "id": "usr-01",
    "nombre": "Mariana Torres",
    "rol": "Operaciones",
    "area": "NTP Media"
  },
  "token": "jwt-o-token-equivalente"
}
```

### Cotizaciones

Endpoints futuros esperados:

- `GET /quotations.php`
- `GET /quotation.php?id=:id`
- `POST /quotations.php`
- `PUT /quotation.php?id=:id`

Campos operativos esperados por cotizacion:

| Campo | Tipo |
| --- | --- |
| `id` | string |
| `nombreCampana` | string |
| `cliente` | string |
| `nombreArchivo` | string |
| `nombreHoja` | string |
| `fechaCreacion` | string |
| `estado` | string |
| `totalPantallas` | number |
| `totalPantallasActivas` | number |
| `columnas` | array |
| `ubicaciones` | array |

Campos esperados por cada ubicacion parseada:

| Campo | Tipo |
| --- | --- |
| `idTemporal` | string |
| `campaignName` | string |
| `cliente` | string |
| `sheetName` | string |
| `screenName` | string |
| `city` | string |
| `venueType` | string |
| `latitude` | number or null |
| `longitude` | number or null |
| `dimensions` | string |
| `impressions` | number |
| `cardinalPoint` | string |
| `isValid` | boolean |
| `is_active` | boolean |
| `errors` | string[] |
| `rawPayload` | object |

Notas del parser:

- el frontend intenta detectar primero `Inventory - Screens`
- si no existe, busca variantes como `Inventory`, `Screens`, `Inventory Screens`, `Inventory-Screens`, `Inventario` y `Pantallas`
- la columna `Maps` se elimina automaticamente antes de formar el payload

### Usuarios

Endpoint futuro esperado:

- `GET /users.php`

Campos esperados por usuario:

| Campo | Tipo |
| --- | --- |
| `id` | string |
| `nombre` | string |
| `area` | string |
| `rol` | string |
| `estadoCredenciales` | string |
| `ultimoAcceso` | string |
| `totalCotizacionesCreadas` | number |

### Locations

Endpoints actualmente preparados por `src/services/locationsApi.js`:

- `POST /save_locations.php`
- `GET /get_locations.php`
- `GET /get_campaign.php?id=:campaignId`
- `DELETE /delete_location.php?id=:locationId`

Payload esperado para guardar locations:

```json
{
  "locations": [
    {
      "campaignName": "Campana Q2 2026",
      "screenName": "Pantalla Centro",
      "city": "Madrid",
      "venueType": "Street",
      "latitude": 40.4168,
      "longitude": -3.7038,
      "cardinalPoint": "Centro",
      "dimensions": "1920x1080",
      "impressions": 15000
    }
  ]
}
```

## Reglas de integracion

- la API externa debe aceptar `Content-Type: application/json`
- si la API vive en otro dominio, debe habilitar CORS
- si cambian nombres de rutas o payloads, deben ajustarse los servicios frontend
- no hay backend PHP dentro de este repositorio
