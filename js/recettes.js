document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM content loaded, initializing recipes...");
    initializeRecipes();
});

export function initializeRecipes() {
    console.log("initializeRecipes() appelée");  // Log de test pour le chargement de la fonction

    const urlParams = new URLSearchParams(window.location.search);
    const selectedCategory = decodeURIComponent(urlParams.get('categorie') || '');
    const activeSubCategory = decodeURIComponent(urlParams.get('subcategorie') || '');
    const searchTerms = (decodeURIComponent(urlParams.get('searchTerms') || '')
                         .split(' ')
                         .map(term => term.trim())
                         .filter(Boolean)); // Diviser par espace

    console.log("Paramètre de catégorie initial :", selectedCategory);
    console.log("Paramètre de sous-catégorie active :", activeSubCategory);
    console.log("Termes de recherche initiaux :", searchTerms);

    const categoryTitleElement = document.querySelector('.display_categorie__titre');
    if (categoryTitleElement && selectedCategory) {
        categoryTitleElement.textContent = selectedCategory;
    } else if (categoryTitleElement) {
        categoryTitleElement.textContent = 'Toutes les recettes';
    }

    loadRecipes(selectedCategory, activeSubCategory, searchTerms).then(() => {
        displaySubCategoriesFromCards(selectedCategory, activeSubCategory);

        if (activeSubCategory || searchTerms.length > 0) {
            applyCombinedFilters(selectedCategory, searchTerms);
        } else {
            applyCombinedFilters(selectedCategory || '');
        }
    });
}

// Tableau pour stocker les sous-catégories actives
let activeSubCategories = [];

// Fonction pour afficher les sous-catégories depuis les `recetteCard`
function displaySubCategoriesFromCards(categoryName, activeSubCategory = null) {
    const subCategoriesContainer = document.getElementById('subCategories');
    if (!subCategoriesContainer) {
        console.warn("Le conteneur de sous-catégories n'est pas présent sur cette page.");
        return;
    }

    // Vider le conteneur des sous-catégories précédentes
    subCategoriesContainer.innerHTML = '';

    const recipeCards = document.querySelectorAll('.recette-item');
    const foundSubCategories = new Set();

    recipeCards.forEach(recipeCard => {
        const cardCategory = decodeURIComponent(recipeCard.getAttribute('data-ref-categorie'));
        const cardSubCategories = recipeCard
            .getAttribute('data-ref-subcategorie')
            .split(',')
            .map(subCat => decodeURIComponent(subCat.trim()));

        // Vérifier la correspondance avec la catégorie si spécifiée
        if (!categoryName || (categoryName && cardCategory.includes(categoryName))) {
            cardSubCategories.forEach(subCategory => foundSubCategories.add(subCategory));
        }
    });

    // Ajouter les sous-catégories uniques trouvées dans les `recetteCard`
    foundSubCategories.forEach(subCategoryName => {
        const subCategoryDiv = document.createElement('div');
        subCategoryDiv.className = 'subCategory';

        const h7 = document.createElement('h7');
        h7.textContent = subCategoryName;
        subCategoryDiv.appendChild(h7);

        // Activer la sous-catégorie si elle correspond à celle de l'URL
        if (subCategoryName === activeSubCategory) {
            subCategoryDiv.classList.add('active');
            activeSubCategories.push(subCategoryName);
        }

        subCategoryDiv.addEventListener('click', () => {
            if (activeSubCategories.includes(subCategoryName)) {
                activeSubCategories = activeSubCategories.filter(name => name !== subCategoryName);
                subCategoryDiv.classList.remove('active');
            } else {
                activeSubCategories.push(subCategoryName);
                subCategoryDiv.classList.add('active');
            }

            // Mettre à jour l'URL si aucune sous-catégorie n'est active
            updateURLWithoutSubCategory();
            applyCombinedFilters(categoryName, searchTerms); // Appliquer les filtres avec la catégorie
        });

        subCategoriesContainer.appendChild(subCategoryDiv);
    });

    console.log("Sous-catégories ajoutées au DOM depuis les `recetteCard`.");
}

// Charger les recettes statiques et appliquer les filtres
async function loadRecipes(selectedCategory = '', activeSubCategory = '', searchTerms = []) {
    try {
        console.log("Début du chargement des recettes...");
        const recipesContainer = document.querySelector('#recettes-list');
        if (!recipesContainer) {
            console.warn("Le conteneur de recettes n'est pas présent sur cette page.");
            return;
        }

        const response = await fetch('/dist/recettes.html');
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des recettes statiques');
        }

        const staticContent = await response.text();
        recipesContainer.innerHTML = staticContent;

        console.log("Recettes statiques chargées et ajoutées au DOM.");

        if (selectedCategory || activeSubCategory || searchTerms.length > 0) {
            applyCombinedFilters(selectedCategory, searchTerms);
        } else {
            applyCombinedFilters('');
        }
    } catch (error) {
        console.error('Erreur lors du chargement des recettes statiques :', error);
    }
}

// Fonction de mise à jour de l'URL pour retirer `subcategorie` s'il n'y a plus de sous-catégorie active
function updateURLWithoutSubCategory() {
    if (activeSubCategories.length === 0) {
        const url = new URL(window.location.href);
        url.searchParams.delete('subcategorie');
        window.history.replaceState({}, '', url);
    }
}

// Fonction de filtrage combiné pour les catégories, sous-catégories, et termes de recherche
function applyCombinedFilters(category = '', searchTerms = []) {
    const recipes = document.querySelectorAll('.recette-item');

    recipes.forEach(recipe => {
        const cardCategory = decodeURIComponent(recipe.getAttribute('data-ref-categorie'));
        const recipeSubCategories = recipe
            .getAttribute('data-ref-subcategorie')
            .split(',')
            .map(subCat => decodeURIComponent(subCat.trim()));
        const ingredients = recipe.getAttribute('data-ref-ingredients').toLowerCase();
        const instructions = recipe.getAttribute('data-ref-instructions').toLowerCase();

        const matchesCategory = category ? cardCategory.includes(category) : true;
        const matchesSubCategory = activeSubCategories.length > 0
            ? activeSubCategories.every(subCategory => recipeSubCategories.includes(subCategory))
            : true;
        const matchesSearchTerms = searchTerms.length > 0
            ? searchTerms.every(term => ingredients.includes(term.toLowerCase()) || instructions.includes(term.toLowerCase()))
            : true;

        recipe.style.display = matchesCategory && matchesSubCategory && matchesSearchTerms ? '' : 'none';
    });

    if (!category && activeSubCategories.length === 0 && searchTerms.length === 0) {
        recipes.forEach(recipe => {
            recipe.style.display = '';
        });
    }
}

