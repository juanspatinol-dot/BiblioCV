document.addEventListener('DOMContentLoaded', () => {
    // Buscamos por la clase '.login' que tiene tu formulario en el HTML
    const loginForm = document.querySelector('form.login'); 

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Usamos los IDs exactos que están en tus inputs del HTML
            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-passw');

            if (!emailInput || !passwordInput) {
                console.error("❌ No se encontraron los inputs de correo o contraseña.");
                alert("Error interno: Faltan elementos en el formulario.");
                return;
            }

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            console.log("📤 Intentando iniciar sesión con:", email);

            if (!email || !password) {
                alert('Por favor, completa todos los campos.');
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                console.log("📥 Respuesta del servidor:", data);

                if (response.ok && data.user) {
                    // Guardamos los datos clave en el localStorage
                    localStorage.setItem('userNick', data.user.nickname_user);
                    localStorage.setItem('userId', data.user.ID_user);         
                    localStorage.setItem('userRole', data.user.role_user);     

                    console.log("✅ Datos guardados en localStorage. Redirigiendo a home.html...");
                    window.location.href = 'home.html';
                } else {
                    alert(data.error || 'Credenciales inválidas.');
                }

            } catch (error) {
                console.error('❌ Error crítico en la petición de login:', error);
                alert('Hubo un error al conectar con el servidor.');
            }
        });
    } else {
        console.error("❌ No se encontró el formulario de login en el HTML.");
    }
});