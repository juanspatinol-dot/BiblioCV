const loginForm = document.querySelector('.login'); 

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Capturamos el correo y la contraseña desde los inputs
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-passw').value;

        try {
            const respuesta = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                alert(`¡Bienvenido de nuevo, ${resultado.user.nickname_user}!`);
                
                localStorage.setItem('userNick', resultado.user.nickname_user);
                localStorage.setItem('userName', resultado.user.name_user);
                localStorage.setItem('userEmail', resultado.user.email_user);
                localStorage.setItem('userPhone', resultado.user.phone_user || '');
                localStorage.setItem('userAddress', resultado.user.adress_user || '');
                localStorage.setItem('userDescription', resultado.user.descr_user || ''); // <--- Guardar descripción
                
                const userJornada = resultado.user.type_user || 'morning';
                localStorage.setItem('userShift', userJornada.toLowerCase().trim());
                
                loginForm.reset();
                window.location.href = 'home.html';
            } else {
                alert('Error: ' + (resultado.error || 'Credenciales incorrectas'));
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            alert('No se pudo conectar con el servidor backend.');
        }
    });
}