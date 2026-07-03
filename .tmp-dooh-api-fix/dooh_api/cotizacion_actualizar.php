<?php
/* Prueba POST */

declare(strict_types=1);

require_once __DIR__ . '/cotizaciones_helpers.php';

$usuario = requerir_sesion();
$pdo = obtener_conexion();
$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$cotizacionId = (int) ($_GET['id'] ?? 0);

if ($metodo !== 'POST') {
    responder_json([
        'ok' => false,
        'mensaje' => 'Metodo no permitido. Usa POST para actualizar la cotizacion.',
    ], 405);
}

if ($cotizacionId <= 0) {
    responder_json([
        'ok' => false,
        'mensaje' => 'ID de cotizacion requerido',
    ], 400);
}

try {
    if (!usuario_puede_editar_cotizacion($pdo, $usuario, $cotizacionId)) {
        responder_json([
            'ok' => false,
            'mensaje' => 'No tienes permisos para editar esta cotizacion',
        ], 403);
    }

    $datos = leer_json_body();

    $pdo->beginTransaction();

    $campos = [];
    $params = [':id' => $cotizacionId];

    $mapaCampos = [
        'nombre_campana' => ['nombreCampana', 'nombre_campana'],
        'nombre_cliente' => ['cliente', 'nombreCliente', 'nombre_cliente'],
        'archivo_original' => ['nombreArchivo', 'archivoOriginal', 'archivo_original'],
        'hoja_origen' => ['nombreHoja', 'hojaOrigen', 'hoja_origen'],
        'notas_internas' => ['notasInternas', 'notas', 'notas_internas'],
        'estatus' => ['estado', 'estatus'],
    ];

    foreach ($mapaCampos as $campoDb => $claves) {
        $valor = valor_de($datos, $claves, null);

        if ($valor !== null) {
            $campos[] = "$campoDb = :$campoDb";
            $params[":$campoDb"] = texto_limpio($valor, '');
        }
    }

    if ($campos) {
        $sql = "UPDATE ntp_dooh_cotizaciones SET " . implode(', ', $campos) . ", fecha_actualizacion = NOW() WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    }

    $ubicaciones = valor_de($datos, ['ubicaciones', 'pantallas'], null);

    if (is_array($ubicaciones)) {
        $orden = 1;

        foreach ($ubicaciones as $ubicacion) {
            if (!is_array($ubicacion)) {
                continue;
            }

            $pantallaId = (int) valor_de($ubicacion, ['id', 'pantallaId'], 0);

            if ($pantallaId > 0) {
                $stmt = $pdo->prepare("
                    UPDATE ntp_dooh_pantallas
                    SET
                        orden = :orden,
                        nombre_pantalla = :nombre_pantalla,
                        ciudad = :ciudad,
                        tipo_venue = :tipo_venue,
                        latitud = :latitud,
                        longitud = :longitud,
                        punto_cardinal = :punto_cardinal,
                        dimensiones = :dimensiones,
                        impresiones = :impresiones,
                        esta_activa = :esta_activa,
                        es_valida = :es_valida,
                        errores_validacion = :errores_validacion,
                        fecha_actualizacion = NOW()
                    WHERE id = :id
                      AND cotizacion_id = :cotizacion_id
                ");

                $stmt->execute([
                    ':orden' => $orden,
                    ':nombre_pantalla' => texto_limpio(valor_de($ubicacion, ['screenName', 'nombrePantalla']), 'Pantalla sin nombre ' . $orden),
                    ':ciudad' => texto_limpio(valor_de($ubicacion, ['city', 'ciudad']), ''),
                    ':tipo_venue' => texto_limpio(valor_de($ubicacion, ['venueType', 'tipoVenue', 'tipo_venue']), ''),
                    ':latitud' => numero_decimal_o_null(valor_de($ubicacion, ['latitude', 'latitud'])),
                    ':longitud' => numero_decimal_o_null(valor_de($ubicacion, ['longitude', 'longitud'])),
                    ':punto_cardinal' => texto_limpio(valor_de($ubicacion, ['cardinalPoint', 'puntoCardinal']), ''),
                    ':dimensiones' => texto_limpio(valor_de($ubicacion, ['dimensions', 'dimensiones']), ''),
                    ':impresiones' => entero_no_negativo(valor_de($ubicacion, ['impressions', 'impresiones'])),
                    ':esta_activa' => booleano_db(valor_de($ubicacion, ['is_active', 'estaActiva', 'esta_activa']), true),
                    ':es_valida' => booleano_db(valor_de($ubicacion, ['isValid', 'esValida', 'es_valida']), true),
                    ':errores_validacion' => json_o_null(valor_de($ubicacion, ['errors', 'errores', 'erroresValidacion'])),
                    ':id' => $pantallaId,
                    ':cotizacion_id' => $cotizacionId,
                ]);
            } else {
                insertar_pantalla($pdo, $cotizacionId, $ubicacion, $orden);
            }

            $orden++;
        }

        actualizar_totales_cotizacion($pdo, $cotizacionId);
    }

    registrar_bitacora(
        (int) $usuario['id'],
        'cotizacion_actualizada',
        'cotizacion',
        $cotizacionId,
        $cotizacionId,
        null,
        ['campos_actualizados' => array_keys($datos)]
    );

    $pdo->commit();

    responder_json([
        'ok' => true,
        'mensaje' => 'Cotizacion actualizada correctamente',
        'cotizacion' => obtener_cotizacion_detalle($pdo, $cotizacionId, $usuario),
    ]);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    responder_json([
        'ok' => false,
        'mensaje' => 'Error actualizando cotizacion',
        'detalle' => APP_ENV === 'production' ? null : $error->getMessage(),
    ], 500);
}