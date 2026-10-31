
import express from "express";
import { getPedidos, cancelarPedido  } from "../controllers/pedido.controller.js";

const router = express.Router();

router.get("/usuario/:id", getPedidos); 
router.patch("/:id/cancelar", cancelarPedido);

export default router;