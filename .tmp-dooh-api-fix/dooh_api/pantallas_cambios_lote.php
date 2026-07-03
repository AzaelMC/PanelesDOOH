<?php

declare(strict_types=1);

require_once __DIR__ . '/cotizaciones_helpers.php';

$usuario = requerir_sesion();
$pdo = obtener_conexion();

requerir_metodo('POST');

function cambios_lote_normalizar_tipo($tipo): string
{
    $tipo = strtolower(trim((string) $tipo));

    if (in_array($tipo, ['actualizar', 'desactivar', 'reactivar'], true)) {
        return $tipo;
    }

    return '';
}

function cambios_lote_preparar_campo(string $campo, $valor): array
{
    switch ($campo) {
        case 'screenName':
            return ['nombre_pantalla', texto_limpio($valor, '')];

        case 'city':
            return ['ciudad', texto_limpio($valor, '')];

        case 'venueType':
            return ['tipo_venue', texto_limpio($valor, '')];

        case 'latitude':
            return ['latitud', numero_decimal_o_null($valor)];

        case 'longitude':
            return ['longitud', numero_decimal_o_null($valor)];

        case 'cardinalPoint':
            return ['punto_cardinal', texto_limpio($valor, '')];

        case 'dimensions':
            return ['dimensiones', texto_limpio($valor, '')];

        case 'impressions':
            return ['impresiones', entero_no_negativo($valor)];

        case 'is_active':
            return ['esta_activa', booleano_db($valor, true)];

        case 'isValid':
            return ['es_valida', booleano_db($valor, true)];

        case 'errors':
            return ['errores_validacion', json_o_null($valor)];

        default:
            return [null, null];
    }
}

function cambios_lote_obtener_totales(PDO $pdo, int $cotizacionId): array
{
    $stmt = $pdo->prepare("
        SELECT
            COUNT(*) AS total_pantallas,
            SUM(CASE WHEN esta_activa = 1 THEN 1 ELSE 0 END) AS pantallas_activas,
            SUM(CASE WHEN esta_activa = 0 THEN 1 ELSE 0 END) AS pantallas_inactivas
        FROM ntp_dooh_pantallas
        WHERE cotizacion_id = :cotizacion_id
    ");
    $stmt->execute([':cotizacion_id' => $cotizacionId]);
    $fila = $stmt->fetch();

    return [
        'totalPantallas' => (int) ($fila['total_pantallas'] ?? 0),
        'pantallasActivas' => (int) ($fila['pantallas_activas'] ?? 0),
        'pantallasInactivas' => (int) ($fila['pantallas_inactivas'] ?? 0),
    ];
}

function cambios_lote_leer_pantalla(PDO $pdo, int $cotizacionId, int $pantallaId)
{
    $stmt = $pdo->prepare("
        SELECT
            id,
            cotizacion_id,
            nombre_pantalla,
            esta_activa,
            es_valida,
            fecha_actualizacion
        FROM ntp_dooh_pantallas
        WHERE id = :id
          AND cotizacion_id = :cotizacion_id
        LIMIT 1
    ");
    $stmt->execute([
        ':id' => $pantallaId,
        ':cotizacion_id' => $cotizacionId,
    ]);

    return $stmt->fetch();
}

try {
    $datos = leer_json_body();

    $cotizacionId = (int) valor_de($datos, ['cotizacionId'], 0);
    $loteIndice = (int) valor_de($datos, ['loteIndice'], 1);
    $totalLotes = (int) valor_de($datos, ['totalLotes'], 1);
    $cambios = valor_de($datos, ['cambios'], []);

    if ($cotizacionId <= 0) {
        responder_json([
            'ok' => false,
            'mensaje' => 'ID de cotizacion requerido',
        ], 400);
    }

    if ($loteIndice <= 0 || $totalLotes <= 0 || $loteIndice > $totalLotes) {
        responder_json([
            'ok' => false,
            'mensaje' => 'Datos de lote invalidos',
        ], 400);
    }

    if (!is_array($cambios) || count($cambios) === 0) {
        responder_json([
            'ok' => false,
            'mensaje' => 'El lote debe incluir al menos un cambio',
        ], 400);
    }

    if (count($cambios) > 50) {
        responder_json([
            'ok' => false,
            'mensaje' => 'El lote excede el limite permitido de 50 cambios',
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
            'mensaje' => 'No tienes permisos para actualizar pantallas en esta cotizacion',
        ], 403);
    }

    $pdo->beginTransaction();

    $recibidos = count($cambios);
    $actualizados = 0;
    $omitidos = 0;
    $errores = [];
    $pantallasActualizadas = [];

    foreach ($cambios as $indice => $cambio) {
        if (!is_array($cambio)) {
            $omitidos++;
            $errores[] = 'Cambio ' . ($indice + 1) . ' ignorado porque no es un objeto valido';
            continue;
        }

        $tipo = cambios_lote_normalizar_tipo(valor_de($cambio, ['tipo'], 'actualizar'));
        $pantallaId = (int) valor_de($cambio, ['pantallaId'], 0);
        $campos = valor_de($cambio, ['campos'], []);

        if ($tipo === '') {
            $omitidos++;
            $errores[] = 'Cambio ' . ($indice + 1) . ' ignorado por tipo no permitido';
            continue;
        }

        if ($pantallaId <= 0) {
            $omitidos++;
            $errores[] = 'Cambio ' . ($indice + 1) . ' ignorado por ID de pantalla invalido';
            continue;
        }

        if (!is_array($campos)) {
            $omitidos++;
            $errores[] = 'Pantalla ' . $pantallaId . ' ignorada porque campos no es un objeto valido';
            continue;
        }

        if ($tipo === 'desactivar') {
            $campos['is_active'] = false;
        }

        if ($tipo === 'reactivar') {
            $campos['is_active'] = true;
        }

        $pantallaAntes = cambios_lote_leer_pantalla($pdo, $cotizacionId, $pantallaId);

        if (!$pantallaAntes) {
            $omitidos++;
            $errores[] = 'Pantalla ' . $pantallaId . ' ignorada porque no pertenece a la cotizacion';
            continue;
        }

        $sets = [];
        $params = [
            ':id' => $pantallaId,
            ':cotizacion_id' => $cotizacionId,
        ];
        $camposAplicados = [];

        foreach ($campos as $campo => $valor) {
            list($campoDb, $valorPreparado) = cambios_lote_preparar_campo((string) $campo, $valor);

            if ($campoDb === null) {
                continue;
            }

            $paramName = ':' . $campoDb;
            $sets[] = "$campoDb = $paramName";
            $params[$paramName] = $valorPreparado;
            $camposAplicados[$campoDb] = $valorPreparado;
        }

        if (count($sets) === 0) {
            $omitidos++;
            $errores[] = 'Pantalla ' . $pantallaId . ' ignorada porque no incluye campos permitidos';
            continue;
        }

        $sql = "
            UPDATE ntp_dooh_pantallas
            SET " . implode(', ', $sets) . ",
                fecha_actualizacion = NOW()
            WHERE id = :id
              AND cotizacion_id = :cotizacion_id
        ";

        $stmtUpdate = $pdo->prepare($sql);
        $stmtUpdate->execute($params);

        $pantallaDespues = cambios_lote_leer_pantalla($pdo, $cotizacionId, $pantallaId);

        if (!$pantallaDespues) {
            $omitidos++;
            $errores[] = 'Pantalla ' . $pantallaId . ' no pudo verificarse despues de actualizar';
            continue;
        }

        $actualizados++;
        $pantallasActualizadas[] = [
            'id' => (int) $pantallaDespues['id'],
            'cotizacionId' => (int) $pantallaDespues['cotizacion_id'],
            'nombrePantalla' => $pantallaDespues['nombre_pantalla'],
            'esta_activa_antes' => (int) $pantallaAntes['esta_activa'],
            'esta_activa' => (int) $pantallaDespues['esta_activa'],
            'es_valida' => (int) $pantallaDespues['es_valida'],
            'fecha_actualizacion' => $pantallaDespues['fecha_actualizacion'],
            'camposAplicados' => $camposAplicados,
        ];
    }

    actualizar_totales_cotizacion($pdo, $cotizacionId);
    $totalesDb = cambios_lote_obtener_totales($pdo, $cotizacionId);

    registrar_bitacora(
        (int) $usuario['id'],
        'pantallas_cambios_lote',
        'cotizacion',
        $cotizacionId,
        $cotizacionId,
        null,
        [
            'lote_indice' => $loteIndice,
            'total_lotes' => $totalLotes,
            'recibidos' => $recibidos,
            'actualizados' => $actualizados,
            'omitidos' => $omitidos,
            'errores' => $errores,
            'pantallas_actualizadas' => $pantallasActualizadas,
            'totales_db' => $totalesDb,
        ]
    );

    $pdo->commit();

    responder_json([
        'ok' => true,
        'mensaje' => 'Lote de cambios aplicado correctamente',
        'cotizacionId' => $cotizacionId,
        'loteIndice' => $loteIndice,
        'totalLotes' => $totalLotes,
        'recibidos' => $recibidos,
        'actualizados' => $actualizados,
        'omitidos' => $omitidos,
        'errores' => $errores,
        'pantallasActualizadas' => $pantallasActualizadas,
        'totalesDb' => $totalesDb,
    ]);
} catch (Throwable $error) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    responder_json([
        'ok' => false,
        'mensaje' => 'Error aplicando lote de cambios',
        'detalle' => APP_ENV === 'production' ? null : $error->getMessage(),
    ], 500);
}
