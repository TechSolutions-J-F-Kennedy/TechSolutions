//Encriptar y comparar contraseñas con bcrypt
import bcrypt from "bcryptjs";

//Las contraseñas encriptadas con bcrypt empiezan con "$2a$", "$2b$" o "$2y$"
export const estaEncriptada = (password) => /^\$2[aby]\$\d{2}\$/.test(String(password || ""));

//Pasar una contraseña escrita a su versión encriptada (no se puede volver atrás)
export const encriptarPassword = (password) => bcrypt.hash(password, 10);

//Comparar lo que escribió la persona con lo guardado en la base.
//Acepta también contraseñas viejas sin encriptar (por ejemplo, las que crea el panel web en PHP).
export const verificarPassword = async (escrita, guardada) => {
    if (!escrita || !guardada) return false;
    if (estaEncriptada(guardada)) return bcrypt.compare(escrita, guardada);
    return escrita === guardada;
};
