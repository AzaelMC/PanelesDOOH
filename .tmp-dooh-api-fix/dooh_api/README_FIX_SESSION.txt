DOOH Maps API - Fix de validacion de sesion

Subir a:
  /public_html/Dooh/dooh_api/

Reemplazar:
  auth.php
  session.php
  logout.php

Archivo temporal:
  revocar_sesiones.php

Orden:
1. Sube auth.php, session.php, logout.php y revocar_sesiones.php.
2. Abre una sola vez:
   https://www.ntpmedia.com.mx/Dooh/dooh_api/revocar_sesiones.php
3. Elimina revocar_sesiones.php del servidor.
4. Prueba session.php sin token:
   debe responder autenticado=false.
5. Haz login con Elena:
   POST /login.php
6. Prueba session.php con token de Elena:
   debe responder Elena/editor.
7. Haz login con Admin:
   POST /login.php
8. Prueba session.php con token de Admin:
   debe responder Administrador/administrador.

Motivo:
  session.php no debe devolver usuarios si no recibe Authorization Bearer.
  session.php no debe cruzar identidades entre tokens.
