import express from "express";
import {
  deleteProductoStockController,
  getProductosStockController,
  patchProductoStockController,
  postProductoStockController
} from "../controllers/stock.controllers.js";

const router = express.Router();

router.get("/", getProductosStockController);
router.post("/", postProductoStockController);
router.patch("/:id", patchProductoStockController);
router.delete("/:id", deleteProductoStockController);

export default router;
