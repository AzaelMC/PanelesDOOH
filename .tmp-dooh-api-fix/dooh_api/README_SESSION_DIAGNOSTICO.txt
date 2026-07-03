DOOH Maps API - Diagnostico y fix de session.php

Subir a:
/public_html/Dooh/dooh_api/

Reemplazar:
- auth.php
- session.php

Opcionalmente reemplazar:
- logout.php si quieres conservar el mismo manejo estricto de token.

Subir temporalmente:
- diagnostico_auth.php
- revocar_sesiones.php

Orden:
1. Reemplaza auth.php y session.php.
2. Abre:
   https://www.ntpmedia.com.mx/Dooh/dooh_api/session.php?nocache=2

Debe responder autenticado=false e incluir:
"version": "session_fix_2026_05_28_v2"

Si NO aparece esa version, el archivo no se reemplazo correctamente o hay cache/opcache.

3. Abre:
   https://www.ntpmedia.com.mx/Dooh/dooh_api/diagnostico_auth.php

Debe mostrar token_detectado=false si entras desde barra del navegador.

4. Abre una sola vez:
   https://www.ntpmedia.com.mx/Dooh/dooh_api/revocar_sesiones.php

5. Elimina:
- diagnostico_auth.php
- revocar_sesiones.php

6. Haz login de nuevo y prueba session.php con Authorization Bearer desde frontend o Postman.

Importante:
session.php desde barra del navegador, sin header Authorization, SIEMPRE debe responder autenticado=false.
