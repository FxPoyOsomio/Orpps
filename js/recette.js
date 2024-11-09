document.addEventListener('DOMContentLoaded', async () => {
    // Extraire l'ID de l'URL après "id="
    const pathParts = window.location.pathname.split('-'); // Séparer par "-"
    const recordId = pathParts[pathParts.length - 1].split('=')[1]; // Extraire l'ID après "id="

    if (!recordId) {
        console.error('Aucun recordId trouvé dans l’URL');
        return;
    }

    try {
        // Construire l'URL pour appeler la fonction Netlify avec le recordId
        const url = `/.netlify/functions/get-recettes?id=${encodeURIComponent(recordId)}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des détails de la recette');
        }

        const data = await response.json();

        // Afficher toutes les données reçues pour vérifier la structure
        console.log("Données reçues :", data);

        const recipe = data[0]?.fields;

        if (!recipe) {
            document.body.innerHTML = '<p>Recette non trouvée</p>';
            return;
        }


        // Récupérer les IDs de catégories et de sous-catégories
        const categoryIds = recipe['CATÉGORIE MENUS [base]'] || [];
        const subCategoryIds = recipe['SOUS-CATÉGORIE MENUS [base]'] || [];


        // Récupérer les noms des catégories et des sous-catégories
        const categoryNames = await fetchCategories(categoryIds);
        const subCategoryNames = await fetchSubCategories(subCategoryIds);

 
        const categoriesDisplay = [
            ...categoryNames.map(category => category.name),
            ...subCategoryNames.map(subCategory => subCategory.name)
        ].join(', ');

        






        // Remplir les métadonnées dynamiques
        document.getElementById("page-title").textContent = `${recipe['Titre recettes']} - Orpps`;
        document.getElementById("page-description").content = recipe['Description recette'];
        document.getElementById("og-title").content = `${recipe['Titre recettes']} - Orpps`;
        document.getElementById("og-description").content = recipe['Description recette'];
        document.getElementById("og-image").content = recipe['img.']?.[0]?.url || '';
        document.getElementById("twitter-title").content = `${recipe['Titre recettes']} - Orpps`;
        document.getElementById("twitter-description").content = recipe['Description recette'];
        document.getElementById("twitter-image").content = recipe['img.']?.[0]?.url || '';

        // Injecter le balisage Schema.org
        document.getElementById("schema-org").textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Recipe",
            "name": recipe['Titre recettes'],
            "description": recipe['Description recette'] || '',
            "image": recipe['img.']?.[0]?.url || '',
            "author": { "@type": "Person", "name": "François-Xavier Poy" },
            "datePublished": recipe['created'],
            "recipeCategory": categoriesDisplay,
            "prepTime": "PT" +
            (recipe['Temps PRÉPARATION - Heure'] ? recipe['Temps PRÉPARATION - Heure'] + "H" : "") +
            (recipe['Temps PRÉPARATION - Minute'] ? recipe['Temps PRÉPARATION - Minute'] + "M" : ""),
            "restTime": "PT" +
            (recipe['Temps REPOS - Heure'] ? recipe['Temps REPOS - Heure'] + "H" : "") +
            (recipe['Temps REPOS - Minute'] ? recipe['Temps REPOS - Minute'] + "M" : ""),
            "cookTime": "PT" +
            (recipe['Temps CUISSON - Heure'] ? recipe['Temps CUISSON - Heure'] + "H" : "") +
            (recipe['Temps CUISSON - Minute'] ? recipe['Temps CUISSON - Minute'] + "M" : ""),
            "totalTime": "PT" +
            (recipe['Temps TOTAL - Heure'] ? recipe['Temps TOTAL - Heure'] + "H" : "") +
            (recipe['Temps TOTAL - Minute'] ? recipe['Temps TOTAL - Minute'] + "M" : ""),
            "recipeYield": recipe['Nb. de portion [base]'],
            "recipeIngredient": recipe['recipeIngredient [Bring!] (from INGRÉDIENTS [PRÉPARATIONS (RECETTE)])'] || [],
        });

        // Appeler la fonction pour injecter les catégories dans les "bread-crumbs"
        injectBreadCrumbsCategories(categoryNames, subCategoryNames, recipe['Titre recettes']);

        document.getElementById("imageRecette_twoColumn").src = recipe['img.']?.[0]?.url || '';

        document.getElementById("titreRecette").textContent = `${recipe['Titre recettes']}`;
        document.getElementById("imageRecette_oneColumn").src = recipe['img.']?.[0]?.url || '';

        document.getElementById("tempsRecette").textContent = `${recipe['Temps recette']}`;
        document.getElementById("difficulteRecette").textContent = `${recipe['Difficulté recette']}`;
        document.getElementById("prixRecette").textContent = `${recipe['Prix recette']}`;

        document.getElementById("descriptionRecette").textContent = `${recipe['Description recette']}`;

        const bringImportContainer = document.getElementById("bring-import-container");
        // Définir les attributs de données dynamiquement
        bringImportContainer.setAttribute("data-bring-base-quantity", `${recipe['Nb. de portion [base]']}`);
        bringImportContainer.setAttribute("data-bring-requested-quantity", `${recipe['Nb. de portion [base]']}`);

        document.getElementById("portion-input").value = `${recipe['Nb. de portion [base]']}`;


        // Récupérer les préparations et les ingrédients associés
        const preparationIds = recipe['PRÉPARATIONS (RECETTE) [base]'] || [];
        const preparationsDetails = await fetchPreparationsDetails(preparationIds);

        // Générer le contenu HTML pour les préparations et ingrédients
        const preparationIngrédientsContainer = document.getElementById("preparationIngrédients");
        preparationIngrédientsContainer.innerHTML = generatePreparationIngredientsHTML(preparationsDetails);



       
        
    } catch (error) {
        console.error('Erreur lors du chargement de la recette :', error);
    }
});

/**
 * Fonction pour récupérer les catégories à partir des IDs
 * @param {Array} categoryIds - Tableau des IDs de catégories
 */
async function fetchCategories(categoryIds) {
    let categoryNames = [];

    for (const categoryId of categoryIds || []) {
        const categoryUrl = `/.netlify/functions/get-menu_categories?id=${encodeURIComponent(categoryId)}`;
        const categoryResponse = await fetch(categoryUrl);

        if (categoryResponse.ok) {
            const categoryData = await categoryResponse.json();
            const categoryName = categoryData[0]?.fields['Nom Menu'] || 'Catégorie inconnue';
            categoryNames.push({ name: categoryName, id: categoryId });
        }
    }
    return categoryNames;
}

/**
 * Fonction pour récupérer les sous-catégories à partir des IDs
 * @param {Array} subCategoryIds - Tableau des IDs de sous-catégories
 */
async function fetchSubCategories(subCategoryIds) {
    let subCategoryNames = [];

    for (const subCategoryId of subCategoryIds || []) {
        const subCategoryUrl = `/.netlify/functions/get-menu_subcategories?id=${encodeURIComponent(subCategoryId)}`;
        const subCategoryResponse = await fetch(subCategoryUrl);

        if (subCategoryResponse.ok) {
            const subCategoryData = await subCategoryResponse.json();
            const subCategoryName = subCategoryData[0]?.fields['Nom sous-catégorie menus'] || 'Sous-catégorie inconnue';
            subCategoryNames.push({ name: subCategoryName, id: subCategoryId });
        }
    }
    return subCategoryNames;
}

/**
 * Fonction pour injecter les catégories, sous-catégories et le titre de la recette dans les "bread-crumbs"
 * @param {Array} categoryNames - Tableau contenant les objets { name, id } des catégories
 * @param {Array} subCategoryNames - Tableau contenant les objets { name, id } des sous-catégories
 * @param {String} recipeTitle - Titre de la recette
 */
function injectBreadCrumbsCategories(categoryNames, subCategoryNames, recipeTitle) {
    const breadCrumbsContainer = document.getElementById("breadCrumbs__categorieMenu");
    const subBreadCrumbsContainer = document.getElementById("breadCrumbs__subCategorieMenu");
    const titleContainer = document.getElementById("breadCrumbs__tiltleRecette");

    breadCrumbsContainer.innerHTML = '';
    subBreadCrumbsContainer.innerHTML = '';
    titleContainer.innerHTML = `<h6>${recipeTitle}</h6>`;

    categoryNames.forEach((category, index) => {
        const categoryLink = document.createElement('a');
        categoryLink.className = 'bread-crumbs__link';
        categoryLink.href = `/recettes?categorie=${encodeURIComponent(category.name)}`;
        categoryLink.innerHTML = `<h6>${category.name}</h6>`;
        breadCrumbsContainer.appendChild(categoryLink);

        if (index < categoryNames.length - 1) {
            const separator = document.createElement('span');
            separator.style.padding = "0 8px";
            separator.innerHTML = `<h6 style="color: #CB6863;">•</h6>`;
            breadCrumbsContainer.appendChild(separator);
        }
    });

    subCategoryNames.forEach((subCategory, index) => {
        const subCategoryLink = document.createElement('a');
        subCategoryLink.className = 'bread-crumbs__link';
        subCategoryLink.href = `/recettes?sous_categorie=${encodeURIComponent(subCategory.name)}`;
        subCategoryLink.innerHTML = `<h6>${subCategory.name}</h6>`;
        subBreadCrumbsContainer.appendChild(subCategoryLink);

        if (index < subCategoryNames.length - 1) {
            const separator = document.createElement('span');
            separator.style.padding = "0 8px";
            separator.innerHTML = `<h6 style="color: #CB6863;">•</h6>`;
            subBreadCrumbsContainer.appendChild(separator);
        }
    });
}





/**
 * Récupérer les détails des préparations et des ingrédients associés
 * @param {Array} preparationIds - Tableau d'IDs des préparations
 */
async function fetchPreparationsDetails(preparationIds) {
    const preparationsDetails = [];

    for (const preparationId of preparationIds) {
        // Récupérer les détails de chaque préparation
        const preparationUrl = `/.netlify/functions/get-recette_preparations?id=${encodeURIComponent(preparationId)}`;
        const preparationResponse = await fetch(preparationUrl);

        if (preparationResponse.ok) {
            const preparationData = await preparationResponse.json();
            const preparationTitle = preparationData[0]?.fields['Préparation'] || 'Préparation inconnue';
            const ingredientIds = preparationData[0]?.fields['INGRÉDIENTS [RECETTES PRÉPARATION]'] || [];

            // Récupérer les détails des ingrédients pour chaque préparation
            const ingredientsDetails = await fetchIngredientsDetails(ingredientIds);

            preparationsDetails.push({
                titre: preparationTitle,
                ingredientsDetails
            });
        }
    }
    return preparationsDetails;
}

async function fetchIngredientsDetails(ingredientIds) {
    const ingredientsDetails = [];

    for (const ingredientId of ingredientIds) {
        const ingredientUrl = `/.netlify/functions/get-recette_preparation_etape_ingredients?id=${encodeURIComponent(ingredientId)}`;
        const ingredientResponse = await fetch(ingredientUrl);

        if (ingredientResponse.ok) {
            const ingredientData = await ingredientResponse.json();
            const name = ingredientData[0]?.fields['Nom ingrédient (sans quantité)'] || 'Ingrédient inconnu';
            const quantity = ingredientData[0]?.fields['Qté. [base]'] || null;
            const unit = ingredientData[0]?.fields['Unité'] || '';
            const ordernb = ingredientData[0]?.fields['Ordre'] || 0;

            // Récupérer l'URL de l'image en vérifiant si c'est un tableau
            let fullImgUrl = ingredientData[0]?.fields['url_Img (from INGRÉDIENTS [Base])'];
            if (Array.isArray(fullImgUrl) && fullImgUrl.length > 0) {
                fullImgUrl = fullImgUrl[0];
            }

            const relativeImgUrl = fullImgUrl ? fullImgUrl.replace('https://fxpoyosomio.github.io/Orpps', '') : '';

            ingredientsDetails.push({ name, quantity, unit, ordernb, img: relativeImgUrl });
        }
    }
    return ingredientsDetails;
}



/**
 * Générer le HTML pour afficher les préparations et leurs ingrédients
 * @param {Array} preparationsDetails - Tableau contenant les détails des préparations et ingrédients
 */
function generatePreparationIngredientsHTML(preparationsDetails) {
    return preparationsDetails.map(preparation => {
        if (preparation.ingredientsDetails && preparation.ingredientsDetails.length > 0) {
            return `
                <div class="preparation-ingrédients">
                    <h3>${preparation.titre}</h3>
                    <div class="recette_ingredients-items">
                        ${preparation.ingredientsDetails.map(ingredient => `
                        <div class="card-ingredient" data-name="${ingredient.ordernb}">
                            <div class="card-ingredient-image">
                                <img src="${ingredient.img}" alt="${ingredient.name}">
                            </div>                        
                            <span class="recette_ingredients-details" id="ingredients">
                                <span id="ingredient-${ingredient.ordernb}">
                                    ${ingredient.quantity !== null ? `
                                    <span class="recette_ingredients-qtunit">
                                        <span class="highlight-quantity">
                                            <input type="text" inputmode="decimal" id="quantite-input" class="quantite-control__value_number" value="${ingredient.quantity}"><span> ${ingredient.unit}</span>
                                        </span>
                                    </span>
                                    ` : ''} 
                                    ${ingredient.name}
                                </span>
                            </span>
                        </div>
                        `).join("")}                
                    </div>
                </div>
            `;
        } else {
            return '';
        }
    }).join("");
}













//Regler hauteur de conainer PORTION identique à celle de TIMING et reciproquement l'inverse
document.addEventListener('DOMContentLoaded', function() {
    // Fonction pour égaliser les hauteurs des conteneurs
    function setEqualHeight() {
        // Vérifie si la largeur de la fenêtre est de 741 pixels ou plus
        if (window.innerWidth >= 741) {
            const portionContainer = document.querySelector('.container-portion');
            const timingContainer = document.querySelector('.container-timing');

            if (portionContainer && timingContainer) {
                // Réinitialiser les hauteurs des deux conteneurs avant de mesurer
                portionContainer.style.height = 'auto';
                timingContainer.style.height = 'auto';

                // Calculer les hauteurs des deux éléments en utilisant scrollHeight
                const portionHeight = portionContainer.scrollHeight;
                const timingHeight = timingContainer.scrollHeight;

                // Déterminer la hauteur maximale et l'appliquer en tant que `height` aux deux éléments
                const maxHeight = Math.max(portionHeight, timingHeight);

                console.log("Portion Height:", portionHeight, "Timing Height:", timingHeight, "Max Height:", maxHeight);

                portionContainer.style.height = `${maxHeight}px`;
                timingContainer.style.height = `${maxHeight}px`;
            } else {
                console.error("Les conteneurs '.container-portion' et/ou '.container-timing' n'ont pas été trouvés.");
            }
        } else {
            // Réinitialiser les hauteurs lorsque la largeur de l'écran est inférieure à 741 pixels
            const portionContainer = document.querySelector('.container-portion');
            const timingContainer = document.querySelector('.container-timing');

            if (portionContainer && timingContainer) {
                portionContainer.style.height = 'auto';
                timingContainer.style.height = 'auto';
            }
        }
    }

    // Appeler la fonction au chargement de la page et lors du redimensionnement
    setEqualHeight();
    window.addEventListener('resize', function() {
        clearTimeout(window.equalHeightTimeout);
        window.equalHeightTimeout = setTimeout(setEqualHeight, 100);
    });
});


document.addEventListener('DOMContentLoaded', function() {
    function setEqualHeight() {
        // Vérifie si la largeur de la fenêtre est de 741 pixels ou plus
        if (window.innerWidth >= 741) {
            const imgRecetteContainer = document.querySelector('.container__img-recette__two-column-page');
            const infoRecetteContainer = document.querySelector('.container__info-recette');

            if (imgRecetteContainer && infoRecetteContainer) {
                // Réinitialiser les hauteurs des deux conteneurs avant de mesurer
                imgRecetteContainer.style.height = 'auto';
                infoRecetteContainer.style.height = 'auto';

                // Calculer les hauteurs des deux éléments
                const imgHeight = imgRecetteContainer.scrollHeight;
                const infoHeight = infoRecetteContainer.scrollHeight;

                // Déterminer la hauteur maximale et l'appliquer en tant que `height` aux deux éléments
                const maxHeight = Math.max(imgHeight, infoHeight);

                imgRecetteContainer.style.height = `${maxHeight}px`;
                infoRecetteContainer.style.height = `${maxHeight}px`;
            }
        } else {
            // Réinitialiser les hauteurs lorsque la largeur de l'écran est inférieure à 741 pixels
            const imgRecetteContainer = document.querySelector('.container__img-recette__two-column-page');
            const infoRecetteContainer = document.querySelector('.container__info-recette');

            if (imgRecetteContainer && infoRecetteContainer) {
                imgRecetteContainer.style.height = 'auto';
                infoRecetteContainer.style.height = 'auto';
            }
        }
    }

    // Appeler la fonction au chargement de la page et lors du redimensionnement
    setEqualHeight();
    window.addEventListener('resize', function() {
        clearTimeout(window.equalHeightTimeout);
        window.equalHeightTimeout = setTimeout(setEqualHeight, 100);
    });
});




// Appliquer le data-View list sur mobile
document.addEventListener('DOMContentLoaded', function() {
    const toggleViewButtonContainer = document.getElementById('toggleViewButtonContainer');
    const containers = document.querySelectorAll(".recette_ingredients-items");

    if (window.innerWidth <= 670) {
        // Si la largeur est <= 670px, définir le data-view sur "list"
        toggleViewButtonContainer.dataset.view = 'list';

        // Modifier l'affichage pour "list-view"
        containers.forEach(container => {
            container.classList.add("list-view");
        });

        // Mettre à jour l'icône en affichage List
        const listSVG = `
            <svg class="titre-section-image" width="64px" height="64px" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M8.5 10.5H5L6.5 19.5H18.5L20 10.5H16.5M8.5 10.5L10.2721 5.18377C10.4082 4.77543 10.7903 4.5 11.2208 4.5H13.7792C14.2097 4.5 14.5918 4.77543 14.7279 5.18377L16.5 10.5M8.5 10.5H16.5" stroke="#CB6863" stroke-width="1.2"></path> <path d="M12.5 10.5V19.5" stroke="#CB6863" stroke-width="1.2"></path> <path d="M9.5 19.5L8.5 10.5" stroke="#CB6863" stroke-width="1.2"></path> <path d="M15.5 19.5L16.5 10.5" stroke="#CB6863" stroke-width="1.2"></path> <path d="M19.5 13.5H5.5" stroke="#CB6863" stroke-width="1.2"></path> <path d="M19 16.5H6" stroke="#CB6863" stroke-width="1.2"></path> </g></svg>
        `;
        toggleViewButtonContainer.innerHTML = listSVG;
    }
});