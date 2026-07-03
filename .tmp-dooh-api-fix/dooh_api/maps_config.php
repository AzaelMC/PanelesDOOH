<?php

declare(strict_types=1);

require_once __DIR__ . '/auth.php';

requerir_metodo('GET');
requerir_sesion();

$mapsPrivateConfigPath = __DIR__ . '/maps_private_config.php';

if (!is_file($mapsPrivateConfigPath)) {
    responder_json([
        'ok' => false,
        'mensaje' => 'La configuracion privada de Google Maps no existe en el servidor.',
    ], 500);
}

require_once $mapsPrivateConfigPath;

$apiKey = defined('GOOGLE_MAPS_API_KEY') ? trim((string) GOOGLE_MAPS_API_KEY) : '';
$mapId = defined('GOOGLE_MAPS_MAP_ID') ? trim((string) GOOGLE_MAPS_MAP_ID) : '';

if ($apiKey === '') {
    responder_json([
        'ok' => false,
        'mensaje' => 'La API key de Google Maps no esta configurada en el servidor.',
    ], 500);
}

if ($mapId === '') {
    responder_json([
        'ok' => false,
        'mensaje' => 'El Map ID de Google Maps no esta configurado en el servidor.',
    ], 500);
}

responder_json([
    'ok' => true,
    'maps' => [
        'apiKey' => $apiKey,
        'mapId' => $mapId,
    ],
]);
