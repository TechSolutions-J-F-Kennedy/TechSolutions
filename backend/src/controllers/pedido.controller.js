import { getPedidosById, getPedidoByServicioId, cancelarPedidoModel } from "../models/pedido.models.js";



export const getPedidos = async (req, res) => {
    try {
        const clienteId = req.params.id;
        const pedidos = await getPedidosById( clienteId );
        return res.json({ payload: pedidos });
    } catch (error) {
        console.error("Error al obtener pedidos:", error);
        return res.status(500).json({ error: "Error al consultar los pedidos" });
    }
};

export const cancelarPedido = async (req, res) => {
    const { id } = req.params;

    try {
        const pedido = await getPedidoByServicioId(id);

        if (!pedido) {
            return res.status(404).json({ error: "El pedido no existe." });
        }

        const estadoActual = String(pedido.Estado || '').toLowerCase();
        if (estadoActual !== 'pendiente') {
            return res.status(400).json({ 
                error: `No se puede cancelar un pedido con estado '${pedido.Estado}'. Solo se pueden cancelar pedidos pendientes.` 
            });
        }

        await cancelarPedidoModel(id);

        return res.status(200).json({ 
            success: true, 
            message: "Pedido cancelado correctamente." 
        });

    } catch (error) {
        console.error("Error al cancelar pedido:", error);
        return res.status(500).json({ error: "Error interno del servidor al cancelar el pedido." });
    }
};