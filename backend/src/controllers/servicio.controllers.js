import { obtenerHorarioTrabajo, obtenerServiciosReservados, existeTurno, crearServicio } from "../models/servicio.models.js";

export const getDisponibilidadTecnico = async (req, res) => {
    try {
        const tecnicoId = req.params.id;
        const { fecha } = req.query;
        if (!fecha) {
            return res.status(400).json({ error: "La fecha es obligatoria" });
        }
        const fechaObj = new Date(fecha + "T00:00:00");
        const diaSemana = fechaObj.getDay();
        const horarios = await obtenerHorarioTrabajo(tecnicoId, diaSemana);
        if (!horarios || horarios.length === 0) {
            return res.status(200).json({ fecha, slots: [] }); // No trabaja ese día
        }
        const horarioTrabajo = horarios[0];
        const serviciosOcupados = await obtenerServiciosReservados(tecnicoId, fecha);
        const horasOcupadasSet = new Set(
            serviciosOcupados.map(s => String(s.hora_servicio).substring(0, 5))
        );
        const slots = [];
        let horaActual = parseInt(horarioTrabajo.hora_inicio.split(":")[0]);
        const horaFin = parseInt(horarioTrabajo.hora_fin.split(":")[0]);
        while (horaActual < horaFin) {
            const horaFormateada = `${horaActual.toString().padStart(2, "0")}:00`;  
            slots.push({
                hora: horaFormateada,
                ocupado: horasOcupadasSet.has(horaFormateada)
            });
            horaActual += 1;
        }
        return res.status(200).json({ fecha, tecnico_id: tecnicoId, slots });
    } catch (error) {
        console.error("Error al obtener disponibilidad:", error);
        return res.status(500).json({ error: "Error al consultar la disponibilidad" });
    }
};
export const postSolicitarServicio = async (req, res) => {
    try {
        const { cliente_id, tecnico_id, descripcion, direccion, fecha_servicio, hora_servicio } = req.body;
        if (!cliente_id || !tecnico_id || !fecha_servicio || !hora_servicio) {
            return res.status(400).json({ error: "Faltan datos obligatorios para la reserva" });
        }
        const turnosOcupados = await existeTurno(tecnico_id, fecha_servicio, hora_servicio);
        if (turnosOcupados && turnosOcupados.length > 0) {
            return res.status(400).json({ error: "El horario seleccionado ya no se encuentra disponible" });
        }
        const nuevoId = await crearServicio({
            cliente_id,
            tecnico_id,
            descripcion: descripcion || '',
            direccion: direccion || '',
            fecha_servicio,
            hora_servicio
        });
        return res.status(201).json({
            mensaje: "Solicitud de servicio creada con éxito",
            servicio_id: nuevoId
        });
    } catch (error) {
        console.error("Error al solicitar el servicio:", error);
        return res.status(500).json({ error: "Error al guardar el servicio en la base de datos" });
    }
};