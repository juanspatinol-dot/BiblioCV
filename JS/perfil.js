document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificar sesión activa
    const activeNick = localStorage.getItem('userNick');
    if (!activeNick) {
        alert('Debes iniciar sesión para ver tu perfil.');
        window.location.href = 'register.html';
        return;
    }

    // 2. Recuperar los datos guardados en localStorage
    const userName = localStorage.getItem('userName') || activeNick;
    const userEmail = localStorage.getItem('userEmail') || 'No registrado';
    const userAddress = localStorage.getItem('userAddress') || 'No especificada';
    const userPhone = localStorage.getItem('userPhone') || 'No registrado';
    const userShift = localStorage.getItem('userShift') ? localStorage.getItem('userShift').toLowerCase().trim() : 'morning';
    const userDescription = localStorage.getItem('userDescription') || `Hola soy ${userName} y soy miembro de BiblioCV`;

    // 3. Inyectar el nombre real en el encabezado
    const nameElement = document.querySelector('.perfil__name');
    if (nameElement) {
        nameElement.textContent = userName;
    }

    // 4. Rellenar los 5 <span> dentro de .perfil__datalist en el orden exacto de tu HTML
    const dataSpans = document.querySelectorAll('.perfil__datalist .perfil__data-parra span');
    
    if (dataSpans.length >= 5) {
        dataSpans[0].textContent = 'Estudiante';                                      // Cargo
        dataSpans[1].textContent = userEmail;                                         // Correo
        dataSpans[2].textContent = userAddress;                                       // Dirección
        dataSpans[3].textContent = userPhone;                                         // Número
        dataSpans[4].textContent = userShift === 'morning' ? 'Secundaria' : 'Primaria'; // Jornada
    }

    // 5. Rellenar estadísticas de libros y clubes en 0
    const bookItems = document.querySelectorAll('.perfil__bookitem .perfil__book-parra');
    if (bookItems.length >= 3) {
        bookItems[0].innerHTML = `<strong>Libros leidos: </strong>0`;
        bookItems[1].innerHTML = `<strong>Libros leer más tarde: </strong>0`;
        bookItems[2].innerHTML = `<strong>Libros favoritos: </strong>0`;
    }

    const clubsParra = document.querySelector('.perfil__clubsitem .perfil__clubs-parra');
    if (clubsParra) {
        clubsParra.innerHTML = `<strong>Clubes: </strong>0`;
    }

    // 6. Rellenar descripción
    const descripElement = document.querySelector('.perfil__descrip-parra');
    if (descripElement) {
        descripElement.textContent = userDescription;
    }

    // 7. Botones del formulario inferior (Editar, Puntos, Cerrar sesión)
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