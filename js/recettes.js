document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM content loaded, initializing subcategories and search terms...");
    initializePageFromURL();
    initializeEventListeners();
    updateCategoryTitle();  // Mettre à jour le titre lors du chargement initial
});

// Fonction principale pour initialiser la page à partir des paramètres URL
function initializePageFromURL() {
    const urlParams = new URLSearchParams(window.location.search);

    // Vérifier si aucune catégorie n'est sélectionnée dans l'URL
    if (!urlParams.has('categorie') && !urlParams.has('searchTerms') && !urlParams.has('subcategorie')) {
        document.getElementById('allRecipes').classList.add('active');
        resetFilters();
        return;
    }

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
            document.getElementById('allRecipes').classList.remove('active'); // Désactiver "Toutes les recettes" si une catégorie est cliquée
            initializeSubCategories(getActiveCategories(), parseSearchTerms(getSearchTerms().join(',')));  // Mettre à jour les sous-catégories
            updateCategoryTitle();  // Mettre à jour le titre
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

    // Écouteur pour le bouton "Toutes les recettes" pour réinitialiser les filtres
    const allRecipesButton = document.getElementById('allRecipes');
    if (allRecipesButton) {
        allRecipesButton.addEventListener('click', () => {
            resetFilters();
            allRecipesButton.classList.add('active'); // Activer "Toutes les recettes"
            updateCategoryTitle();  // Mettre à jour le titre
        });
    }
}

// Fonction pour mettre à jour le titre en fonction des catégories actives
function updateCategoryTitle() {
    const activeCategories = getActiveCategories();
    const titleElement = document.querySelector('.display_categorie__titre');

    if (activeCategories.length === 0) {
        titleElement.textContent = "Toutes les recettes";
    } else if (activeCategories.length === 1) {
        titleElement.textContent = activeCategories[0];
    } else if (activeCategories.length === 2) {
        titleElement.textContent = `${activeCategories[0]} & ${activeCategories[1]}`;
    } else {
        const lastCategory = activeCategories.pop();
        titleElement.textContent = `${activeCategories.join(', ')} & ${lastCategory}`;
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

// Fonction pour réinitialiser les filtres
function resetFilters() {
    // Désactiver toutes les catégories et sous-catégories
    document.querySelectorAll('.categories .category').forEach(category => {
        category.classList.remove('active');
    });
    document.querySelectorAll('#subCategories .subCategory').forEach(subCategory => {
        subCategory.classList.remove('active');
    });

    // Réinitialiser le champ de recherche
    const searchInput = document.getElementById('recettesSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }

    // Réinitialiser les termes de recherche dans data-terms
    const searchBar = document.getElementById('recettesSearchBar');
    if (searchBar) {
        searchBar.setAttribute('data-terms', '');
    }

    // Recharger toutes les sous-catégories et recettes
    initializeSubCategories();
    displayFilteredRecipes([], [], []);  // Afficher toutes les recettes
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

            if (selectedCategories.length === 0 && searchTerms.length === 0) {
                recipeCards.forEach(recipeCard => {
                    const cardSubCategories = recipeCard.getAttribute('data-ref-subcategorie')
                        .split(',')
                        .map(subCat => decodeURIComponent(subCat.trim()));
                    cardSubCategories.forEach(subCategory => foundSubCategories.add(subCategory));
                });
            } else {
                recipeCards.forEach(recipeCard => {
                    const cardCategories = recipeCard.getAttribute('data-ref-categorie')
                        .split(',')
                        .map(cat => decodeURIComponent(cat.trim()));
                    const cardSubCategories = recipeCard.getAttribute('data-ref-subcategorie')
                        .split(',')
                        .map(subCat => decodeURIComponent(subCat.trim()));
                    const ingredients = (recipeCard.getAttribute('data-ref-ingredients') || '').toLowerCase();
                    const instructions = (recipeCard.getAttribute('data-ref-instructions') || '').toLowerCase();
                    const title = (recipeCard.getAttribute('data-ref-titre') || '').toLowerCase();
                    const description = (recipeCard.getAttribute('data-ref-description') || '').toLowerCase();

                    const matchesSearchTerms = searchTerms.every(term => {
                        const formattedTerm = term.toLowerCase().trim();
                        const regex = new RegExp(`\\b${formattedTerm}\\w{0,2}\\b`);
                        return regex.test(ingredients) || regex.test(instructions) || regex.test(title) || regex.test(description);
                    });

                    if (
                        (selectedCategories.length === 0 || selectedCategories.some(category => cardCategories.includes(category))) &&
                        (searchTerms.length === 0 || matchesSearchTerms)
                    ) {
                        cardSubCategories.forEach(subCategory => foundSubCategories.add(subCategory));
                    }
                });
            }

            // Afficher les sous-catégories après un délai
            setTimeout(() => {
                displaySubCategories(Array.from(foundSubCategories), selectedSubCategories);

                // Appeler displayFilteredRecipes avec un délai supplémentaire
                setTimeout(() => {
                    displayFilteredRecipes(selectedCategories, searchTerms, selectedSubCategories);
                }, 300); // Délai pour assurer le chargement complet des sous-catégories
            }, 300); // Délai initial pour l'affichage des sous-catégories
        })
        .catch(error => console.error("Erreur de chargement des sous-catégories :", error));
}


// Fonction pour afficher les recettes en fonction des filtres actifs
function displayFilteredRecipes(categories, searchTerms, subCategories) {
    setTimeout(() => {
        fetch('/dist/recettes.html')
            .then(response => {
                if (!response.ok) throw new Error("Erreur lors du chargement des recettes.");
                return response.text();
            })
            .then(htmlContent => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = htmlContent;

                const recipeCards = tempDiv.querySelectorAll('.recette-item');
                const recettesList = document.getElementById('recettes-list');
                recettesList.innerHTML = '';

                recipeCards.forEach(recipeCard => {
                    const cardCategories = recipeCard.getAttribute('data-ref-categorie')
                        .split(',')
                        .map(cat => decodeURIComponent(cat.trim()));
                    const cardSubCategories = recipeCard.getAttribute('data-ref-subcategorie')
                        .split(',')
                        .map(subCat => decodeURIComponent(subCat.trim()));
                    const ingredients = (recipeCard.getAttribute('data-ref-ingredients') || '').toLowerCase();
                    const instructions = (recipeCard.getAttribute('data-ref-instructions') || '').toLowerCase();
                    const title = (recipeCard.getAttribute('data-ref-titre') || '').toLowerCase();
                    const description = (recipeCard.getAttribute('data-ref-description') || '').toLowerCase();

                    const matchesCategories = categories.length === 0 || categories.some(cat => cardCategories.includes(cat));
                    const matchesSubCategories = subCategories.length === 0 || subCategories.some(subCat => cardSubCategories.includes(subCat));
                    const matchesSearchTerms = searchTerms.every(term => {
                        const formattedTerm = term.toLowerCase().trim();
                        const regex = new RegExp(`\\b${formattedTerm}\\w{0,2}\\b`);
                        return regex.test(ingredients) || regex.test(instructions) || regex.test(title) || regex.test(description);
                    });

                    if (matchesCategories && matchesSubCategories && matchesSearchTerms) {
                        recettesList.appendChild(recipeCard.cloneNode(true));
                    }
                });

                console.log("Recettes filtrées et affichées.");
            })
            .catch(error => console.error("Erreur de chargement des recettes :", error));
    }, 300); // Délai de 300 ms, ajustez si nécessaire
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
    displayFilteredRecipes(getActiveCategories(), getSearchTerms(), activeSubCategories);
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
