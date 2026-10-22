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
import connection from "./src/database/db.js";

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

//Diagnóstico de la conexión a la base (no muestra ninguna contraseña ni dato secreto)
app.get("/api/estado-db", async (req, res) => {
    const nombres = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"];
    const variables = Object.fromEntries(nombres.map((n) => [n, process.env[n] ? "cargada" : "FALTA"]));

    const causas = {
        ETIMEDOUT: "La base no responde: Aiven no deja entrar a este servidor (lista de IPs permitidas) o DB_HOST/DB_PORT están mal",
        ECONNREFUSED: "La base rechazó la conexión: revisá DB_HOST y DB_PORT",
        ENOTFOUND: "No existe ese servidor: DB_HOST está mal escrito",
        ER_ACCESS_DENIED_ERROR: "Usuario o contraseña incorrectos: revisá DB_USER y DB_PASSWORD",
        ER_BAD_DB_ERROR: "No existe esa base de datos: revisá DB_NAME",
        HANDSHAKE_SSL_ERROR: "Problema con la conexión segura (SSL)"
    };

    try {
        await connection.query("SELECT 1");
        res.json({ conexion: "OK ✅", variables });
    } catch (error) {
        res.status(500).json({
            conexion: "FALLA ❌",
            codigo: error.code || "desconocido",
            que_revisar: causas[error.code] || "Error no reconocido: mirá los Logs del servidor",
            variables
        });
    }
});

//Entregar las páginas del frontend (así se puede abrir desde el celular)
app.use(express.static(carpetaFrontend));

app.listen(PORT, () => {
    console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
});
