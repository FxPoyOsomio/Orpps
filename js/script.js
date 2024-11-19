document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM content loaded, starting header and footer fetch...");

    // Sauvegarder immédiatement le hash avant qu'il ne soit écrasé
    const hash = window.location.hash;
    if (hash.includes('invite_token')) {
        const inviteToken = hash.split('invite_token=')[1];
        console.log("Invite token détecté :", inviteToken);
        localStorage.setItem('inviteToken', inviteToken); // Sauvegarder dans localStorage
        // Nettoyer l'URL sans recharger la page
        window.history.replaceState(null, null, window.location.pathname);
    }

    // Vérifier Netlify Identity
    if (typeof netlifyIdentity !== 'undefined') {
        console.log("Netlify Identity détecté.");
        netlifyIdentity.init();

        // Récupérer le token depuis localStorage
        const savedToken = localStorage.getItem('inviteToken');
        if (savedToken) {
            console.log("Tentative d'acceptation de l'invitation avec le token :", savedToken);
            netlifyIdentity
                .acceptInvite(savedToken)
                .then(() => {
                    console.log("Invitation acceptée avec succès.");
                    localStorage.removeItem('inviteToken'); // Nettoyer après succès
                    window.location.replace('/'); // Rediriger après succès
                })
                .catch((error) => {
                    console.error("Erreur lors de l'acceptation de l'invitation :", error);
                });
        } else {
            console.log("Aucun token d'invitation trouvé dans localStorage.");
        }

        // Vérifier si un utilisateur est connecté
        const user = netlifyIdentity.currentUser();
        if (user) {
            console.log('Utilisateur connecté :', user.email);
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('userToken', user.token.access_token);
        } else {
            console.log('Aucun utilisateur connecté via Netlify Identity.');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userToken');
        }

        // Gérer les événements de connexion et déconnexion
        netlifyIdentity.on('login', (user) => {
            console.log('Utilisateur connecté :', user.email);
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('userToken', user.token.access_token);
            location.reload(); // Recharger la page après connexion
        });

        netlifyIdentity.on('logout', () => {
            console.log('Utilisateur déconnecté');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userToken');
            location.reload(); // Recharger la page après déconnexion
        });
    } else {
        console.error("Netlify Identity n'est pas disponible.");
    }

    // Charger et insérer le header
    fetch("/components/header.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("header").innerHTML = data;
            console.log("Header loaded successfully");

            initializeHeader(); // Initialiser les éléments du header une fois le HTML chargé
            applySearchEventsOnHeaderOpen();
            applySearchEvents(document.getElementById("headerSearchBar")); // Activer les événements de la barre de recherche
            applySearchEventsOnCategories();
        })
        .catch(error => console.error("Error loading header:", error));

    // Charger le footer
    fetch("/components/footer.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("footer").innerHTML = data;
        });
});






// Fonction pour initialiser les éléments du header (menu, animation, barre de recherche)
function initializeHeader() {
    const burgerMenu = document.getElementById("burgerMenu");
    const overlayMenu = document.getElementById("overlayMenu");
    const header = document.querySelector(".header");
    const navContainers = document.querySelectorAll(".header__nav_container"); // Tous les containers

    if (burgerMenu && overlayMenu) {
        burgerMenu.addEventListener("click", () => {
            const isMenuActive = overlayMenu.classList.toggle("active"); // Ouvrir/Fermer le menu
            header.classList.toggle("modal-burger-open");
            burgerMenu.classList.toggle("active");

            // Ajouter ou retirer la classe 'visible' avec un délai entre chaque container
            navContainers.forEach((container, index) => {
                if (isMenuActive) {
                    container.style.transitionDelay = `${index * 0.1}s`; // Définir le délai pour l'apparition
                    container.classList.add("visible");
                } else {
                    container.style.transitionDelay = `${(navContainers.length - index) * 0.1}s`; // Délai inverse pour la disparition
                    container.classList.remove("visible");
                }
            });

            initializeSearchBar();
            animateCategoryButtons(isMenuActive); // Animation des boutons de catégorie

        });


        document.addEventListener("click", (event) => {
            if (shouldCloseMenu(event, overlayMenu, burgerMenu, header)) {
                closeMenu(header, overlayMenu, burgerMenu);

                // Retirer la classe 'visible' avec des délais inversés
                navContainers.forEach((container, index) => {
                    container.style.transitionDelay = `${(navContainers.length - index) * 0.1}s`; // Délai inverse
                    container.classList.remove("visible");
                });
            }
        });
    }
}


// Fonction pour initialiser la barre de recherche dans la div `headerSearchBar`
function initializeSearchBar() {
    const searchBarContainer = document.getElementById("headerSearchBar");

    if (searchBarContainer) {
        // Supprimez tout contenu existant pour repartir de zéro
        searchBarContainer.innerHTML = '';

        // Créez et ajoutez la barre de recherche
        const searchContent = createSearchContent();
        searchBarContainer.appendChild(searchContent);

        // Démarrez l'animation de la barre de recherche uniquement si elle est visible
        if (searchBarContainer.offsetParent !== null) {
            setTimeout(() => animateSearchBar(searchContent), 100);
        }
    }
}

// Fonction pour réinitialiser les styles de la barre de recherche
function resetSearchBarAnimation(container) {
    const searchContent = container.querySelector(".header__search-content");
    if (searchContent) {
        searchContent.style.width = "50px";
        searchContent.style.opacity = "0";
        const input = searchContent.querySelector("input");
        if (input) input.style.opacity = "0";
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
        resetSearchBarAnimation(searchBarContainer); // Assurez-vous que la barre de recherche est rétractée si le menu est fermé
        document.removeEventListener("click", handleOutsideClick);
    }
}

// Appliquer les événements de recherche lors de l'ouverture du header
function applySearchEventsOnHeaderOpen() {
    const searchButton = document.getElementById("headerSearchBarButton");
    const searchInput = document.getElementById("headerSearchInput");

    if (searchButton && searchInput) {
        searchButton.addEventListener("click", filterRecipesByCategoryAndSearch);
        searchInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") filterRecipesByCategoryAndSearch();
        });
    }
}

function applySearchEventsOnCategories() {
    const categoryButtons = document.querySelectorAll('.Menu_categorie secondary-button');

    categoryButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault(); // Empêcher la redirection par défaut du lien

            const selectedCategory = button.getAttribute('href').split('=')[1];
            const searchBarInput = document.querySelector(".header__search-content input");
            const searchTerms = searchBarInput ? searchBarInput.value.trim() : '';

            let newUrl = `/recettes?categorie=${encodeURIComponent(selectedCategory)}`;
            if (searchTerms) {
                newUrl += `&searchTerms=${encodeURIComponent(searchTerms)}`;
            }

            console.log("Nouvelle URL construite :", newUrl);
            window.location.assign(newUrl);
        });
    });
}


// Fonction pour filtrer par catégorie et termes de recherche
function filterRecipesByCategoryAndSearch() {
    const searchInput = document.querySelector(".header__search-content input");
    const searchTerms = searchInput ? searchInput.value.trim() : '';
    const urlParams = new URLSearchParams(window.location.search);
    const selectedCategory = urlParams.get('categorie') || '';

    let newUrl = '/recettes';
    if (selectedCategory || searchTerms) {
        newUrl += '?';
        if (selectedCategory) {
            newUrl += `categorie=${encodeURIComponent(selectedCategory)}`;
        }
        if (searchTerms) {
            newUrl += `${selectedCategory ? '&' : ''}searchTerms=${encodeURIComponent(searchTerms)}`;
        }
    }

    console.log("URL finale avec recherche :", newUrl);
    window.location.assign(newUrl);
}









// Fonction pour ajouter les événements de recherche à la searchBar
function applySearchEvents(searchBarContainer) {
    const searchInput = document.getElementById("searchInput");
    const searchButton = document.getElementById("SearchBarButton");

    if (searchInput) {
        console.log("Input de recherche trouvé");

        // Écouteur d'événements pour détecter les changements de texte en temps réel
        searchInput.addEventListener("input", () => {
            console.log("Modification de l'input détectée :", searchInput.value);
            // Mettez à jour l'URL en temps réel ou préparez le filtre ici si nécessaire
        });

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





// Fonction pour vérifier si on doit fermer le menu
function shouldCloseMenu(event, overlayMenu, burgerMenu, header, headerContainer) {
    return (
        overlayMenu && !overlayMenu.contains(event.target) &&
        burgerMenu && !burgerMenu.contains(event.target) &&
        header && !header.contains(event.target) &&
        (!headerContainer || !headerContainer.contains(event.target))
    );
}

// Fonction pour fermer le menu
function closeMenu(header, overlayMenu, burgerMenu) {
    header.classList.remove("modal-burger-open");
    overlayMenu.classList.remove("active");
    burgerMenu.classList.remove("active");
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

// Fonction pour créer le contenu de la barre de recherche
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



// Fonction pour animer la barre de recherche
function animateSearchBar(searchContent) {
    searchContent.style.width = "calc(100% - 40px)";
    searchContent.style.opacity = "1";
    const input = searchContent.querySelector("input");
    if (input) input.style.opacity = "1";
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


function SearchRecipe() {
    console.log("SearchRecipe appelé");

    const searchBarInput = document.querySelector(".header__search-content input");
    if (searchBarInput) {
        const inputValue = searchBarInput.value.replace(/,/g, ' ');
        const searchTerms = inputValue.split(' ').map(term => term.trim()).filter(term => term !== '');

        const searchQuery = searchTerms.length > 0 ? encodeURIComponent(searchTerms.join(' ')) : '';
        const urlParams = new URLSearchParams(window.location.search);
        const selectedCategory = urlParams.get('categorie') || '';

        // Construire l'URL avec searchTerms et categorie, si présents
        let newUrl = '/recettes';
        if (searchQuery || selectedCategory) {
            newUrl += '?';
            if (selectedCategory) {
                newUrl += `categorie=${encodeURIComponent(selectedCategory)}`;
            }
            if (searchQuery) {
                newUrl += `${selectedCategory ? '&' : ''}searchTerms=${searchQuery}`;
            }
        }

        // Rediriger vers la nouvelle URL
        setTimeout(() => {
            window.location.assign(newUrl);
        }, 100);
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
            textElement.style.fontSize = '1.1rem'; // Taille de la police
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
        this.button.style.backgroundColor = 'transparent'; // Supprimer la couleur de fond
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
            this.textElement.style.fontSize = '1.1rem';
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












class AddFavoriteButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Récupérer l'ID de la recette depuis l'attribut HTML
        this.recipeId = this.getAttribute('data-recipe-id');
        this.isActive = false; // Initialement, la recette n'est pas dans les favoris

        // Créer un bouton
        this.button = document.createElement('button');
        this.button.style = `
            color: #CB6863;
            background-color: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(5px);
            border-radius: 50px;
            padding: 10px;
            border: 1px solid #CB6863;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 40px;
            width: 40px;
            position: relative;
            overflow: hidden;
            transition: transform 0.2s;
            margin: 0 10px;
        `;

        this.iconContainer = document.createElement('div');
        this.iconContainer.style = `
            width: 22px;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        this.button.appendChild(this.iconContainer);
        this.shadowRoot.appendChild(this.button);


    }



    

    updateIcon() {
        this.iconContainer.innerHTML = this.isActive
            ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="#CB6863" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M5.62436 4.4241C3.96537 5.18243 2.75 6.98614 2.75 9.13701C2.75 11.3344 3.64922 13.0281 4.93829 14.4797C6.00072 15.676 7.28684 16.6675 8.54113 17.6345C8.83904 17.8642 9.13515 18.0925 9.42605 18.3218C9.95208 18.7365 10.4213 19.1004 10.8736 19.3647C11.3261 19.6292 11.6904 19.7499 12 19.7499C12.3096 19.7499 12.6739 19.6292 13.1264 19.3647C13.5787 19.1004 14.0479 18.7365 14.574 18.3218C14.8649 18.0925 15.161 17.8642 15.4589 17.6345C16.7132 16.6675 17.9993 15.676 19.0617 14.4797C20.3508 13.0281 21.25 11.3344 21.25 9.13701C21.25 6.98614 20.0346 5.18243 18.3756 4.4241C16.9023 3.75065 14.9662 3.85585 13.0725 5.51217L14.5302 6.9694C14.8232 7.26224 14.8233 7.73711 14.5304 8.03006C14.2376 8.323 13.7627 8.32309 13.4698 8.03025L11.4698 6.03097L11.4596 6.02065C9.40166 3.88249 7.23607 3.68739 5.62436 4.4241Z"
                    />
                </svg>`
            : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill="none" stroke="#CB6863" stroke-width="1.5"
                        d="M5.62436 4.4241C3.96537 5.18243 2.75 6.98614 2.75 9.13701C2.75 11.3344 3.64922 13.0281 4.93829 14.4797C6.00072 15.676 7.28684 16.6675 8.54113 17.6345C8.83904 17.8642 9.13515 18.0925 9.42605 18.3218C9.95208 18.7365 10.4213 19.1004 10.8736 19.3647C11.3261 19.6292 11.6904 19.7499 12 19.7499C12.3096 19.7499 12.6739 19.6292 13.1264 19.3647C13.5787 19.1004 14.0479 18.7365 14.574 18.3218C14.8649 18.0925 15.161 17.8642 15.4589 17.6345C16.7132 16.6675 17.9993 15.676 19.0617 14.4797C20.3508 13.0281 21.25 11.3344 21.25 9.13701C21.25 6.98614 20.0346 5.18243 18.3756 4.4241C16.9023 3.75065 14.9662 3.85585 13.0725 5.51217L14.5302 6.9694C14.8232 7.26224 14.8233 7.73711 14.5304 8.03006C14.2376 8.323 13.7627 8.32309 13.4698 8.03025L11.4698 6.03097L11.4596 6.02065C9.40166 3.88249 7.23607 3.68739 5.62436 4.4241Z"
                    />
                </svg>`;
    }

}

customElements.define('add-favorite-button', AddFavoriteButton);









class ShareButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Styles globaux pour le composant
        const styles = document.createElement('style');
        styles.textContent = `
            .share-btn {
                background: #FFFFFF;
                border: 1px solid #FFFFFF;
                border-radius: 50px;
                padding: 10px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 40px;
                width: 40px;
                transition: transform 0.2s;
            }

            .modal-overlay {
                position: fixed;
                top: 80px;
                left: 0;
                width: 100vw;
                height: calc(100vh - 80px);
                background: rgba(255, 255, 255, 0.5);
                backdrop-filter: blur(5px);
                display: none;
                z-index: 999;
            }

            .share-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 300px;
                padding: 20px;
                background-color: #fff;
                border-radius: 20px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                display: none;
                z-index: 1000;
            }

            .share-apps {
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                gap: 5px;
                justify-content: space-around;
                margin: 10px 0;
            }

            .copy-section {
                display: flex;
                align-items: center;
                margin-top: 10px;
            }

            .copy-section input {
                flex: 1;
                padding: 5px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }

            h2, h3 {
                font-family: 'Montserrat', sans-serif;
                color: #1B1B1B;
            }

            h2 {
                font-weight: 500;
                font-size: 1.8em;
            }

            h3 {
                font-weight: 500;
                font-size: 1.4em;
            }

            .modal-divider {
                border: none;
                border-top: 1px solid #ddd;
                margin: 15px 0;
            }
        `;
        this.shadowRoot.appendChild(styles);

        // Créer le bouton principal avec les styles
        this.button = document.createElement('button');
        this.button.style.color = '#CB6863';
        this.button.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        this.button.style.backdropFilter = 'blur(5px)';
        this.button.style.borderRadius = '50px';
        this.button.style.padding = '10px';
        this.button.style.border = '1px solid #CB6863';
        this.button.style.cursor = 'pointer';
        this.button.style.display = 'flex';
        this.button.style.alignItems = 'center';
        this.button.style.justifyContent = 'center';
        this.button.style.height = '40px';
        this.button.style.width = '40px'; // Bouton circulaire
        this.button.style.position = 'relative';
        this.button.style.overflow = 'hidden';
        this.button.style.transition = 'transform 0.2s';
        this.button.style.margin = '0 10px';

        // Conteneur pour l'icône SVG
        this.iconContainer = document.createElement('div');
        this.iconContainer.style.width = '22px';
        this.iconContainer.style.height = '22px';
        this.iconContainer.style.display = 'flex';
        this.iconContainer.style.alignItems = 'center';
        this.iconContainer.style.justifyContent = 'center';

        // Ajouter le SVG par défaut pour l'icône "partage"
        this.iconContainer.innerHTML = `
            <svg width="22px" height="22px" fill="#CB6863" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.7285 3.88396C17.1629 2.44407 19.2609 2.41383 20.4224 3.57981C21.586 4.74798 21.5547 6.85922 20.1194 8.30009L17.6956 10.7333C17.4033 11.0268 17.4042 11.5017 17.6976 11.794C17.9911 12.0863 18.466 12.0854 18.7583 11.7919L21.1821 9.35869C23.0934 7.43998 23.3334 4.37665 21.4851 2.5212C19.6346 0.663551 16.5781 0.905664 14.6658 2.82536L9.81817 7.69182C7.90688 9.61053 7.66692 12.6739 9.51519 14.5293C9.80751 14.8228 10.2824 14.8237 10.5758 14.5314C10.8693 14.2391 10.8702 13.7642 10.5779 13.4707C9.41425 12.3026 9.44559 10.1913 10.8809 8.75042L15.7285 3.88396Z" fill="#CB6863"></path>
                <path d="M14.4851 9.47074C14.1928 9.17728 13.7179 9.17636 13.4244 9.46868C13.131 9.76101 13.1301 10.2359 13.4224 10.5293C14.586 11.6975 14.5547 13.8087 13.1194 15.2496L8.27178 20.1161C6.83745 21.556 4.73937 21.5863 3.57791 20.4203C2.41424 19.2521 2.44559 17.1408 3.88089 15.6999L6.30473 13.2667C6.59706 12.9732 6.59614 12.4984 6.30268 12.206C6.00922 11.9137 5.53434 11.9146 5.24202 12.2081L2.81818 14.6413C0.906876 16.5601 0.666916 19.6234 2.51519 21.4789C4.36567 23.3365 7.42221 23.0944 9.33449 21.1747L14.1821 16.3082C16.0934 14.3895 16.3334 11.3262 14.4851 9.47074Z" fill="#CB6863"></path>
            </svg>
        `;
        this.button.appendChild(this.iconContainer);

        // Ajouter le bouton au shadow DOM
        this.shadowRoot.appendChild(this.button);

        // Création de l'overlay et du modal pour le fallback
        this.createModal();

        // Événement pour ouvrir le modal au clic sur le bouton
        this.button.addEventListener('click', () => this.shareContent());
    }

    createModal() {
        // Overlay de fond
        this.overlay = document.createElement('div');
        this.overlay.classList.add('modal-overlay');
        this.shadowRoot.appendChild(this.overlay);

        // Modal de partage
        this.modal = document.createElement('div');
        this.modal.classList.add('share-modal');
        this.modal.innerHTML = `
            <h2>Partager</h2>
            <hr class="modal-divider">
            <div class="share-apps">

            </div>
            <hr class="modal-divider">
            <h3>Lien de la page</h3>
            <div class="copy-section">
                <input type="text" value="${window.location.href}" readonly>
                <button id="copyButton" class="icon-btn">Copier</button>
            </div>
        `;

        this.shadowRoot.appendChild(this.modal);

        // Gestion des événements pour le modal et l'overlay
        this.overlay.addEventListener('click', () => this.closeModal());
        this.modal.querySelector('#copyButton').addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.href);
            alert('Lien copié dans le presse-papier');
        });
    }

    shareContent() {
        if (navigator.share) {
            navigator.share({
                title: document.title,
                text: 'Découvrez cette recette !',
                url: window.location.href
            }).catch((error) => console.log('Erreur de partage:', error));
        } else {
            this.openModal(); // Ouvrir le modal si l'API de partage Web n'est pas disponible
        }
    }

    openModal() {
        this.overlay.style.display = 'block';
        this.modal.style.display = 'block';
    }

    closeModal() {
        this.overlay.style.display = 'none';
        this.modal.style.display = 'none';
    }
}

customElements.define('share-button', ShareButton);











