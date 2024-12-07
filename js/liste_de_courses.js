document.addEventListener("DOMContentLoaded", () => {
    // Récupérer les métadonnées utilisateur
    const user = netlifyIdentity.currentUser();
    console.log("Utilisateur actuel :", user);
    const listeDeCourses = user?.user_metadata?.liste_de_courses || [];
    console.log("Liste de courses dans les métadonnées utilisateur :", listeDeCourses);

    // Charger les données des ingrédients depuis `ingredients.html`
    fetch("/dist/ingredients.html")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Erreur lors du chargement des ingrédients.");
            }
            return response.text();
        })
        .then((html) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            // Sélectionner toutes les cartes d'ingrédients
            const ingredientCards = doc.querySelectorAll(".card-ingredient");

            ingredientCards.forEach((card) => {
                // Réinitialiser l'affichage de toutes les cartes
                card.style.display = "flex";

                const recordId = card.getAttribute("data-ref-id");
                const matchingIngredient = listeDeCourses.find(item => item.recordId === recordId);

                if (matchingIngredient) {
                    // Mettre à jour les inputs avec les quantités des métadonnées utilisateur
                    const input = card.querySelector("input.quantite-control__value_number");
                    if (input) {
                        const formattedValue = parseFloat(matchingIngredient.quantity || 0).toFixed(2);
                        input.value = formattedValue;
                        input.setAttribute("value", formattedValue);
                        console.log(
                            `Mise à jour de l'ingrédient ${recordId} (${card.getAttribute("data-ref-name")}) avec la quantité :`,
                            formattedValue
                        );

                        // Ajouter un écouteur pour mettre à jour dynamiquement les données et le résumé
                        input.addEventListener("input", () => {
                            updateIngredientMetadata(recordId, input.value, user);
                            updateResume(ingredientCards);
                            toggleNoIngredientsDiv(ingredientCards); // Vérifier la visibilité
                        });
                    }
                } else {
                    // Marquer les cartes non trouvées pour masquage ultérieur
                    card.setAttribute("data-hidden", "true");
                }
            });

            // Regrouper et trier les ingrédients par catégorie et rayon
            const groupedIngredients = groupAndSortIngredients(ingredientCards);

            // Générer le contenu HTML trié
            const ingredientList = document.querySelector(".ingredient_list");
            if (ingredientList) {
                ingredientList.innerHTML = generateCategoryRayonHTML(groupedIngredients);
                console.log("HTML des ingrédients généré avec succès.");
            } else {
                console.warn("Élément .ingredient_list introuvable dans le DOM.");
            }

            // Masquer les cartes marquées comme non correspondantes
            const allCards = document.querySelectorAll(".card-ingredient");
            allCards.forEach((card) => {
                if (card.getAttribute("data-hidden") === "true") {
                    card.style.display = "none";
                }
            });

            // Masquer les rayons et catégories vides
            hideEmptyRayonsAndCategories();

            // Mettre à jour le résumé initial
            updateResume(ingredientCards);

            // Appeler la fonction toggle pour afficher ou cacher les divs
            toggleNoIngredientsDiv(ingredientCards);
        })
        .catch((error) => console.error("Erreur lors de l'affichage des ingrédients :", error));
});



// Fonction pour afficher ou cacher les divs en fonction de la présence d'ingrédients
function toggleNoIngredientsDiv(ingredientCards) {
    const noIngredientDiv = document.querySelector(".noIngredient");
    const resumesIngredientsDiv = document.querySelector(".resumesIngredients");
    const callToActionButton = document.querySelector(".call-to-action__buttons");

    // Vérifier si des ingrédients sont visibles
    const hasVisibleIngredients = Array.from(ingredientCards).some(
        (card) => card.style.display !== "none"
    );

    if (hasVisibleIngredients) {
        if (noIngredientDiv) noIngredientDiv.style.display = "none"; 
        if (resumesIngredientsDiv) resumesIngredientsDiv.style.display = "block"; 
        if (callToActionButton) callToActionButton.style.display = "flex"; 
    } else {
        if (noIngredientDiv) noIngredientDiv.style.display = "block"; 
        if (resumesIngredientsDiv) resumesIngredientsDiv.style.display = "none";
        if (callToActionButton) callToActionButton.style.display = "none"; 
    }
}





// Ajout d'écouteurs sur les inputs pour détecter les modifications
function addInputListenersToIngredients(ingredientCards, user) {
    ingredientCards.forEach((card, index) => {
        const recordId = card.getAttribute("data-ref-id");
        const input = card.querySelector("input.quantite-control__value_number");

        if (input) {
            console.log(`[Input Listener] Ajout d'un écouteur pour l'ingrédient ${recordId}.`);
            input.addEventListener("input", () => {
                const newValue = parseFloat(input.value) || 0;

                console.log(`[Input Listener] Modification détectée sur l'input de l'ingrédient ${recordId}. Nouvelle valeur: ${newValue}`);

            

                // Mettre à jour le résumé
                updateResume(ingredientCards);
                toggleNoIngredientsDiv(ingredientCards);
            });
        } else {
            console.warn(`[Input Listener] Aucun input trouvé pour l'ingrédient ${recordId}.`);
        }
    });
}



// Fonction pour masquer les rayons ou catégories vides
function hideEmptyRayonsAndCategories() {
    const rayonContainers = document.querySelectorAll(".rayon-container");
    rayonContainers.forEach((rayon) => {
        const visibleCards = rayon.querySelectorAll(".card-ingredient:not([style*='display: none'])");
        if (visibleCards.length === 0) {
            rayon.style.display = "none"; // Masquer le rayon s'il n'y a pas d'ingrédient visible
        }
    });

    const categoryContainers = document.querySelectorAll(".category-container");
    categoryContainers.forEach((category) => {
        const visibleRayons = category.querySelectorAll(".rayon-container:not([style*='display: none'])");
        if (visibleRayons.length === 0) {
            category.style.display = "none"; // Masquer la catégorie si aucun rayon visible
        }
    });
}

// Fonction pour regrouper et trier les ingrédients
function groupAndSortIngredients(ingredientCards) {
    const grouped = {};

    ingredientCards.forEach((card) => {
        const category = card.getAttribute("data-ref-category") || "Non spécifié";
        const categoryOrder = parseInt(card.getAttribute("data-ref-category_order"), 10) || 999;
        const rayon = card.getAttribute("data-ref-rayon") || "Non spécifié";
        const sousRayon = card.getAttribute("data-ref-sousRayon") || "Non spécifié";
        const name = card.getAttribute("data-ref-name") || "Ingrédient inconnu";

        if (!grouped[category]) {
            grouped[category] = {
                order: categoryOrder,
                rayons: {},
            };
        }

        if (!grouped[category].rayons[rayon]) {
            grouped[category].rayons[rayon] = [];
        }

        // Ajouter l'ingrédient au rayon avec les infos nécessaires pour le tri
        grouped[category].rayons[rayon].push({
            sousRayon,
            name,
            cardHTML: card.outerHTML,
        });
    });

    const sortedCategories = Object.keys(grouped)
        .sort((a, b) => grouped[a].order - grouped[b].order)
        .map((category) => {
            const sortedRayons = Object.keys(grouped[category].rayons)
                .sort((a, b) => a.localeCompare(b))
                .map((rayon) => {
                    const sortedIngredients = grouped[category].rayons[rayon].sort((a, b) => {
                        if (a.sousRayon === b.sousRayon) {
                            return a.name.localeCompare(b.name);
                        }
                        return a.sousRayon.localeCompare(b.sousRayon);
                    });
                    return { rayon, ingredients: sortedIngredients };
                });
            return { category, rayons: sortedRayons };
        });

    return sortedCategories;
}

// Fonction pour générer le HTML des catégories, rayons, et ingrédients
function generateCategoryRayonHTML(groupedIngredients) {
    return groupedIngredients
        .map((categoryObj) => {
            const rayonsHTML = categoryObj.rayons
                .map((rayonObj) => {
                    const ingredientsHTML = rayonObj.ingredients
                        .map((ingredient) => ingredient.cardHTML)
                        .join("");

                    return `
                        <div class="rayon-container">
                            <h3>${rayonObj.rayon}</h3>
                            <div class="ingrédients-container">
                                ${ingredientsHTML}
                            </div>
                        </div>
                    `;
                })
                .join("");

            return `
                <div class="category-container">
                    <h2>${categoryObj.category}</h2>
                    ${rayonsHTML}
                </div>
            `;
        })
        .join("");
}


document.addEventListener("DOMContentLoaded", () => {
    // Attendre que le bouton "clearIngredients" soit chargé
    const clearIngredientsButton = document.querySelector("primary-button#clearIngredients");

    if (clearIngredientsButton) {
        // Attacher l'événement au bouton interne
        const buttonElement = clearIngredientsButton.shadowRoot.querySelector("button");

        if (buttonElement) {
            buttonElement.addEventListener("click", () => {
                // Récupérer l'utilisateur actuel
                const user = netlifyIdentity.currentUser();

                if (!user) {
                    console.warn("Aucun utilisateur connecté. Impossible de vider la liste des ingrédients.");
                    return;
                }

                // Vider la liste des ingrédients
                const updatedMetadata = {
                    ...user.user_metadata,
                    liste_de_courses: [], // Mettre à jour pour un tableau vide
                };

                // Mettre à jour les métadonnées via Netlify Identity
                user.update({ data: updatedMetadata })
                    .then(() => {
                        console.log("Liste de courses vidée avec succès !");
                        alert("Tous les ingrédients ont été supprimés de votre liste.");

                        // Recharger la page pour refléter les modifications
                        window.location.reload();
                    })
                    .catch((error) => {
                        console.error("Erreur lors de la mise à jour des user-metadata :", error);
                    });
            });
        } else {
            console.warn("Impossible de trouver l'élément <button> dans le shadow DOM du bouton primary-button.");
        }
    } else {
        console.warn("Impossible de trouver le bouton avec l'ID #clearIngredients.");
    }
});


// Fonction pour mettre à jour l'affichage après avoir vidé les ingrédients
function updateDisplayAfterClearing() {
    const categories = document.querySelectorAll(".category-container");

    categories.forEach((category) => {
        const visibleCards = category.querySelectorAll(".card-ingredient:not([style*='display: none'])");
        if (visibleCards.length === 0) {
            category.style.display = "none"; // Cacher les catégories sans ingrédients visibles
        }
    });

    console.log("Affichage mis à jour après suppression des ingrédients.");
}


// Fonction pour mettre à jour dynamiquement le résumé des ingrédients
function updateResume(ingredientCards) {
    const nbIngredientDiv = document.querySelector("#nbIngredient .quantity");
    const prixIngredientDiv = document.querySelector("#prixIngredient .quantity");

    let totalIngredients = 0;
    let totalPrice = 0;

    console.log("Début de la mise à jour du résumé des ingrédients...");

    // Parcourir les cartes d'ingrédients visibles
    ingredientCards.forEach((card, index) => {
        if (card.style.display !== "none") {
            const input = card.querySelector("input.quantite-control__value_number");
            const pricePerUnit = parseFloat(card.getAttribute("data-ref-pricing")) || 0;
            const quantity = parseFloat(input?.value) || 0;


            if (quantity > 0) {
                totalIngredients += 1; // Compter l'ingrédient
                totalPrice += pricePerUnit * quantity; // Calculer le prix total
            }
        }
    });

    // Mettre à jour les divs avec les nouvelles valeurs
    if (nbIngredientDiv) {
        nbIngredientDiv.textContent = totalIngredients;
        console.log(`Nombre total d'ingrédients: ${totalIngredients}`);
    }
    if (prixIngredientDiv) {
        prixIngredientDiv.textContent = totalPrice.toFixed(2);
        console.log(`Prix total: ${totalPrice.toFixed(2)} €`);
    }

    console.log("Résumé mis à jour avec succès.");
}