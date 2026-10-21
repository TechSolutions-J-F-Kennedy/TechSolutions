import express from "express";
import { getProductosStockController } from "../controllers/stock.controllers.js";

const router = express.Router();

router.get("/", getProductosStockController);

export default router;
