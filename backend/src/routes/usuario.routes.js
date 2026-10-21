// src/routes/usuario.routes.js
import express from "express";
import { postUsuario, postSesion, getFoto, putFoto, getFotoImagen } from "../controllers/usuario.controllers.js";

const router = express.Router();

router.post("/registro", postUsuario); // POST /api/usuarios/registro
router.post("/login", postSesion);     // POST /api/usuarios/login
router.get("/:id/foto", getFoto);      // GET /api/usuarios/:id/foto
router.put("/:id/foto", putFoto);      // PUT /api/usuarios/:id/foto
router.get("/:id/foto/imagen", getFotoImagen); // la foto como imagen

export default router;