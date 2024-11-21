document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM content loaded, initializing favorites page...");

    const user = netlifyIdentity.currentUser();
    const isLoggedIn = !!user;

    if (!isLoggedIn) {
        // Afficher un message invitant l'utilisateur à se connecter
        alert('Veuillez vous connecter pour voir vos recettes favorites.');
        // Ouvrir le widget de connexion Netlify Identity
        netlifyIdentity.open('login');
        return;
    }

    initializeEventListeners();
    resetFilters();  // Initialiser les filtres et afficher les recettes

    // Ajouter les écouteurs d'événements Netlify Identity
    netlifyIdentity.on('login', () => {
        console.log('Utilisateur connecté');
        // Réinitialiser les filtres et afficher les recettes
        resetFilters();
    });

    netlifyIdentity.on('logout', () => {
        console.log('Utilisateur déconnecté');
        // Recharger la page pour mettre à jour l'affichage
        window.location.reload();
    });

    // Écouter l'événement 'favoritesChanged' pour mettre à jour l'affichage
    document.addEventListener('favoritesChanged', () => {
        console.log('Les favoris ont changé, mise à jour de l\'affichage');
        resetFilters();
    });
});

// Fonction pour obtenir les IDs des recettes favorites de l'utilisateur
function getFavoriteRecipeIds() {
    const user = netlifyIdentity.currentUser();
    if (user && user.user_metadata && user.user_metadata.recipeFavorites) {
        return user.user_metadata.recipeFavorites;
    } else {
        return [];
    }
}

// Fonction pour initialiser les écouteurs d'événements pour les catégories
function initializeEventListeners() {
    document.querySelectorAll('.categories .category').forEach(category => {
        category.addEventListener('click', () => {
            category.classList.toggle('active');  // Activer / désactiver la catégorie
            const allRecipesButton = document.getElementById('allRecipes');
            if (allRecipesButton) {
                allRecipesButton.classList.remove('active'); // Désactiver "Toutes les recettes" si une catégorie est cliquée
            }
            initializeSubCategories(getActiveCategories());  // Mettre à jour les sous-catégories
        });
    });

    // Écouteur pour le bouton "Toutes les recettes" pour réinitialiser les filtres
    const allRecipesButton = document.getElementById('allRecipes');
    if (allRecipesButton) {
        allRecipesButton.addEventListener('click', () => {
            resetFilters();
            allRecipesButton.classList.add('active'); // Activer "Toutes les recettes"
        });
    }
}

// Fonction pour obtenir les catégories actuellement actives
function getActiveCategories() {
    return Array.from(document.querySelectorAll('.categories .category.active')).map(cat => cat.id);
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

    // Recharger les sous-catégories et les recettes
    initializeSubCategories();
    displayFilteredRecipes([], []);
}

// Fonction pour initialiser les sous-catégories avec un filtre basé sur les catégories actives
function initializeSubCategories(selectedCategories = [], selectedSubCategories = []) {
    const favoriteRecipeIds = getFavoriteRecipeIds();

    // Si l'utilisateur n'a pas de recettes favorites
    if (favoriteRecipeIds.length === 0) {
        const recettesList = document.getElementById('recettes-list');
        recettesList.innerHTML = '<p>Vous n\'avez pas encore de recettes favorites.</p>';
        // Vider les sous-catégories
        const subCategoriesContainer = document.getElementById('subCategories');
        if (subCategoriesContainer) {
            subCategoriesContainer.innerHTML = '';
        }
        return;
    }

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

            recipeCards.forEach(recipeCard => {
                const recipeId = recipeCard.getAttribute('id');

                // Ne considérer que les recettes favorites
                if (!favoriteRecipeIds.includes(recipeId)) {
                    return; // Passer à la recette suivante
                }

                const cardCategories = recipeCard.getAttribute('data-ref-categorie')
                    .split(',')
                    .map(cat => decodeURIComponent(cat.trim()));
                const cardSubCategories = recipeCard.getAttribute('data-ref-subcategorie')
                    .split(',')
                    .map(subCat => decodeURIComponent(subCat.trim()));

                // Appliquer les filtres de catégories
                const matchesCategories = selectedCategories.length === 0 || selectedCategories.some(cat => cardCategories.includes(cat));

                if (matchesCategories) {
                    // Collecter les sous-catégories
                    cardSubCategories.forEach(subCategory => foundSubCategories.add(subCategory));
                }
            });

            // Afficher les sous-catégories
            displaySubCategories(Array.from(foundSubCategories), selectedSubCategories);

            // Afficher les recettes
            displayFilteredRecipes(selectedCategories, selectedSubCategories);
        })
        .catch(error => console.error("Erreur de chargement des sous-catégories :", error));
}

// Fonction pour afficher les recettes en fonction des filtres actifs
function displayFilteredRecipes(categories, subCategories) {
    const favoriteRecipeIds = getFavoriteRecipeIds();

    // Si l'utilisateur n'a pas de recettes favorites
    if (favoriteRecipeIds.length === 0) {
        const recettesList = document.getElementById('recettes-list');
        recettesList.innerHTML = '<p>Vous n\'avez pas encore de recettes favorites.</p>';
        return;
    }

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

            let displayedRecipes = 0;

            recipeCards.forEach(recipeCard => {
                const recipeId = recipeCard.getAttribute('id');

                // Ne considérer que les recettes favorites
                if (!favoriteRecipeIds.includes(recipeId)) {
                    return; // Passer à la recette suivante
                }

                const cardCategories = recipeCard.getAttribute('data-ref-categorie')
                    .split(',')
                    .map(cat => decodeURIComponent(cat.trim()));
                const cardSubCategories = recipeCard.getAttribute('data-ref-subcategorie')
                    .split(',')
                    .map(subCat => decodeURIComponent(subCat.trim()));

                // Appliquer les filtres de catégories et sous-catégories
                const matchesCategories = categories.length === 0 || categories.some(cat => cardCategories.includes(cat));
                const matchesSubCategories = subCategories.length === 0 || subCategories.some(subCat => cardSubCategories.includes(subCat));

                if (matchesCategories && matchesSubCategories) {
                    const recipeCardClone = recipeCard.cloneNode(true);

                    // Afficher le bouton add-favorite-button
                    const addFavoriteButton = recipeCardClone.querySelector('add-favorite-button');
                    if (addFavoriteButton) {
                        addFavoriteButton.style.display = 'block';
                    }

                    recettesList.appendChild(recipeCardClone);
                    displayedRecipes++;
                }
            });

            if (displayedRecipes === 0) {
                recettesList.innerHTML = '<p>Aucune recette favorite ne correspond à vos filtres.</p>';
            }

            console.log(`Recettes filtrées et affichées : ${displayedRecipes}`);
        })
        .catch(error => console.error("Erreur de chargement des recettes :", error));
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

        // Activer automatiquement si la sous-catégorie est dans la liste active
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
    displayFilteredRecipes(getActiveCategories(), activeSubCategories);
}

// Fonction pour obtenir les sous-catégories actives
function getActiveSubCategories() {
    return Array.from(document.querySelectorAll('#subCategories .subCategory.active')).map(subCat => subCat.textContent.trim());
}
