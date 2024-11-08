document.addEventListener('DOMContentLoaded', async () => {
    // Extraire l'ID de l'URL après "id="
    const pathParts = window.location.pathname.split('/');
    const idPart = pathParts[pathParts.length - 1]; // Dernière partie de l'URL après "id="
    const recordId = idPart.split('=')[1]; // Extraire l'ID après "id="

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