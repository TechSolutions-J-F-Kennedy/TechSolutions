import { getProductosStock } from "../models/stock.models.js";

export const getProductosStockController = async (req, res) => {
  try {
    const productos = await getProductosStock();

    return res.status(200).json({
      ok: true,
      payload: productos
    });
  } catch (error) {
    console.error("Error al consultar productos_stock:", error);

    return res.status(500).json({
      ok: false,
      error: "No se pudo consultar la tabla productos_stock",
      detalle: error.message
    });
  }
};
