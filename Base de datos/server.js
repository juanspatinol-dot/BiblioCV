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

    const descrUser = description && description.trim() !== ''
        ? description
        : `Hola soy ${name} y soy miembro de BiblioCV`;

    const query = `
        INSERT INTO users (ID_user, name_user, nickname_user, email_user, born_date, passw_hash, phone_user, type_user, adress_user, role_user, descr_user) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'student', ?)
    `;

    db.query(query, [idUser, name, nick, email, birthDate, password, phone, jornada, address, descrUser], (err) => {
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
                role_user: user.role_user,
                descr_user: user.descr_user
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
// RUTA PARA OBTENER TODOS LOS LIBROS
// ==========================================
app.get('/api/books', (req, res) => {
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
// RUTA PARA OBTENER UN LIBRO POR SU ID
// ==========================================
app.get('/api/books/:id', (req, res) => {
    const bookId = req.params.id;
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

// ==========================================
// RUTA PARA OBTENER ESTADÍSTICAS DEL PERFIL
// ==========================================
app.get('/api/interactions/user/:userid', (req, res) => {
    const userId = req.params.userid;
    const query = 'SELECT type_inter, COUNT(*) as total FROM interaction WHERE userid = ? AND type_inter IS NOT NULL GROUP BY type_inter';

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Error al obtener estadísticas del usuario." });
        }

        const stats = { favorite: 0, read_later: 0, not_interested: 0 };
        results.forEach(row => {
            if (Object.prototype.hasOwnProperty.call(stats, row.type_inter)) {
                stats[row.type_inter] = row.total;
            }
        });

        res.status(200).json(stats);
    });
});

// ==========================================
// RUTA PARA INTERACCIONES (Favoritos / Leer más tarde / Calificación)
// ==========================================
app.post('/api/interactions', (req, res) => {
    const { userid, bookid, type_inter, rating } = req.body;
    const uid = Number(userid);
    const bid = Number(bookid);

    if (!uid || !bid || !type_inter) {
        return res.status(400).json({ error: 'Faltan datos obligatorios o no son numéricos.' });
    }

    if (type_inter === 'rating') {
        const numericRating = parseFloat(rating);
        if (Number.isNaN(numericRating) || numericRating < 0 || numericRating > 5) {
            return res.status(400).json({ error: 'Calificación inválida.' });
        }

        const checkRatingQuery = 'SELECT * FROM interaction WHERE userid = ? AND bookid = ? AND rating IS NOT NULL';
        db.query(checkRatingQuery, [uid, bid], (err, results) => {
            if (err) {
                console.error('Error SQL checkRatingQuery:', err);
                return res.status(500).json({ error: `MySQL (${err.code}): ${err.sqlMessage}` });
            }

            if (results.length > 0) {
                const updateRatingQuery = 'UPDATE interaction SET rating = ? WHERE userid = ? AND bookid = ? AND rating IS NOT NULL';
                db.query(updateRatingQuery, [numericRating, uid, bid], (err) => {
                    if (err) {
                        console.error('Error SQL updateRatingQuery:', err);
                        return res.status(500).json({ error: `MySQL (${err.code}): ${err.sqlMessage}` });
                    }
                    return res.status(200).json({ message: 'Calificación actualizada', action: 'rated', rating: numericRating });
                });
            } else {
                const insertRatingQuery = 'INSERT INTO interaction (userid, bookid, type_inter, rating) VALUES (?, ?, NULL, ?)';
                db.query(insertRatingQuery, [uid, bid, numericRating], (err) => {
                    if (err) {
                        console.error('Error SQL insertRatingQuery:', err);
                        return res.status(500).json({ error: `MySQL (${err.code}): ${err.sqlMessage}` });
                    }
                    return res.status(200).json({ message: 'Calificación guardada', action: 'rated', rating: numericRating });
                });
            }
        });
        return;
    }

    const checkQuery = 'SELECT * FROM interaction WHERE userid = ? AND bookid = ? AND type_inter = ?';
    db.query(checkQuery, [uid, bid, type_inter], (err, results) => {
        if (err) {
            console.error('Error SQL checkQuery:', err);
            return res.status(500).json({ error: `MySQL (${err.code}): ${err.sqlMessage}` });
        }

        if (results.length > 0) {
            const deleteQuery = 'DELETE FROM interaction WHERE userid = ? AND bookid = ? AND type_inter = ?';
            db.query(deleteQuery, [uid, bid, type_inter], (err) => {
                if (err) {
                    console.error('Error SQL deleteQuery:', err);
                    return res.status(500).json({ error: `MySQL (${err.code}): ${err.sqlMessage}` });
                }
                return res.status(200).json({ message: 'Interacción eliminada con éxito', action: 'removed' });
            });
        } else {
            const insertQuery = 'INSERT INTO interaction (userid, bookid, type_inter) VALUES (?, ?, ?)';
            db.query(insertQuery, [uid, bid, type_inter], (err) => {
                if (err) {
                    console.error('Error SQL insertQuery:', err);
                    return res.status(500).json({ error: `MySQL (${err.code}): ${err.sqlMessage}` });
                }
                return res.status(200).json({ message: 'Interacción guardada con éxito', action: 'added' });
            });
        }
    });
});

// ==========================================
// RUTA PARA OBTENER INTERACCIONES DEL USUARIO EN UN LIBRO
// ==========================================
app.get('/api/interactions/:userid/:bookid', (req, res) => {
    const uid = Number(req.params.userid);
    const bid = Number(req.params.bookid);

    if (!uid || !bid) {
        return res.status(400).json({ error: 'ID de usuario o libro inválido.' });
    }

    const query = 'SELECT type_inter, rating FROM interaction WHERE userid = ? AND bookid = ?';

    db.query(query, [uid, bid], (err, results) => {
        if (err) {
            console.error('Error SQL al consultar interacciones del libro:', err);
            return res.status(500).json({ error: `MySQL (${err.code}): ${err.sqlMessage}` });
        }

        const state = {
            favorite: false,
            read_later: false,
            rating: null
        };

        results.forEach(row => {
            if (row.type_inter === 'favorite') state.favorite = true;
            if (row.type_inter === 'read_later') state.read_later = true;
            if (row.rating !== null && row.rating !== undefined) state.rating = Number(row.rating);
        });

        res.status(200).json(state);
    });
});

// ==========================================
// RUTA PARA OBTENER LIBROS DEL HISTORIAL POR USUARIO
// ==========================================
app.get('/api/record/:userid', (req, res) => {
    const uid = Number(req.params.userid);

    if (!uid) {
        return res.status(400).json({ error: 'ID de usuario inválido.' });
    }

    const query = `
        SELECT 
            i.type_inter,
            i.rating,
            b.cod_book,
            b.name_book,
            b.author_book,
            b.genre_book,
            b.year_book,
            b.quantity,
            b.imgurl_book,
            b.fileurl_book,
            b.rate_book
        FROM interaction i
        INNER JOIN books b ON i.bookid = b.cod_book
        WHERE i.userid = ?
    `;

    db.query(query, [uid], (err, results) => {
        if (err) {
            console.error('Error SQL en /api/record/:userid:', err);
            return res.status(500).json({ error: `MySQL (${err.code}): ${err.sqlMessage}` });
        }

        res.status(200).json(results);
    });
});

// ==========================================
// RUTA PARA SOLICITAR PRÉSTAMO (Tabla loans)
// ==========================================
app.post('/api/loans', (req, res) => {
    const uid = Number(req.body.userid);
    const bid = Number(req.body.bookid);

    if (!uid || !bid) {
        return res.status(400).json({ error: 'ID de usuario o libro inválido.' });
    }

    // 1. Verificar stock del libro
    const checkBookQuery = 'SELECT quantity, name_book FROM books WHERE cod_book = ?';
    db.query(checkBookQuery, [bid], (err, bookResults) => {
        if (err) {
            console.error('Error SQL al verificar libro:', err);
            return res.status(500).json({ error: `MySQL (${err.code}): ${err.sqlMessage}` });
        }

        if (bookResults.length === 0) {
            return res.status(404).json({ error: 'El libro no existe.' });
        }

        if (bookResults[0].quantity <= 0) {
            return res.status(400).json({ error: 'No hay stock disponible para este libro.' });
        }

        // 2. Evitar que el mismo usuario pida el mismo libro si ya tiene una solicitud 'pending' o 'acepted'
        const checkLoanQuery = `
            SELECT ID_loan, type_loan 
            FROM loans 
            WHERE userid = ? AND bookid = ? AND type_loan IN ('pending', 'acepted')
        `;
        db.query(checkLoanQuery, [uid, bid], (err, loanResults) => {
            if (err) {
                console.error('Error SQL al verificar préstamos previos:', err);
                return res.status(500).json({ error: `MySQL (${err.code}): ${err.sqlMessage}` });
            }

            if (loanResults.length > 0) {
                const currentStatus = loanResults[0].type_loan === 'pending' ? 'pendiente' : 'aceptada';
                return res.status(409).json({
                    error: `Ya tienes una solicitud ${currentStatus} para este libro.`
                });
            }

            // 3. Insertar la solicitud en la tabla loans con estado 'pending'
            const insertLoanQuery = `
                INSERT INTO loans (userid, bookid, type_loan) 
                VALUES (?, ?, 'pending')
            `;
            db.query(insertLoanQuery, [uid, bid], (err, insertResult) => {
                if (err) {
                    console.error('Error SQL al insertar en loans:', err);
                    return res.status(500).json({ error: `MySQL (${err.code}): ${err.sqlMessage}` });
                }

                return res.status(201).json({
                    message: 'Solicitud de préstamo enviada con éxito.',
                    ID_loan: insertResult.insertId,
                    type_loan: 'pending'
                });
            });
        });
    });
});

// ==========================================
// RUTA PARA OBTENER PRÉSTAMOS DEL USUARIO (Para record.html)
// (Va ANTES de /:userid/:bookid para evitar conflicto de rutas en Express)
// ==========================================
app.get('/api/loans/user/:userid', (req, res) => {
    const uid = Number(req.params.userid);

    if (!uid) {
        return res.status(400).json({ error: 'ID de usuario inválido.' });
    }

    const query = `
        SELECT 
            l.ID_loan,
            l.type_loan,
            b.cod_book,
            b.name_book,
            b.author_book,
            b.genre_book,
            b.year_book,
            b.quantity,
            b.imgurl_book,
            b.fileurl_book,
            b.rate_book
        FROM loans l
        INNER JOIN books b ON l.bookid = b.cod_book
        WHERE l.userid = ?
        ORDER BY l.ID_loan DESC
    `;

    db.query(query, [uid], (err, results) => {
        if (err) {
            console.error('Error SQL en /api/loans/user/:userid:', err);
            return res.status(500).json({ error: `MySQL (${err.code}): ${err.sqlMessage}` });
        }

        res.status(200).json(results);
    });
});

// ==========================================
// RUTA PARA VERIFICAR ESTADO DE PRÉSTAMO DE UN USUARIO EN UN LIBRO
// ==========================================
app.get('/api/loans/:userid/:bookid', (req, res) => {
    const uid = Number(req.params.userid);
    const bid = Number(req.params.bookid);

    if (!uid || !bid) {
        return res.status(400).json({ error: 'ID de usuario o libro inválido.' });
    }

    const query = `
        SELECT ID_loan, type_loan 
        FROM loans 
        WHERE userid = ? AND bookid = ? 
        ORDER BY ID_loan DESC 
        LIMIT 1
    `;

    db.query(query, [uid, bid], (err, results) => {
        if (err) {
            console.error('Error SQL al consultar estado del préstamo:', err);
            return res.status(500).json({ error: `MySQL (${err.code}): ${err.sqlMessage}` });
        }

        if (results.length === 0) {
            return res.status(200).json({ loan: null });
        }

        res.status(200).json({ loan: results[0] });
    });
});

// ==========================================
// RUTAS DE SUPERVISOR / ADMINISTRADOR
// ==========================================

// 1. Listar todas las solicitudes pendientes con datos del usuario y del libro
app.get('/api/admin/loans', (req, res) => {
    const query = `
        SELECT 
            l.ID_loan,
            l.userid,
            l.bookid,
            l.type_loan,
            u.nickname_user,
            u.name_user,
            u.adress_user,
            u.phone_user,
            u.role_user,
            b.name_book,
            b.quantity
        FROM loans l
        INNER JOIN users u ON l.userid = u.ID_user
        INNER JOIN books b ON l.bookid = b.cod_book
        WHERE l.type_loan = 'pending'
        ORDER BY l.ID_loan ASC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error SQL en GET /api/admin/loans:', err);
            return res.status(500).json({ error: `MySQL (${err.code}): ${err.sqlMessage}` });
        }
        res.status(200).json(results);
    });
});

// 2. Aceptar o Rechazar una petición de préstamo
app.put('/api/admin/loans/:id', (req, res) => {
    const loanId = Number(req.params.id);
    const { status } = req.body; // 'acepted' o 'rejected'

    if (!loanId || !['acepted', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Datos de actualización inválidos.' });
    }

    // Si se rechaza, solo actualizamos el estado en loans
    if (status === 'rejected') {
        const rejectQuery = "UPDATE loans SET type_loan = 'rejected' WHERE ID_loan = ?";
        db.query(rejectQuery, [loanId], (err) => {
            if (err) {
                console.error('Error SQL al rechazar préstamo:', err);
                return res.status(500).json({ error: `MySQL (${err.code}): ${err.sqlMessage}` });
            }
            return res.status(200).json({ message: 'Petición rechazada correctamente.' });
        });
        return;
    }

    // Si se acepta, primero verificamos que haya stock disponible del libro
    const checkQuery = `
        SELECT l.bookid, b.quantity 
        FROM loans l 
        INNER JOIN books b ON l.bookid = b.cod_book 
        WHERE l.ID_loan = ?
    `;

    db.query(checkQuery, [loanId], (err, results) => {
        if (err) {
            console.error('Error SQL al verificar stock para aceptar préstamo:', err);
            return res.status(500).json({ error: `MySQL (${err.code}): ${err.sqlMessage}` });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Solicitud no encontrada.' });
        }

        const { bookid, quantity } = results[0];
        if (quantity <= 0) {
            return res.status(400).json({ error: 'No queda stock disponible para aprobar este libro.' });
        }

        const acceptLoanQuery = "UPDATE loans SET type_loan = 'acepted' WHERE ID_loan = ?";
        db.query(acceptLoanQuery, [loanId], (err) => {
            if (err) {
                console.error('Error SQL al aceptar préstamo:', err);
                return res.status(500).json({ error: `MySQL (${err.code}): ${err.sqlMessage}` });
            }

            const updateStockQuery = 'UPDATE books SET quantity = quantity - 1 WHERE cod_book = ?';
            db.query(updateStockQuery, [bookid], (err) => {
                if (err) {
                    console.error('Error SQL al descontar stock:', err);
                    return res.status(500).json({ error: `MySQL (${err.code}): ${err.sqlMessage}` });
                }

                return res.status(200).json({ message: 'Petición aceptada y stock actualizado.' });
            });
        });
    });
});

// 3. Banear usuario y cancelar sus peticiones pendientes
app.put('/api/admin/users/:userid/ban', (req, res) => {
    const uid = Number(req.params.userid);

    if (!uid) {
        return res.status(400).json({ error: 'ID de usuario inválido.' });
    }

    const banQuery = "UPDATE users SET role_user = 'banned' WHERE ID_user = ?";
    db.query(banQuery, [uid], (err) => {
        if (err) {
            console.error('Error SQL al banear usuario:', err);
            return res.status(500).json({ error: `MySQL (${err.code}): ${err.sqlMessage}` });
        }

        const cancelLoansQuery = "UPDATE loans SET type_loan = 'cancelled' WHERE userid = ? AND type_loan = 'pending'";
        db.query(cancelLoansQuery, [uid], (err) => {
            if (err) {
                console.error('Error SQL al cancelar préstamos del baneado:', err);
                return res.status(500).json({ error: `MySQL (${err.code}): ${err.sqlMessage}` });
            }

            return res.status(200).json({ message: 'Usuario baneado y solicitudes pendientes canceladas.' });
        });
    });
});

app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});