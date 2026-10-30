import express from "express";
import { 
    postUsuario, 
    postSesion, 
    putUsuario, 
    getDireccionesUsuario, 
    postDireccionUsuario, 
    patchDireccionPrincipal 
} from "../controllers/usuario.controllers.js";
import { postUsuario, postSesion, getFoto, putFoto, getFotoImagen } from "../controllers/usuario.controllers.js";
import { getDireccionesUsuario } from "../controllers/usuario.controllers.js";

const router = express.Router();

// Autenticación y Perfil
router.post("/registro", postUsuario);               // POST /api/usuarios/registro
router.post("/login", postSesion);                   // POST /api/usuarios/login
router.put("/:usuarioId", putUsuario);                // PUT /api/usuarios/:usuarioId

// Gestión de Direcciones
router.get("/:usuarioId/direcciones", getDireccionesUsuario);                                // GET /api/usuarios/:usuarioId/direcciones
router.post("/:usuarioId/direcciones", postDireccionUsuario);                               // POST /api/usuarios/:usuarioId/direcciones
router.patch("/:usuarioId/direcciones/:direccionId/principal", patchDireccionPrincipal);    // PATCH /api/usuarios/:usuarioId/direcciones/:direccionId/principal




router.post("/registro", postUsuario); // POST /api/usuarios/registro
router.post("/login", postSesion);     // POST /api/usuarios/login
router.get("/:id/foto", getFoto);      // GET /api/usuarios/:id/foto
router.put("/:id/foto", putFoto);      // PUT /api/usuarios/:id/foto
router.get("/:id/foto/imagen", getFotoImagen); // la foto como imagen
router.get("/:usuarioId/direcciones", getDireccionesUsuario);

export default router;