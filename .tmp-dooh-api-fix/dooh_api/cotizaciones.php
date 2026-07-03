<?php
/**
 * DOOH Maps API - Cotizaciones
 *
 * GET  /cotizaciones.php
 * POST /cotizaciones.php
 */

declare(strict_types=1);

require_once __DIR__ . '/cotizaciones_helpers.php';

$usuario = requerir_sesion();
$pdo = obtener_conexion();
$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($metodo === 'GET') {
        $q = trim((string) ($_GET['q'] ?? ''));
        $usuarioId = isset($_GET['usuarioId']) ? (int) $_GET['usuarioId'] : null;
        $estatus = trim((string) ($_GET['estatus'] ?? ''));
        $limit = max(1, min(200, (int) ($_GET['limit'] ?? 50)));
        $offset = max(0, (int) ($_GET['offset'] ?? 0));

        $where = ['1 = 1'];
        $params = [];

        if ($q !== '') {
            $where[] = "(c.nombre_campana LIKE :q OR c.nombre_cliente LIKE :q OR c.archivo_original LIKE :q)";
            $params[':q'] = '%' . $q . '%';
        }

        if ($usuarioId) {
            $where[] = "c.creado_por_usuario_id = :usuario_id";
            $params[':usuario_id'] = $usuarioId;
        }

        if ($estatus !== '') {
            $where[] = "c.estatus = :estatus";
            $params[':estatus'] = $estatus;
        }

        $whereSql = implode(' AND ', $where);

        $stmtTotal = $pdo->prepare("
            SELECT COUNT(*)
            FROM ntp_dooh_cotizaciones c
            WHERE $whereSql
        ");
        $stmtTotal->execute($params);
        $total = (int) $stmtTotal->fetchColumn();

        $stmt = $pdo->prepare("
            SELECT
                c.*,
                u.nombre AS creado_por_nombre,
                u.correo AS creado_por_correo
            FROM ntp_dooh_cotizaciones c
            INNER JOIN ntp_dooh_usuarios u
                ON u.id = c.creado_por_usuario_id
            WHERE $whereSql
            ORDER BY c.fecha_actualizacion DESC, c.id DESC
            LIMIT $limit OFFSET $offset
        ");
        $stmt->execute($params);

        $cotizaciones = array_map(static function (array $fila): array {
            return [
                'id' => (int) $fila['id'],
                'nombreCampana' => $fila['nombre_campana'],
                'cliente' => $fila['nombre_cliente'],
                'nombreArchivo' => $fila['archivo_original'],
                'nombreHoja' => $fila['hoja_origen'],
                'estado' => $fila['estatus'],
                'estatus' => $fila['estatus'],
                'totalPantallas' => (int) $fila['total_pantallas'],
                'totalPantallasActivas' => (int) $fila['pantallas_activas'],
                'usuarioCreadorId' => (int) $fila['creado_por_usuario_id'],
                'usuarioCreadorNombre' => $fila['creado_por_nombre'],
                'usuarioCreadorCorreo' => $fila['creado_por_correo'],
                'fechaCreacion' => $fila['fecha_creacion'],
                'fechaActualizacion' => $fila['fecha_actualizacion'],
            ];
        }, $stmt->fetchAll());

        responder_json([
            'ok' => true,
            'cotizaciones' => $cotizaciones,
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
        ]);
    }

    if ($metodo === 'POST') {
        $datos = leer_json_body();

        if (isset($datos['cotizacionTemporal']) && is_array($datos['cotizacionTemporal'])) {
            $datos = $datos['cotizacionTemporal'];
        }

        $nombreCampana = texto_limpio(valor_de($datos, ['nombreCampana', 'campaignName', 'nombre_campana']));
        $cliente = texto_limpio(valor_de($datos, ['cliente', 'nombreCliente', 'clientName', 'nombre_cliente']));
        $ubicaciones = valor_de($datos, ['ubicaciones', 'pantallas', 'locations'], []);

        if ($nombreCampana === '' || $cliente === '') {
            responder_json([
                'ok' => false,
                'mensaje' => 'Nombre de campana y cliente son obligatorios',
            ], 400);
        }

        if (!is_array($ubicaciones) || count($ubicaciones) === 0) {
            responder_json([
                'ok' => false,
                'mensaje' => 'La cotizacion debe incluir al menos una pantalla',
            ], 400);
        }

        $diagnostico = [
            'diagnostico' => valor_de($datos, ['diagnostico', 'diagnosticoParser', 'parserDiagnostics']),
            'resumen' => valor_de($datos, ['resumen']),
            'columnas' => valor_de($datos, ['columnas']),
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

        $orden = 1;
        foreach ($ubicaciones as $ubicacion) {
            if (!is_array($ubicacion)) {
                continue;
            }

            insertar_pantalla($pdo, $cotizacionId, $ubicacion, $orden);
            $orden++;
        }

        actualizar_totales_cotizacion($pdo, $cotizacionId);

        registrar_bitacora(
            (int) $usuario['id'],
            'cotizacion_creada',
            'cotizacion',
            $cotizacionId,
            $cotizacionId,
            null,
            [
                'nombre_campana' => $nombreCampana,
                'nombre_cliente' => $cliente,
                'pantallas' => $orden - 1,
            ]
        );

        $pdo->commit();

        responder_json([
            'ok' => true,
            'mensaje' => 'Cotizacion guardada correctamente',
            'cotizacionId' => $cotizacionId,
            'cotizacion' => obtener_cotizacion_detalle($pdo, $cotizacionId, $usuario),
        ], 201);
    }

    responder_json([
        'ok' => false,
        'mensaje' => 'Metodo no permitido',
    ], 405);
} catch (Throwable $error) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    responder_json([
        'ok' => false,
        'mensaje' => 'Error procesando cotizaciones',
        'detalle' => APP_ENV === 'production' ? null : $error->getMessage(),
    ], 500);
}
