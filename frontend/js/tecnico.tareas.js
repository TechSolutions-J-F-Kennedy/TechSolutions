const API_URL = location.protocol === 'file:' || location.port === '5500' ? 'http://localhost:3000' : ''; // '' = el mismo servidor que entregó la página (compu, celu o internet)

function obtenerTecnico() {
    try {
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        return usuario?.rol === 'tecnico' && usuario.id ? usuario : null;
    } catch (error) {
        console.error('No se pudieron leer los datos del técnico:', error);
        return null;
    }
}

const tecnico = obtenerTecnico();

if (!tecnico) {
    window.location.href = 'index.html';
} else {
    const mensajeHistorial = document.getElementById('mensaje-historial');
    const grupos = [
        { id: 'hoy', listaId: 'tareas-hoy', cantidadId: 'cantidad-hoy' },
        { id: 'semana', listaId: 'tareas-semana', cantidadId: 'cantidad-semana' },
        { id: 'mes', listaId: 'tareas-mes', cantidadId: 'cantidad-mes' },
        { id: 'anteriores', listaId: 'tareas-anteriores', cantidadId: 'cantidad-anteriores' }
    ];

    function obtenerFecha(fechaCreacion) {
        if (!fechaCreacion) return null;
        const partes = String(fechaCreacion).match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!partes) return null;
        const [anio, mes, dia] = partes.slice(1).map(Number);
        const fecha = new Date(anio, mes - 1, dia);
        if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) {
            return null;
        }
        return fecha;
    }

    function clasificarTarea(tarea, limites) {
        const fecha = obtenerFecha(tarea.fecha_creacion);
        if (!fecha) return 'anteriores';

        const tiempo = fecha.getTime();
        if (tiempo === limites.hoy) return 'hoy';
        if (tiempo >= limites.inicioSemana && tiempo < limites.inicioProximaSemana) {
            return 'semana';
        }
        if (tiempo >= limites.inicioMes && tiempo < limites.inicioSemana) {
            return 'mes';
        }
        return 'anteriores';
    }

    function formatoFecha(fechaCreacion) {
        const fecha = obtenerFecha(fechaCreacion);
        return fecha
            ? new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' }).format(fecha)
            : 'Fecha no disponible';
    }

    function crearBloqueTarea(tarea) {
        const elemento = document.createElement('div');
        elemento.className = 'it';
        const nombreServicio = tarea.servicio ?? tarea.nombre_servicio ?? `Tarea #${tarea.id}`;
        const cliente = tarea.cliente || 'Cliente no disponible';
        const estado = tarea.Estado ?? tarea.estado ?? 'Estado no disponible';
        const ubicacion = tarea.direccion || 'Ubicación no disponible';
        const estadoNormalizado = String(estado).toLowerCase();
        const claseEstado = estadoNormalizado.includes('final')
            ? 'success'
            : estadoNormalizado.includes('proceso') || estadoNormalizado.includes('yendo')
                ? 'progress'
                : 'pending';

        elemento.innerHTML = `
            <i data-lucide="clipboard-list"></i>
            <div class="tarea-info">
                <span>${nombreServicio} · ${cliente}</span>
                <small>${formatoFecha(tarea.fecha_creacion)} · ${ubicacion}</small>
            </div>
            <span class="status ${claseEstado}">${estado}</span>`;
        return elemento;
    }

    function renderizarGrupo(grupo, tareas) {
        const lista = document.getElementById(grupo.listaId);
        const contador = document.getElementById(grupo.cantidadId);

        contador.innerHTML = tareas.length;
        if (tareas.length === 0) {
            lista.innerHTML = '<p class="m">Sin tareas</p>';
            return;
        }

        lista.innerHTML = '';
        tareas.forEach((tarea) => lista.append(crearBloqueTarea(tarea)));
    }

    async function cargarHistorial() {
        try {
            const respuesta = await fetch(
                `${API_URL}/api/tecnicos/${encodeURIComponent(tecnico.id)}/servicios`
            );
            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(datos.error || 'No se pudo cargar el historial.');
            }
            if (!Array.isArray(datos.payload)) {
                throw new Error('La respuesta del servidor no contiene una lista de tareas.');
            }

            const ahora = new Date();
            const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
            const inicioSemana = new Date(hoy);
            const diasDesdeLunes = (hoy.getDay() + 6) % 7;
            inicioSemana.setDate(hoy.getDate() - diasDesdeLunes);
            const inicioProximaSemana = new Date(inicioSemana);
            inicioProximaSemana.setDate(inicioSemana.getDate() + 7);
            const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
            const limites = {
                hoy: hoy.getTime(),
                inicioSemana: inicioSemana.getTime(),
                inicioProximaSemana: inicioProximaSemana.getTime(),
                inicioMes: inicioMes.getTime()
            };
            const tareasPorGrupo = Object.fromEntries(grupos.map(({ id }) => [id, []]));

            datos.payload.forEach((tarea) => {
                tareasPorGrupo[clasificarTarea(tarea, limites)].push(tarea);
            });

            grupos.forEach((grupo) => renderizarGrupo(grupo, tareasPorGrupo[grupo.id]));
            mensajeHistorial.innerHTML = datos.payload.length
                ? ''
                : 'Todavía no tenés tareas en tu historial.';
            lucide.createIcons();
        } catch (error) {
            console.error('Error al cargar el historial de tareas:', error);
            mensajeHistorial.innerHTML = 'No se pudo cargar el historial de tareas.';
        }
    }

    cargarHistorial();
}
