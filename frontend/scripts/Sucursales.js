// Configuración
const API_URL = "http://192.168.1.75:8000";
const SUCURSALES_URL = `${API_URL}/sucursales`;

// Variable global que indica si se está editando una sucursal (objeto) o se creará una nueva (null)
let sucursalEditando = null;

document.addEventListener("DOMContentLoaded", () => {
  loadSucursales();
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

// Muestra el formulario en modo creación (campos vacíos y modo creación)
function mostrarFormularioCrearSucursal() {
  const formulario = document.getElementById("formulario-sucursal");
  formulario.style.display = "block";
  document.getElementById("tituloFormulario").innerHTML = '<i class="fas fa-store me-2"></i>Crear Nueva Sucursal';
  
  // Limpiar campos
  document.getElementById("nombreSucursal").value = "";
  document.getElementById("direccionSucursal").value = "";
  document.getElementById("telefonoMovil").value = "";
  document.getElementById("telefonoFijo").value = "";
  document.getElementById("correoElectronico").value = "";
  document.getElementById("codigoPostal").value = "";
  
  sucursalEditando = null; // Se indica que es modo creación
  
  // Desplazarse al formulario
  formulario.scrollIntoView({ behavior: 'smooth' });
}

// Muestra el formulario en modo edición con los datos de la sucursal recibida
function mostrarFormularioEditarSucursal(sucursal) {
  const formulario = document.getElementById("formulario-sucursal");
  formulario.style.display = "block";
  document.getElementById("tituloFormulario").innerHTML = '<i class="fas fa-edit me-2"></i>Editar Sucursal';
  
  document.getElementById("nombreSucursal").value = sucursal.nombreDeLaSucursal || "";
  document.getElementById("direccionSucursal").value = sucursal.direccion || "";
  document.getElementById("telefonoMovil").value = sucursal.telefonoMovil || "";
  document.getElementById("telefonoFijo").value = sucursal.telefonoFijo || "";
  document.getElementById("correoElectronico").value = sucursal.correoElectronico || "";
  document.getElementById("codigoPostal").value = sucursal.codigoPostal || "";
  
  // Desplazarse al formulario
  formulario.scrollIntoView({ behavior: 'smooth' });
}

// Función que se invoca al presionar "Editar" en alguna sucursal; carga la sucursal y muestra el formulario de edición
function editarSucursal(id) {
  fetchWithAuth(`${SUCURSALES_URL}/${id}`)
    .then(response => {
      if (!response.ok) throw new Error("Error al cargar los datos de la sucursal");
      return response.json();
    })
    .then(sucursal => {
      sucursalEditando = sucursal; // Se guarda la sucursal a editar
      mostrarFormularioEditarSucursal(sucursal);
    })
    .catch(error => {
      console.error("Error:", error);
      mostrarNotificacion("Error al cargar sucursal: " + error.message, "error");
    });
}

// Función que guarda la sucursal (crea o actualiza según el modo)
function guardarSucursal() {
  const nombre = document.getElementById("nombreSucursal").value;
  const direccion = document.getElementById("direccionSucursal").value;
  const telefonoMovil = document.getElementById("telefonoMovil").value;
  const telefonoFijo = document.getElementById("telefonoFijo").value;
  const correoElectronico = document.getElementById("correoElectronico").value;
  const codigoPostal = document.getElementById("codigoPostal").value;
  const idSucursalPadre = localStorage.getItem("idSucursal");

  if (!nombre || !direccion || !correoElectronico) {
    mostrarNotificacion("Nombre, dirección y correo electrónico son campos requeridos", "error");
    return;
  }

  const sucursalData = {
    nombreDeLaSucursal: nombre,
    direccion: direccion,
    telefonoMovil: telefonoMovil || null,
    telefonoFijo: telefonoFijo || null,
    correoElectronico: correoElectronico,
    codigoPostal: codigoPostal || null,
    idSucursalPadre: idSucursalPadre
  };

  if (sucursalEditando) {
    // Modo edición: actualizar la sucursal existente
    fetchWithAuth(`${SUCURSALES_URL}/${sucursalEditando.idSucursal}`, {
      method: "PUT",
      body: JSON.stringify(sucursalData)
    })
      .then(response => {
        if (!response.ok) throw new Error("Error al actualizar sucursal");
        return response.json();
      })
      .then(data => {
        mostrarNotificacion("Sucursal actualizada con éxito");
        loadSucursales();
        document.getElementById("formulario-sucursal").style.display = "none";
        sucursalEditando = null;
      })
      .catch(error => {
        console.error("Error:", error);
        mostrarNotificacion("Error al actualizar sucursal: " + error.message, "error");
      });
  } else {
    // Modo creación: crear una nueva sucursal
    fetchWithAuth(SUCURSALES_URL, {
      method: "POST",
      body: JSON.stringify(sucursalData)
    })
      .then(response => {
        if (!response.ok) throw new Error("Error al crear sucursal");
        return response.json();
      })
      .then(data => {
        mostrarNotificacion("Sucursal creada con éxito");
        loadSucursales();
        document.getElementById("formulario-sucursal").style.display = "none";
      })
      .catch(error => {
        console.error("Error:", error);
        mostrarNotificacion("Error al crear sucursal: " + error.message, "error");
      });
  }
}

// Cargar todas las sucursales y mostrarlas en la lista
function loadSucursales() {
  const idSucursalPadre = localStorage.getItem("idSucursal");
  const lista = document.getElementById("listaSucursales");
  
  // Mostrar estado de carga
  lista.innerHTML = `
    <li class="branch-item">
      <div class="text-center py-3">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-2">Cargando sucursales...</p>
      </div>
    </li>
  `;

  fetchWithAuth(SUCURSALES_URL)
    .then(response => {
      if (!response.ok) throw new Error("Error al cargar las sucursales");
      return response.json();
    })
    .then(sucursales => {
      lista.innerHTML = ""; // Limpiar lista

      // Filtrar sucursales que pertenezcan al superadmin (según idSucursalPadre)
      const sucursalesFiltradas = sucursales.filter(
        sucursal => sucursal.idSucursalPadre == idSucursalPadre
      );

      if (sucursalesFiltradas.length === 0) {
        lista.innerHTML = `
          <li class="branch-item">
            <div class="text-center py-3">
              <i class="fas fa-store-alt-slash fa-2x text-muted mb-3"></i>
              <p>No hay sucursales registradas</p>
            </div>
          </li>
        `;
        return;
      }

      sucursalesFiltradas.forEach(sucursal => {
        const li = document.createElement("li");
        li.className = "branch-item";
        li.innerHTML = `
          <div class="branch-name">${sucursal.nombreDeLaSucursal}</div>
          
          <div class="branch-detail">
            <i class="fas fa-map-marker-alt"></i>
            <span>${sucursal.direccion}</span>
          </div>
          
          <div class="branch-detail">
            <i class="fas fa-mobile-alt"></i>
            <span>${sucursal.telefonoMovil || "No especificado"}</span>
          </div>
          
          <div class="branch-detail">
            <i class="fas fa-phone"></i>
            <span>${sucursal.telefonoFijo || "No especificado"}</span>
          </div>
          
          <div class="branch-detail">
            <i class="fas fa-envelope"></i>
            <span>${sucursal.correoElectronico}</span>
          </div>
          
          <div class="branch-detail">
            <i class="fas fa-mail-bulk"></i>
            <span>${sucursal.codigoPostal || "No especificado"}</span>
          </div>
          
          ${sucursal.idSucursalPadre ? `
            <div class="branch-detail">
              <i class="fas fa-sitemap"></i>
              <span>Sucursal Padre: ${sucursal.idSucursalPadre}</span>
            </div>
          ` : ''}
          
          <div class="branch-actions">
            <button class="btn btn-sm btn-primary" onclick="editarSucursal(${sucursal.idSucursal})">
              <i class="fas fa-edit me-1"></i>Editar
            </button>
            <button class="btn btn-sm btn-danger" onclick="eliminarSucursal(${sucursal.idSucursal})">
              <i class="fas fa-trash me-1"></i>Eliminar
            </button>
          </div>
        `;
        lista.appendChild(li);
      });
    })
    .catch(error => {
      console.error("Error:", error);
      lista.innerHTML = `
        <li class="branch-item">
          <div class="text-center py-3 text-danger">
            <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
            <p>Error al cargar las sucursales</p>
            <button class="btn btn-sm btn-primary" onclick="loadSucursales()">
              <i class="fas fa-sync-alt me-1"></i>Reintentar
            </button>
          </div>
        </li>
      `;
      mostrarNotificacion("Error al cargar sucursales: " + error.message, "error");
    });
}

// Eliminar una sucursal
function eliminarSucursal(id) {
  if (!confirm("¿Estás seguro de que deseas eliminar esta sucursal? Esta acción no se puede deshacer.")) {
    return;
  }
  
  fetchWithAuth(`${SUCURSALES_URL}/${id}`, {
    method: "DELETE"
  })
    .then(response => {
      if (!response.ok) throw new Error("Error al eliminar sucursal");
      return response.json();
    })
    .then(data => {
      mostrarNotificacion("Sucursal eliminada correctamente");
      loadSucursales();
    })
    .catch(error => {
      console.error("Error:", error);
      mostrarNotificacion("Error al eliminar sucursal: " + error.message, "error");
    });
}