<?php


declare(strict_types=1);


define('APP_ENV', 'production');


date_default_timezone_set('America/Mexico_City');

define('DB_HOST', 'localhost');
define('DB_NAME', 'ntpmedia_PanelesDooh');
define('DB_USER', 'ntpmedia_admin');
define('DB_PASS', 'NTPregistro2026');
define('DB_CHARSET', 'utf8mb4');

/**
 * Configuracion de sesiones/token
 * Cambia este valor por una cadena larga y unica antes de produccion.
 */
define('APP_SECRET', 'CAMBIA_ESTA_LLAVE_SECRETA_DOOH_MAPS_2026');
define('SESSION_HOURS', 8);

/**
 * CORS
 * Ajusta estos dominios cuando tengas el dominio final del frontend.
 */
define('ALLOWED_ORIGINS', [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://ntpmedia.com.mx',
    'https://www.ntpmedia.com.mx',
]);

/**
 * Respuestas JSON
 */
define('JSON_OPTIONS', JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

/**
 * Seguridad basica
 */
define('MAX_LOGIN_ATTEMPTS', 5);
define('PASSWORD_MIN_LENGTH', 6);

/**
 * Version de la API
 */
define('API_VERSION', '1.0.0');
