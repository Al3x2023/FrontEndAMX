 // Constante para la URL base
 const API_BASE_URL = "http://192.168.1.75:8000/categorias";
    
 document.addEventListener("DOMContentLoaded", () => {
     loadCategorias();
     document.getElementById("categoriaForm").addEventListener("submit", (event) => {
         event.preventDefault();
         if (document.getElementById("categoriaId").value) {
             updateCategoria();
         } else {
             agregarCategoria();
         }
     });
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

 // Función para cargar las categorías desde el backend
 async function loadCategorias() {
     try {
         const response = await fetch(API_BASE_URL + "/", {
             method: "GET",
             headers: {
                 "Authorization": `Bearer ${localStorage.getItem("access_token")}`
             }
         });

         if (!response.ok) throw new Error("Error al cargar las categorías");

         const categorias = await response.json();
         displayCategorias(categorias);
     } catch (error) {
         mostrarNotificacion("Error al cargar las categorías", "error");
         console.error("Error al cargar las categorías:", error);
     }
 }

 // Función para mostrar las categorías en la lista
 function displayCategorias(categorias) {
     const lista = document.getElementById("listaCategorias");
     lista.innerHTML = "";

     if (categorias.length === 0) {
         lista.innerHTML = '<div class="text-center py-3 text-muted">No hay categorías registradas</div>';
         return;
     }

     categorias.forEach(categoria => {
         const li = document.createElement("li");
         li.innerHTML = `
             <strong>${categoria.categoria}</strong>
             <p>${categoria.descripcion || "Sin descripción"}</p>
             <div class="action-buttons">
               <button class="btn btn-sm btn-warning" onclick="editCategoria(${categoria.idCategoria})">
                 <i class="fas fa-edit me-1"></i>Editar
               </button>
               <button class="btn btn-sm btn-danger" onclick="eliminarCategoria(${categoria.idCategoria})">
                 <i class="fas fa-trash me-1"></i>Eliminar
               </button>
             </div>
         `;
         lista.appendChild(li);
     });
 }

 // Función para agregar una nueva categoría
 async function agregarCategoria() {
     const categoria = document.getElementById("categoria").value;
     const descripcion = document.getElementById("descripcion").value;

     try {
         const response = await fetch(API_BASE_URL + "/", {
             method: "POST",
             headers: {
                 "Content-Type": "application/json",
                 "Authorization": `Bearer ${localStorage.getItem("access_token")}`
             },
             body: JSON.stringify({ categoria, descripcion })
         });

         if (!response.ok) throw new Error("Error al agregar la categoría");

         mostrarNotificacion("Categoría agregada correctamente");
         loadCategorias();
         document.getElementById("categoriaForm").reset();
     } catch (error) {
         mostrarNotificacion("Error al agregar la categoría", "error");
         console.error("Error al agregar la categoría:", error);
     }
 }

 // Función para editar una categoría
 async function editCategoria(idCategoria) {
     try {
         const response = await fetch(`${API_BASE_URL}/${idCategoria}`, {
             method: "GET",
             headers: {
                 "Authorization": `Bearer ${localStorage.getItem("access_token")}`
             }
         });

         if (!response.ok) throw new Error("Error al obtener la categoría");

         const categoria = await response.json();
         document.getElementById("categoriaId").value = categoria.idCategoria;
         document.getElementById("categoria").value = categoria.categoria;
         document.getElementById("descripcion").value = categoria.descripcion;
         
         // Scroll al formulario
         document.getElementById("categoriaForm").scrollIntoView({ behavior: 'smooth' });
         document.getElementById("categoria").focus();
         
         mostrarNotificacion("Categoría cargada para edición");
     } catch (error) {
         mostrarNotificacion("Error al editar la categoría", "error");
         console.error("Error al editar la categoría:", error);
     }
 }

 // Función para actualizar una categoría
 async function updateCategoria() {
     const idCategoria = document.getElementById("categoriaId").value;
     const categoria = document.getElementById("categoria").value;
     const descripcion = document.getElementById("descripcion").value;

     try {
         const response = await fetch(`${API_BASE_URL}/${idCategoria}`, {
             method: "PUT",
             headers: {
                 "Content-Type": "application/json",
                 "Authorization": `Bearer ${localStorage.getItem("access_token")}`
             },
             body: JSON.stringify({ categoria, descripcion })
         });

         if (!response.ok) throw new Error("Error al actualizar la categoría");

         mostrarNotificacion("Categoría actualizada correctamente");
         loadCategorias();
         document.getElementById("categoriaForm").reset();
     } catch (error) {
         mostrarNotificacion("Error al actualizar la categoría", "error");
         console.error("Error al actualizar la categoría:", error);
     }
 }

 // Función para eliminar una categoría
 async function eliminarCategoria(idCategoria) {
     if (!confirm("¿Estás seguro de eliminar esta categoría?")) return;

     try {
         const response = await fetch(`${API_BASE_URL}/${idCategoria}`, {
             method: "DELETE",
             headers: {
                 "Authorization": `Bearer ${localStorage.getItem("access_token")}`
             }
         });

         if (!response.ok) throw new Error("Error al eliminar la categoría");

         mostrarNotificacion("Categoría eliminada correctamente");
         loadCategorias();
     } catch (error) {
         mostrarNotificacion("Error al eliminar la categoría", "error");
         console.error("Error al eliminar la categoría:", error);
     }
 }