const loginForm = document.querySelector('.login'); // Asegúrate de que coincida con el selector de tu formulario de login en HTML

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Capturamos el correo y la contraseña desde los inputs del login
        const email = document.getElementById('login-email').value; // O el ID real de tu input de correo
        const password = document.getElementById('login-passw').value; // O el ID real de tu input de contraseña

        try {
            const respuesta = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                // ¡Aquí saludamos usando el apodo (nickname) que devuelve el backend!
                alert(`¡Bienvenido de nuevo, ${resultado.user.nickname}!`);
                
                // Opcional: guardamos el nickname en localStorage por si lo quieres usar luego en el home
                localStorage.setItem('userNick', resultado.user.nickname);
                
                loginForm.reset();
                window.location.href = 'home.html'; 
            } else {
                alert('Error: ' + resultado.error);
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            alert('No se pudo conectar con el servidor backend.');
        }
    });
}