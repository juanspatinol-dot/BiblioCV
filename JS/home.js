document.addEventListener('DOMContentLoaded', async () => {
    // 1. PROTEGER RUTA: Si no hay sesión activa, redirigir a register
    const activeNick = localStorage.getItem('userNick');
    if (!activeNick) {
        alert('Debes iniciar sesión para acceder al sistema.');
        window.location.href = 'register.html';
        return;
    }

    // Obtener la jornada del usuario almacenada
    const userShift = localStorage.getItem('userShift') ? localStorage.getItem('userShift').toLowerCase().trim() : '';

    // 2. MOSTRAR APODO EN EL BIENVENIDO
    const welcomeTitle = document.querySelector('.main-wrapped .title');
    if (welcomeTitle) {
        welcomeTitle.textContent = `Bienvenido ${activeNick} a BiblioCV.`;
    }

    try {
        // 3. CARGAR LIBROS DESDE LA BASE DE DATOS
        const respuesta = await fetch('http://localhost:3000/api/books');
        if (!respuesta.ok) throw new Error('Error al obtener el catálogo de libros');
        
        const books = await respuesta.json();

        // Filtrar por jornada (si es afternoon, se ocultan los exclusivos de morning)
        const validBooks = books.filter(book => {
            const bookType = book.type_book ? book.type_book.toLowerCase().trim() : '';
            if (userShift === 'afternoon' && bookType === 'morning') {
                return false;
            }
            return true;
        });

        // Agrupar los libros válidos por su género (máximo 5 por sección)
        const booksByGenre = {};
        validBooks.forEach(book => {
            const genre = book.genre_book || 'General';
            if (!booksByGenre[genre]) {
                booksByGenre[genre] = [];
            }
            if (booksByGenre[genre].length < 5) {
                booksByGenre[genre].push(book);
            }
        });

        const generoSections = document.querySelectorAll('.sect__genero');
        const genreEntries = Object.entries(booksByGenre);

        generoSections.forEach((section, index) => {
            const bannerTitle = section.querySelector('.banner__title');
            const sectBody = section.querySelector('.sect__body');
            const cataLink = section.querySelector('.cata__link');

            if (genreEntries[index]) {
                const [genreName, genreBooks] = genreEntries[index];

                if (bannerTitle) bannerTitle.textContent = genreName;
                if (sectBody) sectBody.innerHTML = '';

                genreBooks.forEach(book => {
                    const bookDiv = document.createElement('div');
                    bookDiv.classList.add('book');

                    bookDiv.innerHTML = `
                        <a href="preview.html?id=${book.cod_book}" class="book__link" style="display: flex; flex-direction: column; align-items: center; text-decoration: none; color: inherit; height: 100%;">
                            <img src="${book.imgurl_book || '../Assets/Portadas/HarryPotter.jpg'}" alt="${book.name_book}" style="width: 80%; height: 70%; object-fit: contain; border-radius: 10px; margin-bottom: 5px;">
                            <span style="font-size: 0.85rem; font-weight: 600; text-align: center; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${book.name_book}</span>
                        </a>
                    `;
                    sectBody.appendChild(bookDiv);
                });

                if (cataLink) {
                    cataLink.href = `catalog.html?genre=${encodeURIComponent(genreName)}`;
                }

            } else {
                section.style.display = 'none';
            }
        });

        // 4. Funcionalidad de la barra de búsqueda en el Home
        const homeSearchInput = document.querySelector('.navbar__main-input.btn--search');
        if (homeSearchInput) {
            homeSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const query = homeSearchInput.value.trim();
                    if (query) {
                        window.location.href = `catalog.html?search=${encodeURIComponent(query)}`;
                    }
                }
            });
        }

    } catch (error) {
        console.error('Error al cargar los libros dinámicos:', error);
    }
});