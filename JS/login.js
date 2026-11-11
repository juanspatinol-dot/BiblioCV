const loginForm = document.querySelector('.login');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Capturamos solo correo y contraseña
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-passw').value;

        const credenciales = {
            email: email,
            password: password
        };

        try {
            const respuesta = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credenciales)
            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                alert(`¡Bienvenido de nuevo, ${resultado.user.name}!`);
                
                // Guardamos datos útiles en el navegador para usarlos en el home
                localStorage.setItem('userName', resultado.user.name);
                localStorage.setItem('userRole', resultado.user.role);

                // Redirigir al home de la biblioteca
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