// layout.js

function toggleMenu() {
  const mobileMenu = document.getElementById('mobileMenu');
  mobileMenu.style.display = mobileMenu.style.display === 'none' ? 'block' : 'none';
}
document.addEventListener("DOMContentLoaded", async function () {
    try {
      const response = await fetch("layout.html");
      const layoutHTML = await response.text();
      
      // Crear un contenedor temporal
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = layoutHTML;
  
      // Insertar header, nav y footer en el documento
      document.body.insertBefore(tempDiv.querySelector("header"), document.body.firstChild);
      document.body.insertBefore(tempDiv.querySelector("nav"), document.body.children[1]);
      document.body.appendChild(tempDiv.querySelector("footer"));
    } catch (error) {
      console.error("Error al cargar el layout:", error);
    }
  });
  
  // Función para cerrar sesión
  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("idSucursal");
    window.location.href = "./index.html"; // Redirigir desde la raíz
  }
  