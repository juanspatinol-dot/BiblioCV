document.addEventListener('DOMContentLoaded', async () => {
    const activeNick = localStorage.getItem('userNick');
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');

    if (!activeNick || !userId) {
        alert('Debes iniciar sesión para acceder al panel de supervisión.');
        window.location.href = 'login.html';
        return;
    }

    if (!userRole || userRole === 'student' || userRole === 'banned') {
        alert('Acceso denegado: no tienes permisos para entrar aquí.');
        window.location.href = 'home.html';
        return;
    }

    let contentBody = document.querySelector('.content__body');
    if (!contentBody) {
        const boxContent = document.querySelector('.box__content');
        if (boxContent) {
            contentBody = document.createElement('div');
            contentBody.classList.add('content__body');
            boxContent.appendChild(contentBody);
        }
    }

    const searchInput = document.querySelector('.content__search');
    let allPendingLoans = [];

    const renderLoans = (loans) => {
        if (!contentBody) return;
        contentBody.innerHTML = '';

        if (loans.length === 0) {
            contentBody.innerHTML = `
                <p style="text-align: center; font-size: 1.1rem; opacity: 0.75; margin: 40px 0;">
                    No hay peticiones de libros pendientes por revisar.
                </p>
            `;
            return;
        }

        loans.forEach((loan) => {
            const card = document.createElement('div');
            card.classList.add('profile__card');

            card.innerHTML = `
                <div class="profile__hero">
                    <img src="../Assets/Icons/usuario.png" alt="Foto de usuario" class="profile__img">
                    <h3 class="profile__name">${loan.nickname_user || loan.name_user || 'Usuario'}</h3>
                </div>

                <div class="profile__wrapp">
                    <div class="profile__body">
                        <ul class="profile__list">
                            <li class="profile__item"><strong>Dirección: </strong>${loan.adress_user || 'No registrada'}</li>
                            <li class="profile__item"><strong>Teléfono: </strong>${loan.phone_user || 'No registrado'}</li>
                            <li class="profile__item"><strong>Petición: </strong>${loan.name_book} (Stock: ${loan.quantity})</li>
                            <li class="profile__item"><strong>Puntos: </strong>${loan.points ?? 0}</li>
                        </ul>
                    </div>
                    <div class="profile__footer">
                        <button type="button" class="profile__btn btn--green" data-action="acepted">Aceptar</button>
                        <button type="button" class="profile__btn btn--yellow" data-action="rejected">Rechazar</button>
                        <button type="button" class="profile__btn btn--red" data-action="ban">Banear</button>
                    </div>
                </div>
            `;

            const acceptBtn = card.querySelector('.btn--green');
            const rejectBtn = card.querySelector('.btn--yellow');
            const banBtn = card.querySelector('.btn--red');

            acceptBtn.addEventListener('click', () => handleLoanAction(loan.ID_loan, 'acepted', loan.name_book, loan.nickname_user));
            rejectBtn.addEventListener('click', () => handleLoanAction(loan.ID_loan, 'rejected', loan.name_book, loan.nickname_user));
            banBtn.addEventListener('click', () => handleBanUser(loan.userid, loan.nickname_user));

            contentBody.appendChild(card);
        });
    };

    const loadPendingLoans = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/admin/loans');
            if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

            allPendingLoans = await res.json();
            filterAndRender();
        } catch (error) {
            console.error('[SUPERVISOR] Error al cargar peticiones:', error);
            if (contentBody) {
                contentBody.innerHTML = `<p style="text-align: center; color: #bf1524;">Error al cargar las peticiones (${error.message}).</p>`;
            }
        }
    };

    const filterAndRender = () => {
        const query = (searchInput?.value || '').trim().toLowerCase();
        if (!query) {
            renderLoans(allPendingLoans);
            return;
        }

        const filtered = allPendingLoans.filter((item) => {
            const nick = (item.nickname_user || '').toLowerCase();
            const name = (item.name_user || '').toLowerCase();
            const book = (item.name_book || '').toLowerCase();
            return nick.includes(query) || name.includes(query) || book.includes(query);
        });

        renderLoans(filtered);
    };

    const handleLoanAction = async (loanId, status, bookName, userNick) => {
        const label = status === 'acepted' ? 'aceptar' : 'rechazar';
        if (!confirm(`¿Seguro que deseas ${label} la petición de "${bookName}" para ${userNick}?`)) return;

        try {
            const res = await fetch(`http://localhost:3000/api/admin/loans/${loanId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || `No se pudo ${label} la petición.`);
                return;
            }

            alert(data.message);
            await loadPendingLoans();
        } catch (error) {
            console.error('[SUPERVISOR] Error al actualizar petición:', error);
            alert('Error de conexión con el servidor.');
        }
    };

    const handleBanUser = async (targetUserId, userNick) => {
        if (String(targetUserId) === String(userId)) {
            alert('No puedes banearte a ti mismo.');
            return;
        }

        if (!confirm(`⚠️ ¿Estás seguro de BANEAR a "${userNick}"? Se cancelarán todas sus solicitudes pendientes.`)) return;

        try {
            const res = await fetch(`http://localhost:3000/api/admin/users/${targetUserId}/ban`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || 'No se pudo banear al usuario.');
                return;
            }

            alert(data.message);
            await loadPendingLoans();
        } catch (error) {
            console.error('[SUPERVISOR] Error al banear usuario:', error);
            alert('Error de conexión con el servidor.');
        }
    };

    if (searchInput) {
        searchInput.addEventListener('input', filterAndRender);
    }

    await loadPendingLoans();
});