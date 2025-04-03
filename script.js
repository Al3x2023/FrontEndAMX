document.addEventListener("DOMContentLoaded", function () {
    const sucursalForm = document.getElementById("sucursalForm");

    sucursalForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const data = {
            nombreDeLaSucursal: document.getElementById("nombreDeLaSucursal").value,
            direccion: document.getElementById("direccion").value,
            telefonoMovil: document.getElementById("telefonoMovil").value,
            telefonoFijo: document.getElementById("telefonoFijo").value,
            correoElectronico: document.getElementById("correoElectronico").value,
            codigoPostal: document.getElementById("codigoPostal").value,
            sucursalPadre: document.getElementById("sucursalPadre").value || null // Enviar null si está vacío
        };

        const response = await fetch("http://127.0.0.1:8000/sucursales/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const responseData = await response.json();
            const idSucursal = responseData.idSucursal;
            if (idSucursal) {
                localStorage.setItem("idSucursal", idSucursal);
                console.log("Sucursal registrada, ID de Sucursal: ", idSucursal);
                alert("Sucursal registrada correctamente");
                sucursalForm.reset();
                window.location.href = "registerUser.html";
            } else {
                alert("No se recibió un ID de sucursal válido.");
            }
        } else {
            const errorData = await response.json();
            console.error("Error en la respuesta:", errorData);
            alert("Error al registrar la sucursal: " + JSON.stringify(errorData));
        }
    });
});
