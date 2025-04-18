  // Configuración
  const API_URL = "http://192.168.1.75:8000";
  const USUARIOS_URL = `${API_URL}/usuarios`;
  const SUCURSALES_URL = `${API_URL}/sucursales`;
  
  // Variables globales
  let usuarioEditando = null;
  let idSucursalActual = null;
  let nombreSucursalActual = "No asignada";
  let usuarioActual = null;

  document.addEventListener("DOMContentLoaded", () => {
      // Obtener datos del usuario actual
      usuarioActual = JSON.parse(localStorage.getItem("user"));
      idSucursalActual = localStorage.getItem("idSucursal");
      
      // Cargar el nombre de la sucursal actual
      if (idSucursalActual) {
          cargarNombreSucursal(idSucursalActual);
          document.getElementById("idSucursalUsuario").value = idSucursalActual;
      } else {
          document.getElementById("nombreSucursalActual").textContent = "No asignada";
      }
      
      // Cargar la lista de usuarios
      cargarUsuarios();
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

  // Función para cargar el nombre de la sucursal actual
  function cargarNombreSucursal(idSucursal) {
      fetchWithAuth(`${SUCURSALES_URL}/${idSucursal}`)
          .then(response => {
              if (!response.ok) throw new Error("Error al cargar la sucursal");
              return response.json();
          })
          .then(sucursal => {
              nombreSucursalActual = sucursal.nombreDeLaSucursal || "Sucursal actual";
              document.getElementById("nombreSucursalActual").textContent = nombreSucursalActual;
          })
          .catch(error => {
              console.error("Error al cargar sucursal:", error);
              document.getElementById("nombreSucursalActual").textContent = "Sucursal actual";
          });
  }

  // Mostrar formulario para crear usuario
  function mostrarFormularioCrearUsuario() {
      const formulario = document.getElementById("formulario-usuario");
      formulario.style.display = "block";
      
      // Limpiar campos
      document.getElementById("nombreUsuario").value = "";
      document.getElementById("correoUsuario").value = "";
      document.getElementById("rolUsuario").value = "usuario";
      document.getElementById("contrasenaUsuario").value = "";
      
      // Desplazarse al formulario
      formulario.scrollIntoView({ behavior: 'smooth' });
  }

  // Alternar visibilidad de contraseña
  function togglePassword(id) {
      const input = document.getElementById(id);
      const icon = input.nextElementSibling.querySelector('i');
      
      if (input.type === "password") {
          input.type = "text";
          icon.classList.remove("fa-eye");
          icon.classList.add("fa-eye-slash");
      } else {
          input.type = "password";
          icon.classList.remove("fa-eye-slash");
          icon.classList.add("fa-eye");
      }
  }

  // Crear un nuevo usuario
// Crear un nuevo usuario
function crearUsuario() {
const btnCrear = document.getElementById("btnCrearUsuario");
btnCrear.disabled = true;
btnCrear.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creando...';

const nombre = document.getElementById("nombreUsuario").value.trim();
const correo = document.getElementById("correoUsuario").value.trim();
const rol = document.getElementById("rolUsuario").value;
const contrasena = document.getElementById("contrasenaUsuario").value;
const idSucursal = document.getElementById("idSucursalUsuario").value;

// Validaciones básicas
if (!nombre || !correo || !contrasena) {
  mostrarNotificacion("Nombre, correo y contraseña son campos requeridos", "error");
  btnCrear.disabled = false;
  btnCrear.innerHTML = '<i class="fas fa-save me-2"></i>Crear Usuario';
  return;
}

if (contrasena.length < 6) {
  mostrarNotificacion("La contraseña debe tener al menos 6 caracteres", "error");
  btnCrear.disabled = false;
  btnCrear.innerHTML = '<i class="fas fa-save me-2"></i>Crear Usuario';
  return;
}

// Datos del usuario a crear
const usuarioData = {
  nombre: nombre,
  correoElectronico: correo,
  rol: rol,
  contrasena: contrasena,
  idSucursal: idSucursal ? parseInt(idSucursal) : null
};

fetchWithAuth(USUARIOS_URL, {
  method: "POST",
  body: JSON.stringify(usuarioData)
})
  .then(response => {
      if (!response.ok) {
          return response.json().then(err => {
              // Manejar errores de validación del backend
              let errorMessage = "Error al crear usuario";
              
              // Si el backend devuelve un mensaje de error específico
              if (err.detail) {
                  if (typeof err.detail === 'string') {
                      errorMessage = err.detail;
                  } else if (Array.isArray(err.detail)) {
                      // Si hay múltiples errores de validación
                      errorMessage = err.detail.map(e => e.msg || e.message).join(', ');
                  }
              }
              throw new Error(errorMessage);
          });
      }
      return response.json();
  })
  .then(data => {
      mostrarNotificacion("Usuario creado con éxito");
      document.getElementById("formulario-usuario").style.display = "none";
      cargarUsuarios();
  })
  .catch(error => {
      console.error("Error al crear usuario:", error);
      // Mostrar el mensaje de error real en lugar de [object Object]
      mostrarNotificacion(error.message || "Error desconocido al crear usuario", "error");
  })
  .finally(() => {
      btnCrear.disabled = false;
      btnCrear.innerHTML = '<i class="fas fa-save me-2"></i>Crear Usuario';
  });
}
  // Cargar lista de usuarios filtrados por sucursal
  function cargarUsuarios() {
      const tabla = document.getElementById("tablaUsuarios");
      const tbody = tabla.querySelector("tbody");
      
      // Mostrar estado de carga
      tbody.innerHTML = `
          <tr>
              <td colspan="6" class="text-center py-4">
                  <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Cargando...</span>
                  </div>
                  <p class="mt-2">Cargando usuarios...</p>
              </td>
          </tr>
      `;
      
      // Solo filtrar por sucursal si no es superadmin
      const url = usuarioActual && usuarioActual.rol === "superadmin" ? 
          USUARIOS_URL : 
          `${USUARIOS_URL}?idSucursal=${idSucursalActual}`;
      
      fetchWithAuth(url)
          .then(response => {
              if (!response.ok) throw new Error("Error al cargar usuarios");
              return response.json();
          })
          .then(usuarios => {
              tbody.innerHTML = ""; // Limpiar tabla
              
              if (usuarios.length === 0) {
                  tbody.innerHTML = `
                      <tr>
                          <td colspan="6" class="text-center py-4">
                              <i class="fas fa-user-slash fa-2x text-muted mb-3"></i>
                              <p>No hay usuarios registrados</p>
                          </td>
                      </tr>
                  `;
                  return;
              }
              
              usuarios.forEach(usuario => {
                  const tr = document.createElement("tr");
                  
                  // Obtener nombre de sucursal
                  let nombreSucursal = "No asignada";
                  if (usuario.idSucursal) {
                      nombreSucursal = usuario.nombreSucursal || `Sucursal ${usuario.idSucursal}`;
                  }
                  
                  // Determinar clase del badge según el rol
                  let badgeClass = "badge-primary";
                  if (usuario.rol === "admin") badgeClass = "badge-success";
                  else if (usuario.rol === "cliente") badgeClass = "badge-warning";
                  else if (usuario.rol === "superadmin") badgeClass = "badge-danger";
                  
                  tr.innerHTML = `
                      <td>${usuario.idUsuario}</td>
                      <td>${usuario.nombre}</td>
                      <td>${usuario.correoElectronico}</td>
                      <td><span class="badge ${badgeClass}">${usuario.rol}</span></td>
                      <td>${nombreSucursal}</td>
                      <td>
                          <button class="btn btn-sm btn-primary" onclick="editarUsuario(${usuario.idUsuario})">
                              <i class="fas fa-edit me-1"></i>Editar
                          </button>
                          <button class="btn btn-sm btn-danger" onclick="eliminarUsuario(${usuario.idUsuario}, '${usuario.nombre}')">
                              <i class="fas fa-trash me-1"></i>Eliminar
                          </button>
                      </td>
                  `;
                  tbody.appendChild(tr);
              });
          })
          .catch(error => {
              console.error("Error al cargar usuarios:", error);
              tbody.innerHTML = `
                  <tr>
                      <td colspan="6" class="text-center py-4 text-danger">
                          <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                          <p>Error al cargar los usuarios</p>
                          <button class="btn btn-sm btn-primary" onclick="cargarUsuarios()">
                              <i class="fas fa-sync-alt me-1"></i>Reintentar
                          </button>
                      </td>
                  </tr>
              `;
              mostrarNotificacion("Error al cargar usuarios: " + error.message, "error");
          });
  }

  // Mostrar modal para editar usuario
  function editarUsuario(idUsuario) {
      fetchWithAuth(`${USUARIOS_URL}/${idUsuario}`)
          .then(response => {
              if (!response.ok) throw new Error("Error al cargar usuario");
              return response.json();
          })
          .then(usuario => {
              usuarioEditando = usuario;
              
              // Llenar formulario de edición
              document.getElementById("editarIdUsuario").value = usuario.idUsuario;
              document.getElementById("editarNombre").value = usuario.nombre || "";
              document.getElementById("editarCorreo").value = usuario.correoElectronico || "";
              document.getElementById("editarRol").value = usuario.rol || "usuario";
              
              // Mostrar modal
              const modal = new bootstrap.Modal(document.getElementById('editarUsuarioModal'));
              modal.show();
          })
          .catch(error => {
              console.error("Error al cargar usuario:", error);
              mostrarNotificacion("Error al cargar usuario: " + error.message, "error");
          });
  }

  // Guardar cambios al editar usuario
  function guardarEdicionUsuario() {
      const idUsuario = document.getElementById("editarIdUsuario").value;
      const nombre = document.getElementById("editarNombre").value.trim();
      const correo = document.getElementById("editarCorreo").value.trim();
      const rol = document.getElementById("editarRol").value;
      
      if (!nombre || !correo) {
          mostrarNotificacion("Nombre y correo son campos requeridos", "error");
          return;
      }
      
      const usuarioData = {
          nombre: nombre,
          correoElectronico: correo,
          rol: rol,
          idSucursal: usuarioEditando.idSucursal // Mantener la misma sucursal
      };
      
      const btnGuardar = document.getElementById("btnGuardarEdicion");
      btnGuardar.disabled = true;
      btnGuardar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
      
      fetchWithAuth(`${USUARIOS_URL}/${idUsuario}`, {
          method: "PUT",
          body: JSON.stringify(usuarioData)
      })
          .then(response => {
              if (!response.ok) {
                  return response.json().then(err => {
                      throw new Error(err.detail || "Error al actualizar usuario");
                  });
              }
              return response.json();
          })
          .then(data => {
              mostrarNotificacion("Usuario actualizado con éxito");
              cargarUsuarios();
              
              // Cerrar modal
              const modal = bootstrap.Modal.getInstance(document.getElementById('editarUsuarioModal'));
              modal.hide();
          })
          .catch(error => {
              console.error("Error al actualizar usuario:", error);
              mostrarNotificacion("Error al actualizar usuario: " + error.message, "error");
          })
          .finally(() => {
              btnGuardar.disabled = false;
              btnGuardar.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Cambios';
          });
  }

  // Eliminar usuario
  function eliminarUsuario(idUsuario, nombreUsuario) {
      if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${nombreUsuario}"? Esta acción no se puede deshacer.`)) {
          return;
      }
      
      fetchWithAuth(`${USUARIOS_URL}/${idUsuario}`, {
          method: "DELETE"
      })
          .then(response => {
              if (!response.ok) {
                  return response.json().then(err => {
                      throw new Error(err.detail || "Error al eliminar usuario");
                  });
              }
              return response.json();
          })
          .then(data => {
              mostrarNotificacion("Usuario eliminado con éxito");
              cargarUsuarios();
          })
          .catch(error => {
              console.error("Error al eliminar usuario:", error);
              mostrarNotificacion("Error al eliminar usuario: " + error.message, "error");
          });
  }