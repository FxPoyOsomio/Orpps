document.addEventListener("DOMContentLoaded", () => {
    // Charger le header
    fetch("/Orpps/components/header.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("header").innerHTML = data;

            // Une fois le header chargé, accéder aux éléments
            const burgerMenu = document.getElementById("burgerMenu");
            const overlayMenu = document.getElementById("overlayMenu");

            console.log("burgerMenu:", burgerMenu);
            console.log("overlayMenu:", overlayMenu);

            if (burgerMenu && overlayMenu) {
                // Gestion du clic sur le menu burger
                burgerMenu.addEventListener("click", () => {
                    burgerMenu.classList.toggle("active"); // Ajouter ou retirer la classe "active"
                    overlayMenu.classList.toggle("active"); // Ajouter ou retirer la classe "active" sur le menu
                    console.log("Menu burger clicked, active:", overlayMenu.classList.contains("active"));
                });

                // Gestion du clic en dehors du menu pour le fermer
                overlayMenu.addEventListener("click", (event) => {
                    if (event.target === overlayMenu) {
                        burgerMenu.classList.remove("active"); // Retirer la classe "active"
                        overlayMenu.classList.remove("active"); // Retirer la classe "active" sur le menu
                        console.log("Overlay clicked, menu closed");
                    }
                });
            } else {
                console.error("Element(s) not found:", { burgerMenu, overlayMenu });
            }
        });

    // Charger le footer
    fetch("/Orpps/components/footer.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("footer").innerHTML = data;
        });
});
