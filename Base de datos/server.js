const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Legolaz0',
    database: 'bibliocv'
});

db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conectado exitosamente a la base de datos MySQL.');
});

// ==========================================
// RUTA DE REGISTRO (Actualizada con dirección)
// ==========================================
app.post('/api/register', (req, res) => {
    const { idUser, name, nick, email, phone, birthDate, password, jornada, address, description } = req.body;

    // Si no mandan descripción, usamos la frase por defecto que pediste
    const descrUser = description && description.trim() !== '' 
        ? description 
        : `Hola soy ${name} y soy miembro de BiblioCV`;

    const query = `
        INSERT INTO users (ID_user, name_user, nickname_user, email_user, born_date, passw_hash, phone_user, type_user, adress_user, role_user, descr_user) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'student', ?)
    `;

    db.query(query, [idUser, name, nick, email, birthDate, password, phone, jornada, address, descrUser], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "El documento, apodo o correo ya están registrados." });
        }
        
        res.status(200).json({ 
            message: "Registro exitoso",
            user: {
                idUser,
                name,
                nick,
                email,
                phone,
                birthDate,
                jornada,
                address,
                description: descrUser
            }
        });
    });
});

// ==========================================
// RUTA DE LOGIN
// ==========================================
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email_user = ? AND passw_hash = ?';

    db.query(query, [email, password], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error en el servidor durante el login." });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: "Correo o contraseña incorrectos." });
        }

        const user = results[0];

        res.status(200).json({
            message: "Login exitoso",
            user: {
                ID_user: user.ID_user,
                nickname_user: user.nickname_user,
                name_user: user.name_user,
                email_user: user.email_user,
                phone_user: user.phone_user,
                born_date: user.born_date,
                adress_user: user.adress_user,
                type_user: user.type_user,
                descr_user: user.descr_user // <--- Importante para que viaje la descripción
            }
        });
    });
});

// ==========================================
// RUTA PARA OBTENER DATOS DEL PERFIL POR NICKNAME
// ==========================================
app.get('/api/users/:nick', (req, res) => {
    const userNick = req.params.nick;
    const query = 'SELECT * FROM users WHERE nickname_user = ?';
    
    db.query(query, [userNick], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error en el servidor al buscar el usuario." });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }
        res.status(200).json(results[0]);
    });
});

// ==========================================
// RUTA PARA OBTENER TODOS LOS LIBROS (Para el catálogo / home.js)
// ==========================================
app.get('/api/books', (req, res) => {
    // Asegúrate de que tu tabla en MySQL se llame 'books' (o cámbiala si tiene otro nombre)
    const query = 'SELECT * FROM books'; 
    
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al obtener el catálogo de libros." });
        }
        res.status(200).json(results);
    });
});

// ==========================================
// RUTA PARA OBTENER UN LIBRO POR SU ID (Para el preview.js)
// ==========================================
app.get('/api/books/:id', (req, res) => {
    const bookId = req.params.id;
    // Asegúrate de que 'cod_book' sea el nombre del campo ID/código en tu tabla de libros
    const query = 'SELECT * FROM books WHERE cod_book = ?';
    
    db.query(query, [bookId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error en el servidor al buscar el libro." });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: "Libro no encontrado." });
        }
        res.status(200).json(results[0]);
    });
});

app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});