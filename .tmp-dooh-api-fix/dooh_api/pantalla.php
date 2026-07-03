<?php
/**
 * DOOH Maps API - Pantalla individual
 *
 * PUT    /pantalla.php?id=1
 * DELETE /pantalla.php?id=1  (borrado logico)
 */

declare(strict_types=1);

require_once __DIR__ . '/cotizaciones_helpers.php';

$usuario = requerir_sesion();
$pdo = obtener_conexion();
$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$pantallaId = (int) ($_GET['id'] ?? 0);

if ($pantallaId <= 0) {
    responder_json([
        'ok' => false,
        'mensaje' => 'ID de pantalla requerido',
    ], 400);
}

try {
    $stmtCotizacion = $pdo->prepare("
        SELECT cotizacion_id
        FROM ntp_dooh_pantallas
        WHERE id = :id
        LIMIT 1
    ");
    $stmtCotizacion->execute([':id' => $pantallaId]);
    $cotizacionId = $stmtCotizacion->fetchColumn();

    if ($cotizacionId === false) {
        responder_json([
            'ok' => false,
            'mensaje' => 'Pantalla no encontrada',
        ], 404);
    }

    $cotizacionId = (int) $cotizacionId;

    if (!usuario_puede_editar_cotizacion($pdo, $usuario, $cotizacionId)) {
        responder_json([
            'ok' => false,
            'mensaje' => 'No tienes permisos para modificar esta pantalla',
        ], 403);
    }

    if ($metodo === 'PUT') {
        $datos = leer_json_body();

        $stmt = $pdo->prepare("
            UPDATE ntp_dooh_pantallas
            SET
                nombre_pantalla = COALESCE(:nombre_pantalla, nombre_pantalla),
                ciudad = COALESCE(:ciudad, ciudad),
                tipo_venue = COALESCE(:tipo_venue, tipo_venue),
                latitud = :latitud,
                longitud = :longitud,
                punto_cardinal = COALESCE(:punto_cardinal, punto_cardinal),
                dimensiones = COALESCE(:dimensiones, dimensiones),
                impresiones = :impresiones,
                esta_activa = :esta_activa,
                es_valida = :es_valida,
                fecha_actualizacion = NOW()
            WHERE id = :id
        ");

        $stmt->execute([
            ':nombre_pantalla' => valor_de($datos, ['screenName', 'nombrePantalla']) !== null ? texto_limpio(valor_de($datos, ['screenName', 'nombrePantalla'])) : null,
            ':ciudad' => valor_de($datos, ['city', 'ciudad']) !== null ? texto_limpio(valor_de($datos, ['city', 'ciudad'])) : null,
            ':tipo_venue' => valor_de($datos, ['venueType', 'tipoVenue', 'tipo_venue']) !== null ? texto_limpio(valor_de($datos, ['venueType', 'tipoVenue', 'tipo_venue'])) : null,
            ':latitud' => numero_decimal_o_null(valor_de($datos, ['latitude', 'latitud'])),
            ':longitud' => numero_decimal_o_null(valor_de($datos, ['longitude', 'longitud'])),
            ':punto_cardinal' => valor_de($datos, ['cardinalPoint', 'puntoCardinal']) !== null ? texto_limpio(valor_de($datos, ['cardinalPoint', 'puntoCardinal'])) : null,
            ':dimensiones' => valor_de($datos, ['dimensions', 'dimensiones']) !== null ? texto_limpio(valor_de($datos, ['dimensions', 'dimensiones'])) : null,
            ':impresiones' => entero_no_negativo(valor_de($datos, ['impressions', 'impresiones'])),
            ':esta_activa' => booleano_db(valor_de($datos, ['is_active', 'estaActiva', 'esta_activa']), true),
            ':es_valida' => booleano_db(valor_de($datos, ['isValid', 'esValida', 'es_valida']), true),
            ':id' => $pantallaId,
        ]);

        actualizar_totales_cotizacion($pdo, $cotizacionId);

        registrar_bitacora(
            (int) $usuario['id'],
            'pantalla_actualizada',
            'pantalla',
            $pantallaId,
            $cotizacionId,
            null,
            $datos
        );

        responder_json([
            'ok' => true,
            'mensaje' => 'Pantalla actualizada correctamente',
        ]);
    }

    if ($metodo === 'DELETE') {
        $stmt = $pdo->prepare("
            UPDATE ntp_dooh_pantallas
            SET esta_activa = 0,
                fecha_actualizacion = NOW()
            WHERE id = :id
        ");
        $stmt->execute([':id' => $pantallaId]);

        actualizar_totales_cotizacion($pdo, $cotizacionId);

        registrar_bitacora(
            (int) $usuario['id'],
            'pantalla_desactivada',
            'pantalla',
            $pantallaId,
            $cotizacionId
        );

        responder_json([
            'ok' => true,
            'mensaje' => 'Pantalla desactivada correctamente',
        ]);
    }

    responder_json([
        'ok' => false,
        'mensaje' => 'Metodo no permitido',
    ], 405);
} catch (Throwable $error) {
    responder_json([
        'ok' => false,
        'mensaje' => 'Error procesando pantalla',
        'detalle' => APP_ENV === 'production' ? null : $error->getMessage(),
    ], 500);
}
