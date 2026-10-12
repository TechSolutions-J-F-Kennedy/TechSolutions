//Importar y conectar el router en el servidor principal:
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import tecnicosRoutes from "./src/routes/tecnico.routes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/api/tecnicos", tecnicosRoutes);

app.get("/", (req, res) => {
    res.json({ status: "OK", mensaje: "Servidor Backend corriendo correctamente" });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
});