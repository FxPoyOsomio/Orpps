document.addEventListener("DOMContentLoaded", () => {
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

            // Regrouper et trier les ingrédients par catégorie et rayon
            const groupedIngredients = groupAndSortIngredients(ingredientCards);

            // Générer le contenu HTML trié
            const ingredientList = document.querySelector(".ingredient_list");
            if (ingredientList) {
                ingredientList.innerHTML = generateCategoryRayonHTML(groupedIngredients);
            }
        })
        .catch((error) => console.error("Erreur lors de l'affichage des ingrédients :", error));
});

// Fonction pour regrouper et trier les ingrédients
function groupAndSortIngredients(ingredientCards) {
    const grouped = {};

    ingredientCards.forEach((card) => {
        const category = card.getAttribute("data-ref-category") || "Non spécifié";
        const categoryOrder = parseInt(card.getAttribute("data-ref-category_order"), 10) || 999; // Par défaut 999
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

    // Trier les catégories par ordre croissant
    const sortedCategories = Object.keys(grouped)
        .sort((a, b) => grouped[a].order - grouped[b].order)
        .map((category) => {
            const sortedRayons = Object.keys(grouped[category].rayons)
                .sort((a, b) => a.localeCompare(b)) // Tri alphabétique des rayons
                .map((rayon) => {
                    // Trier les ingrédients par sous-rayon puis par nom
                    const sortedIngredients = grouped[category].rayons[rayon].sort((a, b) => {
                        if (a.sousRayon === b.sousRayon) {
                            return a.name.localeCompare(b.name); // Si sous-rayon identique, trier par nom
                        }
                        return a.sousRayon.localeCompare(b.sousRayon); // Sinon, trier par sous-rayon
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
