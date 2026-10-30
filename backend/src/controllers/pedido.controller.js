import { getPedidosById } from "../models/pedido.models.js";



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