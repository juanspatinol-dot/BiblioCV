document.addEventListener('DOMContentLoaded', async () => {
    // 1. Validar sesión activa (protección de ruta)
    const activeNick = localStorage.getItem('userNick');
    const userId = localStorage.getItem('userId');

    if (!activeNick || !userId) {
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

    let currentBookData = null; 

    try {
        // 3. Consultar la API del backend para traer los datos de este libro específico
        const respuesta = await fetch(`http://localhost:3000/api/books/${bookId}`);
        if (!respuesta.ok) throw new Error('No se pudo encontrar el libro solicitado.');

        const book = await respuesta.json();
        currentBookData = book; 

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

        // ==========================================
        // 5. FUNCIONALIDAD DE LOS 4 BOTONES
        // ==========================================
        
        // --- Botón 1: Pedir libro ---
        const borrowButton = document.getElementById('borrow-btn') || document.querySelector('.book__btns .btn--green:first-of-type');
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

        // --- Botón 2: Favoritos (Conectado a la BD) ---
        const favButton = document.getElementById('fav-btn') || document.querySelector('.book__btns .book__btn:not(.btn--green)');
        if (favButton) {
            favButton.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    const response = await fetch('http://localhost:3000/api/interactions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userid: userId,
                            bookid: book.cod_book,
                            type_inter: 'favorite'
                        })
                    });

                    const data = await response.json();
                    if (response.ok) {
                        if (data.action === 'added') {
                            favButton.textContent = "❤️ En Favoritos";
                            favButton.style.backgroundColor = "#ff7675";
                            favButton.style.color = "white";
                            alert(`¡"${book.name_book}" agregado a favoritos!`);
                        } else {
                            favButton.textContent = "Favoritos";
                            favButton.style.backgroundColor = "";
                            favButton.style.color = "";
                            alert(`"${book.name_book}" eliminado de favoritos.`);
                        }
                    } else {
                        alert(data.error);
                    }
                } catch (error) {
                    console.error("Error al gestionar favoritos:", error);
                }
            });
        }

        // --- Botón 3: Leer más tarde (Conectado a la BD) ---
        const laterButton = document.getElementById('later-btn');
        if (laterButton) {
            laterButton.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    const response = await fetch('http://localhost:3000/api/interactions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userid: userId,
                            bookid: book.cod_book,
                            type_inter: 'read_later'
                        })
                    });

                    const data = await response.json();
                    if (response.ok) {
                        if (data.action === 'added') {
                            laterButton.textContent = "📌 Guardado";
                            laterButton.style.backgroundColor = "#74b9ff";
                            laterButton.style.color = "white";
                            alert(`¡"${book.name_book}" guardado para leer más tarde!`);
                        } else {
                            laterButton.textContent = "Leer más tarde";
                            laterButton.style.backgroundColor = "";
                            laterButton.style.color = "";
                            alert(`"${book.name_book}" quitado de leer más tarde.`);
                        }
                    } else {
                        alert(data.error);
                    }
                } catch (error) {
                    console.error("Error al gestionar lectura posterior:", error);
                }
            });
        }

        // --- Botón 4: Leer libro ---
        const readButton = document.getElementById('read-btn') || document.querySelector('.book__btns .btn--green:last-of-type');
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

    // ==========================================
    // 6. FUNCIONALIDAD DEL DIÁLOGO DE DETALLES
    // ==========================================
    const detailsDialog = document.getElementById('book-details-dialog');
    const conoceMasBtn = document.getElementById('conoce-mas-btn');
    const closeDialogBtn = document.getElementById('close-dialog-btn');
    const dialogInfo = document.getElementById('dialog-info');

    if (conoceMasBtn) {
        conoceMasBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentBookData && detailsDialog && dialogInfo) {
                dialogInfo.innerHTML = `
                    <p><strong>Autor:</strong> ${currentBookData.author_book || 'Desconocido'}</p>
                    <p><strong>Género:</strong> ${currentBookData.genre_book || 'No especificado'}</p>
                    <p><strong>Año de publicación:</strong> ${currentBookData.year_book ? currentBookData.year_book.split('T')[0] : 'No especificado'}</p>
                    <p><strong>Editorial / Publi:</strong> ${currentBookData.publi_book || 'No especificada'}</p>
                    <p><strong>Calificación promedio:</strong> ${currentBookData.rate_book || '0.0'} / 5.0</p>
                    <p><strong>Stock disponible:</strong> ${currentBookData.quantity > 0 ? currentBookData.quantity + ' unidades' : 'Agotado'}</p>
                `;
                detailsDialog.showModal();
            } else {
                alert('La información del libro aún se está cargando, espera un momento.');
            }
        });
    }

    if (closeDialogBtn && detailsDialog) {
        closeDialogBtn.addEventListener('click', () => {
            detailsDialog.close();
        });
    }

    // ==========================================
    // 7. FUNCIONALIDAD DEL DIÁLOGO DE CALIFICACIÓN
    // ==========================================
    const rateDialog = document.getElementById('rate-dialog');
    const rateContentBtn = document.querySelector('.book__rate-content');
    const closeRateDialogBtn = document.getElementById('close-rate-dialog-btn');
    const submitRatingBtn = document.getElementById('submit-rating-btn');
    const ratingSelect = document.getElementById('rating-select');

    if (rateContentBtn) {
        rateContentBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (rateDialog) {
                rateDialog.showModal();
            }
        });
    }

    if (closeRateDialogBtn && rateDialog) {
        closeRateDialogBtn.addEventListener('click', () => {
            rateDialog.close();
        });
    }

    if (submitRatingBtn && ratingSelect && rateDialog) {
        submitRatingBtn.addEventListener('click', () => {
            const selectedRate = ratingSelect.value;
            alert(`¡Gracias, ${activeNick}! Has calificado este libro con ${selectedRate}/5.0`);
            rateDialog.close();
        });
    }
});