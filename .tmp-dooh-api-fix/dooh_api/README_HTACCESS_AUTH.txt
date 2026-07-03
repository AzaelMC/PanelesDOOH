DOOH Maps API - Fix Authorization Bearer en cPanel

Problema:
  login.php devuelve token, pero session.php responde autenticado=false
  aun enviando Authorization: Bearer TOKEN.

Causa probable:
  Apache/cPanel/FastCGI no esta pasando el header Authorization a PHP.

Solucion:
  Reemplaza o actualiza el archivo .htaccess en:
    /public_html/Dooh/dooh_api/.htaccess

Con el archivo incluido en este ZIP.

Despues:
1. Elimina diagnostico_auth.php y revocar_sesiones.php si siguen en el servidor.
2. Vuelve a hacer login desde el frontend.
3. Revisa que localStorage tenga dooh_auth_token.
4. Refresca la pagina.
5. session.php deberia validar el token y conservar la sesion.

Si aun falla:
  Sube temporalmente diagnostico_auth.php otra vez y prueba desde el frontend,
  no desde la barra del navegador, porque el navegador no manda Authorization
  al abrir la URL directa.
