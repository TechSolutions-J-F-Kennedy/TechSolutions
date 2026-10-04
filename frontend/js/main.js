// Función del Frontend para obtener y mostrar la lista de mascotas
async function cargarUsuarios() {
    try {
        // 1. Petición GET a la URL de nuestro servidor Express en localhost:3000
        const response = await fetch("http://localhost:3000/api/usuarios");

        // 2. Control de Errores HTTP: Verificamos si la respuesta fue exitosa (status 200-299)
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        // 3. Deserialización: Convertimos el cuerpo JSON recibido a un objeto JavaScript
        const data = await response.json();

        // 4. Accedemos a la propiedad 'payload' enviada por el Controller de Express
        console.log("Usuarios obtenidas del backend:", data.payload);
        
        // Aquí llamaríamos a la función que renderiza las tarjetas en el HTML
    } catch (error) {
        console.error("No se pudo conectar con el backend:", error);
    }
}

// Función del Frontend para registrar una nueva mascota desde un formulario HTML
async function enviarUsuario(nuevoUsuario) {
    try {
        // 1. fetch con objeto de configuración para métodos distintos de GET
        const response = await fetch("http://localhost:3000/api/usuarios", {
            method: "POST", // Especificamos el verbo HTTP POST
            headers: {
                // ⚠️ CRÍTICO: Le avisa al middleware express.json() del backend que el body viene en formato JSON
                "Content-Type": "application/json"
            },
            // Convertimos el objeto de JavaScript a una cadena de texto en formato JSON
            body: JSON.stringify(nuevoUsuario)
        });

        const data = await response.json();

        if (response.ok) {
            alert(`Usuario creado exitosamente con ID: ${data.id}`);
        } else {
            alert(`Error del servidor: ${data.error}`);
        }
    } catch (error) {
        console.error("Fallo de red al enviar datos:", error);
    }
}