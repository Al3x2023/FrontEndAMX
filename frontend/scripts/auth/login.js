document.addEventListener("DOMContentLoaded", function() {
    console.log("Página cargada. Verificando token de sesión...");
    const token = localStorage.getItem("access_token");
    
    if (!token) {
        console.warn("No hay token almacenado. Se requiere inicio de sesión.");
    } else {
        console.log("Token detectado:", token);
    }
});

document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault();
    
    // Obtén los datos del formulario
    const correoElectronico = document.getElementById("correoElectronico").value;
    const contrasena = document.getElementById("contrasena").value;

    console.log("Intentando iniciar sesión con:", correoElectronico);
    
    fetch("http://192.168.1.75:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correoElectronico, contrasena })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Respuesta del servidor:", data);

        if (data.access_token) {
            console.log("Autenticación exitosa. Token recibido:", data.access_token);
            console.log("Rol recibido:", data.rol);
            console.log("ID Usuario:", data.idUsuario);
            console.log("ID Sucursal:", data.idSucursal);

            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("rol", data.rol);
            localStorage.setItem("idUsuario", data.idUsuario);
            localStorage.setItem("idSucursal", data.idSucursal);

            alert("Login exitoso!");

            // Verificamos y redirigimos según el rol
            switch (data.rol) {
                case "superadmin":
                    console.log("Redirigiendo a superadminDashboard.html");
                    window.location.href = "superadminDashboard.html";
                    break;
                case "admin":
                    console.log("Redirigiendo a adminDashboard.html");
                    window.location.href = "adminDashboard.html";
                    break;
                case "usuario":
                    console.log("Redirigiendo a usuarioDashboard.html");
                    window.location.href = "usuarioDashboard.html";
                    break;
                default:
                    console.warn("Rol desconocido. Redirigiendo a usuarioDashboard.html por defecto.");
                    window.location.href = "usuarioDashboard.html";
            }
        } else {
            console.error("Error: No se recibió un token en la respuesta.");
            throw new Error("Credenciales incorrectas");
        }
    })
    .catch(error => {
        console.error("Error en el proceso de login:", error);
        document.getElementById("error-message").textContent = "Error: " + error.message;
    });
});