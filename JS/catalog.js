document.addEventListener('DOMContentLoaded', async () => {
    // 1. PROTEGER RUTA: Si no hay sesión activa, redirigir a register
    const activeNick = localStorage.getItem('userNick');
    if (!activeNick) {
        alert('Debes iniciar sesión para acceder al catálogo.');
        window.location.href = 'register.html';
        return;
    }

    const userRole = localStorage.getItem('userRole');

    // Ocultar los botones de gestión de libros si es estudiante o cuenta baneada
    const adminBtnContainer = document.querySelector('.admin__btn');
    if (adminBtnContainer && (!userRole || userRole === 'student' || userRole === 'banned')) {
        adminBtnContainer.remove();
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
            const bookType = book.type_book ? book.type_book.toLowerCase().trim() : '';
            if (userShift === 'afternoon' && bookType === 'morning') {
                return false;
            }

            const matchName = book.name_book.toLowerCase().includes(searchTerm);
            const matchAuthor = book.author_book ? book.author_book.toLowerCase().includes(searchTerm) : false;
            const matchesSearch = searchTerm === '' || matchName || matchAuthor;

            const bookGenre = book.genre_book ? book.genre_book.toLowerCase() : '';
            const matchesGenre = selectedGenres.length === 0 || selectedGenres.includes(bookGenre);

            return matchesSearch && matchesGenre;
        });

        renderBooks(filtered);
    };

    // Función reutilizable para cargar/refrescar el catálogo desde MySQL
    const loadCatalogBooks = async () => {
        const respuesta = await fetch('http://localhost:3000/api/books');
        if (!respuesta.ok) throw new Error('Error al obtener el catálogo de libros');
        allBooks = await respuesta.json();
        filterBooks();
    };

    try {
        await loadCatalogBooks();

        const urlParams = new URLSearchParams(window.location.search);
        const selectedGenreUrl = urlParams.get('genre');

        if (selectedGenreUrl) {
            const mainTitle = document.querySelector('.main__title');
            if (mainTitle) mainTitle.textContent = `Libros de ${selectedGenreUrl}`;
        }

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

    // ==========================================
    // GESTIÓN DE DIALOGS CRUD DE LIBROS
    // ==========================================
    const createDialog = document.getElementById('dialog-create-book');
    const deleteDialog = document.getElementById('dialog-delete-book');
    const updateDialog = document.getElementById('dialog-update-book');

    document.querySelector('.create--book')?.addEventListener('click', () => {
        createDialog?.showModal();
    });

    // --- CREAR nuevo libro ---
    const createForm = document.getElementById('form-create-book');
    createForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            name_book: document.getElementById('new-name-book').value.trim(),
            author_book: document.getElementById('new-author-book').value.trim(),
            genre_book: document.getElementById('new-genre-book').value,
            publi_book: document.getElementById('new-publi-book').value.trim(),
            year_book: document.getElementById('new-year-book').value.trim(),
            quantity: document.getElementById('new-quantity').value,
            type_book: document.getElementById('new-type-book').value,
            imgurl_book: document.getElementById('new-imgurl-book').value.trim(),
            fileurl_book: document.getElementById('new-fileurl-book').value.trim(),
            sinopsis_book: document.getElementById('new-sinopsis-book').value.trim()
        };

        try {
            const res = await fetch('http://localhost:3000/api/admin/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || 'No se pudo crear el libro.');
                return;
            }

            alert(data.message);
            createForm.reset();
            createDialog?.close();
            await loadCatalogBooks();
        } catch (error) {
            console.error('[CATALOG] Error al crear libro:', error);
            alert('Error de conexión con el servidor.');
        }
    });

    document.querySelector('.delete--book')?.addEventListener('click', () => {
        document.getElementById('form-delete-book')?.reset();
        deleteDialog?.showModal();
    });

    document.querySelector('.update--book')?.addEventListener('click', () => {
        const searchStep = document.getElementById('update-search-step');
        const updateForm = document.getElementById('form-update-book');
        const initialClose = document.getElementById('update-initial-close');
        const searchInputUpd = document.getElementById('update-book-search');

        if (searchInputUpd) searchInputUpd.value = '';
        if (searchStep) searchStep.style.display = 'flex';
        if (updateForm) updateForm.style.display = 'none';
        if (initialClose) initialClose.style.display = 'flex';

        updateDialog?.showModal();
    });

    // Botones para cerrar cualquiera de los dialogs
    document.querySelectorAll('[data-close-dialog]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-close-dialog');
            document.getElementById(targetId)?.close();
        });
    });

    // --- ELIMINAR libro por código o nombre ---
    const deleteForm = document.getElementById('form-delete-book');
    deleteForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = document.getElementById('delete-book-query')?.value.trim();
        if (!query) return;

        if (!confirm(`¿Seguro que deseas eliminar el libro "${query}"? Esta acción no se puede deshacer.`)) return;

        try {
            const res = await fetch('http://localhost:3000/api/admin/books', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || 'No se pudo eliminar el libro.');
                return;
            }

            alert(data.message);
            deleteDialog?.close();
            await loadCatalogBooks();
        } catch (error) {
            console.error('[CATALOG] Error al eliminar libro:', error);
            alert('Error de conexión con el servidor.');
        }
    });

    // --- ACTUALIZAR libro (Paso 1: Buscar por nombre) ---
    const findUpdateBtn = document.getElementById('btn-find-update-book');
    findUpdateBtn?.addEventListener('click', async () => {
        const nameQuery = document.getElementById('update-book-search')?.value.trim();
        if (!nameQuery) {
            alert('Escribe el nombre del libro que deseas buscar.');
            return;
        }

        try {
            const res = await fetch(`http://localhost:3000/api/admin/books/by-name/${encodeURIComponent(nameQuery)}`);
            const data = await res.json();

            if (!res.ok) {
                alert(data.error || 'Libro no encontrado.');
                return;
            }

            document.getElementById('upd-cod-book').value = data.cod_book;
            document.getElementById('upd-name-book').value = data.name_book || '';
            document.getElementById('upd-author-book').value = data.author_book || '';
            document.getElementById('upd-genre-book').value = data.genre_book || '';
            document.getElementById('upd-publi-book').value = data.publi_book || '';
            document.getElementById('upd-year-book').value = data.year_book ? String(data.year_book).split('T')[0] : '';
            document.getElementById('upd-quantity').value = data.quantity ?? 0;
            document.getElementById('upd-imgurl-book').value = data.imgurl_book || '';
            document.getElementById('upd-fileurl-book').value = data.fileurl_book || '';
            document.getElementById('upd-type-book').value = data.type_book || '';
            document.getElementById('upd-sinopsis-book').value = data.sipnopsis_book || data.sinopsis_book || '';

            document.getElementById('update-search-step').style.display = 'none';
            document.getElementById('update-initial-close').style.display = 'none';
            document.getElementById('form-update-book').style.display = 'flex';
        } catch (error) {
            console.error('[CATALOG] Error al buscar libro para actualizar:', error);
            alert('Error de conexión con el servidor.');
        }
    });

    // --- ACTUALIZAR libro (Paso 2: Guardar cambios) ---
    const updateForm = document.getElementById('form-update-book');
    updateForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bookId = document.getElementById('upd-cod-book').value;

        const payload = {
            name_book: document.getElementById('upd-name-book').value.trim(),
            author_book: document.getElementById('upd-author-book').value.trim(),
            genre_book: document.getElementById('upd-genre-book').value.trim(),
            publi_book: document.getElementById('upd-publi-book').value.trim(),
            year_book: document.getElementById('upd-year-book').value.trim(),
            quantity: document.getElementById('upd-quantity').value,
            imgurl_book: document.getElementById('upd-imgurl-book').value.trim(),
            fileurl_book: document.getElementById('upd-fileurl-book').value.trim(),
            type_book: document.getElementById('upd-type-book').value.trim(),
            sinopsis_book: document.getElementById('upd-sinopsis-book').value.trim()
        };

        try {
            const res = await fetch(`http://localhost:3000/api/admin/books/${bookId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || 'No se pudo actualizar el libro.');
                return;
            }

            alert(data.message);
            updateDialog?.close();
            await loadCatalogBooks();
        } catch (error) {
            console.error('[CATALOG] Error al guardar actualización del libro:', error);
            alert('Error de conexión con el servidor.');
        }
    });
});