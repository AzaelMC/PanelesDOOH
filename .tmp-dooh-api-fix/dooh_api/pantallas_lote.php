<?php
/**
 * DOOH Maps API - Insertar pantallas por lote
 * Compatible con PHP 7.4
 *
 * POST /pantallas_lote.php
 */

declare(strict_types=1);

require_once __DIR__ . '/cotizaciones_helpers.php';

$usuario = requerir_sesion();
$pdo = obtener_conexion();

requerir_metodo('POST');

try {
    $datos = leer_json_body();

    $cotizacionId = (int) valor_de($datos, ['cotizacionId', 'cotizacion_id'], 0);
    $loteIndice = (int) valor_de($datos, ['loteIndice', 'lote_indice'], 1);
    $totalLotes = (int) valor_de($datos, ['totalLotes', 'total_lotes'], 1);
    $pantallas = valor_de($datos, ['pantallas', 'ubicaciones'], []);

    if ($cotizacionId <= 0) {
        responder_json([
            'ok' => false,
            'mensaje' => 'ID de cotizacion requerido',
        ], 400);
    }

    if (!is_array($pantallas) || count($pantallas) === 0) {
        responder_json([
            'ok' => false,
            'mensaje' => 'El lote debe incluir al menos una pantalla',
        ], 400);
    }

    if (count($pantallas) > 75) {
        responder_json([
            'ok' => false,
            'mensaje' => 'El lote excede el limite permitido de 75 pantallas',
        ], 400);
    }

    $stmtCotizacion = $pdo->prepare("
        SELECT id, creado_por_usuario_id
        FROM ntp_dooh_cotizaciones
        WHERE id = :id
        LIMIT 1
    ");
    $stmtCotizacion->execute([':id' => $cotizacionId]);
    $cotizacion = $stmtCotizacion->fetch();

    if (!$cotizacion) {
        responder_json([
            'ok' => false,
            'mensaje' => 'Cotizacion no encontrada',
        ], 404);
    }

    if (!usuario_puede_editar_cotizacion($pdo, $usuario, $cotizacionId)) {
        responder_json([
            'ok' => false,
            'mensaje' => 'No tienes permisos para insertar pantallas en esta cotizacion',
        ], 403);
    }

    $stmtMaxOrden = $pdo->prepare("
        SELECT COALESCE(MAX(orden), 0)
        FROM ntp_dooh_pantallas
        WHERE cotizacion_id = :cotizacion_id
    ");
    $stmtMaxOrden->execute([':cotizacion_id' => $cotizacionId]);
    $orden = ((int) $stmtMaxOrden->fetchColumn()) + 1;

    $pdo->beginTransaction();

    $insertadas = 0;
    $errores = [];

    foreach ($pantallas as $pantalla) {
        if (!is_array($pantalla)) {
            $errores[] = 'Pantalla ignorada porque no es un objeto valido';
            continue;
        }

        insertar_pantalla($pdo, $cotizacionId, $pantalla, $orden);
        $orden++;
        $insertadas++;
    }

    actualizar_totales_cotizacion($pdo, $cotizacionId);

    registrar_bitacora(
        (int) $usuario['id'],
        'pantallas_lote_insertado',
        'cotizacion',
        $cotizacionId,
        $cotizacionId,
        null,
        [
            'lote_indice' => $loteIndice,
            'total_lotes' => $totalLotes,
            'recibidas' => count($pantallas),
            'insertadas' => $insertadas,
        ]
    );

    $pdo->commit();

    responder_json([
        'ok' => true,
        'mensaje' => 'Lote de pantallas guardado correctamente',
        'cotizacionId' => $cotizacionId,
        'loteIndice' => $loteIndice,
        'totalLotes' => $totalLotes,
        'recibidas' => count($pantallas),
        'insertadas' => $insertadas,
        'errores' => $errores,
    ]);
} catch (Throwable $error) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    responder_json([
        'ok' => false,
        'mensaje' => 'Error guardando lote de pantallas',
        'detalle' => APP_ENV === 'production' ? null : $error->getMessage(),
    ], 500);
}
