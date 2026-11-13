document.addEventListener('DOMContentLoaded', async () => {
    // 1. Validar sesión activa (protección de ruta)
    const activeNick = localStorage.getItem('userNick');
    if (!activeNick) {
        alert('Debes iniciar sesión para ver los detalles del libro.');
        window.location.href = 'register.html';
        return;
    }

    // 2. Obtener el ID del libro desde los parámetros de la URL (ej: ?id=5)
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');

    if (!bookId) {
        alert('No se ha seleccionado ningún libro.');
        window.location.href = 'home.html';
        return;
    }

    try {
        // 3. Consultar la API del backend para traer los datos de este libro específico
        const respuesta = await fetch(`http://localhost:3000/api/books/${bookId}`);
        if (!respuesta.ok) throw new Error('No se pudo encontrar el libro solicitado.');

        const book = await respuesta.json();

        // 4. Inyectar dinámicamente los datos en el HTML de preview.html
        const titleElement = document.querySelector('.book__titile');
        if (titleElement) titleElement.textContent = book.name_book || 'Sin título';

        const imgContainer = document.querySelector('.book__hero .img');
        if (imgContainer) {
            imgContainer.innerHTML = `
                <img src="${book.imgurl_book || '../Assets/Portadas/HarryPotter.jpg'}" alt="${book.name_book}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 20px;">
            `;
        }

        const parraElement = document.querySelector('.book__parra');
        if (parraElement) {
            const sinopsisText = book.sipnopsis_book || book.sinopsis_book || book.sipnosis_book;
            parraElement.textContent = sinopsisText || 'No hay sinopsis disponible para este libro.';
        }

        const rateText = document.querySelector('.rate__parra');
        if (rateText) {
            rateText.textContent = `${book.rate_book || '0.0'}/5.0`;
        }

        // 5. Funcionalidad de los botones (respetando 100% tu CSS original)
        const buttons = document.querySelectorAll('.book__btns .book__btn');
        
        // Botón 1: Pedir libro (Primer botón verde)
        const borrowButton = document.querySelector('.book__btns .btn--green:first-of-type');
        if (borrowButton) {
            borrowButton.addEventListener('click', (e) => {
                e.preventDefault();
                if (book.quantity > 0) {
                    alert(`¡Préstamo exitoso! Has solicitado "${book.name_book}". Stock restante: ${book.quantity - 1}`);
                } else {
                    alert('Lo sentimos, este libro no tiene stock disponible en este momento.');
                }
            });
        }

        // Botón 2: Favoritos (Botón del centro)
        const favButton = document.querySelector('.book__btns .book__btn:not(.btn--green)');
        if (favButton) {
            favButton.addEventListener('click', (e) => {
                e.preventDefault();
                alert(`¡"${book.name_book}" ha sido agregado a tus favoritos!`);
            });
        }

        // Botón 3: Leer libro (Segundo botón verde)
        const readButton = document.querySelector('.book__btns .btn--green:last-of-type');
        if (readButton) {
            readButton.addEventListener('click', (e) => {
                e.preventDefault();
                if (book.fileurl_book) {
                    window.open(book.fileurl_book, '_blank');
                } else {
                    alert('El archivo PDF de este libro no está disponible.');
                }
            });
        }

    } catch (error) {
        console.error('Error al cargar la vista previa:', error);
        alert('Hubo un error al cargar la información del libro.');
        window.location.href = 'home.html';
    }
});