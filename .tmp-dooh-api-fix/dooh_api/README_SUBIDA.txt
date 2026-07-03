DOOH Maps API - Archivos iniciales

Ruta correcta:
  /public_html/Dooh/dooh_api/

Subir en esa misma carpeta:
  db.php
  health.php
  crear_usuarios_iniciales.php
  .htaccess

No reemplazar config.php si ya lo subiste y ya tiene tu contrasena real.

Orden de prueba:
1. Verifica que config.php tenga la contrasena real de MySQL.
2. Abre:
   https://www.ntpmedia.com.mx/Dooh/dooh_api/health.php
3. Si health.php responde ok=true, abre una sola vez:
   https://www.ntpmedia.com.mx/Dooh/dooh_api/crear_usuarios_iniciales.php
4. Confirma en phpMyAdmin que existan los usuarios.
5. Elimina crear_usuarios_iniciales.php del servidor.

Usuarios creados:
  elena@ntpmedia.com.mx       rol: editor
  danna@ntpmedia.com.mx       rol: editor
  admin@ntpmedia.com.mx       rol: administrador

Contrasena temporal:
  mapas2026
