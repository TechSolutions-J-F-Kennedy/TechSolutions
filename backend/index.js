//Importar y conectar el router en el servidor principal:
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import tecnicosRoutes from "./src/routes/tecnico.routes.js";
import usuariosRoutes from "./src/routes/usuario.routes.js";
import chatRoutes from "./src/routes/chat.routes.js";
import clientesRoutes from "./src/routes/cliente.routes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

//Carpeta del frontend (al lado de la carpeta backend)
const carpetaFrontend = path.join(path.dirname(fileURLToPath(import.meta.url)), "../frontend");

app.use(cors());
app.use(express.json({ limit: "1mb" })); // 1mb para poder recibir la foto de perfil
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/tecnicos", tecnicosRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/clientes", clientesRoutes);

app.get("/api", (req, res) => {
    res.json({ status: "OK", mensaje: "Servidor Backend corriendo correctamente" });
});

//Entregar las páginas del frontend (así se puede abrir desde el celular)
app.use(express.static(carpetaFrontend));

app.listen(PORT, () => {
    console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
});
