document.addEventListener('DOMContentLoaded', async () => {
    const activeNick = localStorage.getItem('userNick');
    const userId = localStorage.getItem('userId');

    if (!activeNick || !userId) {
        alert('Debes iniciar sesión para ver tu perfil.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const userRes = await fetch(`http://localhost:3000/api/users/${activeNick}`);
        if (!userRes.ok) throw new Error('No se pudo cargar la información del perfil.');
        const user = await userRes.json();

        let stats = { favorite: 0, read_later: 0 };
        const statsRes = await fetch(`http://localhost:3000/api/interactions/user/${userId}`);
        if (statsRes.ok) {
            stats = await statsRes.json();
        }

        const nameElement = document.querySelector('.perfil__name');
        if (nameElement) {
            nameElement.textContent = user.name_user || activeNick;
        }

        const roleMap = {
            'student': 'Estudiante',
            'admin': 'Administrador',
            'supervisor': 'Supervisor'
        };
        const displayRole = roleMap[user.role_user] || 'Estudiante';

        const dataSpans = document.querySelectorAll('.perfil__datalist .perfil__data-parra span');
        if (dataSpans.length >= 5) {
            dataSpans[0].textContent = displayRole;
            dataSpans[1].textContent = user.email_user || 'No registrado';
            dataSpans[2].textContent = user.adress_user || 'No especificada';
            dataSpans[3].textContent = user.phone_user || 'No registrado';
            dataSpans[4].textContent = (user.type_user || '').toLowerCase() === 'morning' ? 'Secundaria' : 'Primaria';
        }

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

        const descripElement = document.querySelector('.perfil__descrip-parra');
        if (descripElement) {
            descripElement.textContent = user.descr_user || `Hola soy ${user.name_user} y soy miembro de BiblioCV`;
        }

    } catch (error) {
        console.error('Error al cargar el perfil:', error);
        alert('Hubo un error al cargar los datos de tu perfil.');
    }

    const formButtons = document.querySelectorAll('.perfil__form .btn__perfil-form');

    if (formButtons[0]) {
        formButtons[0].addEventListener('click', (e) => {
            e.preventDefault();
            alert('Función de editar perfil próximamente disponible.');
        });
    }

    if (formButtons[1]) {
        formButtons[1].addEventListener('click', (e) => {
            e.preventDefault();
            alert('¡Tienes 100 puntos disponibles!');
        });
    }

    if (formButtons[2]) {
        formButtons[2].addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            alert('Has cerrado sesión exitosamente.');
            window.location.href = 'login.html';
        });
    }
});