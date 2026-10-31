// src/routes/usuario.routes.js
import express from "express";
import { getTecnicos, getTecnicosCategoria  } from "../controllers/tecnico.controllers.js";

const router = express.Router();

router.get("/verTodosLosTecnicos", getTecnicos);
router.post("/verTecnicosCategoria", getTecnicosCategoria); // POST /api/tecnicos/getTecnico

export default router;