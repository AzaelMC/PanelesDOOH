<?php
/**
 * DOOH Maps API - Health check
 *
 * Ruta esperada:
 * /public_html/Dooh/dooh_api/health.php
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

try {
    $pdo = obtener_conexion();
    $pdo->query('SELECT 1');

    $tablas = [
        'ntp_dooh_usuarios',
        'ntp_dooh_sesiones',
        'ntp_dooh_cotizaciones',
        'ntp_dooh_pantallas',
        'ntp_dooh_columnas_personalizadas',
        'ntp_dooh_valores_personalizados',
        'ntp_dooh_operaciones',
        'ntp_dooh_bitacora',
    ];

    $estadoTablas = [];

    foreach ($tablas as $tabla) {
        $stmt = $pdo->prepare("
            SELECT COUNT(*) AS existe
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
              AND table_name = :tabla
        ");
        $stmt->execute([':tabla' => $tabla]);
        $estadoTablas[$tabla] = ((int) $stmt->fetchColumn()) === 1;
    }

    responder_json([
        'ok' => true,
        'servicio' => 'DOOH Maps API',
        'version' => API_VERSION,
        'php' => PHP_VERSION,
        'ambiente' => APP_ENV,
        'base_datos' => DB_NAME,
        'conexion' => 'correcta',
        'tablas' => $estadoTablas,
        'fecha' => date('c'),
    ]);
} catch (Throwable $error) {
    responder_json([
        'ok' => false,
        'servicio' => 'DOOH Maps API',
        'conexion' => 'fallida',
        'mensaje' => 'No se pudo conectar con la base de datos',
        'detalle' => APP_ENV === 'production' ? null : $error->getMessage(),
        'fecha' => date('c'),
    ], 500);
}
