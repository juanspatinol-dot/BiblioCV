document.addEventListener('DOMContentLoaded', () => {
    const userNick = localStorage.getItem('userNick');
    
    console.log("Valor actual de userNick en localStorage:", userNick);

    if (userNick && userNick.trim() !== "") {
        console.log("🚀 Sesión activa detectada. Redirigiendo a home.html...");
        window.location.href = 'home.html';
        return;
    }
    console.log("🚀 index.js cargado correctamente.");

    if (userNick) {
        const navLoginBtn = document.getElementById('nav-login-btn');
        const mainContinueBtn = document.getElementById('main-continue-btn');

        if (navLoginBtn) {
            navLoginBtn.href = 'home.html';
            navLoginBtn.textContent = 'Ir al Inicio';
        }

        if (mainContinueBtn) {
            mainContinueBtn.href = 'home.html';
            mainContinueBtn.textContent = `¡Hola, ${userNick}! Continuar`;
        }
    }

    const specialContainer = document.getElementById('special-books-container');
    
    if (specialContainer) {
        fetch('http://localhost:3000/api/books')
            .then(res => res.json())
            .then(books => {
                if (!Array.isArray(books) || books.length === 0) return;

                const selectedBooks = books.slice(0, 4);
                specialContainer.innerHTML = ''; 

                selectedBooks.forEach(book => {
                    const stock = book.quantity !== undefined ? parseInt(book.quantity) : 1; 
                    const isAvailable = stock > 0;
                    const availabilityClass = isAvailable ? 'book__available' : 'book__disvailable';
                    const availabilityText = isAvailable ? 'Disponible' : 'No disponible';

                    const bookCard = document.createElement('div');
                    bookCard.className = 'content__special-books';
                    
                    bookCard.innerHTML = `
                        <div class="book">
                            <img src="${book.imgurl_book || '../Assets/Portadas/' + (book.image_book || 'HarryPotter.jpg')}" alt="${book.name_book} Portada" class="book__img">
                            <div class="book__body">
                                <h3 class="book__title">${book.name_book}</h3>
                                <span class="${availabilityClass}">${availabilityText}</span>
                            </div>
                        </div>
                    `;

                    const bookElement = bookCard.querySelector('.book');
                    bookElement.addEventListener('click', () => {
                        const activeUser = localStorage.getItem('userNick');
                        if (activeUser) {
                            window.location.href = `preview.html?id=${book.cod_book}`;
                        } else {
                            alert('Debes registrarte o iniciar sesión para ver los detalles del libro.');
                            window.location.href = 'register.html';
                        }
                    });

                    specialContainer.appendChild(bookCard);
                });
            })
            .catch(err => console.error('Error al cargar libros especiales:', err));
    }

    fetch('http://localhost:3000/api/books')
        .then(res => res.json())
        .then(books => {
            if (!Array.isArray(books) || books.length === 0) return;

            books.sort((a, b) => {
                const rateA = parseFloat(a.rate_book || 0);
                const rateB = parseFloat(b.rate_book || 0);
                return rateB - rateA;
            });

            const topBook = books[0];
            console.log("🏆 Libro top recomendado seleccionado:", topBook);

            const recImg = document.getElementById('rec-img');
            const recTitle = document.getElementById('rec-title');
            const recDesc = document.getElementById('rec-desc');
            const recAuthor = document.getElementById('rec-author');
            const recBtn = document.getElementById('rec-btn');

            if (recTitle) {
                recTitle.textContent = topBook.name_book || 'Título no disponible';
            }
            
            if (recDesc) {
                recDesc.textContent = topBook.sipnosis_book || "Sin descripción disponible.";
                console.log("✨ Sinopsis inyectada con éxito:", recDesc.textContent);
            }

            if (recAuthor) {
                recAuthor.innerHTML = `<em> ${topBook.author_book || 'Autor desconocido'} / ${topBook.genre_book || 'Novela'} </em>`;
            }

            if (recImg) {
                recImg.src = topBook.imgurl_book || `../Assets/Portadas/HarryPotter.jpg`;
            }

            if (recBtn) {
                recBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const activeUser = localStorage.getItem('userNick');
                    if (activeUser) {
                        window.location.href = `preview.html?id=${topBook.cod_book}`;
                    } else {
                        alert('Debes registrarte o iniciar sesión para ver los detalles del libro.');
                        window.location.href = 'register.html';
                    }
                });
            }
        })
        .catch(err => console.error('❌ Error al cargar el libro recomendado:', err));
});