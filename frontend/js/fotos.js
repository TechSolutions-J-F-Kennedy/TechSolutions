// Achica una imagen elegida por el usuario antes de mandarla al servidor.
// - cuadrada = true: recorta el centro y la deja de lado x lado (foto de perfil)
// - cuadrada = false: mantiene la forma y el lado más largo queda en "lado" (foto de un trabajo)
// Devuelve la imagen como texto "data:image/jpeg;base64,..."
function achicarImagen(archivo, lado = 320, cuadrada = true) {
    return new Promise((resolve, reject) => {
        const lector = new FileReader();
        lector.onerror = () => reject(new Error('No se pudo leer la imagen.'));
        lector.onload = () => {
            const imagen = new Image();
            imagen.onerror = () => reject(new Error('El archivo no es una imagen válida.'));
            imagen.onload = () => {
                const lienzo = document.createElement('canvas');
                const ctx = lienzo.getContext('2d');

                if (cuadrada) {
                    const recorte = Math.min(imagen.width, imagen.height);
                    lienzo.width = lado;
                    lienzo.height = lado;
                    ctx.drawImage(
                        imagen,
                        (imagen.width - recorte) / 2, (imagen.height - recorte) / 2, recorte, recorte,
                        0, 0, lado, lado
                    );
                } else {
                    const escala = Math.min(1, lado / Math.max(imagen.width, imagen.height));
                    lienzo.width = Math.round(imagen.width * escala);
                    lienzo.height = Math.round(imagen.height * escala);
                    ctx.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
                }
                resolve(lienzo.toDataURL('image/jpeg', 0.82));
            };
            imagen.src = lector.result;
        };
        lector.readAsDataURL(archivo);
    });
}
