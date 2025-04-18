document.addEventListener("DOMContentLoaded", function() {
    loadProveedores();
    document.getElementById("proveedorForm").addEventListener("submit", saveProveedor);
    document.getElementById("searchInput").addEventListener("input", searchProveedores);
    document.getElementById("cancelBtn").addEventListener("click", cancelEdit);
  });

  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
      ${message}
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    const tableBody = document.getElementById('tablaProveedores');
    
    if (show) {
      // Mostrar esqueleto de carga
      tableBody.innerHTML = '';
      for (let i = 0; i < 5; i++) {
        const tr = document.createElement('tr');
        tr.className = 'skeleton-row';
        tr.innerHTML = `
          <td><div class="skeleton-cell"></div></td>
          <td><div class="skeleton-cell"></div></td>
          <td><div class="skeleton-cell"></div></td>
          <td><div class="skeleton-cell"></div></td>
          <td><div class="skeleton-cell"></div></td>
          <td><div class="skeleton-cell"></div></td>
          <td><div class="skeleton-cell"></div></td>
        `;
        tableBody.appendChild(tr);
      }
      spinner.style.display = 'flex';
    } else {
      spinner.style.display = 'none';
    }
  }

  function loadProveedores() {
    showLoading(true);
    
    fetch('http://192.168.1.75:8000/proveedores/')
      .then(response => {
        if (!response.ok) throw new Error('Error en la respuesta del servidor');
        return response.json();
      })
      .then(proveedores => {
        renderProveedores(proveedores);
        showLoading(false);
      })
      .catch(error => {
        console.error("Error al cargar proveedores:", error);
        showNotification('Error al cargar proveedores', 'error');
        showLoading(false);
      });
  }

  function renderProveedores(proveedores) {
    let tbody = document.getElementById("tablaProveedores");
    tbody.innerHTML = "";
    
    if (proveedores.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="7" class="text-center py-4 text-muted">
          <i class="fas fa-box-open fa-2x mb-2"></i>
          <p>No se encontraron proveedores</p>
        </td>
      `;
      tbody.appendChild(tr);
      return;
    }
    
    proveedores.forEach(proveedor => {
      let tr = document.createElement("tr");
      tr.style.animation = 'fadeIn 0.3s ease-out';
      tr.innerHTML = `
        <td>${proveedor.idProveedor}</td>
        <td>${proveedor.nombre}</td>
        <td>${proveedor.contacto || '-'}</td>
        <td>${proveedor.telefono || '-'}</td>
        <td>${proveedor.correoElectronico || '-'}</td>
        <td>${proveedor.direccion || '-'}</td>
        <td>
          <button class="action-btn edit-btn" onclick="editProveedor(${proveedor.idProveedor})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn delete-btn" onclick="deleteProveedor(${proveedor.idProveedor})">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function searchProveedores() {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase();
    const rows = document.querySelectorAll("#tablaProveedores tr");
    
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? "" : "none";
    });
  }

  function saveProveedor(event) {
    event.preventDefault();
    
    const id = document.getElementById("idProveedor").value;
    const submitBtn = document.getElementById("submitBtn");
    
    // Cambiar el botón a estado de carga
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
    submitBtn.disabled = true;
    
    let proveedor = {
      nombre: document.getElementById("nombre").value,
      contacto: document.getElementById("contacto").value,
      telefono: document.getElementById("telefono").value,
      correoElectronico: document.getElementById("correoElectronico").value,
      direccion: document.getElementById("direccion").value
    };
    
    let method = id ? "PUT" : "POST";
    let url = id ? `http://192.168.1.75:8000/proveedores/${id}` : "http://192.168.1.75:8000/proveedores/";
    
    fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proveedor)
    })
    .then(response => {
      if (!response.ok) throw new Error('Error en la respuesta del servidor');
      return response.json();
    })
    .then(() => {
      loadProveedores();
      document.getElementById("proveedorForm").reset();
      document.getElementById("idProveedor").value = "";
      document.getElementById("cancelBtn").style.display = "none";
      
      showNotification(id ? 'Proveedor actualizado correctamente' : 'Proveedor creado correctamente');
    })
    .catch(error => {
      console.error("Error al guardar proveedor:", error);
      showNotification('Error al guardar proveedor', 'error');
    })
    .finally(() => {
      submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar';
      submitBtn.disabled = false;
    });
  }

  function editProveedor(id) {
    fetch(`http://192.168.1.75:8000/proveedores/${id}`)
      .then(response => {
        if (!response.ok) throw new Error('Error en la respuesta del servidor');
        return response.json();
      })
      .then(proveedor => {
        document.getElementById("idProveedor").value = proveedor.idProveedor;
        document.getElementById("nombre").value = proveedor.nombre;
        document.getElementById("contacto").value = proveedor.contacto || '';
        document.getElementById("telefono").value = proveedor.telefono || '';
        document.getElementById("correoElectronico").value = proveedor.correoElectronico || '';
        document.getElementById("direccion").value = proveedor.direccion || '';
        
        document.getElementById("cancelBtn").style.display = "inline-block";
        document.getElementById("nombre").focus();
        
        // Desplazarse suavemente al formulario
        document.querySelector('.card:last-child').scrollIntoView({ 
          behavior: 'smooth' 
        });
      })
      .catch(error => {
        console.error("Error al cargar proveedor:", error);
        showNotification('Error al cargar proveedor', 'error');
      });
  }

  function cancelEdit() {
    document.getElementById("proveedorForm").reset();
    document.getElementById("idProveedor").value = "";
    document.getElementById("cancelBtn").style.display = "none";
  }

  function deleteProveedor(id) {
    if (confirm("¿Seguro que deseas eliminar este proveedor?")) {
      fetch(`http://192.168.1.75:8000/proveedores/${id}`, {
        method: "DELETE"
      })
      .then(response => {
        if (!response.ok) throw new Error('Error en la respuesta del servidor');
        loadProveedores();
        showNotification('Proveedor eliminado correctamente');
      })
      .catch(error => {
        console.error("Error al eliminar proveedor:", error);
        showNotification('Error al eliminar proveedor', 'error');
      });
    }
  }