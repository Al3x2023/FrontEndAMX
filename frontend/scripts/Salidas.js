 // Configuración de la API - cambia esta URL por la de tu backend
 const API_URL = "http://localhost:8000";
    
 // Variables globales
 let productosSalida = [];
 
 // Variables para paginación
 let salidasData = [];
 let currentPage = 1;
 const itemsPerPage = 10;
 let filteredSalidas = [];

 // Mostrar notificación
 function mostrarNotificacion(mensaje, tipo = 'success') {
   const notification = document.getElementById('notification');
   notification.textContent = mensaje;
   notification.style.backgroundColor = tipo === 'success' ? 'var(--success)' : 'var(--danger)';
   notification.style.display = 'block';
   
   setTimeout(() => {
     notification.style.display = 'none';
   }, 3000);
 }
 
 // Función auxiliar para peticiones con autenticación
 function fetchWithAuth(url, options = {}) {
   const token = localStorage.getItem("access_token");
   const headers = {
     ...options.headers,
     "Content-Type": "application/json",
     "Authorization": `Bearer ${token}`
   };
   return fetch(url, { ...options, headers });
 }
 
 /* ========== FUNCIONALIDAD PARA SALIDAS ========== */
 
 // Buscar producto por código de barras para salida
 async function buscarProductoPorCodigo() {
   const codigo = document.getElementById("salida-codigo-barras").value.trim();
   if (!codigo) {
     mostrarNotificacion("Ingrese un código de barras", 'error');
     return;
   }

   try {
     // Obtener todos los productos
     const response = await fetchWithAuth(`${API_URL}/productos/`);
     if (!response.ok) throw new Error("Error al obtener productos");
     
     const productos = await response.json();
     
     // Buscar EXACTA del código de barras
     const producto = productos.find(p => String(p.codigoBarras) === codigo);
     
     if (!producto) {
       throw new Error("Producto no encontrado");
     }

     // Aseguramos que el precio sea un número válido
     const precioVenta = parseFloat(producto.precioVenta) || 0;
     
     document.getElementById("infoProductoText").textContent = 
       `Producto: ${producto.nombreDelProducto} | Precio: $${precioVenta.toFixed(2)}`;
     document.getElementById("infoProducto").style.display = "flex";
     document.getElementById("infoProducto").className = "info-producto";
     
     // Agregar al ticket de salida
     const productoExistente = productosSalida.find(p => p.idProducto === producto.idProducto);
     
     if (productoExistente) {
       productoExistente.cantidad += 1;
     } else {
       productosSalida.push({
         idProducto: producto.idProducto,
         codigoBarras: producto.codigoBarras,
         nombre: producto.nombreDelProducto,
         cantidad: 1,
         precioDeVenta: precioVenta,
         stock: producto.stock || 0
       });
     }
     
     actualizarTicketSalida();
     mostrarTicketSalida();
     document.getElementById("salida-codigo-barras").value = '';
     document.getElementById("salida-codigo-barras").focus();
   } catch (error) {
     console.error("Error al buscar producto:", error);
     document.getElementById("infoProductoText").textContent = error.message;
     document.getElementById("infoProducto").style.display = "flex";
     document.getElementById("infoProducto").className = "info-producto error";
   }
 }
 
 // Actualizar ticket de salida
 function actualizarTicketSalida() {
   const tbody = document.getElementById("ticket-salida-body");
   tbody.innerHTML = '';
   
   productosSalida.forEach((producto, index) => {
     const precio = parseFloat(producto.precioDeVenta) || 0;
     const subtotal = producto.cantidad * precio;
     
     const row = document.createElement('tr');
     row.innerHTML = `
       <td>${producto.codigoBarras || 'N/A'}</td>
       <td>${producto.nombre}</td>
       <td>
         <input type="number" class="form-control cantidad-input" value="${producto.cantidad}" 
                min="1" max="${producto.stock}" data-index="${index}" onchange="actualizarCantidadSalida(this)">
       </td>
       <td>
         <input type="number" class="form-control precio-input" value="${precio.toFixed(2)}" 
                step="0.01" min="0" data-index="${index}" onchange="actualizarPrecioSalida(this)">
       </td>
       <td>$${subtotal.toFixed(2)}</td>
       <td>
         <button onclick="eliminarProductoSalida(${index})" class="btn btn-sm btn-danger hover-scale">
           <i class="fas fa-trash-alt me-1"></i>Eliminar
         </button>
       </td>
     `;
     tbody.appendChild(row);
   });
   
   const total = productosSalida.reduce((sum, producto) => {
     const precio = parseFloat(producto.precioDeVenta) || 0;
     return sum + (producto.cantidad * precio);
   }, 0);
   
   document.getElementById("ticket-salida-total").textContent = `$${total.toFixed(2)}`;
   
   // Calcular cambio si hay pago recibido
   const pagoRecibido = parseFloat(document.getElementById("salida-pago-recibido").value) || 0;
   const cambio = pagoRecibido - total;
   document.getElementById("ticket-salida-cambio").textContent = `$${Math.max(0, cambio).toFixed(2)}`;
 }
 
 // Mostrar/ocultar ticket de salida
 function mostrarTicketSalida() {
   if (productosSalida.length > 0) {
     document.getElementById("ticket-salida").style.display = 'block';
   }
 }
 
 function ocultarTicketSalida() {
   document.getElementById("ticket-salida").style.display = 'none';
 }
 
 // Actualizar cantidad en salida
 function actualizarCantidadSalida(input) {
   const index = input.getAttribute('data-index');
   const nuevaCantidad = parseInt(input.value);
   const stockMaximo = productosSalida[index].stock;
   
   if (nuevaCantidad > 0 && nuevaCantidad <= stockMaximo) {
     productosSalida[index].cantidad = nuevaCantidad;
     actualizarTicketSalida();
   } else {
     input.value = productosSalida[index].cantidad;
     mostrarInfoProducto(`La cantidad no puede ser mayor al stock disponible (${stockMaximo})`, true);
   }
 }
 
 // Actualizar precio en salida
 function actualizarPrecioSalida(input) {
   const index = input.getAttribute('data-index');
   const nuevoPrecio = parseFloat(input.value);
   
   if (nuevoPrecio >= 0) {
     productosSalida[index].precioDeVenta = nuevoPrecio;
     actualizarTicketSalida();
   } else {
     input.value = (parseFloat(productosSalida[index].precioVenta) || 0).toFixed(2);
   }
 }
 
 // Eliminar producto de salida
 function eliminarProductoSalida(index) {
   productosSalida.splice(index, 1);
   actualizarTicketSalida();
   
   if (productosSalida.length === 0) {
     ocultarTicketSalida();
     document.getElementById("infoProducto").style.display = "none";
   }
 }

 // Función para preparar el ticket de impresión
 function prepararTicketParaImpresion() {
   const ticketImpression = document.getElementById('ticket-impresion');
   const ticketBody = document.getElementById('ticket-impresion-body');
   const fecha = new Date();

   // Formatear fecha
   document.getElementById('fecha-ticket').textContent = 
     `Fecha: ${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}`;

   // Limpiar contenido anterior
   ticketBody.innerHTML = '';

   // Agregar productos
   productosSalida.forEach(producto => {
     const precio = parseFloat(producto.precioDeVenta) || 0;
     const subtotal = producto.cantidad * precio;
     
     const row = document.createElement('tr');
     row.innerHTML = `
       <td>${producto.cantidad}</td>
       <td>${producto.nombre}</td>
       <td>$${precio.toFixed(2)}</td>
       <td>$${subtotal.toFixed(2)}</td>
     `;
     ticketBody.appendChild(row);
   });

   // Calcular totales
   const total = productosSalida.reduce((sum, p) => sum + (p.cantidad * p.precioDeVenta), 0);
   const pagoRecibido = parseFloat(document.getElementById('salida-pago-recibido').value) || 0;
   const cambio = Math.max(0, pagoRecibido - total);

   document.getElementById('ticket-impresion-total').textContent = `$${total.toFixed(2)}`;
   document.getElementById('ticket-impresion-pago').textContent = `$${pagoRecibido.toFixed(2)}`;
   document.getElementById('ticket-impresion-cambio').textContent = `$${cambio.toFixed(2)}`;

   // Método de pago
   const metodoPago = document.getElementById('salida-metodo-pago').value;
   let metodoTexto = '';
   switch(metodoPago) {
     case 'efectivo': metodoTexto = 'Pago en efectivo'; break;
     case 'tarjeta': metodoTexto = 'Pago con tarjeta'; break;
     case 'transferencia': metodoTexto = 'Transferencia bancaria'; break;
     default: metodoTexto = 'Otro método de pago';
   }
   document.getElementById('metodo-pago-ticket').textContent = metodoTexto;

   return ticketImpression;
 }

 // Función para imprimir el ticket
 function imprimirTicket() {
   if (productosSalida.length === 0) {
     mostrarNotificacion('No hay productos en el ticket', 'error');
     return;
   }

   // Preparar el ticket
   const ticket = prepararTicketParaImpresion();

   // Mostrar el ticket y ocultar otros elementos
   ticket.style.display = 'block';

   // Imprimir
   window.print();

   // Ocultar el ticket después de imprimir
   setTimeout(() => {
     ticket.style.display = 'none';
   }, 500);
 }
 
 async function registrarSalida() {
   // Get payment method and amount received
   const metodoPago = document.getElementById("salida-metodo-pago").value;
   const pagoRecibido = parseFloat(document.getElementById("salida-pago-recibido").value) || 0;

   // Validate there are products
   if (productosSalida.length === 0) {
     mostrarNotificacion("No hay productos en el ticket", 'error');
     return;
   }

   // Validate payment for cash transactions
   if (metodoPago === 'efectivo') {
     const total = productosSalida.reduce((sum, p) => sum + (p.cantidad * p.precioDeVenta), 0);
     if (pagoRecibido < total) {
       mostrarNotificacion(`El pago recibido ($${pagoRecibido.toFixed(2)}) es menor que el total ($${total.toFixed(2)})`, 'error');
       return;
     }
   }

   try {
     const idSucursal = parseInt(localStorage.getItem("idSucursal") || 1);
     const cliente = document.getElementById("salida-cliente").value;
     const fecha = new Date().toISOString();
     
     // Calculate payment per product (proportional for cash)
     const total = productosSalida.reduce((sum, p) => sum + (p.cantidad * p.precioDeVenta), 0);
     const pagoPorProducto = metodoPago === 'efectivo' ? 
       (pagoRecibido / total) : 1;
     
     // Register each product
     for (const producto of productosSalida) {
       const salidaData = {
         idProducto: producto.idProducto,
         idSucursal: idSucursal,
         cantidad: producto.cantidad,
         precioDeVenta: producto.precioDeVenta,
         pagoRecibido: producto.precioDeVenta * producto.cantidad * pagoPorProducto,
         metodoDePago: metodoPago,
         cliente: cliente || null,
         fecha: fecha
       };
       
       const res = await fetchWithAuth(`${API_URL}/salidas/`, {
         method: "POST",
         body: JSON.stringify(salidaData)
       });
       
       if (!res.ok) throw new Error(`Error al registrar producto ${producto.idProducto}`);
       
       await actualizarStock(idSucursal, producto.idProducto, producto.cantidad, "salida");
     }
     
     mostrarNotificacion("Venta registrada correctamente");
     // Imprimir ticket después de registrar
     imprimirTicket();

     resetearTicketSalida();
     loadSalidas();
   } catch (error) {
     console.error("Error al registrar salida:", error);
     mostrarNotificacion("Error al registrar la venta: " + error.message, 'error');
   }
 }
 
 // Actualizar stock
 async function actualizarStock(idSucursal, idProducto, cantidad, tipo) {
   try {
     const ajuste = tipo === "entrada" ? cantidad : -cantidad;
     const payload = {
       idSucursal,
       idProducto,
       cantidad: ajuste
     };
     
     const res = await fetchWithAuth(`${API_URL}/inventarios/actualizar_stock`, {
       method: "PUT",
       body: JSON.stringify(payload)
     });
     
     if (!res.ok) throw new Error("Error al actualizar el stock");
   } catch (error) {
     console.error("Error al actualizar stock:", error);
     throw error;
   }
 }
 
 // Cancelar salida
 function cancelarSalida() {
   if (confirm("¿Está seguro de cancelar esta venta? Se perderán todos los productos del ticket.")) {
     resetearTicketSalida();
   }
 }
 
 // Resetear ticket de salida
 function resetearTicketSalida() {
   productosSalida = [];
   document.getElementById("salida-metodo-pago").value = "efectivo";
   document.getElementById("salida-pago-recibido").value = "";
   document.getElementById("salida-cliente").value = "";
   document.getElementById("infoProducto").style.display = "none";
   actualizarTicketSalida();
   ocultarTicketSalida();
   document.getElementById("salida-codigo-barras").focus();
 }

 // Función modificada para cargar salidas
 async function loadSalidas() {
   try {
     const res = await fetchWithAuth(`${API_URL}/salidas/`);
     salidasData = await res.json();
     
     // Formatear fechas correctamente
     salidasData.forEach(salida => {
       salida.fechaFormateada = new Date(salida.fecha).toLocaleDateString('es-MX', {
         day: '2-digit',
         month: '2-digit',
         year: 'numeric',
         hour: '2-digit',
         minute: '2-digit'
       });
     });
     
     filtrarSalidas();
   } catch (error) {
     console.error("Error al cargar salidas:", error);
     mostrarNotificacion("Error al cargar salidas", 'error');
   }
 }

 // Función para filtrar salidas
 function filtrarSalidas() {
   const searchTerm = document.getElementById("busqueda-salidas").value.toLowerCase();
   const metodoPago = document.getElementById("filtro-metodo-pago").value;
   
   filteredSalidas = salidasData.filter(salida => {
     const matchesSearch = 
       salida.idSalida.toString().includes(searchTerm) ||
       (salida.nombreProducto && salida.nombreProducto.toLowerCase().includes(searchTerm)) ||
       (salida.cliente && salida.cliente.toLowerCase().includes(searchTerm));
     
     const matchesMethod = !metodoPago || salida.metodoDePago === metodoPago;
     
     return matchesSearch && matchesMethod;
   });
   
   currentPage = 1;
   renderSalidas();
   renderPagination();
 }

 // Función para renderizar salidas
 function renderSalidas() {
   const startIndex = (currentPage - 1) * itemsPerPage;
   const endIndex = startIndex + itemsPerPage;
   const salidasToShow = filteredSalidas.slice(startIndex, endIndex);
   
   const lista = document.getElementById("salidas-list");
   lista.innerHTML = "";
   
   if (filteredSalidas.length === 0) {
     lista.innerHTML = `
       <tr>
         <td colspan="8" class="text-center py-4 text-muted">
           <i class="fas fa-inbox fa-2x mb-3"></i>
           <p>No se encontraron salidas</p>
         </td>
       </tr>
     `;
     return;
   }
   
   salidasToShow.forEach(salida => {
     const row = document.createElement('tr');
     row.innerHTML = `
       <td>${salida.idSalida}</td>
       <td>${salida.nombreProducto || 'Producto ' + salida.idProducto}</td>
       <td>${salida.cantidad}</td>
       <td>$${salida.precioDeVenta.toFixed(2)}</td>
       <td>${salida.fechaFormateada}</td>
       <td><span class="badge ${getBadgeClass(salida.metodoDePago)}">${salida.metodoDePago}</span></td>
       <td>${salida.cliente || '-'}</td>
       <td>
         <button onclick="eliminarSalida(${salida.idSalida})" class="btn btn-sm btn-danger hover-scale">
           <i class="fas fa-trash-alt"></i>
         </button>
         <button onclick="verDetalleSalida(${salida.idSalida})" class="btn btn-sm btn-primary hover-scale ms-2">
           <i class="fas fa-eye"></i>
         </button>
       </td>
     `;
     lista.appendChild(row);
   });
 }

 // Función para renderizar paginación
 function renderPagination() {
   const totalPages = Math.ceil(filteredSalidas.length / itemsPerPage);
   const pagination = document.getElementById("paginacion-salidas");
   pagination.innerHTML = "";
   
   if (totalPages <= 1) return;
   
   // Botón Anterior
   const prevLi = document.createElement('li');
   prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
   prevLi.innerHTML = `
     <a class="page-link" href="#" aria-label="Previous" onclick="changePage(${currentPage - 1})">
       <span aria-hidden="true">&laquo;</span>
     </a>
   `;
   pagination.appendChild(prevLi);
   
   // Páginas
   const startPage = Math.max(1, currentPage - 2);
   const endPage = Math.min(totalPages, currentPage + 2);
   
   for (let i = startPage; i <= endPage; i++) {
     const pageLi = document.createElement('li');
     pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
     pageLi.innerHTML = `
       <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
     `;
     pagination.appendChild(pageLi);
   }
   
   // Botón Siguiente
   const nextLi = document.createElement('li');
   nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
   nextLi.innerHTML = `
     <a class="page-link" href="#" aria-label="Next" onclick="changePage(${currentPage + 1})">
       <span aria-hidden="true">&raquo;</span>
     </a>
   `;
   pagination.appendChild(nextLi);
 }

 // Función para cambiar de página
 function changePage(page) {
   currentPage = page;
   renderSalidas();
   renderPagination();
   window.scrollTo({ top: document.getElementById("salidas-list").offsetTop - 20, behavior: 'smooth' });
 }

 // Función para obtener clase de badge según método de pago
 function getBadgeClass(metodoPago) {
   switch(metodoPago) {
     case 'efectivo': return 'bg-success';
     case 'tarjeta': return 'bg-primary';
     case 'transferencia': return 'bg-info';
     default: return 'bg-secondary';
   }
 }

 // Función para ver detalle de salida
 function verDetalleSalida(idSalida) {
   const salida = salidasData.find(s => s.idSalida === idSalida);
   if (salida) {
     // Implementa un modal o vista de detalle aquí
     alert(`Detalle de salida ${idSalida}\nProducto: ${salida.nombreProducto}\nCantidad: ${salida.cantidad}\nTotal: $${salida.precioDeVenta * salida.cantidad}`);
   }
 }
 
 // Eliminar salida
 async function eliminarSalida(idSalida) {
   if (!confirm("¿Estás seguro de eliminar esta salida?")) return;
   
   try {
     const res = await fetchWithAuth(`${API_URL}/salidas/${idSalida}`, { method: "DELETE" });
     
     if (!res.ok) throw new Error("Error al eliminar salida");
     
     mostrarNotificacion("Salida eliminada correctamente");
     loadSalidas();
   } catch (error) {
     console.error("Error al eliminar salida:", error);
     mostrarNotificacion("Error al eliminar salida", 'error');
   }
 }
 
 // Inicialización
 document.addEventListener("DOMContentLoaded", () => {
   // Configurar evento para calcular cambio en salidas
   document.getElementById("salida-pago-recibido").addEventListener('input', () => {
     actualizarTicketSalida();
   });
   
   // Configurar evento para Enter en código de barras de salidas
   document.getElementById("salida-codigo-barras").addEventListener('keypress', (e) => {
     if (e.key === 'Enter') {
       buscarProductoPorCodigo();
     }
   });
   
   // Configurar evento para Enter en búsqueda de salidas
   document.getElementById("busqueda-salidas").addEventListener('keypress', (e) => {
     if (e.key === 'Enter') filtrarSalidas();
   });
   
   // Cargar historial al inicio
   loadSalidas();
 });