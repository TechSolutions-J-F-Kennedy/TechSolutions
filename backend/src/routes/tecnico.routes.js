// src/routes/usuario.routes.js
import express from "express";
import { getTecnicosCercanosController } from "../controllers/tecnico.controllers.js";

const router = express.Router();

// POST /api/tecnicos/getTecnico
router.get("/cercanos/:usuarioId", getTecnicosCercanosController);

export default router;