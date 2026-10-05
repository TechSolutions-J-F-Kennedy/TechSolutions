// src/routes/usuario.routes.js
import express from "express";
import { postUsuario, postSesion } from "../controllers/usuario.controllers.js";

const router = express.Router();

router.post("/registro", postUsuario); // POST /api/usuarios/registro
router.post("/login", postSesion);     // POST /api/usuarios/login

export default router;