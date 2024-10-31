document.addEventListener("DOMContentLoaded", () => {
    const burgerMenu = document.getElementById("burgerMenu");
    const overlayMenu = document.getElementById("overlayMenu");

    burgerMenu.addEventListener("click", () => {
        overlayMenu.classList.toggle("active"); // Ajoute ou retire la classe "active"
    });

    overlayMenu.addEventListener("click", (event) => {
        if (event.target === overlayMenu) {
            overlayMenu.classList.remove("active"); // Retire la classe "active" si l'utilisateur clique en dehors du menu
        }
    });
});

// Charger le header
console.log("Chargement du header...");
fetch("/Orpps/components/header.html")
    .then(response => response.text())
    .then(data => {
        document.getElementById("header").innerHTML = data;
        console.log("Header chargé avec succès.");
    })
    .catch(error => console.error("Erreur de chargement du header :", error));


// Charger le footer
fetch("/Orpps/components/footer.html")
    .then(response => response.text())
    .then(data => {
        document.getElementById("footer").innerHTML = data;
        console.log("Footer chargé avec succès.");
    })
    .catch(error => console.error("Erreur de chargement du footer :", error));

