//Avisos en tiempo real (Server-Sent Events): chat, pedidos nuevos, pedidos tomados, etc.
//Cada usuario abre una conexión en GET /api/chat/:id/tiempo-real y el servidor le escribe ahí.

//Conexiones abiertas: id de usuario -> respuestas (una por pestaña abierta)
const conexiones = new Map();

//Mandar un aviso a un usuario (si tiene la app abierta)
export const enviarEvento = (usuarioId, evento, datos) => {
    const abiertas = conexiones.get(String(usuarioId));
    if (!abiertas) return;
    const texto = `event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`;
    abiertas.forEach((res) => res.write(texto));
};

//Abrir la conexión de un usuario y dejarla abierta
export const abrirConexion = (usuarioId, req, res) => {
    const id = String(usuarioId);

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
