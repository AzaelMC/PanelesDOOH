DOOH Maps API - Autenticacion

Ruta donde se deben subir:
  /public_html/Dooh/dooh_api/

Archivos incluidos:
  auth.php
  login.php
  session.php
  logout.php

No reemplazan config.php ni db.php.

Pruebas rápidas:

1) Login
POST https://www.ntpmedia.com.mx/Dooh/dooh_api/login.php

Body JSON:
{
  "correo": "elena@ntpmedia.com.mx",
  "contrasena": "mapas2026"
}

Tambien puedes usar:
{
  "usuario": "elena@ntpmedia.com.mx",
  "password": "mapas2026"
}

2) Session
GET https://www.ntpmedia.com.mx/Dooh/dooh_api/session.php
Header:
Authorization: Bearer TOKEN_DEVUELTO_POR_LOGIN

3) Logout
POST https://www.ntpmedia.com.mx/Dooh/dooh_api/logout.php
Header:
Authorization: Bearer TOKEN_DEVUELTO_POR_LOGIN

Credenciales temporales:
  elena@ntpmedia.com.mx / mapas2026
  danna@ntpmedia.com.mx / mapas2026
  admin@ntpmedia.com.mx / mapas2026

Frontend .env.local:
  VITE_API_BASE_URL=https://www.ntpmedia.com.mx/Dooh/dooh_api
  VITE_AUTH_MOCK=false
