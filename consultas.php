<?php
require __DIR__ . '/conexion.php';

$pdo = conectar();

function tabla(string $titulo, array $filas): void
{
    echo "<h2>" . htmlspecialchars($titulo) . "</h2>";
    if (!$filas) { echo "<p>Sin resultados.</p>"; return; }

    echo "<table><thead><tr>";
    foreach (array_keys($filas[0]) as $col) {
        echo "<th>" . htmlspecialchars($col) . "</th>";
    }
    echo "</tr></thead><tbody>";
    foreach ($filas as $fila) {
        echo "<tr>";
        foreach ($fila as $valor) {
            echo "<td>" . htmlspecialchars((string)($valor ?? '—')) . "</td>";
        }
        echo "</tr>";
    }
    echo "</tbody></table>";
}

$consultas = [

    'Libros con su categoría y licencias' => <<<'SQL'
        SELECT l.titulo, l.autor, c.nombre AS categoria,
               l.licencias_disponibles, l.licencias_totales
        FROM libros l
        JOIN categorias c ON c.id_categoria = l.id_categoria
        ORDER BY c.nombre, l.titulo
    SQL,

    'Todos los préstamos' => <<<'SQL'
        SELECT p.id_prestamo, u.nombres, u.apellidos, l.titulo,
               p.fecha_solicitud, p.fecha_entrega_estimada,
               p.fecha_devolucion_real, p.estado
        FROM prestamos p
        JOIN usuarios u ON u.id_usuario = p.id_usuario
        JOIN libros l ON l.id_libro = p.id_libro
        ORDER BY p.id_prestamo
    SQL,

    'Préstamos por estado' => <<<'SQL'
        SELECT estado, COUNT(*) AS cantidad
        FROM prestamos
        GROUP BY estado
    SQL,

    'Los 3 libros con menos licencias disponibles' => <<<'SQL'
        SELECT titulo, licencias_disponibles, licencias_totales
        FROM libros
        ORDER BY licencias_disponibles ASC
        LIMIT 3
    SQL,

    'Cantidad de libros por categoría' => <<<'SQL'
        SELECT c.nombre AS categoria, COUNT(l.id_libro) AS total_libros
        FROM categorias c
        LEFT JOIN libros l ON l.id_categoria = c.id_categoria
        GROUP BY c.nombre
        ORDER BY total_libros DESC
    SQL,
];
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>BiblioCV - Consultas</title>
<style>
    body  { font-family: system-ui, sans-serif; margin: 2rem; color: #222; }
    table { border-collapse: collapse; margin-bottom: 1.5rem; }
    th, td { border: 1px solid #ccc; padding: .4rem .7rem; text-align: left; }
    th    { background: #f0f0f0; }
</style>
</head>
<body>
<h1>BiblioCV</h1>
<?php
foreach ($consultas as $titulo => $sql) {
    tabla($titulo, $pdo->query($sql)->fetchAll());
}
?>
</body>
</html>