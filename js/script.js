document.addEventListener("DOMContentLoaded", () => {
    const burgerMenu = document.getElementById("burgerMenu");
    const overlayMenu = document.getElementById("overlayMenu");

    burgerMenu.addEventListener("click", () => {
        overlayMenu.classList.toggle("active");
    });

    overlayMenu.addEventListener("click", (event) => {
        if (event.target === overlayMenu) {
            overlayMenu.classList.remove("active");
        }
    });
});
