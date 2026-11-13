document.addEventListener('DOMContentLoaded', async () => {
    // 1. PROTEGER RUTA: Si no hay sesión activa, redirigir a register
    const activeNick = localStorage.getItem('userNick');
    if (!activeNick) {
        alert('Debes iniciar sesión para acceder al catálogo.');
        window.location.href = 'register.html';
        return;
    }

    const flexboxContainer = document.querySelector('.flexbox');
    const searchInput = document.querySelector('.navbar__main-input.btn--search');
    if (!flexboxContainer) return;

    let allBooks = [];

    // Función para renderizar los libros en pantalla
    const renderBooks = (booksToRender) => {
        flexboxContainer.innerHTML = '';

        if (booksToRender.length === 0) {
            flexboxContainer.innerHTML = '<p style="grid-column: span 4; text-align: center;">No se encontraron libros con esos filtros.</p>';
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

    // Función para aplicar los filtros (Buscador + Checkboxes de Género)
    const filterBooks = () => {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        
        // Obtener géneros seleccionados en los checkboxes
        const selectedGenres = [];
        const genreCheckboxes = document.querySelectorAll('.check__filter input[type="checkbox"]');
        
        // Mapeo rápido de los IDs de los checkboxes con los nombres de géneros en la BD
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

        // Filtrar la lista completa de libros
        let filtered = allBooks.filter(book => {
            const matchName = book.name_book.toLowerCase().includes(searchTerm);
            const matchAuthor = book.author_book ? book.author_book.toLowerCase().includes(searchTerm) : false;
            
            const matchesSearch = searchTerm === '' || matchName || matchAuthor;

            // Si hay géneros seleccionados, el libro debe coincidir con alguno de ellos
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
            
            const initialFiltered = allBooks.filter(book => 
                book.genre_book && book.genre_book.toLowerCase() === selectedGenreUrl.toLowerCase()
            );
            renderBooks(initialFiltered);
        } else {
            renderBooks(allBooks);
        }

        // 3. Escuchar eventos de la barra de búsqueda en tiempo real
        if (searchInput) {
            searchInput.addEventListener('input', filterBooks);
        }

        // 4. Escuchar cambios en los checkboxes de filtros
        const checkboxes = document.querySelectorAll('.check__filter input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', filterBooks);
        });

    } catch (error) {
        console.error('Error al cargar el catálogo:', error);
        flexboxContainer.innerHTML = '<p>Error al conectar con el servidor.</p>';
    }
});