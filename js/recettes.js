export function initializeRecipes() {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedCategory = urlParams.get('categorie');
    const activeSubCategory = urlParams.get('subcategorie');
    let searchTerms = urlParams.get('searchTerms') || '';

    console.log("Paramètre de catégorie initial :", selectedCategory);
    console.log("Paramètre de sous-catégorie active :", activeSubCategory);
    console.log("Paramètre de recherche initial :", searchTerms);

    const categoryTitleElement = document.querySelector('.display_categorie__titre');
    if (categoryTitleElement && selectedCategory) {
        categoryTitleElement.textContent = selectedCategory;
    } else if (categoryTitleElement) {
        categoryTitleElement.textContent = 'Toutes les recettes';
    }

    // Afficher les sous-catégories et ensuite charger les recettes avec le filtre
    displaySubCategories(selectedCategory || '', activeSubCategory)
        .then(() => {
            loadRecipes(selectedCategory, searchTerms);
        });
}


// Tableau pour stocker les sous-catégories actives
let activeSubCategories = [];

// Fonction pour afficher les sous-catégories et ajouter un gestionnaire de clic
async function displaySubCategories(categoryName, activeSubCategory = null) {
    try {
        console.log("Début de displaySubCategories avec categoryName :", categoryName);
        console.log("Sous-catégorie active au chargement :", activeSubCategory);

        const url = categoryName 
            ? `/.netlify/functions/get-menu_subcategories?categoryName=${encodeURIComponent(categoryName)}`
            : `/.netlify/functions/get-menu_subcategories`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Erreur lors de la récupération des sous-catégories");
        }

        const data = await response.json();
        console.log("Données des sous-catégories récupérées :", data);

        const subCategoriesContainer = document.getElementById('subCategories');
        if (!subCategoriesContainer) {
            console.warn("Le conteneur de sous-catégories n'est pas présent sur cette page.");
            return;
        }

        subCategoriesContainer.innerHTML = '';

        data.forEach(subCategory => {
            const subCategoryDiv = document.createElement('div');
            subCategoryDiv.className = 'subCategory';

            const h7 = document.createElement('h7');
            h7.textContent = subCategory.fields['Nom sous-catégorie menus'];
            subCategoryDiv.appendChild(h7);

            const subCategoryName = subCategory.fields['Nom sous-catégorie menus'];

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
                applyCombinedFilters(categoryName, searchTerms); // Utiliser les paramètres de filtre
            });

            subCategoriesContainer.appendChild(subCategoryDiv);
        });

        console.log("Sous-catégories ajoutées au DOM.");
    } catch (error) {
        console.error("Erreur lors de l'affichage des sous-catégories :", error);
    }
}
async function loadRecipes(selectedCategory = '', searchTerms = '') {
    try {
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

        // Appliquer les filtres en fonction de la catégorie et des termes de recherche
        applyCombinedFilters(selectedCategory, searchTerms);
    } catch (error) {
        console.error('Erreur lors du chargement des recettes statiques :', error);
    }
}

// Fonction pour récupérer les noms de sous-catégories à partir d'un tableau d'IDs
async function fetchSubCategories(subCategoryIds) {
    if (!subCategoryIds || subCategoryIds.length === 0) {
        return [];
    }

    const url = `/.netlify/functions/get-menu_subcategories?ids=${encodeURIComponent(subCategoryIds.join(','))}`;
    try {
        const response = await fetch(url);

        // Log de la réponse brute
        console.log("Réponse brute de la fonction get-menu_subcategories :", response);

        // Vérifier que le type de contenu est bien JSON
        if (!response.headers.get("content-type").includes("application/json")) {
            throw new Error("La réponse de la fonction n'est pas au format JSON.");
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur lors de la récupération des sous-catégories : ${errorText}`);
        }

        const data = await response.json();
        console.log("Données des sous-catégories :", data);

        // Extraire les noms des sous-catégories
        const subCategoryNames = data.map(record => {
            // Assurez-vous que le champ existe avant d'accéder à sa valeur
            return {
                id: record.id,
                name: record.fields['Nom sous-catégorie menus'] || 'Nom non disponible'
            };
        });

        console.log("Noms des sous-catégories extraits :", subCategoryNames);
        return subCategoryNames;
    } catch (error) {
        console.error('Erreur lors de la récupération des sous-catégories :', error);
        return [];
    }
}


function applyCombinedFilters(category = '', searchTerms = '') {
    const recipes = document.querySelectorAll('.recette-item');

    recipes.forEach(recipe => {
        const matchesCategory = category ? recipe.getAttribute('data-ref-categorie').includes(category) : true;
        const matchesSubCategory = activeSubCategories.length > 0
            ? activeSubCategories.some(subCategory => recipe.getAttribute('data-ref-subcategorie').includes(subCategory))
            : true;
        const matchesSearch = searchTerms ? recipe.textContent.toLowerCase().includes(searchTerms.toLowerCase()) : true;

        recipe.style.display = matchesCategory && matchesSubCategory && matchesSearch ? '' : 'none';
    });
}
