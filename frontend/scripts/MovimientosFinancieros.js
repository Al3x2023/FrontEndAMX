        // Constante para la URL base
        const API_BASE_URL = "http://192.168.1.75:8000/movimientosfinancieros";
        
        document.addEventListener("DOMContentLoaded", () => {
            fetchMovimientos();
            document.getElementById("movimientoForm").addEventListener("submit", saveMovimiento);
        });

        function mostrarNotificacion(mensaje, tipo = 'success') {
            const notification = document.createElement('div');
            notification.className = `notification ${tipo} show`;
            notification.innerHTML = `
                <i class="fas fa-${tipo === 'success' ? 'check' : 'exclamation'} me-2"></i>
                ${mensaje}
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        async function fetchMovimientos() {
            try {
                const response = await fetch(API_BASE_URL + "/");
                if (!response.ok) throw new Error("Error al obtener los datos");
                const movimientos = await response.json();
                const tbody = document.getElementById("movimientosTable");
                tbody.innerHTML = "";
                
                if (movimientos.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="5" class="text-center py-4 text-muted">No hay movimientos registrados</td>
                        </tr>
                    `;
                    return;
                }
                
                movimientos.forEach(mov => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${mov.idMovimiento}</td>
                        <td>${mov.descripcion}</td>
                        <td>$${parseFloat(mov.monto).toFixed(2)}</td>
                        <td>
                            <span class="badge rounded-pill ${mov.tipo === 'ingreso' ? 'bg-success' : 'bg-danger'}">
                                ${mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                            </span>
                        </td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-sm btn-warning" onclick="editMovimiento(${mov.idMovimiento})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteMovimiento(${mov.idMovimiento})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } catch (error) {
                mostrarNotificacion("Error al cargar los movimientos", "error");
                console.error(error);
            }
        }

        async function saveMovimiento(event) {
            event.preventDefault();
            const id = document.getElementById("movimientoId").value;
            const descripcion = document.getElementById("descripcion").value.trim();
            const monto = parseFloat(document.getElementById("monto").value);
            const tipo = document.getElementById("tipo").value;

            // Obtener el idSucursal desde el localStorage
            const idSucursal = localStorage.getItem("idSucursal");

            if (!idSucursal) {
                mostrarNotificacion("No se ha encontrado el ID de la sucursal en la sesión", "error");
                return;
            }

            if (!descripcion || isNaN(monto) || monto <= 0) {
                mostrarNotificacion("Por favor, ingrese una descripción válida y un monto positivo", "error");
                return;
            }

            const movimiento = { idSucursal, descripcion, monto, tipo };

            const method = id ? "PUT" : "POST";
            const url = id ? `${API_BASE_URL}/${id}` : API_BASE_URL + "/";

            try {
                const response = await fetch(url, {
                    method,
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
                    },
                    body: JSON.stringify(movimiento)
                });
                
                if (!response.ok) throw new Error("Error al guardar el movimiento");
                
                mostrarNotificacion(id ? "Movimiento actualizado correctamente" : "Movimiento agregado correctamente");
                document.getElementById("movimientoForm").reset();
                document.getElementById("movimientoId").value = "";
                fetchMovimientos();
            } catch (error) {
                mostrarNotificacion("Error al guardar el movimiento", "error");
                console.error("Error:", error);
            }
        }

        async function editMovimiento(id) {
            try {
                const response = await fetch(`${API_BASE_URL}/${id}`, {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
                    }
                });
                if (!response.ok) throw new Error("Error al obtener el movimiento");
                const mov = await response.json();
                document.getElementById("movimientoId").value = mov.idMovimiento;
                document.getElementById("descripcion").value = mov.descripcion;
                document.getElementById("monto").value = parseFloat(mov.monto).toFixed(2);
                document.getElementById("tipo").value = mov.tipo;
                
                // Scroll al formulario
                document.getElementById("movimientoForm").scrollIntoView({ behavior: 'smooth' });
                document.getElementById("descripcion").focus();
                
                mostrarNotificacion("Movimiento cargado para edición");
            } catch (error) {
                mostrarNotificacion("Error al cargar el movimiento para editar", "error");
                console.error(error);
            }
        }

        async function deleteMovimiento(id) {
            if (!confirm("¿Estás seguro de eliminar este movimiento?")) return;
            try {
                const response = await fetch(`${API_BASE_URL}/${id}`, { 
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("access_token")}`
                    }
                });
                if (!response.ok) throw new Error("Error al eliminar el movimiento");
                mostrarNotificacion("Movimiento eliminado correctamente");
                fetchMovimientos();
            } catch (error) {
                mostrarNotificacion("Error al eliminar el movimiento", "error");
                console.error(error);
            }
        }