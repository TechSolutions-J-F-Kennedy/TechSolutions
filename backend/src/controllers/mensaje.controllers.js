import { crearMensaje, obtenerMensajesPorChat, obtenerChatsPorUsuario } from "../models/mensaje.models.js";

// Enviar un mensaje (Guarda en la BD)
export const postMensaje = async (req, res) => {
    try {
        const { usuario_id, tecnico_id, remitente, mensaje } = req.body;

        if (!usuario_id || !tecnico_id || !mensaje) {
            return res.status(400).json({ error: "Faltan datos obligatorios para el mensaje" });
        }

        const mensajeId = await crearMensaje({ usuario_id, tecnico_id, remitente, mensaje });

        return res.status(201).json({
            mensaje: "Mensaje enviado con éxito",
            id: mensajeId
        });
    } catch (error) {
        console.error("Error al enviar mensaje:", error);
        return res.status(500).json({ error: "Error al guardar el mensaje" });
    }
};

// Obtener historial del chat
export const getMensajesChat = async (req, res) => {
    try {
        const { usuarioId, tecnicoId } = req.params;
        const mensajes = await obtenerMensajesPorChat(usuarioId, tecnicoId);
        return res.status(200).json(mensajes);
    } catch (error) {
        console.error("Error al obtener mensajes:", error);
        return res.status(500).json({ error: "Error al cargar el historial" });
    }
};
export const getChatsUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const chats = await obtenerChatsPorUsuario(usuarioId);
        return res.status(200).json({ chats });
    } catch (error) {
        console.error("Error al obtener la lista de chats:", error);
        return res.status(500).json({ error: "Error al cargar los chats" });
    }
};