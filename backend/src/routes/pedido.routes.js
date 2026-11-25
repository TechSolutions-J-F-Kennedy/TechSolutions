
import express from "express";
import { getPedidos, cancelarPedido, actualizarEstadoPedido, reprogramarPedido   } from "../controllers/pedido.controllers.js";

const router = express.Router();

router.get("/usuario/:id", getPedidos); 
router.patch("/:id/cancelar", cancelarPedido);
router.patch("/:id/estado", actualizarEstadoPedido);
router.patch("/:id/reprogramar", reprogramarPedido);

export default router;