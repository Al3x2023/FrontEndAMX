document.addEventListener("DOMContentLoaded", function () {
    function toggleMenu() {
        const navUl = document.querySelector(".navbar ul");
        if (navUl) {
            navUl.classList.toggle("active");
        } else {
            console.error("Elemento .navbar ul no encontrado.");
        }
    }

    function closeMenu() {
        const navUl = document.querySelector(".navbar ul");
        if (navUl) {
            navUl.classList.remove("active");
        }
    }

    document.querySelector(".menu-toggle").addEventListener("click", toggleMenu);

    document.querySelectorAll(".navbar ul li a").forEach(link => {
        link.addEventListener("click", function () {
            loadSection(this.getAttribute("href").substring(1));
            closeMenu();
        });
    });
});

function loadSection(section) {
    const content = document.getElementById("content");

    switch(section) {
        case 'inicio':
            content.innerHTML = `
                <section id="inicio" aria-labelledby="titulo-inicio">
                    <h1 id="titulo-inicio">Bienvenido a Artículos MX</h1>
                    <p>La plataforma inteligente para gestionar tus productos, controlar tu inventario y llevar tus ventas al siguiente nivel.</p>
                    <a href="#cta" class="btn-cta">¡Comienza Gratis!</a>
                </section>
            `;
            break;
        case 'cta':
            content.innerHTML = `
                <section id="cta" aria-labelledby="titulo-cta">
                    <h2 id="titulo-cta">Empieza con Artículos MX</h2>
                    <p>Organiza tu inventario, lleva un control de tus artículos y mejora tus operaciones. ¡Regístrate ahora!</p>
                    <a href="registerSucursal.html" class="btn-cta">Crear Cuenta</a>
                </section>
            `;
            break;
        case 'servicios':
            content.innerHTML = `
                <section id="servicios" aria-labelledby="titulo-servicios">
                    <h2 id="titulo-servicios">Funciones Principales</h2>
                    <div class="service-grid">
                        <article>
                            <h3>Inventario en Tiempo Real</h3>
                            <p>Controla tus productos con actualizaciones instantáneas y alertas de stock.</p>
                        </article>
                        <article>
                            <h3>Gestión de Artículos</h3>
                            <p>Clasifica, busca y edita artículos fácilmente desde cualquier dispositivo.</p>
                        </article>
                        <article>
                            <h3>Reportes Automatizados</h3>
                            <p>Obtén reportes de ventas, movimientos y rendimiento para una mejor toma de decisiones.</p>
                        </article>
                    </div>
                </section>
            `;
            break;
        case 'tecnologias':
            content.innerHTML = `
                <section id="tecnologias" aria-labelledby="titulo-tecnologias">
                    <h2 id="titulo-tecnologias">Tecnología de Punta</h2>
                    <div class="tech-grid">
                        <div class="tech-item">
                            <img src="imagenes/react-logo.png" alt="React">
                            <p>React</p>
                        </div>
                        <div class="tech-item">
                            <img src="imagenes/fastapi-logo.png" alt="FastAPI">
                            <p>FastAPI</p>
                        </div>
                        <div class="tech-item">
                            <img src="imagenes/mysql-logo.png" alt="MySQL">
                            <p>MySQL</p>
                        </div>
                    </div>
                </section>
            `;
            break;
        case 'contacto':
            content.innerHTML = `
                <section id="contacto" aria-labelledby="titulo-contacto">
                    <h2 id="titulo-contacto">Contáctanos</h2>
                    <p>¿Tienes dudas o necesitas ayuda? Estamos para ayudarte.</p>
                    <div class="contact-icons">
                        <a href="https://wa.me/1234567890" target="_blank" aria-label="WhatsApp">
                            <i class="bi bi-whatsapp"></i>
                        </a>
                        <a href="mailto:soporte@articulosmx.com" aria-label="Correo electrónico">
                            <i class="bi bi-envelope"></i>
                        </a>
                    </div>
                </section>
            `;
            break;
    }
}

loadSection('inicio');