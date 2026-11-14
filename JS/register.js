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
        const address = document.getElementById('register-direc').value;
        
        // Si tienes un input de descripción en tu HTML, captúralo aquí. Si no, envíalo vacío.
        const descriptionInput = document.getElementById('register-descr'); 
        const description = descriptionInput ? descriptionInput.value : '';

        // Validación de contraseñas iguales
        if (password !== confirmPassword) {
            alert('¡Las contraseñas no coinciden!');
            return;
        }

        const datosUsuario = {
            idUser,
            name,
            nick,
            email,
            phone,
            birthDate,
            password,
            jornada: jornada.toLowerCase(),
            address,
            description
        };

        try {
            const respuesta = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosUsuario)
            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                // Guardamos todos los datos en el localStorage
                localStorage.setItem('userNick', resultado.user.nick);
                localStorage.setItem('userName', resultado.user.name);
                localStorage.setItem('userEmail', resultado.user.email);
                localStorage.setItem('userPhone', resultado.user.phone);
                localStorage.setItem('userAddress', resultado.user.address);
                localStorage.setItem('userShift', resultado.user.jornada);
                localStorage.setItem('userDescription', resultado.user.description);

                alert(`¡Bienvenido, ${resultado.user.nick}! Registro exitoso. Redirigiendo al sistema...`);
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