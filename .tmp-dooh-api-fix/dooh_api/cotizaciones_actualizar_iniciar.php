<?php

declare(strict_types=1);

require_once __DIR__ . '/cotizaciones_helpers.php';

$usuario = requerir_sesion();
$pdo = obtener_conexion();

requerir_metodo('POST');

function actualizacion_campo_presente(array $datos, string $clave): bool
{
    return array_key_exists($clave, $datos) && $datos[$clave] !== null;
}

try {
    $datos = leer_json_body();

    $cotizacionId = (int) valor_de($datos, ['cotizacionId'], 0);
    $totalCambios = (int) valor_de($datos, ['totalCambios'], 0);

    if ($cotizacionId <= 0) {
        responder_json([
            'ok' => false,
            'mensaje' => 'ID de cotizacion requerido',
        ], 400);
    }

    if ($totalCambios < 0) {
        responder_json([
            'ok' => false,
            'mensaje' => 'El total de cambios no puede ser negativo',
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
            'mensaje' => 'No tienes permisos para actualizar esta cotizacion',
        ], 403);
    }

    $pdo->beginTransaction();

    $campos = [];
    $params = [':id' => $cotizacionId];

    $mapaCampos = [
        'nombreCampana' => 'nombre_campana',
        'cliente' => 'nombre_cliente',
        'nombreArchivo' => 'archivo_original',
        'nombreHoja' => 'hoja_origen',
        'notasInternas' => 'notas_internas',
        'estatus' => 'estatus',
    ];

    foreach ($mapaCampos as $campoApi => $campoDb) {
        if (!actualizacion_campo_presente($datos, $campoApi)) {
            continue;
        }

        $campos[] = "$campoDb = :$campoDb";
        $params[":$campoDb"] = texto_limpio($datos[$campoApi], '');
    }

    if (count($campos) > 0) {
        $sql = "
            UPDATE ntp_dooh_cotizaciones
            SET " . implode(', ', $campos) . ",
                fecha_actualizacion = NOW()
            WHERE id = :id
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    }

    registrar_bitacora(
        (int) $usuario['id'],
        'cotizacion_actualizacion_iniciada',
        'cotizacion',
        $cotizacionId,
        $cotizacionId,
        null,
        [
            'total_cambios' => $totalCambios,
            'campos_actualizados' => array_values(array_keys(array_filter(
                $mapaCampos,
                function ($campoDb, $campoApi) use ($datos) {
                    return actualizacion_campo_presente($datos, (string) $campoApi);
                },
                ARRAY_FILTER_USE_BOTH
            ))),
        ]
    );

    $pdo->commit();

    responder_json([
        'ok' => true,
        'mensaje' => 'Actualizacion iniciada correctamente',
        'cotizacionId' => $cotizacionId,
        'totalCambios' => $totalCambios,
        'camposActualizados' => array_values(array_keys(array_filter(
            $mapaCampos,
            function ($campoDb, $campoApi) use ($datos) {
                return actualizacion_campo_presente($datos, (string) $campoApi);
            },
            ARRAY_FILTER_USE_BOTH
        ))),
    ]);
} catch (Throwable $error) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    responder_json([
        'ok' => false,
        'mensaje' => 'Error iniciando actualizacion',
        'detalle' => APP_ENV === 'production' ? null : $error->getMessage(),
    ], 500);
}
