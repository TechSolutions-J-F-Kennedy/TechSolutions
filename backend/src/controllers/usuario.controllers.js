import { 
    crearUsuario, 
    inicioSesion, 
    actualizarUsuario, 
    getFotoPerfil, 
    actualizarFotoPerfil,
    buscarUsuarioPorNombreOEmail,
    obtenerPasswordUsuario,
    cambiarPasswordUsuario
} from "../models/usuario.models.js";
import { 
    crearDireccion, 
    obtenerDireccionesPorUsuario, 
    marcarDireccionPrincipal,
    obtenerDireccionPorId,
    actualizarDireccionUsuario,
    eliminarDireccionUsuario
} from "../models/direccion.models.js";
import { geocodificar } from "../utils/geo.js";

// Expresiones regulares para validaciones
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_REGEX = /^[0-9]{10}$/;

export const postUsuario = async (req, res) => {
    try {
        let { nombre, email, password, telefono, direccion } = req.body;

        nombre = nombre?.trim();
        email = email?.trim().toLowerCase();
        const phoneClean = typeof telefono === "string" ? telefono.replace(/\D/g, "") : "";
        const passClean = typeof password === "string" ? password : "";

        if (!nombre || !email || !passClean) {
            return res.status(400).json({ error: "Faltan datos obligatorios (nombre, email y contraseña)" });
        }

        if (nombre.length < 4) {
            return res.status(400).json({ error: "El nombre de usuario debe tener al menos 4 caracteres" });
        }

        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ error: "El formato de correo electrónico no es válido" });
        }

        if (passClean.length < 4) {
            return res.status(400).json({ error: "La contraseña debe tener al menos 4 caracteres" });
        }

        if (!TELEFONO_REGEX.test(phoneClean)) {
            return res.status(400).json({ error: "El teléfono debe tener exactamente 10 dígitos (ej: 1112345678)" });
        }

        let direccionTexto = typeof direccion === "string" ? direccion.trim() : (direccion?.direccion_completa || "").trim();
        if (!direccionTexto || direccionTexto.length < 5) {
            return res.status(400).json({ error: "Por favor, ingresá una dirección válida con calle y altura (mínimo 5 caracteres)." });
        }

        let latitud = (direccion?.latitud !== undefined && direccion?.latitud !== null) ? Number(direccion.latitud) : null;
        let longitud = (direccion?.longitud !== undefined && direccion?.longitud !== null) ? Number(direccion.longitud) : null;

        if (latitud === null || longitud === null || isNaN(latitud) || isNaN(longitud)) {
            const geoResult = await geocodificar(direccionTexto);

            if (!geoResult || !geoResult.latitud || !geoResult.longitud) {
                return res.status(400).json({ 
                    error: "No encontramos la dirección en el mapa. Seleccioná una opción desplegable o agregá la localidad (ej: Belgrano 120, Lanús)." 
                });
            }

            latitud = Number(geoResult.latitud);
            longitud = Number(geoResult.longitud);
        }

        const usuariosExistentes = await buscarUsuarioPorNombreOEmail(nombre, email);
        const existeNombre = usuariosExistentes.some(u => u.nombre.toLowerCase() === nombre.toLowerCase());
        const existeEmail = usuariosExistentes.some(u => u.email.toLowerCase() === email);

        if (existeNombre) {
            return res.status(409).json({ error: "El nombre de usuario ya se encuentra registrado. Elegí otro" });
        }
        if (existeEmail) {
            return res.status(409).json({ error: "El correo electrónico ya está asociado a otra cuenta" });
        }

        const usuarioId = await crearUsuario({ nombre, email, password: passClean, telefono: phoneClean });

        if (usuarioId && direccionTexto) {
            try {
                await crearDireccion({
                    usuario_id: usuarioId,
                    alias: 'Principal',
                    direccion_completa: direccionTexto,
                    latitud: String(latitud),
                    longitud: String(longitud),
                    es_principal: 1
                });
            } catch (errDir) {
                console.error("Error al guardar la dirección principal del usuario:", errDir);
            }
        }

        return res.status(201).json({ 
            mensaje: "Usuario y dirección registrados con éxito", 
            id: usuarioId 
        });

    } catch (error) {
        console.error("Error al crear usuario:", error);
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "El nombre de usuario o correo ya existe en la base de datos" });
        }
        return res.status(500).json({ error: "Error al registrar usuario en la base de datos" });
    }
};

export const postSesion = async (req, res) => {
    try {
        let { email, password } = req.body;

        email = email?.trim().toLowerCase();

        if (!email || !password) {
            return res.status(400).json({ error: "Email y contraseña son requeridos" });
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

// Actualizar datos del usuario con MISMAS validaciones que el registro
export const putUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        let { nombre, email, telefono } = req.body;

        nombre = nombre?.trim();
        email = email?.trim().toLowerCase();
        const phoneClean = typeof telefono === "string" ? telefono.replace(/\D/g, "") : "";

        // 1. Campos obligatorios
        if (!nombre || !email) {
            return res.status(400).json({ error: "Nombre y email son obligatorios" });
        }

        // 2. Mínimo 4 caracteres en nombre de usuario
        if (nombre.length < 4) {
            return res.status(400).json({ error: "El nombre de usuario debe tener al menos 4 caracteres" });
        }

        // 3. Formato de Email
        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ error: "El formato de correo electrónico no es válido" });
        }

        // 4. Exactamente 10 dígitos en Teléfono
        if (!TELEFONO_REGEX.test(phoneClean)) {
            return res.status(400).json({ error: "El teléfono debe tener exactamente 10 dígitos (ej: 1112345678)" });
        }

        // 5. Verificar que el nuevo nombre o email no pertenezcan a OTRO usuario registrado
        const usuariosExistentes = await buscarUsuarioPorNombreOEmail(nombre, email);
        const ocupadoNombre = usuariosExistentes.some(u => u.nombre.toLowerCase() === nombre.toLowerCase() && String(u.id) !== String(usuarioId));
        const ocupadoEmail = usuariosExistentes.some(u => u.email.toLowerCase() === email && String(u.id) !== String(usuarioId));

        if (ocupadoNombre) {
            return res.status(409).json({ error: "Ese nombre de usuario ya está ocupado por otra cuenta" });
        }
        if (ocupadoEmail) {
            return res.status(409).json({ error: "Ese correo electrónico ya está asociado a otra cuenta" });
        }

        const actualizado = await actualizarUsuario(usuarioId, { nombre, email, telefono: phoneClean });

        if (!actualizado) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        return res.status(200).json({ mensaje: "Perfil actualizado correctamente" });
    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        return res.status(500).json({ error: "Error al actualizar perfil" });
    }
};

// Cambiar Contraseña con Verificación de Clave Actual
export const patchPassword = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { passwordActual, nuevaPassword } = req.body;

        if (!passwordActual || !nuevaPassword) {
            return res.status(400).json({ error: "Debes ingresar tu contraseña actual y la nueva contraseña" });
        }

        // Validar contraseña actual
        const passDB = await obtenerPasswordUsuario(usuarioId);
        if (!passDB || passDB !== passwordActual) {
            return res.status(401).json({ error: "La contraseña actual es incorrecta" });
        }

        // Validar que la nueva contraseña tenga 4 o más caracteres
        if (nuevaPassword.length < 4) {
            return res.status(400).json({ error: "La nueva contraseña debe tener al menos 4 caracteres" });
        }

        const actualizado = await cambiarPasswordUsuario(usuarioId, nuevaPassword);
        if (!actualizado) {
            return res.status(404).json({ error: "No se pudo actualizar la contraseña" });
        }

        return res.status(200).json({ mensaje: "Contraseña actualizada con éxito" });
    } catch (error) {
        console.error("Error al cambiar contraseña:", error);
        return res.status(500).json({ error: "Error interno al modificar la contraseña" });
    }
};

// Foto de Perfil
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

// GESTIÓN COMPLETA DE DIRECCIONES
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

        let direccionTexto = direccion_completa?.trim() || '';

        if (!direccionTexto || direccionTexto.length < 5) {
            return res.status(400).json({ error: "Ingresá una dirección válida de al menos 5 caracteres" });
        }

        let lat = latitud ? Number(latitud) : null;
        let lng = longitud ? Number(longitud) : null;

        if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
            const geoResult = await geocodificar(direccionTexto);
            if (!geoResult || !geoResult.latitud || !geoResult.longitud) {
                return res.status(400).json({ error: "No se pudo geocodificar la dirección en el mapa" });
            }
            lat = Number(geoResult.latitud);
            lng = Number(geoResult.longitud);
        }

        const id = await crearDireccion({
            usuario_id: usuarioId,
            alias: alias ? alias.trim() : 'Otra',
            direccion_completa: direccionTexto,
            latitud: String(lat),
            longitud: String(lng),
            es_principal: 0
        });

        return res.status(201).json({ mensaje: "Dirección guardada con éxito", id });
    } catch (error) {
        console.error("Error al crear dirección:", error);
        return res.status(500).json({ error: "Error al guardar la dirección" });
    }
};

export const putDireccionUsuario = async (req, res) => {
    try {
        const { usuarioId, direccionId } = req.params;
        let { alias, direccion_completa, latitud, longitud } = req.body;

        let direccionTexto = direccion_completa?.trim() || '';
        if (!direccionTexto || direccionTexto.length < 5) {
            return res.status(400).json({ error: "La dirección debe tener al menos 5 caracteres" });
        }

        let lat = latitud ? Number(latitud) : null;
        let lng = longitud ? Number(longitud) : null;

        if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
            const geoResult = await geocodificar(direccionTexto);
            if (!geoResult || !geoResult.latitud || !geoResult.longitud) {
                return res.status(400).json({ error: "No pudimos localizar la dirección en el mapa" });
            }
            lat = Number(geoResult.latitud);
            lng = Number(geoResult.longitud);
        }

        const exito = await actualizarDireccionUsuario(direccionId, usuarioId, {
            alias: alias ? alias.trim() : 'Dirección',
            direccion_completa: direccionTexto,
            latitud: String(lat),
            longitud: String(lng)
        });

        if (!exito) {
            return res.status(404).json({ error: "No se encontró la dirección a actualizar" });
        }

        return res.status(200).json({ mensaje: "Dirección actualizada con éxito" });
    } catch (error) {
        console.error("Error al actualizar dirección:", error);
        return res.status(500).json({ error: "Error al editar la dirección" });
    }
};

export const deleteDireccionUsuario = async (req, res) => {
    try {
        const { usuarioId, direccionId } = req.params;

        // Verificar que no sea la dirección principal
        const dir = await obtenerDireccionPorId(direccionId);
        if (!dir || String(dir.usuario_id) !== String(usuarioId)) {
            return res.status(404).json({ error: "Dirección no encontrada" });
        }

        if (dir.es_principal === 1) {
            return res.status(400).json({ error: "La dirección principal no se puede eliminar. Cambiá primero la dirección principal a otra antes de borrar esta." });
        }

        const exito = await eliminarDireccionUsuario(direccionId, usuarioId);

        if (!exito) {
            return res.status(400).json({ error: "No se pudo eliminar la dirección" });
        }

        return res.status(200).json({ mensaje: "Dirección eliminada con éxito" });
    } catch (error) {
        console.error("Error al eliminar dirección:", error);
        return res.status(500).json({ error: "Error interno al eliminar la dirección" });
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