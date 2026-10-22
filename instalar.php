<?php
/**
 * Crea la base de datos, tablas, índices, triggers y datos de ejemplo.
 * Se abre una sola vez en el navegador.
 */
require __DIR__ . '/conexion.php';
header('Content-Type: text/plain; charset=utf-8');

// ---------- 1. Base de datos ----------
$pdo = conectar(false);
$pdo->exec("CREATE DATABASE IF NOT EXISTS bibliocv CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
$pdo = conectar(true);

// ---------- 2. Tablas e índices ----------
$ddl = [

'usuarios' => <<<'SQL'
CREATE TABLE usuarios (
    id_usuario       INT AUTO_INCREMENT PRIMARY KEY,
    nombres          VARCHAR(60)  NOT NULL,
    apellidos        VARCHAR(60)  NOT NULL,
    correo           VARCHAR(120) NOT NULL UNIQUE,
    contrasena_hash  VARCHAR(255) NOT NULL,
    rol              ENUM('estudiante','bibliotecario') NOT NULL DEFAULT 'estudiante',
    fecha_registro   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado           ENUM('activo','inactivo') NOT NULL DEFAULT 'activo'
) ENGINE=InnoDB
SQL,

'estudiantes' => <<<'SQL'
CREATE TABLE estudiantes (
    id_usuario      INT PRIMARY KEY,
    grado           VARCHAR(10) NOT NULL,
    grupo           VARCHAR(5)  NOT NULL,
    puntos_totales  INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_estudiante_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB
SQL,

'categorias' => <<<'SQL'
CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB
SQL,

'libros' => <<<'SQL'
CREATE TABLE libros (
    id_libro              INT AUTO_INCREMENT PRIMARY KEY,
    titulo                VARCHAR(180) NOT NULL,
    autor                 VARCHAR(120) NOT NULL,
    editorial             VARCHAR(100),
    isbn                  VARCHAR(20) UNIQUE,
    id_categoria          INT NOT NULL,
    anio_publicacion      SMALLINT,
    sinopsis              TEXT,
    url_archivo           VARCHAR(255) NOT NULL,
    url_portada           VARCHAR(255),
    licencias_totales     INT NOT NULL DEFAULT 1,
    licencias_disponibles INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_libro_categoria FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria),
    CONSTRAINT chk_licencias CHECK (licencias_disponibles >= 0 AND licencias_disponibles <= licencias_totales)
) ENGINE=InnoDB
SQL,

'idx_libros_titulo' => "CREATE INDEX idx_libros_titulo ON libros(titulo)",

'configuracion_puntos' => <<<'SQL'
CREATE TABLE configuracion_puntos (
    id_config    INT AUTO_INCREMENT PRIMARY KEY,
    tipo_evento  VARCHAR(50) NOT NULL UNIQUE,
    puntos       INT NOT NULL,
    descripcion  VARCHAR(150)
) ENGINE=InnoDB
SQL,

'prestamos' => <<<'SQL'
CREATE TABLE prestamos (
    id_prestamo             INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario              INT NOT NULL,
    id_libro                INT NOT NULL,
    fecha_solicitud         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega_estimada  DATE NOT NULL,
    fecha_devolucion_real   DATETIME NULL,
    estado                  ENUM('activo','devuelto','atrasado') NOT NULL DEFAULT 'activo',
    CONSTRAINT fk_prestamo_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_prestamo_libro   FOREIGN KEY (id_libro)   REFERENCES libros(id_libro)
) ENGINE=InnoDB
SQL,

'idx_prestamos_usuario' => "CREATE INDEX idx_prestamos_usuario ON prestamos(id_usuario)",

'historial_puntos' => <<<'SQL'
CREATE TABLE historial_puntos (
    id_historial  INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario    INT NOT NULL,
    id_prestamo   INT NOT NULL,
    puntos        INT NOT NULL,
    tipo          ENUM('positivo','negativo') NOT NULL,
    motivo        VARCHAR(150),
    fecha         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hp_usuario  FOREIGN KEY (id_usuario)  REFERENCES estudiantes(id_usuario),
    CONSTRAINT fk_hp_prestamo FOREIGN KEY (id_prestamo) REFERENCES prestamos(id_prestamo)
) ENGINE=InnoDB
SQL,

'conversaciones' => <<<'SQL'
CREATE TABLE conversaciones (
    id_conversacion  INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario_1     INT NOT NULL,
    id_usuario_2     INT NOT NULL,
    fecha_creacion   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_conv_usuario1 FOREIGN KEY (id_usuario_1) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_conv_usuario2 FOREIGN KEY (id_usuario_2) REFERENCES usuarios(id_usuario),
    CONSTRAINT uq_conversacion_par UNIQUE (id_usuario_1, id_usuario_2)
) ENGINE=InnoDB
SQL,

'mensajes' => <<<'SQL'
CREATE TABLE mensajes (
    id_mensaje         INT AUTO_INCREMENT PRIMARY KEY,
    id_conversacion    INT NOT NULL,
    id_usuario_emisor  INT NOT NULL,
    contenido          TEXT NOT NULL,
    fecha_envio        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    leido              BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_mensaje_conversacion FOREIGN KEY (id_conversacion) REFERENCES conversaciones(id_conversacion) ON DELETE CASCADE,
    CONSTRAINT fk_mensaje_usuario FOREIGN KEY (id_usuario_emisor) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB
SQL,

'idx_mensajes_conversacion' => "CREATE INDEX idx_mensajes_conversacion ON mensajes(id_conversacion, fecha_envio)",
];

foreach ($ddl as $nombre => $sql) {
    $pdo->exec($sql);
    echo "OK  $nombre\n";
}

// ---------- 3. Triggers ----------
$triggers = [

'trg_prestamo_insert' => <<<'SQL'
CREATE TRIGGER trg_prestamo_insert
BEFORE INSERT ON prestamos
FOR EACH ROW
BEGIN
    DECLARE disponibles INT;
    SELECT licencias_disponibles INTO disponibles FROM libros WHERE id_libro = NEW.id_libro;
    IF disponibles IS NULL OR disponibles <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No hay copias virtuales disponibles de este libro.';
    END IF;
END
SQL,

'trg_prestamo_after_insert' => <<<'SQL'
CREATE TRIGGER trg_prestamo_after_insert
AFTER INSERT ON prestamos
FOR EACH ROW
BEGIN
    UPDATE libros SET licencias_disponibles = licencias_disponibles - 1 WHERE id_libro = NEW.id_libro;
END
SQL,

'trg_prestamo_devolucion' => <<<'SQL'
CREATE TRIGGER trg_prestamo_devolucion
AFTER UPDATE ON prestamos
FOR EACH ROW
BEGIN
    DECLARE puntos_evento INT;
    DECLARE tipo_evento_nombre VARCHAR(50);
    DECLARE tipo_puntos ENUM('positivo','negativo');

    IF NEW.estado = 'devuelto' AND OLD.estado <> 'devuelto' THEN
        IF DATE(NEW.fecha_devolucion_real) <= NEW.fecha_entrega_estimada THEN
            SET tipo_evento_nombre = 'entrega_a_tiempo';
            SET tipo_puntos = 'positivo';
        ELSE
            SET tipo_evento_nombre = 'entrega_atrasada';
            SET tipo_puntos = 'negativo';
        END IF;

        SELECT puntos INTO puntos_evento FROM configuracion_puntos WHERE tipo_evento = tipo_evento_nombre;

        INSERT INTO historial_puntos (id_usuario, id_prestamo, puntos, tipo, motivo)
        VALUES (NEW.id_usuario, NEW.id_prestamo, puntos_evento, tipo_puntos,
                CONCAT('Préstamo #', NEW.id_prestamo, ' - ', tipo_evento_nombre));

        UPDATE estudiantes SET puntos_totales = puntos_totales + puntos_evento WHERE id_usuario = NEW.id_usuario;
        UPDATE libros SET licencias_disponibles = licencias_disponibles + 1 WHERE id_libro = NEW.id_libro;
    END IF;
END
SQL,
];

foreach ($triggers as $nombre => $sql) {
    $pdo->exec($sql);
    echo "OK  trigger $nombre\n";
}

// ---------- 4. Datos de ejemplo ----------
$categorias = ['Fantasía', 'Historia', 'Poesía', 'Autoayuda', 'Biografía', 'Matemáticas', 'Arte'];
$st = $pdo->prepare("INSERT INTO categorias (nombre) VALUES (?)");
foreach ($categorias as $c) { $st->execute([$c]); }
echo "OK  categorias\n";

$usuarios = [
    ['Mariana',   'Gómez',    'mariana.gomez@colegio.edu.co',     'hash1',  'estudiante'],
    ['Andrés',    'Pérez',    'andres.perez@colegio.edu.co',      'hash2',  'estudiante'],
    ['Laura',     'Díaz',     'laura.diaz@colegio.edu.co',        'hash3',  'estudiante'],
    ['Daniel',    'Ríos',     'daniel.rios@colegio.edu.co',       'hash4',  'estudiante'],
    ['Valentina', 'Torres',   'valentina.torres@colegio.edu.co',  'hash5',  'estudiante'],
    ['Julián',    'Ramírez',  'julian.ramirez@colegio.edu.co',    'hash6',  'estudiante'],
    ['Camila',    'Ortiz',    'camila.ortiz@colegio.edu.co',      'hash7',  'estudiante'],
    ['Sebastián', 'Muñoz',    'sebastian.munoz@colegio.edu.co',   'hash8',  'estudiante'],
    ['Nicolás',   'Herrera',  'nicolas.herrera@colegio.edu.co',   'hash9',  'estudiante'],
    ['Isabella',  'Cárdenas', 'isabella.cardenas@colegio.edu.co', 'hash10', 'bibliotecario'],
];
$st = $pdo->prepare(
    "INSERT INTO usuarios (nombres, apellidos, correo, contrasena_hash, rol) VALUES (?,?,?,?,?)"
);
foreach ($usuarios as $u) { $st->execute($u); }
echo "OK  usuarios\n";

// Estudiantes (ids 1-9; el 10 es bibliotecario). Grado y grupo son de ejemplo.
$st = $pdo->prepare("INSERT INTO estudiantes (id_usuario, grado, grupo) VALUES (?,?,?)");
foreach (range(1, 9) as $id) { $st->execute([$id, '10', $id % 2 ? 'A' : 'B']); }
echo "OK  estudiantes\n";

// Puntos por evento (los usa el trigger de devolución). Valores de ejemplo.
$st = $pdo->prepare("INSERT INTO configuracion_puntos (tipo_evento, puntos, descripcion) VALUES (?,?,?)");
$st->execute(['entrega_a_tiempo', 10, 'Devolución dentro del plazo']);
$st->execute(['entrega_atrasada', -5, 'Devolución después del plazo']);
echo "OK  configuracion_puntos\n";

$libros = [
    ['El Aleph', 'Jorge Luis Borges', 'Emecé', '9788420633287', 1, 1949, 'Colección de cuentos fantásticos sobre el infinito y el tiempo.', '/archivos/el_aleph.pdf', '/portadas/el_aleph.jpg', 2, 2],
    ['Breve historia del tiempo', 'Stephen Hawking', 'Crítica', '9788484329110', 2, 1988, 'Explicación divulgativa del origen y funcionamiento del universo.', '/archivos/breve_historia_tiempo.pdf', '/portadas/breve_historia.jpg', 3, 3],
    ['Clean Code', 'Robert C. Martin', 'Prentice Hall', '9780132350884', 3, 2008, 'Buenas prácticas para escribir código legible y mantenible.', '/archivos/clean_code.pdf', '/portadas/clean_code.jpg', 4, 4],
    ['El Hobbit', 'J.R.R. Tolkien', 'Minotauro', '9788445077438', 4, 1937, 'Las aventuras de Bilbo Bolsón camino a la Montaña Solitaria.', '/archivos/el_hobbit.pdf', '/portadas/el_hobbit.jpg', 3, 3],
    ['Sapiens', 'Yuval Noah Harari', 'Debate', '9788499926223', 5, 2011, 'Una breve historia de la humanidad, de la Edad de Piedra a hoy.', '/archivos/sapiens.pdf', '/portadas/sapiens.jpg', 2, 2],
    ['Veinte poemas de amor', 'Pablo Neruda', 'Losada', '9789500722610', 6, 1924, 'Poemario emblemático de la lírica en español.', '/archivos/veinte_poemas.pdf', '/portadas/veinte_poemas.jpg', 5, 5],
    ['El poder del ahora', 'Eckhart Tolle', 'Grijalbo', '9788478087298', 7, 1997, 'Reflexiones sobre la atención plena y el momento presente.', '/archivos/poder_del_ahora.pdf', '/portadas/poder_ahora.jpg', 3, 3],
];
$st = $pdo->prepare(
    "INSERT INTO libros (titulo, autor, editorial, isbn, id_categoria, anio_publicacion, sinopsis,
                         url_archivo, url_portada, licencias_totales, licencias_disponibles)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)"
);
foreach ($libros as $l) { $st->execute($l); }
echo "OK  libros\n";

// Préstamos y devoluciones.
// 'p' = nuevo préstamo [id_usuario, id_libro, solicitud, entrega_estimada, estado]
// 'd' = devolución     [id_usuario, id_libro, fecha_devolucion_real]
$pasos = [
    ['p', 4, 4, '2026-08-10 09:00:00', '2026-08-17', 'activo'],
    ['p', 5, 5, '2026-08-05 10:00:00', '2026-08-12', 'activo'],
    ['d', 4, 4, '2026-08-11 17:00:00'],
    ['p', 6, 6, '2026-08-01 08:30:00', '2026-08-08', 'activo'],
    ['d', 5, 5, '2026-08-15 20:00:00'],
    ['p', 7, 7, '2026-08-20 11:00:00', '2026-08-27', 'atrasado'],
    ['p', 8, 1, '2026-08-01 09:15:00', '2026-08-05', 'activo'],
    ['d', 8, 1, '2026-08-04 12:00:00'],
    ['p', 9, 2, '2026-08-02 14:00:00', '2026-08-06', 'activo'],
    ['d', 9, 2, '2026-08-10 09:30:00'],
    ['p', 1, 5, '2026-08-15 09:00:00', '2026-08-25', 'activo'],
    ['d', 1, 5, '2026-08-24 16:00:00'],
];
$insP = $pdo->prepare(
    "INSERT INTO prestamos (id_usuario, id_libro, fecha_solicitud, fecha_entrega_estimada, estado)
     VALUES (?,?,?,?,?)"
);
$updD = $pdo->prepare(
    "UPDATE prestamos SET estado = 'devuelto', fecha_devolucion_real = ?
     WHERE id_usuario = ? AND id_libro = ? AND estado <> 'devuelto'"
);

foreach ($pasos as $i => $paso) {
    try {
        if ($paso[0] === 'p') {
            $insP->execute(array_slice($paso, 1));
            echo "OK  préstamo (usuario {$paso[1]}, libro {$paso[2]})\n";
        } else {
            $updD->execute([$paso[3], $paso[1], $paso[2]]);
            echo "OK  devolución (usuario {$paso[1]}, libro {$paso[2]}) filas: {$updD->rowCount()}\n";
        }
    } catch (PDOException $e) {
        echo "ERR paso " . ($i + 1) . ": " . $e->getMessage() . "\n";
    }
}

echo "\nListo.\n";