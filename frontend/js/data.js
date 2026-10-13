// ===== DATOS MOCK (reemplazar por fetch al backend cuando esté listo) =====

const TECNICO = {
  nombre: "Sofía",
  estado: "Disponible"
};

let ORDENES = [
  {
    id: 1042,
    cliente: "Juan Pérez",
    direccion: "Av. Principal 1234",
    horario: "14:00 - 15:00",
    descripcion: "El router no enciende, posible falla de fuente de alimentación.",
    estado: "pendiente", // pendiente | en-sitio | finalizado
    checkinTimestamp: null,
    materiales: []
  },
  {
    id: 1043,
    cliente: "Marcela Díaz",
    direccion: "Calle Falsa 221",
    horario: "15:30 - 16:30",
    descripcion: "Cliente reporta intermitencia en la señal de internet.",
    estado: "pendiente",
    checkinTimestamp: null,
    materiales: []
  },
  {
    id: 1044,
    cliente: "Roberto Gómez",
    direccion: "Belgrano 980",
    horario: "17:00 - 18:00",
    descripcion: "Instalación de nuevo punto de red en oficina.",
    estado: "finalizado",
    checkinTimestamp: null,
    materiales: [{ sku: "REP-1001", nombre: "Cable UTP 5m", cantidad: 2, precio: 800 }]
  }
];

// Catálogo simulado para la búsqueda por SKU / QR
const CATALOGO_SKU = {
  "REP-4521": { nombre: "Router Wi-Fi", precio: 15000 },
  "REP-1001": { nombre: "Cable UTP 5m", precio: 800 },
  "REP-2210": { nombre: "Conector RJ45", precio: 150 }
};

// Persistencia local básica (requisito de la guía: localStorage / IndexedDB)
function guardarEnLocalStorage() {
  localStorage.setItem("ordenes_tecnico", JSON.stringify(ORDENES));
  // TODO: cuando haya backend, intentar sincronizar aquí y limpiar el storage si tiene éxito.
}

function cargarDeLocalStorage() {
  const data = localStorage.getItem("ordenes_tecnico");
  if (data) ORDENES = JSON.parse(data);
}

cargarDeLocalStorage();