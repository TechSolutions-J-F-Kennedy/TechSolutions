//Ubicaciones: buscar coordenadas de una dirección y medir distancias

//A los técnicos que estén a esta distancia o menos (en km) les llega el pedido
export const RADIO_KM = 15;

//Distancia en km entre dos puntos, calculada en MySQL (fórmula del círculo máximo).
//Recibe los nombres de las columnas o "?" para valores; LEAST evita errores de redondeo en ACOS.
export const sqlDistanciaKm = (lat1, lng1, lat2, lng2) => `(6371 * ACOS(LEAST(1,
    COS(RADIANS(${lat1})) * COS(RADIANS(${lat2})) * COS(RADIANS(${lng2}) - RADIANS(${lng1}))
    + SIN(RADIANS(${lat1})) * SIN(RADIANS(${lat2})))))`;

//Buscar las coordenadas de una dirección escrita con OpenStreetMap (gratis, sin clave).
//Devuelve { latitud, longitud, direccion } o null si no la encuentra.
export const geocodificar = async (direccion) => {
    const url = "https://nominatim.openstreetmap.org/search?" + new URLSearchParams({
        q: direccion,
        format: "json",
        limit: "1",
        countrycodes: "ar",
        "accept-language": "es"
    });

    //OpenStreetMap pide que cada app se identifique con un User-Agent propio
    const respuesta = await fetch(url, {
        headers: { "User-Agent": "KennedyTechSolutions/1.0 (proyecto escolar)" },
        signal: AbortSignal.timeout(8000)
    });
    if (!respuesta.ok) throw new Error(`OpenStreetMap respondió ${respuesta.status}`);

    const [lugar] = await respuesta.json();
    if (!lugar) return null;
    return { latitud: Number(lugar.lat), longitud: Number(lugar.lon), direccion: lugar.display_name };
};
