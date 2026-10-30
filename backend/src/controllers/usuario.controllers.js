import { crearUsuario, inicioSesion, actualizarUsuario } from "../models/usuario.models.js";
import { 
    crearDireccion, 
    obtenerDireccionesPorUsuario, 
    marcarDireccionPrincipal 
} from "../models/direccion.models.js";

export const postUsuario = async (req, res) => {
    try {
        const { nombre, email, password, telefono, direccion } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }

        // 1. Crear el usuario
        const usuarioId = await crearUsuario({ nombre, email, password, telefono: telefono || '' });

        // 2. Si se envió una dirección seleccionada, guardarla como la principal
        if (direccion && direccion.direccion_completa) {
            await crearDireccion({
                usuario_id: usuarioId,
                alias: 'Casa',
                direccion_completa: direccion.direccion_completa,
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
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Faltan datos obligatorios" });
        }

        // Buscar el usuario en la BD
        const usuarioEncontrado = await inicioSesion({ email, password });

        // Si no se encontró ningún registro
        if (!usuarioEncontrado) {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        // Si existe, devolver mensaje Y los datos del usuario para el frontend
        return res.status(200).json({
            mensaje: "Inicio de sesión exitoso",
            usuario: usuarioEncontrado
        });
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        return res.status(500).json({ error: "Error en la búsqueda en la base de datos" });
    }
};

// --- AGREGADA: Actualizar datos de usuario (PUT /api/usuarios/:usuarioId) ---
export const putUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { nombre, email, telefono } = req.body;

        if (!nombre || !email) {
            return res.status(400).json({ error: "Nombre y email son obligatorios" });
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

// --- AGREGADA: Crear nueva dirección (POST /api/usuarios/:usuarioId/direcciones) ---
export const postDireccionUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { alias, direccion_completa, latitud, longitud } = req.body;

        if (!direccion_completa) {
            return res.status(400).json({ error: "La dirección completa es requerida" });
        }

        const id = await crearDireccion({
            usuario_id: usuarioId,
            alias: alias || 'Otra',
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