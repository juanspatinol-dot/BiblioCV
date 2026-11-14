document.addEventListener('DOMContentLoaded', async () => {
    // 1. PROTEGER RUTA: Si no hay sesión activa, redirigir a register
    const activeNick = localStorage.getItem('userNick');
    if (!activeNick) {
        alert('Debes iniciar sesión para acceder al catálogo.');
        window.location.href = 'register.html';
        return;
    }

    // Obtener la jornada del usuario almacenada ('morning' o 'afternoon')
    const userShift = localStorage.getItem('userShift') ? localStorage.getItem('userShift').toLowerCase().trim() : '';

    const flexboxContainer = document.querySelector('.flexbox');
    const searchInput = document.querySelector('.navbar__main-input.btn--search');
    if (!flexboxContainer) return;

    let allBooks = [];

    // Función para renderizar los libros en pantalla
    const renderBooks = (booksToRender) => {
        flexboxContainer.innerHTML = '';

        if (booksToRender.length === 0) {
            flexboxContainer.innerHTML = '<p style="grid-column: span 4; text-align: center;">No se encontraron libros disponibles para tu jornada con esos filtros.</p>';
            return;
        }

        booksToRender.forEach(book => {
            const bookDiv = document.createElement('div');
            bookDiv.classList.add('book__cata');

            bookDiv.innerHTML = `
                <a href="preview.html?id=${book.cod_book}" class="book__cata__link" style="display: flex; flex-direction: column; align-items: center; text-decoration: none; color: inherit; height: 100%;">
                    <img src="${book.imgurl_book || '../Assets/Portadas/HarryPotter.jpg'}" alt="${book.name_book}" style="width: 80%; height: 70%; object-fit: contain; border-radius: 10px; margin-bottom: 5px;">
                    <span style="font-size: 0.85rem; font-weight: 600; text-align: center; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${book.name_book}</span>
                </a>
            `;
            flexboxContainer.appendChild(bookDiv);
        });
    };

    // Función para aplicar los filtros (Jornada + Buscador + Checkboxes de Género)
    const filterBooks = () => {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        
        // Obtener géneros seleccionados en los checkboxes
        const selectedGenres = [];
        const genreCheckboxes = document.querySelectorAll('.check__filter input[type="checkbox"]');
        
        const genreMap = {
            'horror': 'Terror',
            'action': 'Acción',
            'scfic': 'Ciencia Ficción',
            'come': 'Comedia',
            'roman': 'Romance',
            'hist': 'Historia',
            'soci': 'Sociales',
            'educ': 'Educativos'
        };

        genreCheckboxes.forEach(cb => {
            if (cb.checked && genreMap[cb.id]) {
                selectedGenres.push(genreMap[cb.id].toLowerCase());
            }
        });

        // Filtrar la lista completa
        let filtered = allBooks.filter(book => {
            // 1. REGLA DE JORNADA (type_book): 
            // Si el usuario es afternoon, no ve los exclusivos de morning. Si es morning, ve todo.
            const bookType = book.type_book ? book.type_book.toLowerCase().trim() : '';
            if (userShift === 'afternoon' && bookType === 'morning') {
                return false;
            }

            // 2. Búsqueda por texto (Nombre o Autor)
            const matchName = book.name_book.toLowerCase().includes(searchTerm);
            const matchAuthor = book.author_book ? book.author_book.toLowerCase().includes(searchTerm) : false;
            const matchesSearch = searchTerm === '' || matchName || matchAuthor;

            // 3. Filtrado por género
            const bookGenre = book.genre_book ? book.genre_book.toLowerCase() : '';
            const matchesGenre = selectedGenres.length === 0 || selectedGenres.includes(bookGenre);

            return matchesSearch && matchesGenre;
        });

        renderBooks(filtered);
    };

    try {
        // 2. Cargar todos los libros desde la API
        const respuesta = await fetch('http://localhost:3000/api/books');
        if (!respuesta.ok) throw new Error('Error al obtener el catálogo de libros');
        
        allBooks = await respuesta.json();

        // Verificar si hay un género inicial por URL (ej: desde el "Ver más" del home)
        const urlParams = new URLSearchParams(window.location.search);
        const selectedGenreUrl = urlParams.get('genre');

        if (selectedGenreUrl) {
            const mainTitle = document.querySelector('.main__title');
            if (mainTitle) mainTitle.textContent = `Libros de ${selectedGenreUrl}`;
        }

        // Ejecutar el filtro inicial para que aplique de entrada la regla de la jornada
        filterBooks();

        // 3. Escuchar eventos en tiempo real
        if (searchInput) {
            searchInput.addEventListener('input', filterBooks);
        }

        const checkboxes = document.querySelectorAll('.check__filter input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', filterBooks);
        });

    } catch (error) {
        console.error('Error al cargar el catálogo:', error);
        flexboxContainer.innerHTML = '<p>Error al conectar con el servidor.</p>';
    }
});