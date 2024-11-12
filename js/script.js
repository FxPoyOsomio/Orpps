import { initializeRecipes } from './recettes.js';

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM content loaded, starting header fetch...");

    fetch("/components/header.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("header").innerHTML = data;

            initializeHeader();
            applySearchEventsOnHeaderOpen();

            // Initialiser l'affichage des recettes filtrées, si on est sur la page des recettes
            if (window.location.pathname === "/recettes.html" || window.location.search.includes("categorie") || window.location.search.includes("searchTerms")) {
                initializeRecipes();
            }
        })
        .catch(error => console.error("Error loading header:", error));

    // Charger le footer
    fetch("/components/footer.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("footer").innerHTML = data;
        });
});

// Fonction pour initialiser la barre de recherche dans la div `headerSearchBar`
function initializeSearchBar() {
    const searchBarContainer = document.getElementById("headerSearchBar");
    if (searchBarContainer && !searchBarContainer.querySelector(".header__search-content")) {
        const searchContent = createSearchContent();
        searchBarContainer.appendChild(searchContent);

        // Démarrer l'animation de la barre de recherche uniquement si elle est visible
        if (searchBarContainer.offsetParent !== null) { // Vérifie si visible
            setTimeout(() => animateSearchBar(searchContent), 100);
        }
    }
}

// Fonction d'initialisation du header (burger menu, overlay, animation des catégories)
function initializeHeader() {
    const burgerMenu = document.getElementById("burgerMenu");
    const overlayMenu = document.getElementById("overlayMenu");
    const header = document.querySelector(".header");

    if (burgerMenu && overlayMenu) {
        burgerMenu.addEventListener("click", () => {
            header.classList.toggle("modal-burger-open");
            overlayMenu.classList.toggle("active");
            burgerMenu.classList.toggle("active");

            const isActive = overlayMenu.classList.contains("active");

            // Activer/désactiver l'animation des boutons de catégorie
            animateCategoryButtons(isActive);

            if (isActive) {
                initializeSearchBar(); // Afficher et animer la barre de recherche quand le menu s'ouvre
                document.addEventListener("click", handleOutsideClick);
            } else {
                resetSearchBar(); // Rétracter la barre de recherche quand le menu se ferme
                document.removeEventListener("click", handleOutsideClick);
            }
        });
    }
}

// Gérer le clic en dehors du menu pour le fermer
function handleOutsideClick(event) {
    const overlayMenu = document.getElementById("overlayMenu");
    const burgerMenu = document.getElementById("burgerMenu");
    const header = document.querySelector(".header");
    const headerContainer = document.querySelector(".header__container");

    if (shouldCloseMenu(event, overlayMenu, burgerMenu, header, headerContainer)) {
        closeMenu(header, overlayMenu, burgerMenu);
        resetSearchBar(); // Assurez-vous que la barre de recherche est rétractée si le menu est fermé
        document.removeEventListener("click", handleOutsideClick);
    }
}

// Fonction pour ajouter les événements de recherche
function applySearchEventsOnHeaderOpen() {
    const searchButton = document.getElementById("SearchBarButton");
    const searchInput = document.getElementById("searchInput");

    if (searchButton && searchInput) {
        searchButton.addEventListener("click", () => {
            const searchTerms = searchInput.value.trim();
            if (searchTerms) {
                window.location.href = `/recettes?searchTerms=${encodeURIComponent(searchTerms)}`;
            }
        });

        searchInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                const searchTerms = searchInput.value.trim();
                if (searchTerms) {
                    window.location.href = `/recettes?searchTerms=${encodeURIComponent(searchTerms)}`;
                }
            }
        });
    }
}





// Fonction pour ajouter les événements de recherche à la searchBar
function applySearchEvents(searchBarContainer) {
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("SearchBarButton");

    if (searchInput) {
        console.log("Input de recherche trouvé");
        searchInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                filterRecipesByCategoryAndSearch();
            }
        });
    } else {
        console.log("Impossible de trouver l'élément input de recherche.");
    }

    if (searchButton) {
        console.log("Bouton de recherche trouvé");
        searchButton.addEventListener("click", filterRecipesByCategoryAndSearch);
    } else {
        console.log("Impossible de trouver le bouton de recherche.");
    }
}

// Fonction pour filtrer les recettes par catégorie et termes de recherche
function filterRecipesByCategoryAndSearch(selectedCategory = null) {
    const searchInput = document.querySelector(".header__search-content input");
    const searchTerms = searchInput ? searchInput.value.trim() : '';

    const url = `/path_to_netlify_function/get-recettes?filterByCategory=${encodeURIComponent(selectedCategory || '')}&searchTerms=${encodeURIComponent(searchTerms)}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log("Recettes filtrées :", data);
            // Insérez ici le code pour afficher les recettes filtrées
        })
        .catch(error => console.error("Erreur lors de la récupération des recettes :", error));
}


// Vérifier si on doit fermer le menu
function shouldCloseMenu(event, overlayMenu, burgerMenu, header, headerContainer) {
    return !overlayMenu.contains(event.target) &&
           !burgerMenu.contains(event.target) &&
           !header.contains(event.target) &&
           !headerContainer.contains(event.target);
}

// Fonction pour fermer le menu
function closeMenu(header, overlayMenu, burgerMenu) {
    header.classList.remove("modal-burger-open");
    overlayMenu.classList.remove("active");
    burgerMenu.classList.remove("active");
}

// Fonction pour basculer la barre de recherche (ouvrir/fermer avec animation)
function handleSearchBarToggle(searchBarContainer) {
    if (searchBarContainer) {
        if (!searchBarContainer.querySelector(".header__search-content")) {
            const searchContent = createSearchContent();
            searchBarContainer.appendChild(searchContent);
            setTimeout(() => animateSearchBar(searchContent), 100);
        } else {
            resetSearchBar(searchBarContainer);
        }
    }
}

function handleSearchBarReset(searchBarContainer) {
    if (searchBarContainer) {
        const searchContent = searchBarContainer.querySelector(".header__search-content");
        if (searchContent) {
            resetSearchBar(searchBarContainer);
        }
    }
}

// Réinitialiser la barre de recherche
function resetSearchBar() {
    const searchBarContainer = document.getElementById("headerSearchBar");
    if (searchBarContainer) {
        const searchContent = searchBarContainer.querySelector(".header__search-content");
        if (searchContent) {
            searchContent.querySelector("input").style.opacity = "0";
            searchContent.style.width = "50px";
            searchContent.style.opacity = "0";
            setTimeout(() => searchBarContainer.innerHTML = '', 600);
        }
    }
}

// Fonction de création de contenu pour la barre de recherche
function createSearchContent() {
    const searchContent = document.createElement("div");
    searchContent.className = "header__search-content";
    searchContent.style.display = "flex";
    searchContent.style.alignItems = "center";
    searchContent.style.border = "1px solid rgba(63, 55, 53, 0.23)";
    searchContent.style.borderRadius = "50px";
    searchContent.style.padding = "5px 10px";
    searchContent.style.width = "50px";
    searchContent.style.opacity = "0";
    searchContent.style.transition = "width 0.9s ease, opacity 0.3s ease";

    const searchButton = document.createElement("div");
    searchButton.className = "search-bar__button";
    searchButton.id = "SearchBarButton";
    searchButton.innerHTML = `
        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#696969">
            <path d="M16.6725 16.6412L21 21M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="#696969" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
    `;
    searchButton.style.marginRight = "10px";
    searchButton.style.cursor = "pointer";
    searchButton.addEventListener("click", SearchRecipe);

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.id = "searchInput"; 
    searchInput.placeholder = "Recherche";
    searchInput.style.border = "none";
    searchInput.style.outline = "none";
    searchInput.style.flex = "1";
    searchInput.style.opacity = "0";
    searchInput.style.transition = "opacity 0.4s ease 0.3s";
    searchInput.style.backgroundColor = "transparent";

    searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            SearchRecipe();
        }
    });

    searchContent.appendChild(searchButton);
    searchContent.appendChild(searchInput);

    return searchContent;
}



// Animation de la barre de recherche
function animateSearchBar(searchContent) {
    searchContent.style.width = "250px";
    searchContent.style.opacity = "1";
    searchContent.querySelector("input").style.opacity = "1";
}





// Fonction pour animer les boutons de catégorie lors de l'ouverture/fermeture du menu
function animateCategoryButtons(isActive) {
    const categoryButtonsContainer = document.querySelector('.Menu_categorie');
    if (categoryButtonsContainer) {
        const categoryButtons = categoryButtonsContainer.querySelectorAll('secondary-button');

        if (isActive) {
            // Afficher les boutons puis appliquer une transition d'opacité
            categoryButtons.forEach((button, index) => {
                button.style.display = "inline-block";
                setTimeout(() => {
                    button.style.opacity = "1";
                    button.style.transition = `opacity 0.8s ease ${index * 0.1}s`;
                }, 0);
            });
        } else {
            // Masquer les boutons en supprimant leur opacité
            categoryButtons.forEach(button => {
                button.style.opacity = "0";
                // Utiliser un timeout pour masquer après la transition
                setTimeout(() => {
                    button.style.display = "none";
                }, 600); // Correspond à la durée de l'animation de 0.6s
            });
        }
    }
}


// Fonction principale de recherche
function SearchRecipe() {
    console.log("SearchRecipe appelé");

    const searchBarInput = document.querySelector(".header__search-content input");
    if (searchBarInput) {
        const inputValue = searchBarInput.value.replace(/,/g, ' ');
        const searchTerms = inputValue.split(' ').map(term => term.trim()).filter(term => term !== '');

        if (searchTerms.length > 0) {
            const searchQuery = encodeURIComponent(searchTerms.join(' '));
            setTimeout(() => {
                window.location.assign(`/recettes?searchTerms=${searchQuery}`);
            }, 100);
        }
    } else {
        console.log("Le champ de recherche n'a pas été trouvé.");
    }
}

























//  Primary Button Component 

class PrimaryButton extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });

        const button = document.createElement('button');
        button.style.backgroundColor = '#CB6863'; // Couleur de fond
        button.style.color = '#fff'; // Couleur du texte
        button.style.borderRadius = '50px'; // Arrondi des coins
        button.style.padding = '10px 20px'; // Espacement interne
        button.style.border = 'none'; // Pas de bordure
        button.style.cursor = 'pointer';
        button.style.display = 'flex'; // Pour aligner le contenu
        button.style.alignItems = 'center'; // Aligner verticalement
        button.style.justifyContent = 'center'; // Centrer le contenu horizontalement
        button.style.height = '40px'; // Hauteur fixe pour le bouton
        button.style.width = 'auto'; // Largeur auto pour le bouton
        button.style.position = 'relative'; // Nécessaire pour le masque
        button.style.overflow = 'hidden'; // Pour cacher le masque qui dépasse
        button.style.transition = 'transform 0.2s'; // Transition pour le hover
        button.style.margin = '0 10px'; // Padding de 10px sur côté du bouton

        // Créer une div pour l'icône SVG
        const iconContainer = document.createElement('div');
        iconContainer.style.width = '22px'; // Largeur fixe pour le conteneur de l'icône
        iconContainer.style.height = '22px'; // Hauteur fixe pour le conteneur de l'icône
        iconContainer.style.display = 'flex'; // Utiliser flex pour centrer l'icône
        iconContainer.style.alignItems = 'center'; // Aligner verticalement
        iconContainer.style.justifyContent = 'center'; // Centrer horizontalement
        iconContainer.style.marginRight = '10px'; // Espace entre l'icône et le texte

        // Vérifier s'il y a un SVG
        const svg = this.querySelector('svg'); // Cherche un SVG dans les enfants
        if (svg) {
            svg.setAttribute('fill', 'white'); // Définir le fill en blanc
            svg.style.width = '22px'; // Largeur fixe pour le SVG
            svg.style.height = '22px'; // Hauteur fixe pour le SVG
            iconContainer.appendChild(svg); // Ajouter le SVG au conteneur
            button.appendChild(iconContainer); // Ajouter l'icône au bouton
        }

        // Vérifier s'il y a du texte
        const buttonText = this.getAttribute('text');
        if (buttonText) {
            const textElement = document.createElement('span');
            textElement.textContent = buttonText;
            textElement.style.fontFamily = "'Montserrat Alternates"; // Police du texte
            textElement.style.fontSize = '1.1em'; // Taille de la police
            textElement.style.fontWeight = '400'; // Graisse de la police // Utiliser le texte fourni
            button.appendChild(textElement); // Ajouter le texte au bouton
        }

        // Si le bouton ne contient que le SVG
        if (!buttonText && svg) {
            button.style.width = '40px'; // Largeur fixe pour le bouton (forme un cercle)
            iconContainer.style.marginRight = '0'; // Enlever la marge droite pour centrer le SVG
        }

        // Styles pour le hover
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)'; // Agrandir le bouton au survol
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)'; // Réinitialiser à la taille normale
        });

        // Styles pour le clic actif
        button.addEventListener('mousedown', () => {
            // Créer le masque d'onde
            const ripple = document.createElement('span');
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%'; // S'assurer que c'est un cercle
            
            // Calculer la largeur de la bordure en fonction de la taille actuelle
            const borderWidth = button.offsetWidth / 50; // Largeur dynamique
            ripple.style.border = `${borderWidth}px solid #F5E1DE`; // Bordure dynamique
            ripple.style.backgroundColor = 'transparent'; // Fond transparent
            ripple.style.pointerEvents = 'none'; // Pour que l'onde ne bloque pas les événements de clic
            ripple.style.width = '10px'; // Largeur de l'onde (ajuster selon besoin)
            ripple.style.height = '10px'; // Hauteur de l'onde
            ripple.style.transform = 'scale(1)'; // Commencer à 1px
            ripple.style.transition = 'transform 1s cubic-bezier(0.5, 0, 0.5, 1)'; // Durée de 1 seconde avec courbe de vitesse

            // Positionner l'onde au centre du bouton
            const centerX = button.offsetWidth / 2; // Centre du bouton en X
            const centerY = button.offsetHeight / 2; // Centre du bouton en Y

            ripple.style.left = `${centerX}px`; // Positionner au centre en X
            ripple.style.top = `${centerY}px`; // Positionner au centre en Y
            ripple.style.transformOrigin = 'center'; // Origine de transformation au centre
            ripple.style.transform = `translate(-50%, -50%) scale(1)`; // Centrer et étendre l'onde

            button.appendChild(ripple); // Ajouter le masque au bouton

            // Lancer l'animation après un léger délai
            setTimeout(() => {
                ripple.style.transform = 'translate(-50%, -50%) scale(100)'; // Étendre l'onde
            }, 10);

            // Supprimer le masque après l'animation
            ripple.addEventListener('transitionend', () => {
                ripple.remove();
            });
        });

        button.addEventListener('mouseup', () => {
            // Suppression du changement de taille pour l'état actif
            // Redirection après un délai de 500 ms
            setTimeout(() => {
                const redirectUrl = this.getAttribute('href'); // Récupérer l'URL depuis l'attribut href
                window.location.href = redirectUrl; // Rediriger vers l'URL
            }, 300);
        });

        shadow.appendChild(button);
    }
}

customElements.define('primary-button', PrimaryButton);










// Secondary Button Component 
class SecondaryButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Créer un bouton
        this.button = document.createElement('button');
        this.button.style.color = '#CB6863'; // Couleur du texte
        this.button.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'; // Supprimer la couleur de fond
        this.button.style.backdropFilter = 'blur(5px)';
        this.button.style.borderRadius = '50px'; // Arrondi des coins
        this.button.style.padding = '10px 20px'; // Espacement interne
        this.button.style.border = '1px solid #CB6863'; // Bordure de 1px de couleur #CB6863
        this.button.style.cursor = 'pointer';
        this.button.style.display = 'flex'; // Pour aligner le contenu
        this.button.style.alignItems = 'center'; // Aligner verticalement
        this.button.style.justifyContent = 'center'; // Centrer le contenu horizontalement
        this.button.style.height = '40px'; // Hauteur fixe pour le bouton
        this.button.style.width = 'auto'; // Largeur auto pour le bouton
        this.button.style.position = 'relative'; // Nécessaire pour le masque
        this.button.style.overflow = 'hidden'; // Pour cacher le masque qui dépasse
        this.button.style.transition = 'transform 0.2s'; // Transition pour le hover
        this.button.style.margin = '0 10px'; // Espacement

        // Créer une div pour l'icône SVG
        this.iconContainer = document.createElement('div');
        this.iconContainer.style.width = '22px';
        this.iconContainer.style.height = '22px';
        this.iconContainer.style.display = 'flex';
        this.iconContainer.style.alignItems = 'center';
        this.iconContainer.style.justifyContent = 'center';

        // Vérifier s'il y a un SVG
        const svg = this.querySelector('svg');
        if (svg) {
            svg.setAttribute('fill', '#CB6863');
            svg.style.width = '22px';
            svg.style.height = '22px';
            this.iconContainer.appendChild(svg);
            this.button.appendChild(this.iconContainer);
        }

        // Ajouter le bouton au shadow DOM
        this.shadowRoot.appendChild(this.button);

        // Styles pour le hover
        this.button.addEventListener('mouseenter', () => {
            this.button.style.transform = 'scale(1.1)'; // Agrandir le bouton au survol
        });

        this.button.addEventListener('mouseleave', () => {
            this.button.style.transform = 'scale(1)'; // Réinitialiser à la taille normale
        });

        // Styles pour le clic actif
        this.button.addEventListener('mousedown', () => {
            // Créer le masque d'onde
            const ripple = document.createElement('span');
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%'; // S'assurer que c'est un cercle

            // Calculer la largeur de la bordure en fonction de la taille actuelle
            const borderWidth = this.button.offsetWidth / 50; // Largeur dynamique
            ripple.style.border = `${borderWidth}px solid #F5E1DE`; // Bordure dynamique
            ripple.style.backgroundColor = 'transparent'; // Fond transparent
            ripple.style.pointerEvents = 'none'; // Pour que l'onde ne bloque pas les événements de clic
            ripple.style.width = '10px'; // Largeur de l'onde (ajuster selon besoin)
            ripple.style.height = '10px'; // Hauteur de l'onde
            ripple.style.transform = 'scale(1)'; // Commencer à 1px
            ripple.style.transition = 'transform 1s cubic-bezier(0.5, 0, 0.5, 1)'; // Durée de 1 seconde avec courbe de vitesse

            // Positionner l'onde au centre du bouton
            const centerX = this.button.offsetWidth / 2; // Centre du bouton en X
            const centerY = this.button.offsetHeight / 2; // Centre du bouton en Y

            ripple.style.left = `${centerX}px`; // Positionner au centre en X
            ripple.style.top = `${centerY}px`; // Positionner au centre en Y
            ripple.style.transformOrigin = 'center'; // Origine de transformation au centre
            ripple.style.transform = `translate(-50%, -50%) scale(1)`; // Centrer et étendre l'onde

            this.button.appendChild(ripple); // Ajouter le masque au bouton

            // Lancer l'animation après un léger délai
            setTimeout(() => {
                ripple.style.transform = 'translate(-50%, -50%) scale(100)'; // Étendre l'onde
            }, 10);

            // Supprimer le masque après l'animation
            ripple.addEventListener('transitionend', () => {
                ripple.remove();
            });
        });

        this.button.addEventListener('mouseup', () => {
            // Suppression du changement de taille pour l'état actif
            // Redirection après un délai de 500 ms
            setTimeout(() => {
                const redirectUrl = this.getAttribute('href'); // Récupérer l'URL depuis l'attribut href
                if (redirectUrl) {
                    window.location.href = redirectUrl; // Rediriger vers l'URL
                }
            }, 300);
        });
    }

    connectedCallback() {
        // Appelée lorsque l'élément est ajouté au DOM
        const buttonText = this.getAttribute('text');
        if (buttonText) {
            // Si le texte est présent
            this.textElement = document.createElement('span');
            this.textElement.textContent = buttonText;
            this.textElement.style.color = '#CB6863';
            this.textElement.style.fontFamily = "'Montserrat Alternates'";
            this.textElement.style.fontSize = '1.1em';
            this.textElement.style.fontWeight = '400';
            this.button.appendChild(this.textElement);

            // Ajuster les styles pour le bouton avec texte
            this.button.style.padding = '10px 20px';
            this.button.style.width = 'auto';
            this.iconContainer.style.marginRight = '10px'; // Espace entre l'icône et le texte
        } else {
            // Si aucun texte n'est présent
            this.button.style.padding = '10px'; // Réduire le padding pour garder le bouton en cercle
            this.button.style.width = '40px'; // Largeur et hauteur égales pour un cercle
            this.button.style.height = '40px';
            this.iconContainer.style.marginRight = '0'; // Pas de marge pour centrer
        }
    }

    static get observedAttributes() {
        return ['text'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'text' && oldValue !== newValue) {
            if (this.textElement) {
                this.textElement.textContent = newValue;
            }
        }
    }
}

customElements.define('secondary-button', SecondaryButton);





