document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión activa
    const activeNick = localStorage.getItem('userNick');
    const userId = localStorage.getItem('userId');

    if (!activeNick || !userId) {
        alert('Debes iniciar sesión para ver tu perfil.');
        window.location.href = 'login.html';
        return;
    }

    try {
        // 2. Consultar los datos reales del usuario desde MySQL
        const userRes = await fetch(`http://localhost:3000/api/users/${activeNick}`);
        if (!userRes.ok) throw new Error('No se pudo cargar la información del perfil.');
        const user = await userRes.json();

        // 3. Consultar el conteo real de interacciones (Favoritos y Leer más tarde)
        let stats = { favorite: 0, read_later: 0 };
        const statsRes = await fetch(`http://localhost:3000/api/interactions/user/${userId}`);
        if (statsRes.ok) {
            stats = await statsRes.json();
        }

        // 4. Inyectar el nombre real en el encabezado
        const nameElement = document.querySelector('.perfil__name');
        if (nameElement) {
            nameElement.textContent = user.name_user || activeNick;
        }

        // Traducir el rol de la base de datos a español legible
        const roleMap = {
            'student': 'Estudiante',
            'admin': 'Administrador',
            'supervisor': 'Supervisor'
        };
        const displayRole = roleMap[user.role_user] || 'Estudiante';

        // 5. Rellenar los 5 <span> dentro de .perfil__datalist
        const dataSpans = document.querySelectorAll('.perfil__datalist .perfil__data-parra span');
        if (dataSpans.length >= 5) {
            dataSpans[0].textContent = displayRole;                                                           // Cargo
            dataSpans[1].textContent = user.email_user || 'No registrado';                                    // Correo
            dataSpans[2].textContent = user.adress_user || 'No especificada';                                 // Dirección
            dataSpans[3].textContent = user.phone_user || 'No registrado';                                    // Número
            dataSpans[4].textContent = (user.type_user || '').toLowerCase() === 'morning' ? 'Secundaria' : 'Primaria'; // Jornada
        }

        // 6. Rellenar estadísticas reales de libros y clubes
        const bookItems = document.querySelectorAll('.perfil__bookitem .perfil__book-parra');
        if (bookItems.length >= 3) {
            bookItems[0].innerHTML = `<strong>Libros leidos: </strong>0`;
            bookItems[1].innerHTML = `<strong>Libros leer más tarde: </strong>${stats.read_later}`;
            bookItems[2].innerHTML = `<strong>Libros favoritos: </strong>${stats.favorite}`;
        }

        const clubsParra = document.querySelector('.perfil__clubsitem .perfil__clubs-parra');
        if (clubsParra) {
            clubsParra.innerHTML = `<strong>Clubes: </strong>0`;
        }

        // 7. Rellenar descripción real desde la base de datos
        const descripElement = document.querySelector('.perfil__descrip-parra');
        if (descripElement) {
            descripElement.textContent = user.descr_user || `Hola soy ${user.name_user} y soy miembro de BiblioCV`;
        }

    } catch (error) {
        console.error('Error al cargar el perfil:', error);
        alert('Hubo un error al cargar los datos de tu perfil.');
    }

    // 8. Botones del formulario inferior (Editar, Puntos, Cerrar sesión)
    const formButtons = document.querySelectorAll('.perfil__form .btn__perfil-form');

    // Botón Editar (índice 0)
    if (formButtons[0]) {
        formButtons[0].addEventListener('click', (e) => {
            e.preventDefault();
            alert('Función de editar perfil próximamente disponible.');
        });
    }

    // Botón Puntos (índice 1)
    if (formButtons[1]) {
        formButtons[1].addEventListener('click', (e) => {
            e.preventDefault();
            alert('¡Tienes 100 puntos disponibles!');
        });
    }

    // Botón Cerrar sesión (índice 2) -> Borra TODO el localStorage
    if (formButtons[2]) {
        formButtons[2].addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            alert('Has cerrado sesión exitosamente.');
            window.location.href = 'login.html';
        });
    }
});