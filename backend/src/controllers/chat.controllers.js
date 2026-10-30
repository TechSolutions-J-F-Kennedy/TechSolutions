import { getRolUsuario, getConversacionesByUsuario, getMensajesConversacion, crearMensaje, chatAceptaFotos, getImagenMensaje } from "../models/chat.models.js";
import { enviarImagenBase64 } from "./usuario.controllers.js";
import { enviarEvento, abrirConexion } from "../utils/tiempoReal.js";

//Foto del chat: JPG/PNG/WEBP en base64 de hasta ~375 KB (el frontend la achica antes)
const FOTO_VALIDA = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

const ROLES_CHAT = ["tecnico", "usuario"];

//A partir de dos ids, saber quién es el técnico y quién el usuario
const armarPareja = async (idA, idB) => {
    const [rolA, rolB] = await Promise.all([getRolUsuario(idA), getRolUsuario(idB)]);
    if (rolA === "tecnico" && rolB === "usuario") return { tecnico_id: Number(idA), usuario_id: Number(idB), rolA };
    if (rolA === "usuario" && rolB === "tecnico") return { tecnico_id: Number(idB), usuario_id: Number(idA), rolA };
    return null;
};

//GET /api/chat/:id/tiempo-real  (Server-Sent Events: chat y avisos de pedidos)
export const getTiempoReal = (req, res) => abrirConexion(req.params.id, req, res);

export const getConversaciones = async (req, res) => {
    try {
        const { id } = req.params;
        const rol = await getRolUsuario(id);
        if (!ROLES_CHAT.includes(rol)) {
            return res.status(404).json({ error: "El chat es solo para técnicos y usuarios" });
        }
        const conversaciones = await getConversacionesByUsuario(id, rol);
        return res.json({ payload: conversaciones });
    } catch (error) {
        console.error("Error al obtener las conversaciones:", error);
        return res.status(500).json({ error: "Error al consultar las conversaciones" });
    }
};

export const getMensajes = async (req, res) => {
    try {
        const pareja = await armarPareja(req.params.id, req.params.otroId);
        if (!pareja) {
            return res.status(400).json({ error: "El chat tiene que ser entre un técnico y un usuario" });
        }
        const mensajes = await getMensajesConversacion(pareja.usuario_id, pareja.tecnico_id);
        return res.json({ payload: mensajes });
    } catch (error) {
        console.error("Error al obtener los mensajes:", error);
        return res.status(500).json({ error: "Error al consultar los mensajes" });
    }
};

export const postMensaje = async (req, res) => {
    try {
        const { emisor_id, receptor_id, imagen } = req.body;
        const mensaje = typeof req.body.mensaje === "string" ? req.body.mensaje.trim() : "";

        //Se puede mandar texto, una foto, o las dos cosas
        if (!emisor_id || !receptor_id || mensaje.length > 1000 || (!mensaje && !imagen)) {
            return res.status(400).json({ error: "Revisá el emisor, el receptor y el mensaje (máx. 1000 caracteres)" });
        }
        if (imagen && (typeof imagen !== "string" || imagen.length > 500000 || !FOTO_VALIDA.test(imagen))) {
            return res.status(400).json({ error: "La foto tiene que ser una imagen JPG, PNG o WEBP de menos de 375 KB" });
        }
        if (imagen && !(await chatAceptaFotos())) {
            return res.status(400).json({ error: "Todavía no se pueden mandar fotos: falta la columna 'imagen' en la tabla Mensajes" });
        }

        const pareja = await armarPareja(emisor_id, receptor_id);
        if (!pareja) {
            return res.status(400).json({ error: "El chat tiene que ser entre un técnico y un usuario" });
        }

        const nuevo = await crearMensaje({
            usuario_id: pareja.usuario_id,
            tecnico_id: pareja.tecnico_id,
            remitente: pareja.rolA,
            mensaje,
            imagen: imagen || null
        });

        //Avisar al instante a los dos (el que envía puede tener otra pestaña abierta)
        enviarEvento(pareja.usuario_id, "mensaje", nuevo);
        enviarEvento(pareja.tecnico_id, "mensaje", nuevo);

        return res.status(201).json({ payload: nuevo });
    } catch (error) {
        console.error("Error al enviar el mensaje:", error);
        return res.status(500).json({ error: "Error al guardar el mensaje" });
    }
};

//GET /api/chat/mensajes/:mensajeId/imagen -> la foto de un mensaje
export const getImagen = async (req, res) => {
    try {
        enviarImagenBase64(res, await getImagenMensaje(req.params.mensajeId));
    } catch (error) {
        console.error("Error al enviar la foto del mensaje:", error);
        res.status(404).end();
    }
};
