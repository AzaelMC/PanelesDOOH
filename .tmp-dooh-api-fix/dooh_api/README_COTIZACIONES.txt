DOOH Maps API - Cotizaciones y pantallas reales

Subir estos archivos a:
  /public_html/Dooh/dooh_api/

Archivos incluidos:
  cotizaciones_helpers.php
  cotizaciones.php
  cotizacion.php
  usuarios.php
  pantalla.php

Requieren que ya existan:
  config.php
  db.php
  auth.php
  login.php
  session.php
  logout.php

Endpoints nuevos:

1) Listar cotizaciones
GET /cotizaciones.php
Requiere Authorization: Bearer TOKEN

Filtros opcionales:
  q
  usuarioId
  estatus
  limit
  offset

2) Guardar cotizacion completa
POST /cotizaciones.php
Requiere Authorization: Bearer TOKEN

Acepta payload desde el frontend:
{
  "nombreCampana": "Campana demo",
  "cliente": "Cliente demo",
  "nombreArchivo": "inventario.xlsx",
  "nombreHoja": "Inventory - Screens",
  "notasInternas": "",
  "diagnostico": {},
  "resumen": {},
  "columnas": [],
  "ubicaciones": []
}

Tambien acepta:
{
  "cotizacionTemporal": { ... }
}

3) Obtener detalle de cotizacion
GET /cotizacion.php?id=1
Requiere Authorization: Bearer TOKEN

4) Actualizar cotizacion
PUT /cotizacion.php?id=1
Requiere Authorization: Bearer TOKEN
Solo administrador o usuario creador.

5) Archivar cotizacion
DELETE /cotizacion.php?id=1
Requiere Authorization: Bearer TOKEN
Solo administrador.
No borra fisicamente, cambia estatus a archivada.

6) Listar usuarios
GET /usuarios.php
Requiere Authorization: Bearer TOKEN

7) Crear usuario
POST /usuarios.php
Requiere rol administrador.

8) Actualizar/desactivar pantalla
PUT /pantalla.php?id=1
DELETE /pantalla.php?id=1

Notas:
- Las cotizaciones se guardan siempre en ntp_dooh_cotizaciones.
- Las pantallas viven en ntp_dooh_pantallas con el mismo cotizacion_id.
- No se crean tablas fisicas por cotizacion ni por edicion.
- El borrado de pantallas es logico usando esta_activa=0.
