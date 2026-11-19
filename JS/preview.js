document.addEventListener('DOMContentLoaded', async () => {
    const activeNick = localStorage.getItem('userNick');
    const userId = localStorage.getItem('userId');

    if (!activeNick || !userId) {
        alert('Debes iniciar sesión para ver los detalles del libro.');
        window.location.href = 'register.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');

    if (!bookId) {
        alert('No se ha seleccionado ningún libro.');
        window.location.href = 'home.html';
        return;
    }

    let currentBookData = null;
    const rateText = document.querySelector('.rate__parra');
    const borrowButton = document.getElementById('borrow-btn') || document.querySelector('.book__btns .btn--green:first-of-type');
    const favButton = document.getElementById('fav-btn') || document.querySelector('.book__btns .book__btn:not(.btn--green)');
    const laterButton = document.getElementById('later-btn');
    const ratingSelect = document.getElementById('rating-select');

    const setBorrowButtonState = (loanStatus) => {
        if (!borrowButton) return;
        if (loanStatus === 'pending') {
            borrowButton.textContent = 'Pendiente';
            borrowButton.style.backgroundColor = '#fdcb6e';
            borrowButton.style.color = '#2d3436';
            borrowButton.disabled = true;
        } else if (loanStatus === 'acepted') {
            borrowButton.textContent = 'Préstamo activo';
            borrowButton.style.backgroundColor = '#0984e3';
            borrowButton.style.color = '#ffffff';
            borrowButton.disabled = true;
        } else {
            borrowButton.textContent = 'Pedir libro';
            borrowButton.style.backgroundColor = '';
            borrowButton.style.color = '';
            borrowButton.disabled = false;
        }
    };

    const setFavButtonState = (isActive) => {
        if (!favButton) return;
        if (isActive) {
            favButton.textContent = "Favoritos";
            favButton.style.backgroundColor = "#333";
            favButton.style.color = "#f0f0f0";
        } else {
            favButton.textContent = "Favoritos";
            favButton.style.backgroundColor = "";
            favButton.style.color = "";
        }
    };

    const setLaterButtonState = (isActive) => {
        if (!laterButton) return;
        if (isActive) {
            laterButton.textContent = "Guardado";
            laterButton.style.backgroundColor = "#74b9ff";
            laterButton.style.color = "white";
        } else {
            laterButton.textContent = "Leer más tarde";
            laterButton.style.backgroundColor = "";
            laterButton.style.color = "";
        }
    };

    const sendInteraction = async (payload, label) => {
        const response = await fetch('http://localhost:3000/api/interactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const rawText = await response.text();
        let data = {};
        try {
            data = JSON.parse(rawText);
        } catch {
            data = { rawText };
        }

        if (!response.ok) {
            throw new Error(data.error || `Error HTTP ${response.status}`);
        }

        return data;
    };

    try {
        const respuesta = await fetch(`http://localhost:3000/api/books/${bookId}`);
        if (!respuesta.ok) throw new Error('No se pudo encontrar el libro solicitado.');

        const book = await respuesta.json();
        currentBookData = book;
        const resolvedBookId = book.cod_book || bookId;

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

        if (rateText) {
            rateText.textContent = `${book.rate_book || '0.0'}/5.0`;
        }

        try {
            const interRes = await fetch(`http://localhost:3000/api/interactions/${userId}/${resolvedBookId}`);
            if (interRes.ok) {
                const interState = await interRes.json();
                setFavButtonState(Boolean(interState.favorite));
                setLaterButtonState(Boolean(interState.read_later));

                if (interState.rating !== null && interState.rating !== undefined && !Number.isNaN(interState.rating)) {
                    if (rateText) {
                        rateText.textContent = `${Number(interState.rating).toFixed(1)}/5.0`;
                    }
                    if (ratingSelect) {
                        const formattedOption = Number(interState.rating).toFixed(1);
                        const existsOption = Array.from(ratingSelect.options).some(opt => opt.value === formattedOption);
                        if (existsOption) {
                            ratingSelect.value = formattedOption;
                        }
                    }
                }
            }
        } catch (interError) {
            console.warn('No se pudo cargar el estado previo de interacciones:', interError);
        }

        try {
            const loanRes = await fetch(`http://localhost:3000/api/loans/${userId}/${resolvedBookId}`);
            if (loanRes.ok) {
                const loanData = await loanRes.json();
                if (loanData.loan) {
                    setBorrowButtonState(loanData.loan.type_loan);
                }
            }
        } catch (loanError) {
            console.warn('No se pudo cargar el estado del préstamo:', loanError);
        }

        if (borrowButton) {
            borrowButton.addEventListener('click', async (e) => {
                e.preventDefault();

                if (book.quantity <= 0) {
                    alert('Lo sentimos, este libro no tiene stock disponible en este momento.');
                    return;
                }

                try {
                    const res = await fetch('http://localhost:3000/api/loans', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userid: userId,
                            bookid: resolvedBookId
                        })
                    });

                    const data = await res.json();

                    if (!res.ok) {
                        alert(data.error || 'No se pudo enviar la solicitud de préstamo.');
                        return;
                    }

                    setBorrowButtonState('pending');
                    alert(`¡Solicitud enviada! Tu petición para "${book.name_book}" quedó pendiente de aprobación por un administrador.`);
                } catch (error) {
                    console.error('[PEDIR LIBRO] Error:', error);
                    alert('Error de conexión al intentar solicitar el libro.');
                }
            });
        }

        if (favButton) {
            favButton.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    const data = await sendInteraction({
                        userid: userId,
                        bookid: resolvedBookId,
                        type_inter: 'favorite'
                    }, 'FAVORITOS');

                    if (data.action === 'added') {
                        setFavButtonState(true);
                        alert(`¡"${book.name_book}" agregado a favoritos!`);
                    } else {
                        setFavButtonState(false);
                        alert(`"${book.name_book}" eliminado de favoritos.`);
                    }
                } catch (error) {
                    console.error("[FAVORITOS] Error:", error.message);
                    alert(error.message || 'No se pudo actualizar favoritos.');
                }
            });
        }

        if (laterButton) {
            laterButton.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    const data = await sendInteraction({
                        userid: userId,
                        bookid: resolvedBookId,
                        type_inter: 'read_later'
                    }, 'LEER MÁS TARDE');

                    if (data.action === 'added') {
                        setLaterButtonState(true);
                        alert(`¡"${book.name_book}" guardado para leer más tarde!`);
                    } else {
                        setLaterButtonState(false);
                        alert(`"${book.name_book}" quitado de leer más tarde.`);
                    }
                } catch (error) {
                    console.error("[LEER MÁS TARDE] Error:", error.message);
                    alert(error.message || 'No se pudo actualizar leer más tarde.');
                }
            });
        }

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
        console.error('[PREVIEW] Error al cargar la vista previa:', error);
        alert('Hubo un error al cargar la información del libro.');
        window.location.href = 'home.html';
    }

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

    const rateDialog = document.getElementById('rate-dialog');
    const rateContentBtn = document.querySelector('.book__rate-content');
    const closeRateDialogBtn = document.getElementById('close-rate-dialog-btn');
    const submitRatingBtn = document.getElementById('submit-rating-btn');

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

    if (submitRatingBtn && ratingSelect && rateDialog && currentBookData) {
        submitRatingBtn.addEventListener('click', async () => {
            const selectedRate = parseFloat(ratingSelect.value);

            try {
                await sendInteraction({
                    userid: userId,
                    bookid: currentBookData.cod_book || bookId,
                    type_inter: 'rating',
                    rating: selectedRate
                }, 'CALIFICAR');

                alert(`¡Gracias, ${activeNick}! Has calificado este libro con ${selectedRate.toFixed(1)}/5.0`);
                if (rateText) {
                    rateText.textContent = `${selectedRate.toFixed(1)}/5.0`;
                }
                rateDialog.close();
            } catch (error) {
                console.error('[CALIFICAR] Error:', error.message);
                alert(error.message || 'No se pudo guardar la calificación.');
            }
        });
    }
});