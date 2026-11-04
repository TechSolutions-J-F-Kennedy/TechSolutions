import connection from "../database/db.js";


export const obtenerHorarioTrabajo = async (tecnicoId, diaSemana) => {
    const sql = "SELECT hora_inicio, hora_fin FROM disponibilidad_tecnico WHERE tecnico_id = ? AND dia_semana = ?";
    const [rows] = await connection.query(sql, [tecnicoId, diaSemana]);
    return rows;     
}

  // Obtener las horas ya reservadas para un técnico en una fecha específica
  export const obtenerServiciosReservados = async(tecnicoId, fecha) => {
    const sql = "SELECT hora_servicio FROM Servicios WHERE tecnico_id = ? AND fecha_servicio = ? AND Estado NOT IN ('cancelado', 'rechazado')";
    const [rows] = await connection.query(sql, [tecnicoId, fecha]);
    return rows;
  }

  // Verificar si un turno específico ya está ocupado
export const existeTurno = async(tecnicoId, fecha, hora) =>{
    const sql = "SELECT id FROM Servicios  WHERE tecnico_id = ? AND fecha_servicio = ? AND hora_servicio = ? AND Estado NOT IN ('cancelado', 'rechazado')";
    const [rows] = await connection.query(sql, [tecnicoId, fecha, hora]);
    return rows;
}

export const crearServicio = async(datos) =>{
    const { cliente_id, tecnico_id, descripcion, direccion, fecha_servicio, hora_servicio } = datos;
    const sql = "INSERT INTO Servicios (cliente_id, tecnico_id, Estado, descripcion, direccion, fecha_servicio, hora_servicio, fecha_creacion) VALUES (?, ?, 'pendiente', ?, ?, ?, ?, NOW())";
    const [rows] = await connection.query(sql, [cliente_id, tecnico_id, descripcion, direccion, fecha_servicio, hora_servicio]);
    return rows.insertId;
}
