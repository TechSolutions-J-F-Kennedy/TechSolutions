
"use strict";



const form = document.getElementById("formSolicitud");
const direccion = document.getElementById("direccion");
const descripcion = document.getElementById("descripcion");

const foto = document.getElementById("foto");
const vistaPrevia = document.getElementById("vistaPrevia");
const imagenPrevia = document.getElementById("imagenPrevia");
const nombreFoto = document.getElementById("nombreFoto");
const quitarFoto = document.getElementById("quitarFoto");

const contadorTexto = document.getElementById("contadorTexto");
const mensaje = document.getElementById("mensaje");
const btnConfirmar = document.getElementById("btnConfirmar");



const MAX_FOTO = 5 * 1024 * 1024;

const TIPOS_PERMITIDOS = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

let urlPrevia = null;


function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = `mensaje ${tipo}`;
    mensaje.hidden = false;
}

function limpiarMensaje() {
    mensaje.textContent = "";
    mensaje.className = "mensaje";
    mensaje.hidden = true;
}


descripcion.addEventListener("input", () => {
    contadorTexto.textContent =
        `${descripcion.value.length}/1000`;

    limpiarMensaje();
});



function limpiarFoto() {
    foto.value = "";

    if (urlPrevia) {
        URL.revokeObjectURL(urlPrevia);
        urlPrevia = null;
    }

    imagenPrevia.removeAttribute("src");
    nombreFoto.textContent = "";
    vistaPrevia.hidden = true;
}


foto.addEventListener("change", () => {
    limpiarMensaje();

    const archivo = foto.files[0];

    if (!archivo) return;

    if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
        limpiarFoto();
        mostrarMensaje("Elegí una imagen JPG, PNG o WEBP.", "error");
        return;
    }

    if (archivo.size > MAX_FOTO) {
        limpiarFoto();
        mostrarMensaje("La foto no puede superar los 5 MB.", "error");
        return;
    }

    // Mostrar la imagen seleccionada
    if (urlPrevia) {
        URL.revokeObjectURL(urlPrevia);
    }

    urlPrevia = URL.createObjectURL(archivo);

    imagenPrevia.src = urlPrevia;
    nombreFoto.textContent = archivo.name;
    vistaPrevia.hidden = false;
});



quitarFoto.addEventListener("click", () => {
    limpiarFoto();
    limpiarMensaje();
});



direccion.addEventListener("input", limpiarMensaje);


form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    limpiarMensaje();

    const direccionValor = direccion.value.trim();
    const descripcionValor = descripcion.value.trim();

    // Validar dirección.
    if (!direccionValor) {
        mostrarMensaje(
            "Ingresá la dirección donde se realizará el trabajo.",
            "error"
        );

        direccion.focus();
        return;
    }

    if (direccionValor.length > 200) {
        mostrarMensaje(
            "La dirección no puede superar los 200 caracteres.",
            "error"
        );

        direccion.focus();
        return;
    }

    // Validar descripción.
    if (!descripcionValor) {
        mostrarMensaje(
            "Describí brevemente el problema que necesitás resolver.",
            "error"
        );

        descripcion.focus();
        return;
    }

    if (descripcionValor.length > 1000) {
        mostrarMensaje(
            "La descripción no puede superar los 1000 caracteres.",
            "error"
        );

        descripcion.focus();
        return;
    }

    // Volver a comprobar la foto antes de continuar.
    const archivo = foto.files[0];

    if (archivo && !TIPOS_PERMITIDOS.includes(archivo.type)) {
        mostrarMensaje(
            "Seleccioná una imagen JPG, PNG o WEBP.",
            "error"
        );

        return;
    }

    if (archivo && archivo.size > MAX_FOTO) {
        mostrarMensaje(
            "La foto supera el límite permitido de 5 MB.",
            "error"
        );

        return;
    }

    

    mostrarMensaje(
        "Los datos son válidos. El formulario está listo para conectarse al servidor.",
        "exito"
    );
        const datos = new FormData();

    datos.append("id_usuario", localStorage.getItem("usuarioId") || "");
    datos.append("direccion", direccionValor);
    datos.append("descripcion", descripcionValor);

    if (archivo) {
        datos.append("foto", archivo);
    }

    btnConfirmar.disabled = true;
    btnConfirmar.textContent = "Enviando solicitud...";

    try {
        const respuesta = await fetch(
            "http://localhost:3000/api/solicitudes",
            {
                method: "POST",
                body: datos
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || "No se pudo crear la solicitud.");
        }

        mostrarMensaje(
            `¡Solicitud #${resultado.solicitud.id} creada correctamente! Estado: ${resultado.solicitud.estado}.`,
            "exito"
        );

        form.reset();
        contadorTexto.textContent = "0/1000";
        limpiarFoto();

    } catch (error) {
        console.error("Error al enviar la solicitud:", error);

        mostrarMensaje(
            error.message || "No se pudo conectar con el servidor.",
            "error"
        );
    } finally {
        btnConfirmar.disabled = false;
        btnConfirmar.innerHTML = 'Confirmar Solicitud <span>→</span>';
    }
});


window.addEventListener("beforeunload", () => {
    if (urlPrevia) {
        URL.revokeObjectURL(urlPrevia);
    }
});