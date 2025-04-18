document.addEventListener("DOMContentLoaded", () => {
    // Obtén todos los elementos del menú
    const menuLinks = document.querySelectorAll("nav ul.menu li a");

    menuLinks.forEach(link => {
        link.addEventListener("click", event => {
            const href = link.getAttribute("href");
    
            // Si el enlace es una URL interna (que empieza con '#')
            if (href.startsWith('#')) {
                event.preventDefault();  // Evita el comportamiento predeterminado de desplazamiento
                const targetId = href.substring(1);  // Obtén el id del destino
                showSection(targetId);  // Llama a la función para mostrar la sección
            } else {
                // Si no es un enlace interno, deja que se navegue a la página (por ejemplo, login.html)
                window.location.href = href;
            }
        });
    });
    

    // Función para mostrar la sección y ocultar las demás
    function showSection(targetId) {
        // Oculta todas las secciones
        document.querySelectorAll(".main-content section").forEach(section => {
            section.style.display = "none";
        });
        
        // Muestra la sección seleccionada
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.style.display = "block";
        }
    }

    // Muestra solo la sección de inicio al cargar la página
    showSection("inicio");
});

// Función para alternar el menú de hamburguesa
function toggleMenu() {
    const menu = document.querySelector('.menu');
    menu.classList.toggle('active');
}

document.querySelectorAll('.menu li a').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelector('.menu').classList.remove('active');
    });
});


// Detección del sistema operativo
window.onload = function() {
    const userAgent = navigator.userAgent.toLowerCase();
    const head = document.getElementsByTagName('head')[0];
    let styleLink;

    if (userAgent.includes('mac') || userAgent.includes('iphone') || userAgent.includes('ipad')) {
        // Apple: Cargar stylesA.css
        styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = 'styles.css';
        head.appendChild(styleLink);
    } else if (userAgent.includes('windows')) {
        // Microsoft: Cargar stylesM.css
        styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = 'styles.css';
        head.appendChild(styleLink);
    } else {
        // Caso por defecto: ya se ha cargado styles.css
        console.log('Usando estilo predeterminado.');
    }
};
