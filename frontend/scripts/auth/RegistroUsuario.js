document.addEventListener("DOMContentLoaded", function () {
    const usuarioForm = document.getElementById("usuarioform");

    // Establecer el valor del campo 'rol' a 'superadmin' por defecto y deshabilitarlo
    const rolSelect = document.getElementById("rol");
    rolSelect.value = "superadmin";  // Se asigna el valor de 'superadmin'
    rolSelect.disabled = true;       // Se deshabilita el campo para que no se pueda cambiar

    // Recuperamos el idSucursal desde localStorage
    const idSucursal = localStorage.getItem("idSucursal");
    console.log("idSucursal cargado desde localStorage: ", idSucursal);  // Log para verificar

    // Asegurarnos de que idSucursal existe y asignarlo automáticamente al enviar el formulario
    usuarioForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const rol = document.getElementById("rol").value;

        // Verificar que el rol sea 'superadmin' (aunque ya está establecido como tal)
        if (rol !== "superadmin") {
            alert("Solo un superadministrador puede registrar usuarios.");
            return;
        }

        const data = {
            nombre: document.getElementById("nombre").value,
            correoElectronico: document.getElementById("correoElectronico").value,
            contrasena: document.getElementById("contrasena").value,
            rol: rol
        };

        // Solo agregar idSucursal si el rol es 'superadmin'
        if (rol === "superadmin") {
            if (!idSucursal) {
                alert("El superadministrador debe tener asignada una sucursal.");
                return;
            }
            data.idSucursal = idSucursal;  // Asignamos el idSucursal desde localStorage
        }

        // Enviar la solicitud
        const response = await fetch("http://192.168.1.75:8000/usuarios/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {

            alert("Usuario registrado correctamente");
            usuarioForm.reset();
            window.location.href = "login.html"; // Asegúrate de que la ruta sea correcta

        } else {
            const errorData = await response.json();
            console.error("Error en la respuesta:", errorData);
            alert("Error al registrar el usuario: " + JSON.stringify(errorData));
        }
    });
});