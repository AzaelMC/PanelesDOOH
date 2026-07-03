<?php
/**
 * DOOH Maps API - Logout
 * Metodo: POST
 */
declare(strict_types=1);

require_once __DIR__ . '/auth.php';

requerir_metodo('POST');

try {
    $token = obtener_token_autorizacion();

    if (!$token) {
        responder_json([
            'ok' => true,
            'mensaje' => 'Sesion cerrada',
        ]);
    }

    $usuario = obtener_usuario_por_token($token);
    $hashToken = crear_hash_token($token);
    $pdo = obtener_conexion();

    $stmt = $pdo->prepare("
        UPDATE ntp_dooh_sesiones
        SET revocada = 1
        WHERE hash_token = :hash_token
    ");

    $stmt->execute([':hash_token' => $hashToken]);

    if ($usuario) {
        registrar_bitacora((int) $usuario['id'], 'logout', 'usuario', (int) $usuario['id']);
    }

    responder_json([
        'ok' => true,
        'mensaje' => 'Sesion cerrada correctamente',
    ]);
} catch (Throwable $error) {
    responder_json([
        'ok' => false,
        'mensaje' => 'Error al cerrar sesion',
        'detalle' => APP_ENV === 'production' ? null : $error->getMessage(),
    ], 500);
}
