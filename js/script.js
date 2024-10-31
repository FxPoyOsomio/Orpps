document.addEventListener("DOMContentLoaded", () => {
    const burgerMenu = document.getElementById("burgerMenu");
    const overlayMenu = document.getElementById("overlayMenu");

    if (burgerMenu && overlayMenu) { // Vérifie que les éléments existent
        // Gestion du clic sur le menu burger
        burgerMenu.addEventListener("click", () => {
            overlayMenu.classList.toggle("active"); // Ajouter ou retirer la classe "active"
        });

        // Gestion du clic en dehors du menu pour le fermer
        overlayMenu.addEventListener("click", (event) => {
            if (event.target === overlayMenu) {
                overlayMenu.classList.remove("active"); // Retirer la classe "active"
            }
        });
    } else {
        console.error("Element(s) not found:", { burgerMenu, overlayMenu });
    }

    // Charger le header
    fetch("../components/header.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("header").innerHTML = data;
        });

    // Charger le footer
    fetch("../components/footer.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("footer").innerHTML = data;
        });
});