import { getRolUsuario, getConversacionesByUsuario, getMensajesConversacion, crearMensaje } from "../models/chat.models.js";

const ROLES_CHAT = ["tecnico", "usuario"];

//Conexiones abiertas en tiempo real: id de usuario -> respuestas (una por pestaña abierta)
const conexiones = new Map();

const enviarEvento = (usuarioId, evento, datos) => {
    const abiertas = conexiones.get(String(usuarioId));
    if (!abiertas) return;
    const texto = `event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`;
    abiertas.forEach((res) => res.write(texto));
};

//A partir de dos ids, saber quién es el técnico y quién el usuario
const armarPareja = async (idA, idB) => {
    const [rolA, rolB] = await Promise.all([getRolUsuario(idA), getRolUsuario(idB)]);
    if (rolA === "tecnico" && rolB === "usuario") return { tecnico_id: Number(idA), usuario_id: Number(idB), rolA };
    if (rolA === "usuario" && rolB === "tecnico") return { tecnico_id: Number(idB), usuario_id: Number(idA), rolA };
    return null;
};

//GET /api/chat/:id/tiempo-real  (Server-Sent Events)
export const getTiempoReal = (req, res) => {
    const id = String(req.params.id);

    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
    });
    res.write("event: conectado\ndata: {}\n\n");

    if (!conexiones.has(id)) conexiones.set(id, new Set());
    conexiones.get(id).add(res);

    //Mensaje vacío cada 25 segundos para que la conexión no se corte
    const latido = setInterval(() => res.write(": ping\n\n"), 25000);

    req.on("close", () => {
        clearInterval(latido);
        const abiertas = conexiones.get(id);
        abiertas.delete(res);
        if (abiertas.size === 0) conexiones.delete(id);
    });
};

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
        const { emisor_id, receptor_id, mensaje } = req.body;

        if (!emisor_id || !receptor_id || typeof mensaje !== "string" || !mensaje.trim() || mensaje.length > 1000) {
            return res.status(400).json({ error: "Revisá el emisor, el receptor y el mensaje (máx. 1000 caracteres)" });
        }

        const pareja = await armarPareja(emisor_id, receptor_id);
        if (!pareja) {
            return res.status(400).json({ error: "El chat tiene que ser entre un técnico y un usuario" });
        }

        const nuevo = await crearMensaje({
            usuario_id: pareja.usuario_id,
            tecnico_id: pareja.tecnico_id,
            remitente: pareja.rolA,
            mensaje: mensaje.trim()
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
