import { 
    crearUsuario, 
    inicioSesion, 
    actualizarUsuario, 
    getFotoPerfil, 
    actualizarFotoPerfil 
} from "../models/usuario.models.js";
import { 
    crearDireccion, 
    obtenerDireccionesPorUsuario, 
    marcarDireccionPrincipal 
} from "../models/direccion.models.js";

// Helper de validación de formato Email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const postUsuario = async (req, res) => {
    try {
        let { nombre, email, password, telefono, direccion } = req.body;

        // Sanitización (trim)
        nombre = nombre?.trim();
        email = email?.trim().toLowerCase();
        telefono = telefono?.trim() || '';

        // 1. Validar campos obligatorios
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: "Faltan datos obligatorios (nombre, email y contraseña)" });
        }

        // 2. Validar longitud del nombre
        if (nombre.length < 2) {
            return res.status(400).json({ error: "El nombre debe tener al menos 2 caracteres" });
        }

        // 3. Validar formato de email
        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ error: "El formato de correo electrónico no es válido" });
        }

        // 4. Validar fortaleza/longitud de contraseña
        if (password.length < 6) {
            return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
        }

        const usuarioId = await crearUsuario({ nombre, email, password, telefono });

        if (direccion && direccion.direccion_completa) {
            await crearDireccion({
                usuario_id: usuarioId,
                alias: 'Casa',
                direccion_completa: direccion.direccion_completa.trim(),
                latitud: direccion.latitud,
                longitud: direccion.longitud,
                es_principal: 1
            });
        }

        return res.status(201).json({ 
            mensaje: "Usuario y dirección registrados con éxito", 
            id: usuarioId 
        });

    } catch (error) {
        console.error("Error al crear usuario:", error);
        return res.status(500).json({ error: "Error al registrar usuario en la base de datos" });
    }
};

export const postSesion = async (req, res) => {
    try {
        let { email, password } = req.body;

        email = email?.trim().toLowerCase();

        // 1. Validar presencia de credenciales
        if (!email || !password) {
            return res.status(400).json({ error: "Email y contraseña son requeridos" });
        }

        // 2. Validar formato de email
        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ error: "El correo electrónico ingresado no es válido" });
        }

        const usuarioEncontrado = await inicioSesion({ email, password });

        if (!usuarioEncontrado) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        return res.status(200).json({
            mensaje: "Inicio de sesión exitoso",
            usuario: usuarioEncontrado
        });
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        return res.status(500).json({ error: "Error en la búsqueda en la base de datos" });
    }
};

export const putUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        let { nombre, email, telefono } = req.body;

        nombre = nombre?.trim();
        email = email?.trim().toLowerCase();
        telefono = telefono?.trim() || '';

        // 1. Campos obligatorios
        if (!nombre || !email) {
            return res.status(400).json({ error: "Nombre y email son obligatorios" });
        }

        // 2. Validaciones de formato
        if (nombre.length < 2) {
            return res.status(400).json({ error: "El nombre debe tener al menos 2 caracteres" });
        }

        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ error: "El formato de correo electrónico no es válido" });
        }

        const actualizado = await actualizarUsuario(usuarioId, { nombre, email, telefono });

        if (!actualizado) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        return res.status(200).json({ mensaje: "Perfil actualizado correctamente" });
    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        return res.status(500).json({ error: "Error al actualizar perfil" });
    }
};

// Máximo ~375 KB de imagen Base64
const MAX_FOTO = 500000;
const FORMATO_FOTO = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

export const getFoto = async (req, res) => {
    try {
        const foto = await getFotoPerfil(req.params.id);
        if (foto === undefined) {
            return res.status(404).json({ error: "No se encontró el usuario" });
        }
        return res.json({ foto });
    } catch (error) {
        console.error("Error al obtener la foto de perfil:", error);
        return res.status(500).json({ error: "Error al consultar la foto de perfil" });
    }
};

export const putFoto = async (req, res) => {
    try {
        const { foto } = req.body;

        if (foto !== null && (typeof foto !== "string" || foto.length > MAX_FOTO || !FORMATO_FOTO.test(foto))) {
            return res.status(400).json({ error: "La foto tiene que ser una imagen JPG, PNG o WEBP de menos de 375 KB" });
        }

        const actualizado = await actualizarFotoPerfil(req.params.id, foto);
        if (!actualizado) {
            return res.status(404).json({ error: "No se encontró el usuario" });
        }
        return res.json({ foto });
    } catch (error) {
        console.error("Error al guardar la foto de perfil:", error);
        return res.status(500).json({ error: "Error al guardar la foto de perfil" });
    }
};

export const enviarImagenBase64 = (res, foto) => {
    const partes = /^data:(image\/[a-z]+);base64,(.+)$/.exec(foto || "");
    if (!partes) return res.status(404).end();
    res.set("Content-Type", partes[1]);
    res.set("Cache-Control", "no-cache");
    return res.send(Buffer.from(partes[2], "base64"));
};

export const getFotoImagen = async (req, res) => {
    try {
        enviarImagenBase64(res, await getFotoPerfil(req.params.id));
    } catch (error) {
        console.error("Error al enviar la foto de perfil:", error);
        res.status(404).end();
    }
};

export const getDireccionesUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const direcciones = await obtenerDireccionesPorUsuario(usuarioId);
        return res.status(200).json(direcciones);
    } catch (error) {
        console.error("Error al obtener direcciones:", error);
        return res.status(500).json({ error: "Error al cargar las direcciones" });
    }
};

export const postDireccionUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        let { alias, direccion_completa, latitud, longitud } = req.body;

        direccion_completa = direccion_completa?.trim();

        if (!direccion_completa) {
            return res.status(400).json({ error: "La dirección completa es requerida" });
        }

        const id = await crearDireccion({
            usuario_id: usuarioId,
            alias: alias ? alias.trim() : 'Otra',
            direccion_completa,
            latitud,
            longitud,
            es_principal: 0
        });

        return res.status(201).json({ mensaje: "Dirección guardada con éxito", id });
    } catch (error) {
        console.error("Error al crear dirección:", error);
        return res.status(500).json({ error: "Error al guardar la dirección" });
    }
};

export const patchDireccionPrincipal = async (req, res) => {
    try {
        const { usuarioId, direccionId } = req.params;

        const exito = await marcarDireccionPrincipal(usuarioId, direccionId);

        if (!exito) {
            return res.status(404).json({ error: "No se encontró la dirección especificada para este usuario" });
        }

        return res.status(200).json({ mensaje: "Dirección principal actualizada correctamente" });
    } catch (error) {
        console.error("Error al marcar dirección principal:", error);
        return res.status(500).json({ error: "Error al cambiar la dirección principal" });
    }
};