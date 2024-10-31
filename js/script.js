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
            console.log("burgerMenu:", burgerMenu);
            console.log("overlayMenu:", overlayMenu);

            if (burgerMenu && overlayMenu) {
                // Gestion du clic sur le menu burger
                burgerMenu.addEventListener("click", () => {
                    burgerMenu.classList.toggle("active");
                    overlayMenu.classList.toggle("active");
                    console.log("Burger menu clicked, overlay active:", overlayMenu.classList.contains("active"));
                });

                // Gestion du clic en dehors du menu pour le fermer
                overlayMenu.addEventListener("click", (event) => {
                    if (event.target === overlayMenu) {
                        burgerMenu.classList.remove("active");
                        overlayMenu.classList.remove("active");
                        console.log("Overlay clicked, menu closed");
                    }
                });
            } else {
                console.error("Elements not found:", { burgerMenu, overlayMenu });
            }
        })
        .catch(error => console.error("Error loading header:", error));

    // Charger le footer
    fetch("/Orpps/components/footer.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("footer").innerHTML = data;
        });
});
