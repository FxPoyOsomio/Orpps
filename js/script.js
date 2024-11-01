document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM content loaded, starting header fetch...");
    fetch("/Orpps/components/header.html")
        .then(response => {
            console.log("Header fetch response:", response);
            return response.text();
        })
        .then(data => {
            document.getElementById("header").innerHTML = data;
            console.log("Header loaded successfully");

            // Accéder aux éléments du header
            const burgerMenu = document.getElementById("burgerMenu");
            const overlayMenu = document.getElementById("overlayMenu");
            const header = document.querySelector(".header");
            console.log("burgerMenu:", burgerMenu);
            console.log("overlayMenu:", overlayMenu);

            if (burgerMenu && overlayMenu) {
                // Gestion du clic sur le menu burger
                burgerMenu.addEventListener("click", () => {
                    header.classList.toggle("modal-burger-open"); // Modifie le header pour ajouter la classe d'animation
                    overlayMenu.classList.toggle("active"); // Affiche ou cache l'overlay
                    burgerMenu.classList.toggle("active"); // Ajoute la classe "active" au menu burger
                    console.log("Burger menu clicked, overlay active:", overlayMenu.classList.contains("active"));
                });

                // Gestion du clic en dehors du menu pour le fermer
                overlayMenu.addEventListener("click", (event) => {
                    if (event.target === overlayMenu) {
                        header.classList.remove("modal-burger-open");
                        overlayMenu.classList.remove("active");
                        burgerMenu.classList.remove("active"); // Retire la classe "active" du menu burger
                        console.log("Overlay clicked, menu closed");
                    }
                });
            } else {
                console.error("Elements not found:", { burgerMenu, overlayMenu });
            }

            // Gérer le changement de couleur des liens dans le header et le menu mobile
            const navLinks = document.querySelectorAll('.header__nav a');

            navLinks.forEach(link => {
                link.addEventListener('click', function() {
                    // Supprimer la classe active de tous les liens
                    navLinks.forEach(navLink => navLink.classList.remove('active'));

                    // Ajouter la classe active au lien cliqué
                    this.classList.add('active');

                    // Retirer la classe active après 1 seconde
                    setTimeout(() => {
                        this.classList.remove('active');
                    }, 1000);
                });
            });
        })
        .catch(error => console.error("Error loading header:", error));

    // Charger le footer
    fetch("/Orpps/components/footer.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("footer").innerHTML = data;
        });
});
