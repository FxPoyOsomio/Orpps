document.addEventListener('DOMContentLoaded', async () => {
    const pathParts = window.location.pathname.split('-');
    const recordId = pathParts[pathParts.length - 1].split('=')[1];

    if (!recordId) {
        console.error('Aucun recordId trouvé dans l’URL');
        return;
    }

    try {
        const url = `/.netlify/functions/get-recettes?id=${encodeURIComponent(recordId)}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des détails de la recette');
        }

        const data = await response.json();
        console.log("Données reçues :", data);

        const recipe = data[0]?.fields;
        if (!recipe) {
            document.body.innerHTML = '<p>Recette non trouvée</p>';
            return;
        }


        // Traitement des catégories
        const categoryIds = recipe['CATÉGORIE MENUS [base]'] || [];
        const subCategoryIds = recipe['SOUS-CATÉGORIE MENUS [base]'] || [];
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


        // Gestion des ingrédients et étapes
        const preparationIds = recipe['PRÉPARATIONS (RECETTE) [base]'] || [];
        const preparationsIngredientsDetails = await fetchPreparationsIngredientsDetails(preparationIds);
        const preparationsEtapesDetails = await fetchPreparationsEtapesDetails(preparationIds);

        document.getElementById("preparationIngrédients").innerHTML = generatePreparationIngredientsHTML(preparationsIngredientsDetails);
        document.getElementById("preparationEtapes").innerHTML = generatePreparationEtapesHTML(preparationsEtapesDetails);

        // Affichage des temps de préparation
        document.getElementById("tempsPreparation").textContent = `${recipe['Temps PRÉPARATION']}`;
        document.getElementById("tempsRepos").textContent = `${recipe['Temps REPOS']}`;
        document.getElementById("tempsCuisson").textContent = `${recipe['Temps CUISSON']}`;
        document.getElementById("tempsTotal_large").textContent = `${recipe['Temps TOTAL']}`;
        document.getElementById("tempsTotal_small").textContent = `${recipe['Temps TOTAL']}`;

        
        // Récupération des IDs d'ingrédients
        const ingredientsIds = recipe['INGRÉDIENTS [PRÉPARATIONS (RECETTE)]'] || [];

        // Récupération des détails des ingrédients
        const ingredientsList = await fetchRecetteIngredientsDetails(ingredientsIds);

        // Utilisez ingredientsList pour générer le contenu HTML, etc.
        console.log("Détails des ingrédients :", ingredientsList);
        
        
        
        // Vérifiez que `recipe['recipeIngredient [Bring!] (from INGRÉDIENTS [PRÉPARATIONS (RECETTE)])']` est défini
        if (recipe['recipeIngredient [Bring!] (from INGRÉDIENTS [PRÉPARATIONS (RECETTE)])']) {

            // Créez le script dynamique pour gérer les portions et ingrédients
            const dynamicScriptContent = `
                const originalIngredients = ${JSON.stringify(ingredientsList)};
                
                document.addEventListener("DOMContentLoaded", function() {
                    // Conversion initiale des valeurs des inputs en utilisant des virgules pour l'affichage
                    document.querySelectorAll(".highlight-quantity input, #portion-input").forEach(input => {
                        if (input.value.includes('.')) {
                            input.value = convertPointToComma(input.value);
                        }
                    });
                    // Ajustement initial des styles des inputs
                    adjustPortionInputStyle(); // Ajuster l'input des portions
            
                    // Appliquer l'ajustement de style initial pour tous les ingédients
                    initializeIngredientStyles();
                });
            
                function updatePortions(delta) {
                    const input = document.getElementById("portion-input");
                    let currentValue = parseFloat(input.value.replace(',', '.')); // Remplacer la virgule par un point pour le calcul
                    console.log("Valeur actuelle des portions :", currentValue);
            
                    if (currentValue + delta > 0) {
                        let newValue = currentValue + delta;
                        input.value = convertPointToComma(newValue); // Utiliser la virgule pour l'affichage
                        adjustPortionInputStyle(); // Ajuster le style après la mise à jour
                        updateIngredients();
                    } else {
                        console.log("Modification des portions ignorée car elle donnerait une valeur négative ou nulle.");
                    }
                }
            
                function updateIngredients() {
                    const input = document.getElementById("portion-input");
                    let portionValue = parseFloat(input.value.replace(',', '.')); // Remplacer la virgule par un point pour le calcul
                    console.log("Nouvelle valeur des portions :", portionValue);
            
                    // Mise à jour des attributs Bring
                    const bringContainer = document.getElementById("bring-import-container");
                    if (bringContainer) {
                        bringContainer.setAttribute("data-bring-base-quantity", portionValue);
                        bringContainer.setAttribute("data-bring-requested-quantity", portionValue);
                        console.log("Attributs data-bring mis à jour :", bringContainer.getAttribute("data-bring-base-quantity"), bringContainer.getAttribute("data-bring-requested-quantity"));
                    }
            
                    // Création de la liste des IDs d'ingrédients et mise à jour des quantités
                    originalIngredients.forEach(ingredient => {
                        let newQuantite;
            
                        // Calcul de la nouvelle quantité
                        if (ingredient.quantite === null || ingredient.quantite === 0) {
                            newQuantite = '';
                        } else {
                            let calculateNewQuantite = (ingredient.quantite * portionValue / 6);
                            console.log("Quantité calculée pour l'ingrédient :", ingredient.nom, "->", calculateNewQuantite);
            
                            newQuantite = Number.isInteger(calculateNewQuantite) ? calculateNewQuantite.toFixed(0) : calculateNewQuantite.toFixed(2);
                        }
            
                        console.log("Nouvelle quantité pour l'ingrédient :", ingredient.nom, "->", newQuantite);
            
                        // Conversion du point en virgule pour l'affichage
                        newQuantite = convertPointToComma(newQuantite);
            
                        // Recherche et mise à jour de tous les éléments avec cet ID dans le DOM
                        const ingredientElements = document.querySelectorAll(\`\#ingredient-\${ingredient.ordernb}\`);
                        if (ingredientElements.length > 0) {
                            ingredientElements.forEach(ingredientSpan => {
                                const quantityInput = ingredientSpan.querySelector(".highlight-quantity input");
                                if (quantityInput) {
                                    quantityInput.value = newQuantite;
                                    adjustInputWidth(quantityInput); // Ajuster la largeur après la mise à jour
                                    console.log("Quantité mise à jour dans le DOM pour :", ingredient.nom);
                                } else {
                                    console.log("Élément .highlight-quantity input introuvable pour l'ingrédient :", ingredient.nom);
                                }
                            });
                        } else {
                            console.log(\`Élément avec l'ID ingredient-\${ingredient.ordernb} introuvable dans le DOM pour l'ingrédient :\`, ingredient.nom);
                        }
                    });
                }
            
                function adjustPortionInputStyle() {
                    const input = document.getElementById("portion-input");
                    input.style.width = ((input.value.length + 1) * 0.5) + "em";
                    input.style.textAlign = "center";
                    input.style.border = "none";
                    input.style.outline = "none";
                }
            
                function adjustInputWidth(input) {
                    input.style.width = ((input.value.length + 1) * 0.5) + "em";
                    input.style.textAlign = "center";
                    input.style.border = "none";
                }
            
                function initializeIngredientStyles() {
                    // Parcourir tous les ingrédients et ajuster les styles initialement
                    originalIngredients.forEach(ingredient => {
                        const ingredientElements = document.querySelectorAll(\`\#ingredient-\${ingredient.ordernb}\`);
                        if (ingredientElements.length > 0) {
                            ingredientElements.forEach(ingredientSpan => {
                                const quantityInput = ingredientSpan.querySelector(".highlight-quantity input");
                                if (quantityInput) {
                                    adjustInputWidth(quantityInput); // Ajuster la largeur initiale du champ input
                                    quantityInput.style.backgroundColor = "transparent";
                                    quantityInput.style.border = "none";
                                    quantityInput.style.textAlign = "center";
                                }
                            });
                        }
                    });
            
                    // Ajustement des styles d'encadrement et focus pour chaque ingrédient
                    document.querySelectorAll(".card-ingredient").forEach(card => {
                        const input = card.querySelector(".highlight-quantity input");
                        if (input) {
                            input.style.backgroundColor = "transparent"; // Rendre le fond transparent par défaut
            
                            // Gestion des styles d'encadrement et focus
                            card.addEventListener("mouseover", function() {
                                input.style.border = "1px solid #ccc";
                                input.style.backgroundColor = "white"; // Afficher le fond blanc lors du survol
                            });
                            card.addEventListener("mouseout", function() {
                                input.style.border = "1px solid transparent";
                                input.style.backgroundColor = "transparent"; // Rendre le fond transparent lorsqu'on quitte le survol
                            });
                            card.addEventListener("click", function() {
                                input.focus();
                                input.select(); // Sélectionner tout le texte à l'intérieur de l'input pour faciliter la modification
                            });
            
                            input.addEventListener("blur", function() {
                                if (this.value !== "") {
                                    const ingredientId = parseInt(this.closest("[id^='ingredient-']").id.replace("ingredient-", ""), 10);
                                    const ingredient = originalIngredients.find(ing => ing.ordernb === ingredientId);
                                    if (ingredient) {
                                        const newPortionValue = (parseFloat(this.value.replace(',', '.')) / ingredient.quantite) * 6;
                                        document.getElementById("portion-input").value = convertPointToComma(Number.isInteger(newPortionValue) ? newPortionValue : newPortionValue.toFixed(2));
                                        updateIngredients();
                                        adjustPortionInputStyle(); // Ajuster le style après la mise à jour
                                    }
                                }
                            });
            
                            input.addEventListener("keydown", function(e) {
                                if (e.key === "Enter") {
                                    this.blur();
                                }
                            });
            
                            // Ajustement de la largeur du champ input en fonction du texte
                            input.addEventListener("input", function() {
                                adjustInputWidth(this);
                            });
                            // Ajustement initial
                            adjustInputWidth(input);
                        }
                    });
                }
            
                document.getElementById("portion-input").addEventListener("input", function(e) {
                    this.value = this.value.replace(/[^0-9,]/g, ''); // N'accepte que les chiffres et les virgules
                    if (this.value !== "") {
                        let newValue = parseFloat(this.value.replace(',', '.'));
                        this.value = convertPointToComma(Number.isInteger(newValue) ? newValue : newValue.toFixed(2));
                        adjustPortionInputStyle(); // Ajuster la largeur en fonction du texte
                        updateIngredients();
                    }
                });
            
                document.querySelector(".portion-control__value").addEventListener("mouseover", function() {
                    const input = document.getElementById("portion-input");
                    input.style.border = "1px solid #ccc";
                });
            
                document.querySelector(".portion-control__value").addEventListener("mouseout", function() {
                    const input = document.getElementById("portion-input");
                    input.style.border = "none";
                });
            
                document.querySelector(".portion-control__value").addEventListener("click", function() {
                    const input = document.getElementById("portion-input");
                    input.focus();
                    input.select(); // Sélectionner tout le texte à l'intérieur de l'input pour faciliter la modification
                });
            
                document.querySelectorAll(".preparation-instruction .highlight-quantity input").forEach(input => {
                    adjustInputWidth(input);
                    input.style.backgroundColor = "transparent";
                    input.style.border = "none";
                    input.style.outline = "none";
            
                    input.addEventListener("input", function() {
                        adjustInputWidth(this);
                    });
                });
            
                // Function reset nb. portion à l'initiale
                function resetPortion() {
                    const input = document.getElementById("portion-input");
                    const initialValue = input.getAttribute("value"); // Récupérer la valeur initiale depuis l'attribut 'value'
                    input.value = initialValue; // Réinitialiser l'input à la valeur initiale
                    adjustPortionInputStyle(); // Ajuster le style de l'input après la mise à jour
                    updateIngredients(); // Mettre à jour les ingrédients
                }
            
                // Fonction de conversion du point en virgule pour l'affichage
                function convertPointToComma(value) {
                    if (typeof value === 'number') {
                        value = value.toString();
                    }
                    return value.replace('.', ',');
                }
            `;

            // Ajoutez le script dynamique à la fin du `<body>`
            const dynamicScript = document.createElement('script');
            dynamicScript.type = 'text/javascript';
            dynamicScript.textContent = dynamicScriptContent;
            document.body.appendChild(dynamicScript);
        }


        // Ajout dynamique du script toggleViewButtonContainer à la fin du HTML
        if (document.getElementById("toggleViewButtonContainer")) {
            const toggleViewScriptContent = `
                document.getElementById("toggleViewButtonContainer").addEventListener("click", function () {
                    const containers = document.querySelectorAll(".recette_ingredients-items");
                
                    // Définir les deux SVG (Grid et List)
                    const gridSVG = \`
                        <svg class="titre-section-image" id="toggleViewButton" height="64px" width="64px" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="-122.88 -122.88 757.76 757.76" xml:space="preserve" fill="#CB6863"><g><path d="M512,182.161c0-12.088-4.164-23.909-11.996-33.389c-9.964-12.046-24.792-19.027-40.42-19.027H349.003 c-2.382-8.597-7.88-15.895-15.245-20.56l-0.133-66.82l-0.017-0.124c-0.283-13.546-7.797-25.892-19.71-32.323 c-5.582-3.016-11.763-4.532-17.895-4.532c-6.697,0-13.429,1.832-19.377,5.423l-0.016-0.025l-65.146,37.538l-0.216,0.15 c-15.696,9.78-25.725,26.492-27.041,44.919l-0.033,0.624v35.764c-20.844,0.1-40.904,7.864-56.366,21.826l-108.732,98.21 C6.732,260.969,0,276.639,0,292.726c0,5.839,0.883,11.763,2.732,17.511L54.499,472.9c6.381,20.077,25.008,33.714,46.085,33.714 h230.092c25.208,0,49.45-9.706,67.711-27.083l66.995-63.813c8.714-8.314,14.628-19.11,16.911-30.939l0.066-0.383l28.841-193.054 h-0.033C511.701,188.3,512,185.227,512,182.161z"></path></g></svg>\`;
                    
                    const listSVG = \`
                        <svg class="titre-section-image" width="64px" height="64px" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M8.5 10.5H5L6.5 19.5H18.5L20 10.5H16.5M8.5 10.5L10.2721 5.18377C10.4082 4.77543 10.7903 4.5 11.2208 4.5H13.7792C14.2097 4.5 14.5918 4.77543 14.7279 5.18377L16.5 10.5M8.5 10.5H16.5" stroke="#CB6863" stroke-width="1.2"></path> <path d="M12.5 10.5V19.5" stroke="#CB6863" stroke-width="1.2"></path> <path d="M9.5 19.5L8.5 10.5" stroke="#CB6863" stroke-width="1.2"></path> <path d="M15.5 19.5L16.5 10.5" stroke="#CB6863" stroke-width="1.2"></path> <path d="M19.5 13.5H5.5" stroke="#CB6863" stroke-width="1.2"></path> <path d="M19 16.5H6" stroke="#CB6863" stroke-width="1.2"></path> </g></svg>\`;
                    
                    containers.forEach(container => {
                        container.classList.toggle("list-view");
                    });
                    
                    const buttonContainer = document.getElementById("toggleViewButtonContainer");
                    if (buttonContainer.dataset.view === "grid") {
                        buttonContainer.innerHTML = listSVG;
                        buttonContainer.dataset.view = "list";
                    } else {
                        buttonContainer.innerHTML = gridSVG;
                        buttonContainer.dataset.view = "grid";
                    }
                });
            `;

            // Ajout du script à la fin du body
            const scriptElement = document.createElement('script');
            scriptElement.type = 'text/javascript';
            scriptElement.textContent = toggleViewScriptContent;
            document.body.appendChild(scriptElement);
        }

        
        // Ajout dynamique du script Bring pour remplacer le texte et l'image
        if (document.querySelector('.bring-import-text-light') || document.querySelector('.bring-import-image-light img')) {
            const bringScriptContent = `
                document.addEventListener('DOMContentLoaded', function () {
                    const checkElement = setInterval(function () {
                        const textElement = document.querySelector('.bring-import-text-light');
                        const imageElement = document.querySelector('.bring-import-image-light img');

                        if (textElement) {
                            console.log("Text element found.");
                            textElement.textContent = 'Bring!';
                            clearInterval(checkElement);
                        }
                    }, 500); // Vérification toutes les 500 ms
                });
            `;

            // Création du script et ajout à la fin du body
            const bringScriptElement = document.createElement('script');
            bringScriptElement.type = 'text/javascript';
            bringScriptElement.textContent = bringScriptContent;
            document.body.appendChild(bringScriptElement);
        }






       
        
    } catch (error) {
        console.error('Erreur lors du chargement de la recette :', error);
    }
});

/**
 * Fonction pour récupérer les catégories
 */
async function fetchCategories(categoryIds) {
    const categoryNames = [];
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
 * Fonction pour récupérer les sous-catégories
 */
async function fetchSubCategories(subCategoryIds) {
    const subCategoryNames = [];
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
 * Injecter les catégories dans les "bread-crumbs"
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
 */
async function fetchPreparationsIngredientsDetails(preparationIds) {
    const preparationsIngredientsDetails = [];
    for (const preparationId of preparationIds) {
        const preparationUrl = `/.netlify/functions/get-recette_preparations?id=${encodeURIComponent(preparationId)}`;
        const preparationResponse = await fetch(preparationUrl);
        if (preparationResponse.ok) {
            const preparationData = await preparationResponse.json();
            const preparationTitle = preparationData[0]?.fields['Préparation'] || 'Préparation inconnue';
            const ingredientIds = preparationData[0]?.fields['INGRÉDIENTS [RECETTES PRÉPARATION]'] || [];
            const ingredientsDetails = await fetchIngredientsDetails(ingredientIds);
            preparationsIngredientsDetails.push({
                titre: preparationTitle,
                ingredientsDetails
            });
        }
    }
    return preparationsIngredientsDetails;
}

/**
 * Récupérer les détails des ingrédients associés à chaque préparation
 */
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
            const ordernb = ingredientData[0]?.fields['Ordre d\'ingrédient'] || 0;
            let fullImgUrl = ingredientData[0]?.fields['url_Img (from INGRÉDIENTS [Base])'];
            fullImgUrl = Array.isArray(fullImgUrl) && fullImgUrl.length > 0 ? fullImgUrl[0] : '';
            const relativeImgUrl = fullImgUrl ? fullImgUrl.replace('https://fxpoyosomio.github.io/Orpps', '') : '';
            ingredientsDetails.push({ name, quantity, unit, ordernb, img: relativeImgUrl });
        }
    }
    return ingredientsDetails;
}

/**
 * Générer le HTML pour afficher les préparations et leurs ingrédients
 */
function generatePreparationIngredientsHTML(preparationsIngredientsDetails) {
    return preparationsIngredientsDetails.map(preparation => {
        // Ne pas afficher la div si aucun ingrédient n'est trouvé
        if (!preparation.ingredientsDetails || preparation.ingredientsDetails.length === 0) {
            return ''; // Retourne une chaîne vide pour ne rien afficher
        }

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
                                ${ingredient.quantity !== null ? `<span class="highlight-quantity">
                                    <input type="text" inputmode="decimal" id="quantite-input" class="quantite-control__value_number" value="${ingredient.quantity}">
                                    <span> ${ingredient.unit}</span>
                                </span>` : ''} 
                                ${ingredient.name}
                            </span>
                        </span>
                    </div>
                    `).join("")}                
                </div>
            </div>
        `;
    }).join("");
}


/**
 * Récupérer les détails des préparations et leurs étapes
 */
async function fetchPreparationsEtapesDetails(preparationIds) {
    const preparationsEtapesDetails = [];
    for (const preparationId of preparationIds) {
        const preparationUrl = `/.netlify/functions/get-recette_preparations?id=${encodeURIComponent(preparationId)}`;
        const preparationResponse = await fetch(preparationUrl);
        if (preparationResponse.ok) {
            const preparationData = await preparationResponse.json();
            const preparationTitle = preparationData[0]?.fields['Préparation'] || 'Préparation inconnue';
            const etapeIds = preparationData[0]?.fields['ÉTAPES PRÉPARATIONS (RECETTE) [base]'] || [];
            const etapesDetails = await fetchEtapesDetails(etapeIds);
            preparationsEtapesDetails.push({ titre: preparationTitle, etapes: etapesDetails });
        }
    }
    return preparationsEtapesDetails;
}

/**
 * Récupérer les détails des étapes
 */
async function fetchEtapesDetails(etapeIds) {
    const etapesDetails = [];
    for (const etapeId of etapeIds) {
        const etapeUrl = `/.netlify/functions/get-recette_preparation_etapes?id=${encodeURIComponent(etapeId)}`;
        const etapeResponse = await fetch(etapeUrl);
        if (etapeResponse.ok) {
            const etapeData = await etapeResponse.json();
            const ordre = etapeData[0]?.fields['Ordre étape recette'] || 0;
            let instructions = etapeData[0]?.fields['Instructions'] || '';
            etapesDetails.push({ ordre, originalInstructions: instructions });
        }
    }

    // Remplacement des références d'ingrédients dans chaque instruction
    for (const etape of etapesDetails) {
        etape.originalInstructions = await replaceIngredientReferences(etape.originalInstructions);
    }

    return etapesDetails;
}

/**
 * Remplacer les références d'ingrédients dans les instructions par les détails des ingrédients
 */
async function replaceIngredientReferences(instructions) {
    console.log("Instructions initiales :", instructions);

    // Extraire les identifiants d'ingrédients dans le format [recepF4jPU7Icq9DL]
    const ingredientIds = instructions.match(/\[([a-zA-Z0-9]+)\]/g)?.map(id => id.replace(/[\[\]]/g, '')) || [];

    console.log("Identifiants d'ingrédients extraits :", ingredientIds);

    if (ingredientIds.length === 0) {
        console.warn("Aucun identifiant d'ingrédient trouvé dans les instructions.");
        return instructions;
    }

    // Récupérer les détails des ingrédients correspondants
    const ingredientsDetailsForHTML = await fetchIngredientsForInstructions(ingredientIds);

    // Remplacer les références de type [recepF4jPU7Icq9DL] par les informations des ingrédients correspondants
    return instructions.replace(/\[([a-zA-Z0-9]+)\]/g, (match, p1) => {
        const ingredient = ingredientsDetailsForHTML.find(ing => ing.order === p1 || ing.id === p1); // Vérifie par ID

        if (ingredient) {
            console.log(`Substitution réussie pour l'ingrédient ID : ${p1}`);
            return `<span id="ingredients" class="ingredient-preparation">
                        <span id="ingredient-${ingredient.order || ingredient.id}">
                            ${ingredient.quantity ? `<span class="highlight-quantity">
                                <input type="text" inputmode="decimal" id="quantite-input" class="quantite-control__value_number" value="${ingredient.quantity}">
                                <span> ${ingredient.unit}</span>
                            </span>` : ''}
                            ${ingredient.name}
                        </span>
                    </span>`;
        }

        console.warn(`Aucun détail trouvé pour l'ingrédient avec l'ID : ${p1}`);
        return match; // Laisse la référence d'origine si aucun ingrédient ne correspond
    });
}

/**
 * Récupérer les ingrédients pour les instructions
 */
async function fetchIngredientsForInstructions(ingredientIds) {
    if (!ingredientIds || ingredientIds.length === 0) {
        console.warn("Aucun ID d'ingrédient fourni pour fetchIngredientsForInstructions");
        return [];
    }

    console.log("Requête pour les ingrédients avec IDs :", ingredientIds);

    const requests = ingredientIds.map(id => 
        fetch(`/.netlify/functions/get-recette_preparation_etape_ingredients?id=${encodeURIComponent(id)}`)
            .then(res => res.ok ? res.json() : Promise.reject(`Erreur de chargement pour l'ingrédient ID : ${id}`))
    );

    try {
        const responses = await Promise.all(requests);
        const ingredientsDetails = responses.map(data => ({
            id: data[0]?.id, // Ajout de l'ID pour la correspondance
            name: data[0]?.fields['Nom ingrédient (sans quantité)'] || 'Ingrédient inconnu',
            quantity: data[0]?.fields['Qté. [base]'] || null,
            unit: data[0]?.fields['Unité'] || '',
            order: data[0]?.fields['Ordre d\'ingrédient'] || data[0]?.id // Utilisation de l'ID en cas d'absence d'ordre
        }));
        
        console.log("Détails des ingrédients récupérés :", ingredientsDetails);
        return ingredientsDetails;
    } catch (error) {
        console.error("Erreur lors de la récupération des ingrédients:", error);
        return [];
    }
}


/**
 * Générer le HTML pour afficher les préparations et leurs étapes
 */
function generatePreparationEtapesHTML(preparationsEtapesDetails) {
    return preparationsEtapesDetails.map(preparation => `
        <div class="preparation-instruction">
            <h3>${preparation.titre}</h3>
            ${preparation.etapes.map(etape => `
                <div class="etape">
                    <h4>ÉTAPE ${etape.ordre}</h4>
                    <p>${etape.originalInstructions
                        .replace(/\\n/g, '<br>')
                        .replace(/\*\*(.*?)\*\*/g, '<span style="font-weight:400; font-style: italic;">$1</span>')
                    }</p>
                </div>
            `).join("")}
        </div>
    `).join("");
}



/**
 * Fonction pour récupérer les détails des ingrédients en utilisant leurs IDs
 */
async function fetchRecetteIngredientsDetails(ingredientsIds) {
    const ingredientsDetails = [];
    
    for (const ingredientId of ingredientsIds) {
        const ingredientUrl = `/.netlify/functions/get-recette_preparation_etape_ingredients?id=${encodeURIComponent(ingredientId)}`;
        const ingredientResponse = await fetch(ingredientUrl);

        if (ingredientResponse.ok) {
            const ingredientData = await ingredientResponse.json();
            const ingredient = ingredientData[0]?.fields;

            if (ingredient) {
                const quantite = ingredient["Qté. [base]"] || null;
                const unite = ingredient["Unité"] || null;
                const nomIngredient = ingredient["Nom ingrédient (sans quantité)"] || "Ingrédient inconnu";
                const nomSimpleIngredient = ingredient["Nom ingrédient"] || "Ingrédient simple";
                const ordernb = ingredient["Ordre d'ingrédient"] || 0;
                const order = `[${ordernb}]`;
                const img = ingredient["url_Img (from INGRÉDIENTS [Base])"] || '';

                ingredientsDetails.push({ quantite, unite, nom: nomIngredient, simplename: nomSimpleIngredient, order, ordernb, img });
            }
        } else {
            console.error(`Erreur lors de la récupération de l'ingrédient avec l'ID : ${ingredientId}`);
        }
    }

    return ingredientsDetails;
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
























