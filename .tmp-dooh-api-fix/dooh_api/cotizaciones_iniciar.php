<?php
/**
 * DOOH Maps API - Iniciar cotizacion por lotes
 * Compatible con PHP 7.4
 *
 * POST /cotizaciones_iniciar.php
 */

declare(strict_types=1);

require_once __DIR__ . '/cotizaciones_helpers.php';

$usuario = requerir_sesion();
$pdo = obtener_conexion();

requerir_metodo('POST');

try {
    $datos = leer_json_body();

    $nombreCampana = texto_limpio(valor_de($datos, ['nombreCampana', 'campaignName', 'nombre_campana']));
    $cliente = texto_limpio(valor_de($datos, ['cliente', 'nombreCliente', 'clientName', 'nombre_cliente']));

    if ($nombreCampana === '' || $cliente === '') {
        responder_json([
            'ok' => false,
            'mensaje' => 'Nombre de campana y cliente son obligatorios',
        ], 400);
    }

    $diagnostico = [
        'diagnostico' => valor_de($datos, ['diagnostico', 'diagnosticoParser', 'parserDiagnostics']),
        'resumen' => valor_de($datos, ['resumen']),
        'columnas' => valor_de($datos, ['columnas']),
        'modo_guardado' => 'lotes',
    ];

    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        INSERT INTO ntp_dooh_cotizaciones (
            creado_por_usuario_id,
            nombre_campana,
            nombre_cliente,
            archivo_original,
            hoja_origen,
            estatus,
            total_pantallas,
            pantallas_activas,
            notas_internas,
            diagnostico_parser,
            fecha_creacion,
            fecha_actualizacion
        ) VALUES (
            :creado_por_usuario_id,
            :nombre_campana,
            :nombre_cliente,
            :archivo_original,
            :hoja_origen,
            'borrador',
            0,
            0,
            :notas_internas,
            :diagnostico_parser,
            NOW(),
            NOW()
        )
    ");

    $stmt->execute([
        ':creado_por_usuario_id' => (int) $usuario['id'],
        ':nombre_campana' => $nombreCampana,
        ':nombre_cliente' => $cliente,
        ':archivo_original' => texto_limpio(valor_de($datos, ['nombreArchivo', 'archivoOriginal', 'originalFileName']), ''),
        ':hoja_origen' => texto_limpio(valor_de($datos, ['nombreHoja', 'hojaOrigen', 'sheetName']), ''),
        ':notas_internas' => texto_limpio(valor_de($datos, ['notasInternas', 'notas']), ''),
        ':diagnostico_parser' => json_o_null($diagnostico),
    ]);

    $cotizacionId = (int) $pdo->lastInsertId();

    registrar_bitacora(
        (int) $usuario['id'],
        'cotizacion_iniciada',
        'cotizacion',
        $cotizacionId,
        $cotizacionId,
        null,
        [
            'nombre_campana' => $nombreCampana,
            'nombre_cliente' => $cliente,
            'modo_guardado' => 'lotes',
        ]
    );

    $pdo->commit();

    responder_json([
        'ok' => true,
        'mensaje' => 'Cotizacion iniciada correctamente',
        'cotizacionId' => $cotizacionId,
    ], 201);
} catch (Throwable $error) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    responder_json([
        'ok' => false,
        'mensaje' => 'Error iniciando cotizacion',
        'detalle' => APP_ENV === 'production' ? null : $error->getMessage(),
    ], 500);
}
