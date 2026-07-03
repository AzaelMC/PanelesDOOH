<?php
/**
 * DOOH Maps API - Validar sesion actual
 * Version: session_fix_2026_06_30_v1
 * Metodo: GET
 */
declare(strict_types=1);

require_once __DIR__ . '/auth.php';

requerir_metodo('GET');

try {
    $usuario = obtener_usuario_sesion_actual();

    if (!$usuario) {
        responder_json([
            'ok' => true,
            'autenticado' => false,
            'usuario' => null,
            'mensaje' => 'Sesion no valida o expirada',
            'version' => 'session_fix_2026_06_30_v1',
        ]);
    }

    responder_json([
        'ok' => true,
        'autenticado' => true,
        'usuario' => formatear_usuario($usuario),
        'expiraEn' => $usuario['fecha_expiracion'],
        'version' => 'session_fix_2026_06_30_v1',
    ]);
} catch (Throwable $error) {
    responder_json([
        'ok' => false,
        'mensaje' => 'Error al validar sesion',
        'detalle' => APP_ENV === 'production' ? null : $error->getMessage(),
        'version' => 'session_fix_2026_06_30_v1',
    ], 500);
}
