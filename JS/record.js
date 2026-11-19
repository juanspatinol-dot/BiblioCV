document.addEventListener('DOMContentLoaded', async () => {
    const activeNick = localStorage.getItem('userNick');
    const userId = localStorage.getItem('userId');

    console.log('[RECORD] Sesión -> activeNick:', activeNick, '| userId:', userId);

    if (!activeNick || !userId) {
        alert('Debes iniciar sesión para ver tu historial.');
        window.location.href = 'login.html';
        return;
    }

    const sections = document.querySelectorAll('.main__body .sect__library-record');
    console.log('[RECORD] Secciones .sect__library-record encontradas:', sections.length);

    const favContainer = sections[0]?.querySelector('.sect__body');
    const dislikedContainer = sections[1]?.querySelector('.sect__body');
    const readLaterContainer = sections[2]?.querySelector('.sect__body');
    const pendingContainer = sections[3]?.querySelector('.sect__body');

    const searchInput = document.querySelector('.navbar__main-input.btn--search');
    const orderSelect = document.getElementById('orderby');

    let allRecordItems = [];
    let allLoanItems = [];

    const createBookCard = (item, badgeText = '') => {
        const card = document.createElement('div');
        card.classList.add('book');

        const link = document.createElement('a');
        link.href = `preview.html?id=${item.cod_book}`;
        link.classList.add('book__link');

        const imgSrc = item.imgurl_book || '../Assets/Portadas/HarryPotter.jpg';
        link.innerHTML = `
            <img src="${imgSrc}" alt="${item.name_book || 'Libro'}" class="book__img">
            <p class="book__title-card">${item.name_book || 'Sin título'}</p>
            ${badgeText ? `<span style="font-size: 0.78rem; color: #b7791f; font-weight: 600; text-align: center;">${badgeText}</span>` : ''}
        `;

        card.appendChild(link);
        return card;
    };

    const renderEmptyMessage = (container, text) => {
        if (!container) return;
        container.innerHTML = `<p style="grid-column: 1 / -1; opacity: 0.75;">${text}</p>`;
    };

    const sortItems = (items, criteria) => {
        const copy = [...items];
        switch (criteria) {
            case 'Author':
                return copy.sort((a, b) => (a.author_book || '').localeCompare(b.author_book || ''));
            case 'Name':
                return copy.sort((a, b) => (a.name_book || '').localeCompare(b.name_book || ''));
            case 'Namereve':
                return copy.sort((a, b) => (b.name_book || '').localeCompare(a.name_book || ''));
            case 'Able':
                return copy.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
            case 'year':
                return copy.sort((a, b) => String(b.year_book || '').localeCompare(String(a.year_book || '')));
            case 'stock':
                return copy.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
            default:
                return copy;
        }
    };

    const filterBySearch = (items, queryText) => {
        if (!queryText) return items;
        return items.filter(item => {
            const title = (item.name_book || '').toLowerCase();
            const author = (item.author_book || '').toLowerCase();
            const genre = (item.genre_book || '').toLowerCase();
            return title.includes(queryText) || author.includes(queryText) || genre.includes(queryText);
        });
    };

    const renderSections = () => {
        const queryText = (searchInput?.value || '').trim().toLowerCase();
        const sortCriteria = orderSelect?.value || '';

        const filteredInteractions = sortItems(filterBySearch(allRecordItems, queryText), sortCriteria);
        const filteredLoans = sortItems(filterBySearch(allLoanItems, queryText), sortCriteria);

        const favorites = filteredInteractions.filter(i => i.type_inter === 'favorite');
        const disliked = filteredInteractions.filter(i => i.type_inter === 'not_interested');
        const readLater = filteredInteractions.filter(i => i.type_inter === 'read_later');
        const pendingLoans = filteredLoans.filter(l => l.type_loan === 'pending');

        if (favContainer) {
            favContainer.innerHTML = '';
            if (favorites.length === 0) {
                renderEmptyMessage(favContainer, 'No tienes libros en Favoritos todavía.');
            } else {
                favorites.forEach(item => favContainer.appendChild(createBookCard(item)));
            }
        }

        if (dislikedContainer) {
            dislikedContainer.innerHTML = '';
            if (disliked.length === 0) {
                renderEmptyMessage(dislikedContainer, 'No tienes libros marcados en No te gustaron.');
            } else {
                disliked.forEach(item => dislikedContainer.appendChild(createBookCard(item)));
            }
        }

        if (readLaterContainer) {
            readLaterContainer.innerHTML = '';
            if (readLater.length === 0) {
                renderEmptyMessage(readLaterContainer, 'No tienes libros en Leer después todavía.');
            } else {
                readLater.forEach(item => readLaterContainer.appendChild(createBookCard(item)));
            }
        }

        if (pendingContainer) {
            pendingContainer.innerHTML = '';
            if (pendingLoans.length === 0) {
                renderEmptyMessage(pendingContainer, 'No tienes solicitudes de préstamo pendientes.');
            } else {
                pendingLoans.forEach(item => pendingContainer.appendChild(createBookCard(item, 'En revisión')));
            }
        }
    };

    try {
        const [recordRes, loansRes] = await Promise.all([
            fetch(`http://localhost:3000/api/record/${userId}`),
            fetch(`http://localhost:3000/api/loans/user/${userId}`)
        ]);

        if (!recordRes.ok) {
            throw new Error(`HTTP ${recordRes.status} al cargar interacciones`);
        }

        allRecordItems = await recordRes.json();

        if (loansRes.ok) {
            allLoanItems = await loansRes.json();
        }

        renderSections();
    } catch (error) {
        console.error('[RECORD] Error al cargar record.js:', error);
        renderEmptyMessage(favContainer, `Error al cargar el historial (${error.message}).`);
        renderEmptyMessage(dislikedContainer, 'Error al cargar el historial.');
        renderEmptyMessage(readLaterContainer, 'Error al cargar el historial.');
        renderEmptyMessage(pendingContainer, 'Error al cargar los pendientes.');
    }

    if (searchInput) {
        searchInput.addEventListener('input', renderSections);
    }

    if (orderSelect) {
        orderSelect.addEventListener('change', renderSections);
    }

    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', (e) => e.preventDefault());
    });
});