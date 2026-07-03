DOOH Maps API - Parche seguro PHP 7.4

Contexto:
No se debe subir la cuenta completa a PHP 8 porque hay una campaña activa en DV360 que depende de una API legacy en PHP 7.4.

Estrategia:
Mantener PHP 7.4 global y hacer compatible la API DOOH con PHP 7.4.

Subir a:
/public_html/Dooh/dooh_api/

Reemplazar:
- cotizaciones_helpers.php

Subir temporalmente:
- diagnostico_cotizaciones.php
- version_check.php

Orden recomendado:
1. Subir/reemplazar cotizaciones_helpers.php.
2. Subir diagnostico_cotizaciones.php y version_check.php.
3. Probar:
   https://www.ntpmedia.com.mx/Dooh/dooh_api/version_check.php
4. Pedir a Codex repetir POST /diagnostico_cotizaciones.php con token y payload actual.
5. Si responde dryRun=true, probar POST /cotizaciones.php.
6. Si POST /cotizaciones.php guarda bien, eliminar:
   - diagnostico_cotizaciones.php
   - version_check.php

Notas:
- diagnostico_cotizaciones.php incluye shutdown handler para devolver JSON aun si ocurre fatal error.
- No tocar PHP global mientras la campaña de DV360 esté viva.
