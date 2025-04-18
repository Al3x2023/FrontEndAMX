 // Configuración
 const API_URL = "http://192.168.1.75:8000";
 const PRODUCTOS_URL = `${API_URL}/productos`;
 const CATEGORIAS_URL = `${API_URL}/categorias`;
 
 // Variables globales
 let productos = [];
 let categorias = [];

 document.addEventListener("DOMContentLoaded", () => {
   // Cargar categorías y productos
   Promise.all([cargarCategorias(), cargarProductos()]);
   
   // Configurar eventos
   document.getElementById('btnFiltrar').addEventListener('click', filtrarProductos);
   document.getElementById('buscarProducto').addEventListener('keyup', filtrarProductos);
   document.getElementById('filtrarCategoria').addEventListener('change', filtrarProductos);
   document.getElementById('productoForm').addEventListener('submit', guardarProducto);
   document.getElementById('btnToggleForm').addEventListener('click', toggleFormulario);
 });

 // Función para mostrar notificación
 function mostrarNotificacion(mensaje, tipo = 'success') {
   const notification = document.getElementById('notification');
   notification.innerHTML = `
     <i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
     ${mensaje}
   `;
   notification.className = `notification ${tipo} show`;
   
   setTimeout(() => {
     notification.classList.remove('show');
   }, 3000);
 }

 // Función para realizar peticiones con token de autenticación
 function fetchWithAuth(url, options = {}) {
   const token = localStorage.getItem("access_token");
   const headers = {
     ...options.headers,
     "Content-Type": "application/json",
     "Authorization": `Bearer ${token}`
   };
   return fetch(url, { ...options, headers });
 }

 // Alternar visibilidad del formulario
 function toggleFormulario() {
   const formContainer = document.getElementById('productoFormContainer');
   const btnToggle = document.getElementById('btnToggleForm');
   
   if (formContainer.style.display === 'none') {
     formContainer.style.display = 'block';
     btnToggle.innerHTML = '<i class="fas fa-chevron-up me-1"></i> Ocultar';
   } else {
     formContainer.style.display = 'none';
     btnToggle.innerHTML = '<i class="fas fa-chevron-down me-1"></i> Mostrar';
   }
 }

 // Cargar categorías desde la API
 function cargarCategorias() {
   return fetchWithAuth(CATEGORIAS_URL)
     .then(response => {
       if (!response.ok) throw new Error("Error al cargar categorías");
       return response.json();
     })
     .then(data => {
       categorias = data;
       
       // Llenar select de categorías en el formulario
       const selectCategoria = document.getElementById('idCategoria');
       const selectFiltrar = document.getElementById('filtrarCategoria');
       
       // Limpiar selects
       selectCategoria.innerHTML = '<option value="">Seleccionar Categoría...</option>';
       selectFiltrar.innerHTML = '<option value="">Todas las Categorías</option>';
       
       // Agregar categorías
       data.forEach(categoria => {
         const option = document.createElement('option');
         option.value = categoria.idCategoria;
         option.textContent = categoria.nombreCategoria;
         
         selectCategoria.appendChild(option.cloneNode(true));
         selectFiltrar.appendChild(option);
       });
     })
     .catch(error => {
       console.error("Error al cargar categorías:", error);
       mostrarNotificacion("Error al cargar categorías", "error");
     });
 }

 // Cargar productos desde la API
 function cargarProductos() {
   const lista = document.getElementById('listaProductos');
   
   // Mostrar estado de carga
   lista.innerHTML = `
     <li class="product-item">
       <div class="text-center py-3">
         <div class="spinner-border text-primary" role="status">
           <span class="visually-hidden">Cargando...</span>
         </div>
         <p class="mt-2">Cargando productos...</p>
       </div>
     </li>
   `;
   
   return fetchWithAuth(PRODUCTOS_URL)
     .then(response => {
       if (!response.ok) throw new Error("Error al cargar productos");
       return response.json();
     })
     .then(data => {
       productos = data;
       mostrarProductos(data);
       actualizarContador(data.length);
     })
     .catch(error => {
       console.error("Error al cargar productos:", error);
       lista.innerHTML = `
         <li class="product-item">
           <div class="text-center py-3 text-danger">
             <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
             <p>Error al cargar los productos</p>
             <button class="btn btn-sm btn-primary" onclick="cargarProductos()">
               <i class="fas fa-sync-alt me-1"></i>Reintentar
             </button>
           </div>
         </li>
       `;
       mostrarNotificacion("Error al cargar productos", "error");
     });
 }

// Mostrar productos en la lista
function mostrarProductos(productosMostrar) {
const lista = document.getElementById('listaProductos');

if (productosMostrar.length === 0) {
 lista.innerHTML = `
   <li class="product-item">
     <div class="text-center py-3">
       <i class="fas fa-box-open fa-2x text-muted mb-3"></i>
       <p>No se encontraron productos</p>
     </div>
   </li>
 `;
 return;
}

lista.innerHTML = '';

productosMostrar.forEach(producto => {
 const li = document.createElement('li');
 li.className = 'product-item';
 
 // Obtener nombre de categoría
 const categoria = categorias.find(c => c.idCategoria === producto.idCategoria) || {};
 
 // Manejo seguro del precio
 let precioFormateado = '0.00';
 try {
   // Convertir a número y formatear
   const precio = parseFloat(producto.precioVenta);
   if (!isNaN(precio)) {
     precioFormateado = precio.toFixed(2);
   }
 } catch (e) {
   console.warn("Error al formatear precio:", e);
 }
 
 li.innerHTML = `
   <div class="product-header">
     <h3 class="product-name">${producto.nombreDelProducto}</h3>
     <span class="product-code">${producto.codigoBarras || 'Sin código'}</span>
   </div>
   
   <div class="product-details">
     <div class="product-detail">
       <i class="fas fa-tag"></i>
       <span>${categoria.nombreCategoria || 'Sin categoría'}</span>
     </div>
     
     <div class="product-detail">
       <i class="fas fa-dollar-sign"></i>
       <span>$${precioFormateado}</span>
     </div>
     
     <div class="product-detail">
       <i class="fas fa-box"></i>
       <span>${producto.presentacion || 'Sin presentación'}</span>
     </div>
     
     <div class="product-detail">
       <i class="fas fa-ruler"></i>
       <span>${producto.unidadDeMedida || 'Sin unidad'}</span>
     </div>
   </div>
   
   <div class="product-actions">
     <button class="btn btn-sm btn-primary" onclick="editarProducto(${producto.idProducto})">
       <i class="fas fa-edit me-1"></i>Editar
     </button>
     <button class="btn btn-sm btn-danger" onclick="eliminarProducto(${producto.idProducto}, '${producto.nombreDelProducto}')">
       <i class="fas fa-trash me-1"></i>Eliminar
     </button>
   </div>
 `;
 
 lista.appendChild(li);
});
}
 // Actualizar contador de productos
 function actualizarContador(cantidad) {
   document.getElementById('contadorProductos').textContent = `${cantidad} ${cantidad === 1 ? 'producto' : 'productos'}`;
 }

 // Filtrar productos
 function filtrarProductos() {
   const busqueda = document.getElementById('buscarProducto').value.toLowerCase();
   const idCategoria = document.getElementById('filtrarCategoria').value;
   
   let productosFiltrados = productos;
   
   // Filtrar por categoría
   if (idCategoria) {
     productosFiltrados = productosFiltrados.filter(p => p.idCategoria == idCategoria);
   }
   
   // Filtrar por búsqueda
   if (busqueda) {
     productosFiltrados = productosFiltrados.filter(p => 
       (p.codigoBarras && p.codigoBarras.toLowerCase().includes(busqueda)) ||
       p.nombreDelProducto.toLowerCase().includes(busqueda)
     );
   }
   
   mostrarProductos(productosFiltrados);
   actualizarContador(productosFiltrados.length);
 }

 // Guardar producto (crear o actualizar)
 function guardarProducto(e) {
   e.preventDefault();
   
   const btnSubmit = e.target.querySelector('button[type="submit"]');
   btnSubmit.disabled = true;
   btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
   
   const productoData = {
     idCategoria: parseInt(document.getElementById('idCategoria').value),
     nombreDelProducto: document.getElementById('nombreDelProducto').value.trim(),
     codigoBarras: document.getElementById('codigoBarras').value.trim() || null,
     codigoQR: document.getElementById('codigoQR').value.trim() || null,
     precioVenta: parseFloat(document.getElementById('precioVenta').value),
     presentacion: document.getElementById('presentacion').value || null,
     unidadDeMedida: document.getElementById('unidadDeMedida').value || null
   };
   
   // Validaciones
   if (!productoData.idCategoria || !productoData.nombreDelProducto || isNaN(productoData.precioVenta)) {
     mostrarNotificacion("Categoría, nombre y precio son campos requeridos", "error");
     btnSubmit.disabled = false;
     btnSubmit.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Producto';
     return;
   }
   
   fetchWithAuth(PRODUCTOS_URL, {
     method: "POST",
     body: JSON.stringify(productoData)
   })
     .then(response => {
       if (!response.ok) {
         return response.json().then(err => {
           throw new Error(err.detail || "Error al guardar producto");
         });
       }
       return response.json();
     })
     .then(data => {
       mostrarNotificacion("Producto guardado con éxito");
       document.getElementById('productoForm').reset();
       cargarProductos();
     })
     .catch(error => {
       console.error("Error al guardar producto:", error);
       mostrarNotificacion(error.message || "Error al guardar producto", "error");
     })
     .finally(() => {
       btnSubmit.disabled = false;
       btnSubmit.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Producto';
     });
 }

 // Editar producto (placeholder)
 function editarProducto(idProducto) {
   mostrarNotificacion(`Función de edición para producto ID: ${idProducto}`, "info");
 }

 // Eliminar producto
 function eliminarProducto(idProducto, nombreProducto) {
   if (!confirm(`¿Estás seguro de que deseas eliminar el producto "${nombreProducto}"? Esta acción no se puede deshacer.`)) {
     return;
   }
   
   fetchWithAuth(`${PRODUCTOS_URL}/${idProducto}`, {
     method: "DELETE"
   })
     .then(response => {
       if (!response.ok) {
         return response.json().then(err => {
           throw new Error(err.detail || "Error al eliminar producto");
         });
       }
       return response.json();
     })
     .then(data => {
       mostrarNotificacion("Producto eliminado con éxito");
       cargarProductos();
     })
     .catch(error => {
       console.error("Error al eliminar producto:", error);
       mostrarNotificacion(error.message || "Error al eliminar producto", "error");
     });
 }