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
            const header = document.querySelector(".header");
            console.log("burgerMenu:", burgerMenu);
            console.log("overlayMenu:", overlayMenu);

            if (burgerMenu && overlayMenu) {
                // Gestion du clic sur le menu burger
                burgerMenu.addEventListener("click", () => {
                    header.classList.toggle("modal-burger-open"); // Modifie le header pour ajouter la classe d'animation
                    overlayMenu.classList.toggle("active"); // Affiche ou cache l'overlay
                    burgerMenu.classList.toggle("active"); // Ajoute la classe "active" au menu burger
                    console.log("Burger menu clicked, overlay active:", overlayMenu.classList.contains("active"));
                });

                // Gestion du clic en dehors du menu pour le fermer
                overlayMenu.addEventListener("click", (event) => {
                    if (event.target === overlayMenu) {
                        header.classList.remove("modal-burger-open");
                        overlayMenu.classList.remove("active");
                        burgerMenu.classList.remove("active"); // Retire la classe "active" du menu burger
                        console.log("Overlay clicked, menu closed");
                    }
                });
            } else {
                console.error("Elements not found:", { burgerMenu, overlayMenu });
            }

            // Gérer le changement de couleur des liens dans le header et le menu mobile
            const navLinks = document.querySelectorAll('.header__nav a');

            navLinks.forEach(link => {
                link.addEventListener('click', function() {
                    // Supprimer la classe active de tous les liens
                    navLinks.forEach(navLink => navLink.classList.remove('active'));

                    // Ajouter la classe active au lien cliqué
                    this.classList.add('active');

                    // Retirer la classe active après 1 seconde
                    setTimeout(() => {
                        this.classList.remove('active');
                    }, 1000);
                });
            });
        })
        .catch(error => console.error("Error loading header:", error));

    // Charger le footer
    fetch("/Orpps/components/footer.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("footer").innerHTML = data;
        });
});


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
        button.style.margin = '0 15px'; // Padding de 15px tout autour du bouton

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
            textElement.style.fontWeight = '300'; // Graisse de la police // Utiliser le texte fourni
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
        const shadow = this.attachShadow({ mode: 'open' });

        const button = document.createElement('button');
        button.style.color = '#CB6863'; // Couleur du texte
        button.style.backgroundColor = 'unset'; // Supprimer la couleur de fond
        button.style.borderRadius = '50px'; // Arrondi des coins
        button.style.padding = '10px 20px'; // Espacement interne
        button.style.border = '1px solid #CB6863'; // Bordure de 1px de couleur #CB6863
        button.style.cursor = 'pointer';
        button.style.display = 'flex'; // Pour aligner le contenu
        button.style.alignItems = 'center'; // Aligner verticalement
        button.style.justifyContent = 'center'; // Centrer le contenu horizontalement
        button.style.height = '40px'; // Hauteur fixe pour le bouton
        button.style.width = 'auto'; // Largeur auto pour le bouton
        button.style.position = 'relative'; // Nécessaire pour le masque
        button.style.overflow = 'hidden'; // Pour cacher le masque qui dépasse
        button.style.transition = 'transform 0.2s'; // Transition pour le hover
        button.style.margin = '0 15px'; // Padding de 15px tout autour du bouton

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
            svg.setAttribute('fill', '#CB6863'); // Définir le fill en couleur #CB6863
            svg.style.width = '22px'; // Largeur fixe pour le SVG
            svg.style.height = '22px'; // Hauteur fixe pour le SVG
            iconContainer.appendChild(svg); // Ajouter le SVG au conteneur
            button.appendChild(iconContainer); // Ajouter l'icône au bouton
        }

        // Vérifier s'il y a du texte
        const buttonText = this.getAttribute('text');
        if (buttonText) {
            const textElement = document.createElement('span');
            textElement.textContent = buttonText; // Utiliser le texte fourni
            textElement.style.color = '#CB6863'; // Couleur du texte
            textElement.style.fontFamily = "'Caviar Dreams', sans-serif"; // Police du texte
            textElement.style.fontSize = '1.1em'; // Taille de la police
            textElement.style.fontWeight = '700'; // Graisse de la police
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
            // Redirection après un délai de 300 ms
            setTimeout(() => {
                const redirectUrl = this.getAttribute('href'); // Récupérer l'URL depuis l'attribut href
                window.location.href = redirectUrl; // Rediriger vers l'URL
            }, 300);
        });

        shadow.appendChild(button);
    }
}

customElements.define('secondary-button', SecondaryButton);
