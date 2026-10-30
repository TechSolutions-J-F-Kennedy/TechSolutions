//Comparar contraseñas.
//Por ahora las contraseñas se guardan SIN encriptar. Igual, algunas cuentas ya tienen la
//contraseña encriptada con bcrypt (empiezan con "$2a$", "$2b$" o "$2y$") y no se pueden volver
//a texto, así que el login acepta los dos formatos para que esas cuentas puedan seguir entrando.
import bcrypt from "bcryptjs";

const estaEncriptada = (password) => /^\$2[aby]\$\d{2}\$/.test(String(password || ""));

export const verificarPassword = async (escrita, guardada) => {
    if (!escrita || !guardada) return false;
    if (estaEncriptada(guardada)) return bcrypt.compare(escrita, guardada);
    return escrita === guardada;
};
