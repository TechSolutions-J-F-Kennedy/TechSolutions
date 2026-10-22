
import express from "express";
import { getPedidos  } from "../controllers/pedido.controller.js";

const router = express.Router();

router.get("/usuario/:id", getPedidos); 

export default router;