const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
     ssl: {
        rejectUnauthorized: false
    }
});


app.get("/", (req, res) => {
    res.json({
        mensaje: "Backend funcionando correctamente"
    });
});



app.get("/api/prueba-db", async (req, res) => {
    try {
        const [resultado] = await db.query("SELECT 1 AS conectado");

        res.json({
            mensaje: "Conexión con MySQL funcionando",
            resultado
        });

    } catch (error) {
        console.error("Error al conectar con MySQL:", error.message);

        res.status(500).json({
            mensaje: "Error al conectar con MySQL",
            error: error.message
        });
    }
});


app.get("/api/Usuarios", async (req, res) => {
    try {
        const [usuarios] = await db.query("SELECT * FROM Usuarios");

        res.json(usuarios);

    } catch (error) {
        console.error("Error al consultar usuarios:", error.message);

        res.status(500).json({
            mensaje: "Error al consultar usuarios",
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});