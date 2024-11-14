document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM content loaded, initializing subcategories and search terms...");
    initializePageFromURL();
    initializeEventListeners();
});

// Fonction principale pour initialiser la page à partir des paramètres URL
function initializePageFromURL() {
    const urlParams = new URLSearchParams(window.location.search);

    // Initialiser les catégories
    const selectedCategory = decodeURIComponent(urlParams.get('categorie') || '');
    if (selectedCategory) {
        activateCategories(selectedCategory.split(','));
    }

    // Initialiser les termes de recherche
    const searchTerms = decodeURIComponent(urlParams.get('searchTerms') || '');
    if (searchTerms) {
        initializeSearchTerms(searchTerms);
    }

    // Initialiser les sous-catégories avec sous-catégories actives si présentes
    const selectedSubCategories = decodeURIComponent(urlParams.get('subcategorie') || '').split(',').map(sub => sub.trim()).filter(Boolean);
    initializeSubCategories(getActiveCategories(), parseSearchTerms(searchTerms), selectedSubCategories);
}

// Fonction pour initialiser les écouteurs d'événements pour les catégories et la recherche
function initializeEventListeners() {
    document.querySelectorAll('.categories .category').forEach(category => {
        category.addEventListener('click', () => {
            category.classList.toggle('active');  // Activer / désactiver la catégorie
            initializeSubCategories(getActiveCategories(), parseSearchTerms(getSearchTerms().join(',')));  // Mettre à jour les sous-catégories
        });
    });

    const searchInput = document.getElementById('recettesSearchInput');
    const searchButton = document.querySelector('.recettesSearch-bar__button');

    if (searchInput) {
        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                updateSearchTermsAndSubCategories();
            }
        });
    }

    if (searchButton) {
        searchButton.addEventListener('click', updateSearchTermsAndSubCategories);
    }
}

// Fonction pour activer plusieurs catégories
function activateCategories(categories) {
    categories.forEach(categoryName => {
        const categoryElement = document.getElementById(categoryName.trim());
        if (categoryElement) {
            categoryElement.classList.add('active');
            console.log(`Catégorie activée : ${categoryName}`);
        } else {
            console.warn(`Catégorie non trouvée : ${categoryName}`);
        }
    });
}

// Fonction pour initialiser les termes de recherche et les ajouter à data-terms
function initializeSearchTerms(searchTerms) {
    const processedTerms = parseSearchTerms(searchTerms).join(',');

    const searchInput = document.getElementById('recettesSearchInput');
    if (searchInput) {
        searchInput.value = processedTerms.replace(/,/g, ' ');
        console.log(`Terme(s) de recherche initialisé(s) dans l'input : ${processedTerms}`);
    } else {
        console.warn("Le champ de recherche 'recettesSearchInput' n'a pas été trouvé.");
    }

    const searchBar = document.getElementById('recettesSearchBar');
    if (searchBar) {
        searchBar.setAttribute('data-terms', processedTerms);
        console.log(`Terme(s) de recherche ajouté(s) à data-terms : ${searchBar.getAttribute('data-terms')}`);
    } else {
        console.warn("La barre de recherche 'recettesSearchBar' n'a pas été trouvée.");
    }
}

// Fonction pour mettre à jour les termes de recherche et les sous-catégories
function updateSearchTermsAndSubCategories() {
    const searchInput = document.getElementById('recettesSearchInput');
    if (searchInput) {
        const searchTerms = searchInput.value.trim();
        initializeSearchTerms(searchTerms); // Met à jour data-terms
        initializeSubCategories(getActiveCategories(), parseSearchTerms(searchTerms));
    }
}

// Fonction pour initialiser les sous-catégories avec un filtre basé sur les catégories et termes de recherche actifs
function initializeSubCategories(selectedCategories = [], searchTerms = [], selectedSubCategories = []) {
    return fetch('/dist/recettes.html')
        .then(response => {
            if (!response.ok) throw new Error("Erreur lors du chargement des sous-catégories.");
            return response.text();
        })
        .then(htmlContent => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;

            const recipeCards = tempDiv.querySelectorAll('.recette-item');
            const foundSubCategories = new Set();

            // Si aucune catégorie ni termes de recherche, afficher toutes les sous-catégories
            if (selectedCategories.length === 0 && searchTerms.length === 0) {
                recipeCards.forEach(recipeCard => {
                    const cardSubCategories = recipeCard.getAttribute('data-ref-subcategorie')
                        .split(',')
                        .map(subCat => decodeURIComponent(subCat.trim()));
                    cardSubCategories.forEach(subCategory => foundSubCategories.add(subCategory));
                });
            } else {
                // Parcourir les recettes et récupérer les sous-catégories filtrées
                recipeCards.forEach(recipeCard => {
                    const cardCategories = recipeCard.getAttribute('data-ref-categorie')
                        .split(',')
                        .map(cat => decodeURIComponent(cat.trim()));
                    const cardSubCategories = recipeCard.getAttribute('data-ref-subcategorie')
                        .split(',')
                        .map(subCat => decodeURIComponent(subCat.trim()));
                    const ingredients = (recipeCard.getAttribute('data-ref-ingredients') || '').toLowerCase();
                    const instructions = (recipeCard.getAttribute('data-ref-instructions') || '').toLowerCase();

                    // Vérifier les termes de recherche avec règles spéciales
                    const matchesSearchTerms = searchTerms.every(term => {
                        const formattedTerm = term.toLowerCase().trim();
                        const regex = new RegExp(`\\b${formattedTerm}\\w{0,2}\\b`);
                        return regex.test(ingredients) || regex.test(instructions);
                    });

                    // Ajouter les sous-catégories si elles correspondent aux catégories actives et aux termes de recherche
                    if (
                        (selectedCategories.length === 0 || selectedCategories.some(category => cardCategories.includes(category))) &&
                        (searchTerms.length === 0 || matchesSearchTerms)
                    ) {
                        cardSubCategories.forEach(subCategory => foundSubCategories.add(subCategory));
                    }
                });
            }

            displaySubCategories(Array.from(foundSubCategories), selectedSubCategories);
        })
        .catch(error => console.error("Erreur de chargement des sous-catégories :", error));
}

// Fonction pour obtenir les catégories actuellement actives
function getActiveCategories() {
    return Array.from(document.querySelectorAll('.categories .category.active')).map(cat => cat.id);
}

// Fonction pour obtenir les termes de recherche de l'input
function getSearchTerms() {
    const searchBar = document.getElementById('recettesSearchBar');
    if (searchBar) {
        return searchBar.getAttribute('data-terms') ? searchBar.getAttribute('data-terms').split(',') : [];
    }
    return [];
}

// Fonction pour afficher les sous-catégories avec gestion de l'activation/désactivation
function displaySubCategories(subCategories, activeSubCategories = []) {
    const subCategoriesContainer = document.getElementById('subCategories');
    if (!subCategoriesContainer) {
        console.warn("Le conteneur de sous-catégories n'est pas présent sur cette page.");
        return;
    }

    subCategoriesContainer.innerHTML = '';

    subCategories.forEach(subCategoryName => {
        const subCategoryDiv = document.createElement('div');
        subCategoryDiv.className = 'subCategory';
        subCategoryDiv.id = subCategoryName.replace(/\s+/g, '-');

        const h7 = document.createElement('h7');
        h7.textContent = subCategoryName;
        subCategoryDiv.appendChild(h7);

        // Activer automatiquement si la sous-catégorie est dans la liste active de l'URL
        if (activeSubCategories.includes(subCategoryName)) {
            subCategoryDiv.classList.add('active');
            console.log(`Sous-catégorie activée : ${subCategoryName}`);
        }

        // Activer ou désactiver la sous-catégorie au clic
        subCategoryDiv.addEventListener('click', () => {
            subCategoryDiv.classList.toggle('active');
            updateActiveSubCategoriesDisplay();
        });

        subCategoriesContainer.appendChild(subCategoryDiv);
    });

    console.log("Sous-catégories affichées.");
}

// Fonction pour mettre à jour les sous-catégories actives
function updateActiveSubCategoriesDisplay() {
    const activeSubCategories = getActiveSubCategories();
    console.log("Sous-catégories actives :", activeSubCategories);
    // Ici, vous pouvez ajouter la logique pour appliquer un filtre sur les recettes selon les sous-catégories actives
}

// Fonction pour obtenir les sous-catégories actives
function getActiveSubCategories() {
    return Array.from(document.querySelectorAll('#subCategories .subCategory.active')).map(subCat => subCat.textContent.trim());
}

// Fonction pour traiter les termes de recherche
function parseSearchTerms(searchTerms) {
    return searchTerms
        .toLowerCase()
        .replace(/[\s,_-]+/g, ',') // Remplace espaces, underscores et tirets par des virgules
        .split(',')
        .map(term => term.trim())
        .filter(Boolean);
}
