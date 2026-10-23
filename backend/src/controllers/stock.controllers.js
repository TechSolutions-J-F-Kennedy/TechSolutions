import {
  actualizarProductoStock,
  crearProductoStock,
  eliminarProductoStock,
  getProductosStock
} from "../models/stock.models.js";

const validarProducto = (producto) => {
  if (!producto || typeof producto !== "object" || Array.isArray(producto)) {
    return false;
  }

  const camposTexto = ["codigo_sku", "nombre", "descripcion"];
  if (
    camposTexto.some((campo) => typeof producto[campo] !== "string") ||
    (producto.codigo_qr !== null && typeof producto.codigo_qr !== "string") ||
    !producto.codigo_sku.trim() ||
    !producto.nombre.trim() ||
    !Number.isInteger(producto.stock_actual) ||
    producto.stock_actual < 0 ||
    !Number.isInteger(producto.stock_minimo) ||
    producto.stock_minimo < 0
  ) {
    return false;
  }

  return true;
};

const validarId = (valor) => /^\d+$/.test(valor) && Number(valor) > 0;

export const getProductosStockController = async (req, res) => {
  const { nombre, codigo, stock_max: stockMaxQuery } = req.query;

  if (
    (nombre !== undefined && typeof nombre !== "string") ||
    (codigo !== undefined && typeof codigo !== "string") ||
    (stockMaxQuery !== undefined &&
      stockMaxQuery !== "" &&
      (typeof stockMaxQuery !== "string" || !/^\d+$/.test(stockMaxQuery)))
  ) {
    return res.status(400).json({ error: "Los filtros enviados no son válidos" });
  }

  try {
    const productos = await getProductosStock({
      nombre: nombre?.trim(),
      codigo: codigo?.trim(),
      stockMax: !stockMaxQuery ? undefined : Number(stockMaxQuery)
    });

    return res.status(200).json({ ok: true, payload: productos });
  } catch (error) {
    console.error("Error al consultar productos_stock:", error);

    return res.status(500).json({
      ok: false,
      error: "No se pudo consultar el inventario"
    });
  }
};

export const postProductoStockController = async (req, res) => {
  if (!validarProducto(req.body)) {
    return res.status(400).json({ error: "Los datos del producto no son válidos" });
  }

  try {
    const id = await crearProductoStock(req.body);
    return res.status(201).json({ ok: true, id });
  } catch (error) {
    console.error("Error al crear producto_stock:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "El código SKU o QR ya está registrado" });
    }

    return res.status(500).json({ error: "No se pudo crear el producto" });
  }
};

export const patchProductoStockController = async (req, res) => {
  const { id } = req.params;
  if (!validarId(id)) {
    return res.status(400).json({ error: "El ID del producto no es válido" });
  }
  if (!validarProducto(req.body)) {
    return res.status(400).json({ error: "Los datos del producto no son válidos" });
  }

  try {
    const actualizado = await actualizarProductoStock(Number(id), req.body);
    if (!actualizado) {
      return res.status(404).json({ error: "No se encontró el producto activo" });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error al actualizar producto_stock:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "El código SKU o QR ya está registrado" });
    }

    return res.status(500).json({ error: "No se pudo actualizar el producto" });
  }
};

export const deleteProductoStockController = async (req, res) => {
  const { id } = req.params;
  if (!validarId(id)) {
    return res.status(400).json({ error: "El ID del producto no es válido" });
  }

  try {
    const eliminado = await eliminarProductoStock(Number(id));
    if (!eliminado) {
      return res.status(404).json({ error: "No se encontró el producto activo" });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error al eliminar producto_stock:", error);
    return res.status(500).json({ error: "No se pudo eliminar el producto" });
  }
};
