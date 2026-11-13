const registerForm = document.querySelector('.register');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Capturamos los valores de los inputs del formulario
        const idUser = document.getElementById('register-id').value;
        const name = document.getElementById('register-name').value;
        const nick = document.getElementById('register-nick').value;
        const email = document.getElementById('register-email').value;
        const phone = document.getElementById('register-phone').value;
        const birthDate = document.getElementById('register-date').value;
        const password = document.getElementById('register-passw').value;
        const confirmPassword = document.getElementById('register-cpassw').value;
        const jornada = document.getElementById('register-jornada').value;

        // Validación de contraseñas iguales
        if (password !== confirmPassword) {
            alert('¡Las contraseñas no coinciden!');
            return;
        }

        const datosUsuario = {
            idUser: idUser,
            name: name,
            nick: nick,
            email: email,
            phone: phone,
            birthDate: birthDate,
            password: password,
            jornada: jornada.toLowerCase()
        };

        try {
            const respuesta = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosUsuario)
            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                // Mensaje de éxito saludando con el nick devuelto por el servidor
                alert(`¡Bienvenido, ${resultado.nick}! Registro exitoso. Redirigiendo...`);
                registerForm.reset();
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