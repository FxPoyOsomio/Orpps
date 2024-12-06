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
                card.style.display = "block";

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
        })
        .catch((error) => console.error("Erreur lors de l'affichage des ingrédients :", error));
});

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
