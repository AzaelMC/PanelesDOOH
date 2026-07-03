DOOH Maps API - Endpoints batch PHP 7.4

Subir estos archivos a:
  /public_html/Dooh/dooh_api/

Archivos:
  cotizaciones_iniciar.php
  pantallas_lote.php
  cotizaciones_finalizar.php

Requieren:
  config.php
  db.php
  auth.php
  cotizaciones_helpers.php

Flujo:
1. POST /cotizaciones_iniciar.php
   Crea un registro base en ntp_dooh_cotizaciones y devuelve cotizacionId.

2. POST /pantallas_lote.php
   Inserta pantallas en ntp_dooh_pantallas usando el mismo cotizacionId.
   Limite de seguridad: maximo 75 pantallas por request.

3. POST /cotizaciones_finalizar.php
   Recalcula total_pantallas y pantallas_activas.
   Devuelve la cotizacion completa.

Notas:
- Compatible con PHP 7.4.
- No usa mixed, match, union types ni sintaxis PHP 8.
- No crea tablas por cotizacion.
- No crea una cotizacion por cada lote.
- Todas las pantallas quedan asociadas al mismo cotizacion_id.
