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
    fetch("/components/header.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("header").innerHTML = data;
        });

    // Charger le footer
    fetch("/components/footer.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("footer").innerHTML = data;
        });
});
