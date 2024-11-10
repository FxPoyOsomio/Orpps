//Regler hauteur de conainer PORTION identique à celle de TIMING et reciproquement l'inverse
document.addEventListener('DOMContentLoaded', function() {
    // Fonction pour égaliser les hauteurs des conteneurs
    function setEqualHeight() {
        // Vérifie si la largeur de la fenêtre est de 741 pixels ou plus
        if (window.innerWidth >= 741) {
            const portionContainer = document.querySelector('.container-portion');
            const timingContainer = document.querySelector('.container-timing');

            if (portionContainer && timingContainer) {
                // Réinitialiser les hauteurs des deux conteneurs avant de mesurer
                portionContainer.style.height = 'auto';
                timingContainer.style.height = 'auto';

                // Calculer les hauteurs des deux éléments en utilisant scrollHeight
                const portionHeight = portionContainer.scrollHeight;
                const timingHeight = timingContainer.scrollHeight;

                // Déterminer la hauteur maximale et l'appliquer en tant que `height` aux deux éléments
                const maxHeight = Math.max(portionHeight, timingHeight);

                console.log("Portion Height:", portionHeight, "Timing Height:", timingHeight, "Max Height:", maxHeight);

                portionContainer.style.height = `${maxHeight}px`;
                timingContainer.style.height = `${maxHeight}px`;
            } else {
                console.error("Les conteneurs '.container-portion' et/ou '.container-timing' n'ont pas été trouvés.");
            }
        } else {
            // Réinitialiser les hauteurs lorsque la largeur de l'écran est inférieure à 741 pixels
            const portionContainer = document.querySelector('.container-portion');
            const timingContainer = document.querySelector('.container-timing');

            if (portionContainer && timingContainer) {
                portionContainer.style.height = 'auto';
                timingContainer.style.height = 'auto';
            }
        }
    }

    // Appeler la fonction au chargement de la page et lors du redimensionnement
    setEqualHeight();
    window.addEventListener('resize', function() {
        clearTimeout(window.equalHeightTimeout);
        window.equalHeightTimeout = setTimeout(setEqualHeight, 100);
    });
});


document.addEventListener('DOMContentLoaded', function() {
    function setEqualHeight() {
        // Vérifie si la largeur de la fenêtre est de 741 pixels ou plus
        if (window.innerWidth >= 741) {
            const imgRecetteContainer = document.querySelector('.container__img-recette__two-column-page');
            const infoRecetteContainer = document.querySelector('.container__info-recette');

            if (imgRecetteContainer && infoRecetteContainer) {
                // Réinitialiser les hauteurs des deux conteneurs avant de mesurer
                imgRecetteContainer.style.height = 'auto';
                infoRecetteContainer.style.height = 'auto';

                // Calculer les hauteurs des deux éléments
                const imgHeight = imgRecetteContainer.scrollHeight;
                const infoHeight = infoRecetteContainer.scrollHeight;

                // Déterminer la hauteur maximale et l'appliquer en tant que `height` aux deux éléments
                const maxHeight = Math.max(imgHeight, infoHeight);

                imgRecetteContainer.style.height = `${maxHeight}px`;
                infoRecetteContainer.style.height = `${maxHeight}px`;
            }
        } else {
            // Réinitialiser les hauteurs lorsque la largeur de l'écran est inférieure à 741 pixels
            const imgRecetteContainer = document.querySelector('.container__img-recette__two-column-page');
            const infoRecetteContainer = document.querySelector('.container__info-recette');

            if (imgRecetteContainer && infoRecetteContainer) {
                imgRecetteContainer.style.height = 'auto';
                infoRecetteContainer.style.height = 'auto';
            }
        }
    }

    // Appeler la fonction au chargement de la page et lors du redimensionnement
    setEqualHeight();
    window.addEventListener('resize', function() {
        clearTimeout(window.equalHeightTimeout);
        window.equalHeightTimeout = setTimeout(setEqualHeight, 100);
    });
});




// Appliquer le data-View list sur mobile
document.addEventListener('DOMContentLoaded', function() {
    const toggleViewButtonContainer = document.getElementById('toggleViewButtonContainer');
    const containers = document.querySelectorAll(".recette_ingredients-items");

    if (window.innerWidth <= 670) {
        // Si la largeur est <= 670px, définir le data-view sur "list"
        toggleViewButtonContainer.dataset.view = 'list';

        // Modifier l'affichage pour "list-view"
        containers.forEach(container => {
            container.classList.add("list-view");
        });

        // Mettre à jour l'icône en affichage List
        const listSVG = `
            <svg class="titre-section-image" width="64px" height="64px" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M8.5 10.5H5L6.5 19.5H18.5L20 10.5H16.5M8.5 10.5L10.2721 5.18377C10.4082 4.77543 10.7903 4.5 11.2208 4.5H13.7792C14.2097 4.5 14.5918 4.77543 14.7279 5.18377L16.5 10.5M8.5 10.5H16.5" stroke="#CB6863" stroke-width="1.2"></path> <path d="M12.5 10.5V19.5" stroke="#CB6863" stroke-width="1.2"></path> <path d="M9.5 19.5L8.5 10.5" stroke="#CB6863" stroke-width="1.2"></path> <path d="M15.5 19.5L16.5 10.5" stroke="#CB6863" stroke-width="1.2"></path> <path d="M19.5 13.5H5.5" stroke="#CB6863" stroke-width="1.2"></path> <path d="M19 16.5H6" stroke="#CB6863" stroke-width="1.2"></path> </g></svg>
        `;
        toggleViewButtonContainer.innerHTML = listSVG;
    }
});