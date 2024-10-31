document.addEventListener("DOMContentLoaded", () => {
    // Menu burger
    const burgerMenu = document.getElementById("burgerMenu");
    const overlayMenu = document.getElementById("overlayMenu");

    if (burgerMenu && overlayMenu) {
        burgerMenu.addEventListener("click", () => {
            overlayMenu.classList.toggle("active");
        });

        overlayMenu.addEventListener("click", (event) => {
            if (event.target === overlayMenu) {
                overlayMenu.classList.remove("active");
            }
        });
    }

    // Charger le header
    console.log("Chargement du header...");
    fetch("https://fxpoyosomio.github.io/Orpps/components/header.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("header").innerHTML = data;
            console.log("Header chargé avec succès.");
        })
        .catch(error => console.error("Erreur de chargement du header :", error));
    

    // Charger le footer
    fetch("https://fxpoyosomio.github.io/Orpps/components/footer.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("footer").innerHTML = data;
            console.log("Footer chargé avec succès.");
        })
        .catch(error => console.error("Erreur de chargement du footer :", error));
});
