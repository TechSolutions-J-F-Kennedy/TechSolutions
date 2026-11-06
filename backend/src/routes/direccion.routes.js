import express from "express";
import { getDireccionPrincipal } from "../controllers/direccion.controllers.js";

const router = express.Router();

router.get("/principal/:usuarioId", getDireccionPrincipal);

export default router;