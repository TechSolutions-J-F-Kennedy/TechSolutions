import { crearUsuario, inicioSesion } from "../models/usuario.models.js";
import { crearDireccion, obtenerDireccionesPorUsuario } from "../models/direccion.models.js";

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
}

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