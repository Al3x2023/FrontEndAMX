function toggleMenu() {
  const navUl = document.querySelector(".navbar ul");
  navUl.classList.toggle("active");
}

document.addEventListener("DOMContentLoaded", () => {
  initializeDashboard();
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

async function initializeDashboard() {
  try {
    const idSucursal = localStorage.getItem("idSucursal");
    if (!idSucursal) throw new Error("No se encontró el ID de la sucursal en el almacenamiento local.");
    
    mostrarNotificacion("Cargando datos del dashboard...", "info");
    
    await Promise.all([
      loadResumenDashboard(idSucursal),
      loadProductosMasVendidos(idSucursal),
      loadActividadReciente(idSucursal)
    ]);
    
    mostrarNotificacion("Dashboard cargado exitosamente");
  } catch (error) {
    console.error("Error inicializando el dashboard:", error);
    mostrarNotificacion("Error al cargar el dashboard: " + error.message, "error");
  }
}

// Carga el resumen general (ventas, ingresos, egresos, balance)
async function loadResumenDashboard(idSucursal) {
  try {
    const res = await fetchWithAuth(`http://192.168.1.75:8000/dashboard/resumen/${idSucursal}`);
    if (!res.ok) throw new Error("Error al obtener el resumen del dashboard.");
    const resumen = await res.json();
    
    // Formatear valores monetarios
    const formatMoney = (value) => {
      return new Intl.NumberFormat('es-MX', { 
        style: 'currency', 
        currency: 'MXN',
        minimumFractionDigits: 2
      }).format(value || 0);
    };
    
    document.getElementById("totalVentas").textContent = formatMoney(resumen.ventas_totales);
    document.getElementById("ingresosTotales").textContent = formatMoney(resumen.ingresos_totales);
    document.getElementById("egresosTotales").textContent = formatMoney(resumen.egresos_totales);
    document.getElementById("balance").textContent = formatMoney(resumen.balance);
  } catch (error) {
    console.error("Error al cargar el resumen:", error);
    mostrarNotificacion("Error al cargar métricas: " + error.message, "error");
  }
}

// Carga la actividad reciente: últimas entradas y salidas
async function loadActividadReciente(idSucursal) {
  try {
    const res = await fetchWithAuth(`http://192.168.1.75:8000/dashboard/actividad_reciente/${idSucursal}`);
    if (!res.ok) throw new Error("Error al obtener la actividad reciente.");
    const actividad = await res.json();
    const lista = document.getElementById("actividad-reciente");
    lista.innerHTML = "";
    
    // Combinar y ordenar entradas y salidas por fecha (asumiendo que tienen un campo fecha)
    const actividadesCombinadas = [
      ...(actividad.ultimas_entradas || []).map(e => ({ ...e, tipo: 'entrada' })),
      ...(actividad.ultimas_salidas || []).map(s => ({ ...s, tipo: 'salida' }))
    ].sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
    
    if (actividadesCombinadas.length === 0) {
      lista.innerHTML = `
        <li class="activity-item">
          <div class="activity-icon">
            <i class="fas fa-info-circle"></i>
          </div>
          <div class="activity-content">
            <div class="activity-type">No hay actividad reciente</div>
          </div>
        </li>
      `;
      return;
    }
    
    actividadesCombinadas.forEach(item => {
      const li = document.createElement("li");
      li.className = "activity-item";
      
      const iconClass = item.tipo === 'entrada' ? 'entrada' : 'salida';
      const icon = item.tipo === 'entrada' ? 'sign-in-alt' : 'sign-out-alt';
      const tipoTexto = item.tipo === 'entrada' ? 'Entrada' : 'Salida';
      
      li.innerHTML = `
        <div class="activity-icon ${iconClass}">
          <i class="fas fa-${icon}"></i>
        </div>
        <div class="activity-content">
          <div class="activity-type">${tipoTexto} #${item.idEntrada || item.idSalida}</div>
          <div class="activity-details">
            Producto: ${item.idProducto} | 
            Cantidad: ${item.cantidad} | 
            ${item.fecha ? `Fecha: ${new Date(item.fecha).toLocaleString()}` : ''}
          </div>
        </div>
      `;
      lista.appendChild(li);
    });
  } catch (error) {
    console.error("Error al cargar la actividad reciente:", error);
    mostrarNotificacion("Error al cargar actividad reciente", "error");
  }
}

// Carga los productos más vendidos y renderiza el gráfico
async function loadProductosMasVendidos(idSucursal) {
  try {
    const res = await fetchWithAuth(`http://192.168.1.75:8000/dashboard/productos_mas_vendidos/${idSucursal}`);
    if (!res.ok) throw new Error("Error al obtener productos más vendidos.");
    const productos = await res.json();
    
    if (productos && productos.length > 0) {
      document.getElementById("topProducto").textContent = productos[0].nombre || productos[0].idProducto;
      renderGraficoProductos(productos);
    } else {
      document.getElementById("topProducto").textContent = "-";
      renderGraficoProductos([]);
    }
  } catch (error) {
    console.error("Error al cargar productos más vendidos:", error);
    mostrarNotificacion("Error al cargar productos más vendidos", "error");
  }
}

function renderGraficoProductos(productos) {
  const ctx = document.getElementById("graficoProductos").getContext("2d");
  
  // Si no hay datos, mostrar mensaje
  if (!productos || productos.length === 0) {
    if (window.chartProducto) window.chartProducto.destroy();
    
    ctx.font = '16px Nunito';
    ctx.textAlign = 'center';
    ctx.fillText('No hay datos disponibles para mostrar', ctx.canvas.width / 2, ctx.canvas.height / 2);
    return;
  }
  
  const labels = productos.map(p => p.nombre || `Producto ${p.idProducto}`);
  const data = productos.map(p => p.total_vendido || 0);
  
  // Colores dinámicos
  const backgroundColors = [
    'rgba(78, 115, 223, 0.5)',
    'rgba(28, 200, 138, 0.5)',
    'rgba(246, 194, 62, 0.5)',
    'rgba(231, 74, 59, 0.5)',
    'rgba(54, 185, 204, 0.5)'
  ];
  
  if (window.chartProducto) window.chartProducto.destroy();
  
  window.chartProducto = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{
        label: "Ventas por Producto",
        data: data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(c => c.replace('0.5', '1')),
        borderWidth: 1
      }]
    },
    options: { 
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font: {
              family: 'Nunito',
              size: 14
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.label || '';
              if (label) label += ': ';
              label += context.raw + ' unidades';
              return label;
            }
          }
        }
      }
    }
  });
}