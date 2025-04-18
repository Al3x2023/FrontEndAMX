    // Configuración
    const API_URL = "http://192.168.1.75:8000";
    const PRODUCTOS_URL = `${API_URL}/productos`;
    const INVENTARIO_URL = `${API_URL}/inventarios`;
    const itemsPerPage = 10;
    let currentPage = 1;
    let allInventoryData = [];
    let filteredData = [];
    let productosMap = {};
    let stockStats = { low: 0, medium: 0, high: 0 };

    // Mostrar notificación
    function mostrarNotificacion(mensaje, tipo = 'success') {
      const notification = document.getElementById('notification');
      notification.textContent = mensaje;
      notification.className = `notification ${tipo} show`;
      
      setTimeout(() => {
        notification.classList.remove('show');
      }, 3000);
    }

    // Obtener ID de sucursal de localStorage
    function obtenerIdSucursal() {
      return localStorage.getItem("idSucursal") || 1; // Default a 1 si no existe
    }

    // Función para obtener nombres de productos
    async function obtenerNombresProductos() {
      try {
        const response = await fetch(PRODUCTOS_URL);
        if (!response.ok) throw new Error("Error al obtener productos");
        const productos = await response.json();
        
        // Crear un mapa de ID a Nombre
        productosMap = {};
        const selectProducto = document.getElementById('idProducto');
        selectProducto.innerHTML = '<option value="" selected disabled>Seleccione un producto</option>';
        
        productos.forEach(p => {
          productosMap[p.idProducto] = p.nombreDelProducto;
          const option = document.createElement('option');
          option.value = p.idProducto;
          option.textContent = `${p.idProducto} - ${p.nombreDelProducto}`;
          selectProducto.appendChild(option);
        });
        
        return productosMap;
      } catch (error) {
        console.error("Error al obtener productos:", error);
        return {};
      }
    }

    // Función para actualizar stock
    async function actualizarStock(e) {
      e.preventDefault();
      
      const idProducto = document.getElementById('idProducto').value;
      const cantidad = document.getElementById('cantidad').value;
      const idSucursal = document.getElementById('idSucursal').value;
      const motivo = document.getElementById('motivo').value;

      if (!idProducto || !cantidad || !idSucursal) {
        mostrarNotificacion('Todos los campos son requeridos', 'error');
        return;
      }

      const btn = document.getElementById('btnActualizar');
      btn.classList.add('loading');

      try {
        const response = await fetch(`${INVENTARIO_URL}/actualizar_stock`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idProducto: parseInt(idProducto),
            idSucursal: parseInt(idSucursal),
            cantidad: parseInt(cantidad),
            motivo: motivo
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Error al actualizar stock');
        }

        const data = await response.json();
        mostrarNotificacion(`Stock actualizado: ${productosMap[data.idProducto] || data.idProducto}, Nuevo stock: ${data.stock}`);
        
        // Reset form
        document.getElementById('formActualizarStock').reset();
        document.getElementById('idProducto').innerHTML = '<option value="" selected disabled>Seleccione un producto</option>';
        
        // Refresh data
        await consultarInventario();
        await obtenerNombresProductos();
      } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion(error.message, 'error');
      } finally {
        btn.classList.remove('loading');
      }
    }

    // Función para consultar inventario
    async function consultarInventario(e) {
      if (e) e.preventDefault();
      
      const idSucursal = document.getElementById('sucursalConsulta').value;
      const btn = document.getElementById('btnConsultar');
      btn.classList.add('loading');

      try {
        const response = await fetch(`${INVENTARIO_URL}/${idSucursal}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Error al consultar inventario');
        }

        const inventario = await response.json();
        allInventoryData = inventario;
        filteredData = [...inventario];
        
        mostrarInventario(inventario);
        actualizarEstadisticas(inventario);
        mostrarNotificacion(`Inventario de sucursal ${idSucursal} cargado`);
        
        // Actualizar ID de sucursal en localStorage
        localStorage.setItem("idSucursal", idSucursal);
        document.getElementById('sucursalActual').textContent = idSucursal;
        document.getElementById('idSucursal').value = idSucursal;
      } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion(error.message, 'error');
      } finally {
        btn.classList.remove('loading');
      }
    }

    // Determinar clase CSS según nivel de stock
    function getStockLevelClass(stock) {
      if (stock <= 5) return 'stock-low';
      if (stock <= 15) return 'stock-medium';
      return 'stock-high';
    }

    // Determinar badge según nivel de stock
    function getStockBadge(stock) {
      if (stock <= 5) return '<span class="badge badge-danger">Bajo</span>';
      if (stock <= 15) return '<span class="badge badge-warning">Medio</span>';
      return '<span class="badge badge-success">Alto</span>';
    }

    // Actualizar estadísticas
    function actualizarEstadisticas(inventario) {
      const totalProductos = inventario.length;
      const totalStock = inventario.reduce((sum, item) => sum + item.stock, 0);
      
      stockStats = { low: 0, medium: 0, high: 0 };
      
      inventario.forEach(item => {
        if (item.stock <= 5) stockStats.low++;
        else if (item.stock <= 15) stockStats.medium++;
        else stockStats.high++;
      });
      
      const productosBajos = stockStats.low;
      
      document.getElementById('totalProductos').textContent = totalProductos;
      document.getElementById('totalStock').textContent = totalStock;
      document.getElementById('productosBajos').textContent = productosBajos;
      
      // Actualizar gráfico de progreso
      const total = totalProductos || 1;
      document.getElementById('progressLow').style.width = `${(stockStats.low / total) * 100}%`;
      document.getElementById('progressMedium').style.width = `${(stockStats.medium / total) * 100}%`;
      document.getElementById('progressHigh').style.width = `${(stockStats.high / total) * 100}%`;
      
      document.getElementById('stockLowCount').textContent = stockStats.low;
      document.getElementById('stockMediumCount').textContent = stockStats.medium;
      document.getElementById('stockHighCount').textContent = stockStats.high;
    }

    // Mostrar inventario en tabla con paginación
    function mostrarInventario(inventario) {
      const tbody = document.querySelector('#tablaInventario tbody');
      tbody.innerHTML = '';

      if (inventario.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay registros de inventario</td></tr>';
        document.getElementById('mostrando').textContent = '0';
        document.getElementById('totalRegistros').textContent = '0';
        updatePaginationButtons();
        return;
      }

      // Actualizar contadores
      document.getElementById('mostrando').textContent = Math.min(itemsPerPage, filteredData.length);
      document.getElementById('totalRegistros').textContent = filteredData.length;
      
      // Mostrar solo los elementos de la página actual
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
      const paginatedItems = filteredData.slice(startIndex, endIndex);

      paginatedItems.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.idProducto}</td>
          <td>${productosMap[item.idProducto] || 'Desconocido'}</td>
          <td class="${getStockLevelClass(item.stock)}">${item.stock}</td>
          <td>${getStockBadge(item.stock)}</td>
          <td class="action-buttons">
            <button class="btn btn-sm btn-outline-primary" onclick="abrirModalEdicion(${item.idProducto}, ${item.idSucursal})">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-info" onclick="verHistorial(${item.idProducto}, ${item.idSucursal})">
              <i class="fas fa-history"></i>
            </button>
          </td>
        `;
        tbody.appendChild(row);
      });
      
      updatePaginationButtons();
    }

    // Actualizar botones de paginación
    function updatePaginationButtons() {
      const btnPrev = document.getElementById('btnPrev');
      const btnNext = document.getElementById('btnNext');
      
      btnPrev.disabled = currentPage === 1;
      btnNext.disabled = currentPage * itemsPerPage >= filteredData.length;
    }

    // Filtrar por nombre
    function filtrarPorNombre() {
      const filtro = document.getElementById("busquedaNombre").value.toLowerCase();
      filteredData = allInventoryData.filter(item => {
        const nombreProducto = (productosMap[item.idProducto] || '').toLowerCase();
        return nombreProducto.includes(filtro);
      });
      
      currentPage = 1;
      mostrarInventario(filteredData);
    }

    // Filtrar por nivel de stock
    function filtrarPorStock(nivel) {
      if (nivel === 'all') {
        filteredData = [...allInventoryData];
      } else {
        filteredData = allInventoryData.filter(item => {
          if (nivel === 'low') return item.stock <= 5;
          if (nivel === 'medium') return item.stock > 5 && item.stock <= 15;
          if (nivel === 'high') return item.stock > 15;
          return true;
        });
      }
      
      currentPage = 1;
      mostrarInventario(filteredData);
    }

    // Abrir modal para edición rápida
    function abrirModalEdicion(idProducto, idSucursal) {
      const producto = allInventoryData.find(item => 
        item.idProducto === idProducto && item.idSucursal === idSucursal
      );
      
      if (!producto) return;
      
      document.getElementById('modalIdProducto').value = idProducto;
      document.getElementById('modalIdSucursal').value = idSucursal;
      document.getElementById('modalNombreProducto').value = productosMap[idProducto] || 'Desconocido';
      document.getElementById('modalStockActual').value = producto.stock;
      document.getElementById('modalNuevoStock').value = producto.stock;
      
      const modal = new bootstrap.Modal(document.getElementById('editarStockModal'));
      modal.show();
    }

    // Guardar cambios desde el modal
    async function guardarCambiosStock() {
      const idProducto = document.getElementById('modalIdProducto').value;
      const idSucursal = document.getElementById('modalIdSucursal').value;
      const stockActual = parseInt(document.getElementById('modalStockActual').value);
      const nuevoStock = parseInt(document.getElementById('modalNuevoStock').value);
      const motivo = document.getElementById('modalMotivo').value;
      
      const diferencia = nuevoStock - stockActual;
      
      if (diferencia === 0) {
        mostrarNotificacion('No hay cambios en el stock', 'error');
        return;
      }
      
      const btn = document.getElementById('btnGuardarCambios');
      btn.classList.add('loading');
      
      try {
        const response = await fetch(`${INVENTARIO_URL}/actualizar_stock`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idProducto: parseInt(idProducto),
            idSucursal: parseInt(idSucursal),
            cantidad: diferencia,
            motivo: motivo
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Error al actualizar stock');
        }

        const data = await response.json();
        mostrarNotificacion(`Stock actualizado: ${productosMap[data.idProducto] || data.idProducto}, Nuevo stock: ${data.stock}`);
        
        // Cerrar modal y refrescar datos
        bootstrap.Modal.getInstance(document.getElementById('editarStockModal')).hide();
        await consultarInventario();
      } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion(error.message, 'error');
      } finally {
        btn.classList.remove('loading');
      }
    }

    // Ver historial (placeholder)
    function verHistorial(idProducto, idSucursal) {
      mostrarNotificacion(`Función de historial para producto ${idProducto} en sucursal ${idSucursal}`, 'info');
    }

    // Event Listeners
    document.addEventListener('DOMContentLoaded', async () => {
      // Configurar el ID de sucursal en los inputs
      const idSucursal = obtenerIdSucursal();
      document.getElementById('idSucursal').value = idSucursal;
      document.getElementById('sucursalConsulta').value = idSucursal;
      document.getElementById('sucursalActual').textContent = idSucursal;
      
      // Configurar event listeners
      document.getElementById('formActualizarStock').addEventListener('submit', actualizarStock);
      document.getElementById('formConsultarInventario').addEventListener('submit', consultarInventario);
      document.getElementById('busquedaNombre').addEventListener('input', filtrarPorNombre);
      document.getElementById('btnGuardarCambios').addEventListener('click', guardarCambiosStock);
      
      document.getElementById('btnPrev').addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          mostrarInventario(filteredData);
        }
      });
      
      document.getElementById('btnNext').addEventListener('click', () => {
        if (currentPage * itemsPerPage < filteredData.length) {
          currentPage++;
          mostrarInventario(filteredData);
        }
      });
      
      // Cargar datos iniciales
      await obtenerNombresProductos();
      await consultarInventario();
    });