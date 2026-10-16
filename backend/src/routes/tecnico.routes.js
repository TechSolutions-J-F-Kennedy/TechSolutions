// src/routes/usuario.routes.js
import express from "express";
import { getTecnicos, getTecnicosCategoria  } from "../controllers/tecnico.controllers.js";
import { getTecnicosCercanosController } from "../controllers/tecnico.dos.controllers.js";

const router = express.Router();

router.get("/verTodosLosTecnicos", getTecnicos);
router.post("/verTecnicosCategoria", getTecnicosCategoria); // POST /api/tecnicos/getTecnico
router.get("/cercanos/:usuarioId", getTecnicosCercanosController);

export default router;