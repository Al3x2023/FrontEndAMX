// Configuración de la API - cambia esta URL por la de tu backend
const API_URL = "http://localhost:8000";
        
// Variables globales
let productosEntrada = [];

// Mostrar notificación mejorada
function mostrarNotificacion(mensaje, tipo = 'success') {
  const notification = document.getElementById('notification');
  notification.textContent = mensaje;
  notification.style.backgroundColor = tipo === 'success' ? 'var(--success)' : 'var(--danger)';
  notification.style.display = 'block';
  
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => {
      notification.style.display = 'none';
      notification.style.animation = 'slideIn 0.3s ease-out';
    }, 300);
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

/* ========== FUNCIONALIDAD PARA ENTRADAS ========== */

// Escanear código de barras en entradas
document.getElementById("entrada-codigo-barras").addEventListener("keypress", async function(e) {
  if (e.key === 'Enter') {
    const codigo = this.value.trim();
    if (codigo) {
      await buscarProductoParaEntrada(codigo);
      this.value = '';
    }
  }
});

// Buscar producto para entrada
async function buscarProductoParaEntrada(codigo) {
  try {
    const response = await fetchWithAuth(`${API_URL}/productos/`);
    const productos = await response.json();
    
    let producto = productos.find(p => String(p.codigoBarras) === codigo);
    
    if (!producto) {
      if (confirm("Producto no encontrado. ¿Desea agregarlo manualmente?")) {
        agregarProductoManual(codigo);
      }
      return;
    }
    
    const productoExistente = productosEntrada.find(p => p.idProducto === producto.idProducto);
    
    if (productoExistente) {
      productoExistente.cantidad += 1;
    } else {
      productosEntrada.push({
        idProducto: producto.idProducto,
        codigoBarras: producto.codigoBarras,
        nombre: producto.nombreDelProducto,
        cantidad: 1,
        precioDeCompra: producto.precioCompra || 0
      });
    }
    
    actualizarTicketEntrada();
    mostrarTicketEntrada();
  } catch (error) {
    console.error("Error al buscar producto:", error);
    mostrarNotificacion("Error al buscar el producto", 'error');
  }
}

// Agregar producto manualmente a entrada
function agregarProductoManual(codigo = '') {
  const nombre = prompt("Nombre del producto:", codigo ? `Producto ${codigo}` : "");
  if (!nombre) return;
  
  const cantidad = parseInt(prompt("Cantidad:", "1"));
  if (isNaN(cantidad)) {
    mostrarNotificacion("Cantidad inválida", 'error');
    return;
  }
  
  const precio = parseFloat(prompt("Precio de compra:", "0.00"));
  if (isNaN(precio)) {
    mostrarNotificacion("Precio inválido", 'error');
    return;
  }
  
  productosEntrada.push({
    idProducto: codigo || `temp-${Date.now()}`,
    codigoBarras: codigo || '',
    nombre: nombre,
    cantidad: cantidad,
    precioDeCompra: precio
  });
  
  actualizarTicketEntrada();
  mostrarTicketEntrada();
}

// Actualizar ticket de entrada
function actualizarTicketEntrada() {
  const tbody = document.getElementById("ticket-productos-body");
  tbody.innerHTML = '';
  
  productosEntrada.forEach((producto, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${producto.codigoBarras || 'N/A'}</td>
      <td>${producto.nombre}</td>
      <td>
        <input type="number" class="form-control cantidad-input" value="${producto.cantidad}" 
               min="1" data-index="${index}" onchange="actualizarCantidadEntrada(this)">
      </td>
      <td>
        <input type="number" class="form-control precio-input" value="${producto.precioDeCompra.toFixed(2)}" 
               step="0.01" min="0" data-index="${index}" onchange="actualizarPrecioEntrada(this)">
      </td>
      <td>$${(producto.cantidad * producto.precioDeCompra).toFixed(2)}</td>
      <td>
        <button onclick="eliminarProductoEntrada(${index})" class="btn btn-sm btn-danger hover-scale">
          <i class="fas fa-trash-alt me-1"></i>Eliminar
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
  
  const total = productosEntrada.reduce((sum, producto) => sum + (producto.cantidad * producto.precioDeCompra), 0);
  document.getElementById("ticket-total").textContent = `$${total.toFixed(2)}`;
}

// Mostrar/ocultar ticket de entrada
function mostrarTicketEntrada() {
  if (productosEntrada.length > 0) {
    document.getElementById("ticket-entrada").style.display = 'block';
  }
}

function ocultarTicketEntrada() {
  document.getElementById("ticket-entrada").style.display = 'none';
}

// Actualizar cantidad en entrada
function actualizarCantidadEntrada(input) {
  const index = input.getAttribute('data-index');
  const nuevaCantidad = parseInt(input.value);
  
  if (nuevaCantidad > 0) {
    productosEntrada[index].cantidad = nuevaCantidad;
    actualizarTicketEntrada();
  } else {
    input.value = productosEntrada[index].cantidad;
  }
}

// Actualizar precio en entrada
function actualizarPrecioEntrada(input) {
  const index = input.getAttribute('data-index');
  const nuevoPrecio = parseFloat(input.value);
  
  if (nuevoPrecio >= 0) {
    productosEntrada[index].precioDeCompra = nuevoPrecio;
    actualizarTicketEntrada();
  } else {
    input.value = productosEntrada[index].precioDeCompra.toFixed(2);
  }
}

// Eliminar producto de entrada
function eliminarProductoEntrada(index) {
  productosEntrada.splice(index, 1);
  actualizarTicketEntrada();
  
  if (productosEntrada.length === 0) {
    ocultarTicketEntrada();
  }
}

// Registrar entrada
async function registrarEntrada() {
  if (productosEntrada.length === 0) {
    mostrarNotificacion("No hay productos en el ticket", 'error');
    return;
  }
  
  const proveedor = document.getElementById("ticket-proveedor").value;
  const idProveedor = proveedor.match(/ID:\s*(\d+)/) ? parseInt(proveedor.match(/ID:\s*(\d+)/)[1]) : null;
  
  if (!idProveedor) {
    mostrarNotificacion("Seleccione un proveedor válido", 'error');
    return;
  }
  
  const idSucursal = localStorage.getItem("idSucursal") || 1;
  const notas = document.getElementById("ticket-notas").value;
  
  try {
    for (const producto of productosEntrada) {
      const entradaData = {
        idProducto: producto.idProducto,
        idSucursal: parseInt(idSucursal),
        idProveedor: idProveedor,
        cantidad: producto.cantidad,
        precioDeCompra: producto.precioDeCompra,
        notas: notas
      };
      
      const res = await fetchWithAuth(`${API_URL}/entradas/`, {
        method: "POST",
        body: JSON.stringify(entradaData)
      });
      
      if (!res.ok) throw new Error(`Error al registrar entrada para producto ${producto.idProducto}`);
      
      await actualizarStock(idSucursal, producto.idProducto, producto.cantidad, "entrada");
    }
    
    mostrarNotificacion("Entrada registrada correctamente");
    resetearTicketEntrada();
    loadEntradas();
  } catch (error) {
    console.error("Error al registrar entrada:", error);
    mostrarNotificacion("Error al registrar la entrada: " + error.message, 'error');
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

// Cancelar entrada
function cancelarEntrada() {
  if (confirm("¿Está seguro de cancelar esta entrada? Se perderán todos los productos del ticket.")) {
    resetearTicketEntrada();
  }
}

// Resetear ticket de entrada
function resetearTicketEntrada() {
  productosEntrada = [];
  document.getElementById("ticket-proveedor").value = "";
  document.getElementById("ticket-notas").value = "";
  actualizarTicketEntrada();
  ocultarTicketEntrada();
  document.getElementById("entrada-codigo-barras").focus();
}

// Cargar historial de entradas
async function loadEntradas() {
  try {
    const res = await fetchWithAuth(`${API_URL}/entradas/`);
    const entradas = await res.json();
    const lista = document.getElementById("entradas-list");
    lista.innerHTML = "";
    
    entradas.forEach(entrada => {
      const li = document.createElement('li');
      li.className = 'd-flex justify-content-between align-items-center';
      li.innerHTML = `
        <div>
          <span class="badge bg-primary me-2">ID: ${entrada.idEntrada}</span>
          <strong>${entrada.nombreProducto || 'Producto ' + entrada.idProducto}</strong>
          <div class="text-muted small mt-1">
            <span class="me-3"><i class="fas fa-box me-1"></i> ${entrada.cantidad} unidades</span>
            <span class="me-3"><i class="fas fa-dollar-sign me-1"></i> $${entrada.precioDeCompra.toFixed(2)}</span>
            <span><i class="fas fa-calendar-alt me-1"></i> ${new Date(entrada.fechaEntrada).toLocaleDateString()}</span>
          </div>
        </div>
        <button onclick="eliminarEntrada(${entrada.idEntrada})" class="btn btn-sm btn-danger hover-scale">
          <i class="fas fa-trash-alt"></i>
        </button>
      `;
      lista.appendChild(li);
    });
  } catch (error) {
    console.error("Error al cargar entradas:", error);
    mostrarNotificacion("Error al cargar entradas", 'error');
  }
}

// Eliminar entrada
async function eliminarEntrada(idEntrada) {
  if (!confirm("¿Estás seguro de eliminar esta entrada?")) return;
  
  try {
    const res = await fetchWithAuth(`${API_URL}/entradas/${idEntrada}`, { method: "DELETE" });
    
    if (!res.ok) throw new Error("Error al eliminar entrada");
    
    mostrarNotificacion("Entrada eliminada correctamente");
    loadEntradas();
  } catch (error) {
    console.error("Error al eliminar entrada:", error);
    mostrarNotificacion("Error al eliminar entrada", 'error');
  }
}

// Poblar lista de proveedores
async function poblarListaProveedores() {
  try {
    const res = await fetchWithAuth(`${API_URL}/proveedores/`);
    const proveedores = await res.json();
    const listaProveedores = document.getElementById("lista-proveedores");
    listaProveedores.innerHTML = "";
    
    proveedores.forEach(proveedor => {
      const option = document.createElement('option');
      option.value = `${proveedor.nombre} (ID: ${proveedor.idProveedor})`;
      listaProveedores.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar proveedores:", error);
  }
}

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  poblarListaProveedores();
  loadEntradas();
});