<?php
/**
 * DOOH Maps API - Finalizar cotizacion por lotes
 * Compatible con PHP 7.4
 *
 * POST /cotizaciones_finalizar.php
 */

declare(strict_types=1);

require_once __DIR__ . '/cotizaciones_helpers.php';

$usuario = requerir_sesion();
$pdo = obtener_conexion();

requerir_metodo('POST');

try {
    $datos = leer_json_body();
    $cotizacionId = (int) valor_de($datos, ['cotizacionId', 'cotizacion_id'], 0);

    if ($cotizacionId <= 0) {
        responder_json([
            'ok' => false,
            'mensaje' => 'ID de cotizacion requerido',
        ], 400);
    }

    $stmtCotizacion = $pdo->prepare("
        SELECT id
        FROM ntp_dooh_cotizaciones
        WHERE id = :id
        LIMIT 1
    ");
    $stmtCotizacion->execute([':id' => $cotizacionId]);
    $existe = $stmtCotizacion->fetchColumn();

    if ($existe === false) {
        responder_json([
            'ok' => false,
            'mensaje' => 'Cotizacion no encontrada',
        ], 404);
    }

    if (!usuario_puede_editar_cotizacion($pdo, $usuario, $cotizacionId)) {
        responder_json([
            'ok' => false,
            'mensaje' => 'No tienes permisos para finalizar esta cotizacion',
        ], 403);
    }

    $pdo->beginTransaction();

    actualizar_totales_cotizacion($pdo, $cotizacionId);

    registrar_bitacora(
        (int) $usuario['id'],
        'cotizacion_finalizada',
        'cotizacion',
        $cotizacionId,
        $cotizacionId
    );

    $pdo->commit();

    responder_json([
        'ok' => true,
        'mensaje' => 'Cotizacion finalizada correctamente',
        'cotizacionId' => $cotizacionId,
        'cotizacion' => obtener_cotizacion_detalle($pdo, $cotizacionId, $usuario),
    ]);
} catch (Throwable $error) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    responder_json([
        'ok' => false,
        'mensaje' => 'Error finalizando cotizacion',
        'detalle' => APP_ENV === 'production' ? null : $error->getMessage(),
    ], 500);
}
