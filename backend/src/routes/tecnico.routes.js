// src/routes/usuario.routes.js
import express from "express";
import { getTecnico } from "../controllers/tecnico.controllers.js";

const router = express.Router();

router.post("/verTecnicos", getTecnico); // POST /api/tecnicos/getTecnico

export default router;