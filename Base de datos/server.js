const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Conexión a la base de datos MySQL
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
    console.log('¡Conectado exitosamente a la base de datos MySQL!');
});

// ==========================================
// RUTA DE REGISTRO
// ==========================================
app.post('/api/register', async (req, res) => {
    const { idUser, name, nick, email, phone, birthDate, password, jornada } = req.body;
    const role = 'student'; // Rol por defecto

    try {
        const saltRounds = 10;
        const passw_hash = await bcrypt.hash(password, saltRounds);

        const query = `INSERT INTO users (ID_user, name_user, nickname_user, email_user, born_date, passw_hash, phone_user, type_user, role_user) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(query, [idUser, name, nick, email, birthDate, passw_hash, phone, jornada, role], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "El documento, apodo o correo ya están registrados." });
            }
            // Devolvemos el nick para mostrarlo en el alert de éxito
            res.status(201).json({ 
                message: "¡Usuario registrado con éxito!",
                nick: nick 
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error en el servidor al procesar el registro." });
    }
});

// ==========================================
// RUTA DE LOGIN
// ==========================================
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const query = 'SELECT * FROM users WHERE email_user = ?';
        db.query(query, [email], async (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Error en el servidor al intentar iniciar sesión." });
            }

            if (results.length === 0) {
                return res.status(401).json({ error: "Correo o contraseña incorrectos." });
            }

            const user = results[0];

            const passwordMatch = await bcrypt.compare(password, user.passw_hash);

            if (!passwordMatch) {
                return res.status(401).json({ error: "Correo o contraseña incorrectos." });
            }

            // Devolvemos el nickname_user en el objeto del usuario
            res.status(200).json({ 
                message: "¡Inicio de sesión exitoso!",
                user: {
                    id: user.ID_user,
                    name: user.name_user,
                    nickname: user.nickname_user,
                    email: user.email_user,
                    role: user.role_user
                }
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error interno en el servidor." });
    }
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});