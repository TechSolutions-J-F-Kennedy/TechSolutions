        fetch('datos.json')
            .then(response => response.json())
            .then(data => {
                const tbody = document.getElementById('cuerpo-tabla');
                
                // Recorrer cada objeto del JSON
                data.forEach(item => {
                    const fila = document.createElement('tr');
                    
                    fila.innerHTML = `
                        <td>${item.id}</td>
                        <td>${item.nombre}</td>
                        <td>${item.email}</td>
                    `;
                    
                    tbody.appendChild(fila);
                });
            })
            .catch(error => console.error('Error al cargar el JSON:', error));