import express from "express";
import { crearResena, getResenasPorCliente, eliminarResena } from "../controllers/resena.controllers.js";

const router = express.Router();

router.post("/", crearResena);
router.get("/cliente/:clienteId", getResenasPorCliente);
router.delete("/:id", eliminarResena);

export default router;