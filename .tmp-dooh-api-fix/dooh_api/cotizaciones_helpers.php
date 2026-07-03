<?php
/**
 * DOOH Maps API - Helpers para cotizaciones, pantallas y usuarios
 * Version compatible con PHP 7.4+
 *
 * Ruta esperada:
 * /public_html/Dooh/dooh_api/cotizaciones_helpers.php
 */

declare(strict_types=1);

require_once __DIR__ . '/auth.php';

function version_cotizaciones_helpers()
{
    return 'cotizaciones_helpers_php74_safe_2026_06_03';
}

function valor_de(array $datos, array $claves, $default = null)
{
    foreach ($claves as $clave) {
        if (array_key_exists($clave, $datos) && $datos[$clave] !== null) {
            return $datos[$clave];
        }
    }

    return $default;
}

function texto_limpio($valor, $default = '')
{
    if ($valor === null) {
        return $default;
    }

    $texto = trim((string) $valor);

    return $texto === '' ? $default : $texto;
}

function numero_decimal_o_null($valor)
{
    if ($valor === null || $valor === '') {
        return null;
    }

    if (is_string($valor)) {
        $valor = str_replace([',', ' '], ['', ''], $valor);
    }

    return is_numeric($valor) ? (float) $valor : null;
}

function entero_no_negativo($valor)
{
    if ($valor === null || $valor === '') {
        return 0;
    }

    if (is_string($valor)) {
        $valor = str_replace([',', ' '], ['', ''], $valor);
    }

    if (!is_numeric($valor)) {
        return 0;
    }

    return max(0, (int) round((float) $valor));
}

function booleano_db($valor, $default = true)
{
    if ($valor === null) {
        return $default ? 1 : 0;
    }

    if (is_bool($valor)) {
        return $valor ? 1 : 0;
    }

    if (is_numeric($valor)) {
        return ((int) $valor) === 1 ? 1 : 0;
    }

    $texto = strtolower(trim((string) $valor));

    if (in_array($texto, ['true', 'si', 'sí', '1', 'activo', 'activa'], true)) {
        return 1;
    }

    if (in_array($texto, ['false', 'no', '0', 'inactivo', 'inactiva'], true)) {
        return 0;
    }

    return $default ? 1 : 0;
}

function json_o_null($valor)
{
    if ($valor === null || $valor === '') {
        return null;
    }

    if (is_string($valor)) {
        $decoded = json_decode($valor, true);

        if (json_last_error() === JSON_ERROR_NONE) {
            return json_encode($decoded, JSON_OPTIONS);
        }

        return json_encode(['valor' => $valor], JSON_OPTIONS);
    }

    return json_encode($valor, JSON_OPTIONS);
}

function clave_segura($texto)
{
    $texto = trim((string) $texto);
    $texto = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $texto) ?: $texto;
    $texto = strtolower($texto);
    $texto = preg_replace('/[^a-z0-9]+/', '_', $texto);
    $texto = trim((string) $texto, '_');

    return $texto !== '' ? $texto : 'columna_' . time();
}

function usuario_puede_editar_cotizacion(PDO $pdo, array $usuario, $cotizacionId)
{
    if (($usuario['rol'] ?? '') === 'administrador') {
        return true;
    }

    $stmt = $pdo->prepare("
        SELECT creado_por_usuario_id
        FROM ntp_dooh_cotizaciones
        WHERE id = :id
        LIMIT 1
    ");
    $stmt->execute([':id' => (int) $cotizacionId]);
    $creadoPor = $stmt->fetchColumn();

    return $creadoPor !== false && (int) $creadoPor === (int) $usuario['id'];
}

function mapear_pantalla_respuesta(array $fila)
{
    return [
        'id' => (int) $fila['id'],
        'pantallaId' => (int) $fila['id'],
        'cotizacionId' => (int) $fila['cotizacion_id'],
        'idTemporal' => $fila['id_temporal_frontend'] ?? null,
        'orden' => $fila['orden'] !== null ? (int) $fila['orden'] : null,
        'screenName' => $fila['nombre_pantalla'],
        'city' => $fila['ciudad'],
        'venueType' => $fila['tipo_venue'],
        'latitude' => $fila['latitud'] !== null ? (float) $fila['latitud'] : null,
        'longitude' => $fila['longitud'] !== null ? (float) $fila['longitud'] : null,
        'cardinalPoint' => $fila['punto_cardinal'],
        'dimensions' => $fila['dimensiones'],
        'impressions' => (int) $fila['impresiones'],
        'is_active' => ((int) $fila['esta_activa']) === 1,
        'estaActiva' => ((int) $fila['esta_activa']) === 1,
        'isValid' => ((int) $fila['es_valida']) === 1,
        'esValida' => ((int) $fila['es_valida']) === 1,
        'rawPayload' => $fila['datos_originales'] ? json_decode($fila['datos_originales'], true) : null,
        'errors' => $fila['errores_validacion'] ? json_decode($fila['errores_validacion'], true) : [],
        'fechaCreacion' => $fila['fecha_creacion'],
        'fechaActualizacion' => $fila['fecha_actualizacion'],
    ];
}

function obtener_cotizacion_detalle(PDO $pdo, $cotizacionId, array $usuario)
{
    $cotizacionId = (int) $cotizacionId;

    $stmt = $pdo->prepare("
        SELECT
            c.*,
            u.nombre AS creado_por_nombre,
            u.correo AS creado_por_correo,
            u.rol AS creado_por_rol
        FROM ntp_dooh_cotizaciones c
        INNER JOIN ntp_dooh_usuarios u
            ON u.id = c.creado_por_usuario_id
        WHERE c.id = :id
        LIMIT 1
    ");
    $stmt->execute([':id' => $cotizacionId]);
    $cotizacion = $stmt->fetch();

    if (!$cotizacion) {
        responder_json([
            'ok' => false,
            'mensaje' => 'Cotizacion no encontrada',
        ], 404);
    }

    $stmtPantallas = $pdo->prepare("
        SELECT *
        FROM ntp_dooh_pantallas
        WHERE cotizacion_id = :cotizacion_id
        ORDER BY COALESCE(orden, id), id
    ");
    $stmtPantallas->execute([':cotizacion_id' => $cotizacionId]);
    $pantallas = array_map('mapear_pantalla_respuesta', $stmtPantallas->fetchAll());

    $stmtColumnas = $pdo->prepare("
        SELECT *
        FROM ntp_dooh_columnas_personalizadas
        WHERE cotizacion_id = :cotizacion_id
        ORDER BY id
    ");
    $stmtColumnas->execute([':cotizacion_id' => $cotizacionId]);
    $columnas = $stmtColumnas->fetchAll();

    $stmtValores = $pdo->prepare("
        SELECT
            v.*,
            cp.clave_columna,
            cp.etiqueta,
            cp.tipo_dato
        FROM ntp_dooh_valores_personalizados v
        INNER JOIN ntp_dooh_columnas_personalizadas cp
            ON cp.id = v.columna_personalizada_id
        INNER JOIN ntp_dooh_pantallas p
            ON p.id = v.pantalla_id
        WHERE p.cotizacion_id = :cotizacion_id
        ORDER BY v.id
    ");
    $stmtValores->execute([':cotizacion_id' => $cotizacionId]);
    $valores = $stmtValores->fetchAll();

    $stmtOperaciones = $pdo->prepare("
        SELECT *
        FROM ntp_dooh_operaciones
        WHERE cotizacion_id = :cotizacion_id
        ORDER BY id
    ");
    $stmtOperaciones->execute([':cotizacion_id' => $cotizacionId]);
    $operaciones = $stmtOperaciones->fetchAll();

    $puedeEditar = usuario_puede_editar_cotizacion($pdo, $usuario, $cotizacionId);

    return [
        'id' => (int) $cotizacion['id'],
        'nombreCampana' => $cotizacion['nombre_campana'],
        'cliente' => $cotizacion['nombre_cliente'],
        'nombreCliente' => $cotizacion['nombre_cliente'],
        'nombreArchivo' => $cotizacion['archivo_original'],
        'nombreHoja' => $cotizacion['hoja_origen'],
        'estado' => $cotizacion['estatus'],
        'estatus' => $cotizacion['estatus'],
        'totalPantallas' => (int) $cotizacion['total_pantallas'],
        'totalPantallasActivas' => (int) $cotizacion['pantallas_activas'],
        'notasInternas' => $cotizacion['notas_internas'],
        'diagnosticoParser' => $cotizacion['diagnostico_parser'] ? json_decode($cotizacion['diagnostico_parser'], true) : null,
        'usuarioCreadorId' => (int) $cotizacion['creado_por_usuario_id'],
        'usuarioCreadorNombre' => $cotizacion['creado_por_nombre'],
        'usuarioCreadorCorreo' => $cotizacion['creado_por_correo'],
        'fechaCreacion' => $cotizacion['fecha_creacion'],
        'fechaActualizacion' => $cotizacion['fecha_actualizacion'],
        'puedeEditar' => $puedeEditar,
        'ubicaciones' => $pantallas,
        'pantallas' => $pantallas,
        'columnasPersonalizadas' => $columnas,
        'valoresPersonalizados' => $valores,
        'operaciones' => $operaciones,
    ];
}

function insertar_pantalla(PDO $pdo, $cotizacionId, array $ubicacion, $orden)
{
    $cotizacionId = (int) $cotizacionId;
    $orden = (int) $orden;

    $nombrePantalla = texto_limpio(valor_de($ubicacion, ['screenName', 'nombrePantalla', 'nombre_pantalla']), 'Pantalla sin nombre ' . $orden);

    $latitud = numero_decimal_o_null(valor_de($ubicacion, ['latitude', 'latitud']));
    $longitud = numero_decimal_o_null(valor_de($ubicacion, ['longitude', 'longitud']));

    $stmt = $pdo->prepare("
        INSERT INTO ntp_dooh_pantallas (
            cotizacion_id,
            id_temporal_frontend,
            orden,
            nombre_pantalla,
            ciudad,
            tipo_venue,
            latitud,
            longitud,
            punto_cardinal,
            dimensiones,
            impresiones,
            esta_activa,
            es_valida,
            datos_originales,
            errores_validacion,
            fecha_creacion,
            fecha_actualizacion
        ) VALUES (
            :cotizacion_id,
            :id_temporal_frontend,
            :orden,
            :nombre_pantalla,
            :ciudad,
            :tipo_venue,
            :latitud,
            :longitud,
            :punto_cardinal,
            :dimensiones,
            :impresiones,
            :esta_activa,
            :es_valida,
            :datos_originales,
            :errores_validacion,
            NOW(),
            NOW()
        )
    ");

    $stmt->execute([
        ':cotizacion_id' => $cotizacionId,
        ':id_temporal_frontend' => texto_limpio(valor_de($ubicacion, ['idTemporal', 'id_temporal_frontend']), ''),
        ':orden' => $orden,
        ':nombre_pantalla' => $nombrePantalla,
        ':ciudad' => texto_limpio(valor_de($ubicacion, ['city', 'ciudad']), ''),
        ':tipo_venue' => texto_limpio(valor_de($ubicacion, ['venueType', 'tipoVenue', 'tipo_venue']), ''),
        ':latitud' => $latitud,
        ':longitud' => $longitud,
        ':punto_cardinal' => texto_limpio(valor_de($ubicacion, ['cardinalPoint', 'puntoCardinal', 'punto_cardinal']), ''),
        ':dimensiones' => texto_limpio(valor_de($ubicacion, ['dimensions', 'dimensiones']), ''),
        ':impresiones' => entero_no_negativo(valor_de($ubicacion, ['impressions', 'impresiones'])),
        ':esta_activa' => booleano_db(valor_de($ubicacion, ['is_active', 'estaActiva', 'esta_activa']), true),
        ':es_valida' => booleano_db(valor_de($ubicacion, ['isValid', 'esValida', 'es_valida']), true),
        ':datos_originales' => json_o_null(valor_de($ubicacion, ['rawPayload', 'datosOriginales', 'datos_originales'])),
        ':errores_validacion' => json_o_null(valor_de($ubicacion, ['errors', 'errores', 'erroresValidacion', 'errores_validacion'])),
    ]);

    return (int) $pdo->lastInsertId();
}

function actualizar_totales_cotizacion(PDO $pdo, $cotizacionId)
{
    $cotizacionId = (int) $cotizacionId;

    $stmt = $pdo->prepare("
        UPDATE ntp_dooh_cotizaciones
        SET
            total_pantallas = (
                SELECT COUNT(*)
                FROM ntp_dooh_pantallas
                WHERE cotizacion_id = :cotizacion_id_total
            ),
            pantallas_activas = (
                SELECT COUNT(*)
                FROM ntp_dooh_pantallas
                WHERE cotizacion_id = :cotizacion_id_activas
                  AND esta_activa = 1
            ),
            fecha_actualizacion = NOW()
        WHERE id = :cotizacion_id
    ");

    $stmt->execute([
        ':cotizacion_id_total' => $cotizacionId,
        ':cotizacion_id_activas' => $cotizacionId,
        ':cotizacion_id' => $cotizacionId,
    ]);
}
