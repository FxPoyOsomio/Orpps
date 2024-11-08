export function initializeRecipes() {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedCategory = urlParams.get('categorie');
    let searchTerms = urlParams.get('searchTerms') || '';

    console.log("Paramètre de catégorie initial :", selectedCategory);
    console.log("Paramètre de recherche initial :", searchTerms);

    // Charge les recettes immédiatement en fonction des paramètres d'URL
    if (selectedCategory && searchTerms) {
        loadRecipes([selectedCategory], searchTerms.split(' '));
    } else if (selectedCategory) {
        loadRecipes([selectedCategory]);
    } else if (searchTerms) {
        loadRecipes(null, searchTerms.split(' '));
    } else {
        loadRecipes(); // Charge toutes les recettes sans filtre
    }
}

export async function loadRecipes(categoryNames = [], searchTerms = []) {
    try {
        console.log("Récupération des recettes avec paramètres :");
        console.log("Catégories :", categoryNames);
        console.log("Termes de recherche :", searchTerms);

        let url = '/.netlify/functions/get-recettes';

        if (categoryNames && categoryNames.length > 0) {
            const filterByCategory = categoryNames.join(',');
            url += `?filterByCategory=${encodeURIComponent(filterByCategory)}`;
        }

        if (searchTerms && searchTerms.length > 0) {
            const searchTermsParam = searchTerms.join(' ');
            url += (url.includes('?') ? '&' : '?') + `searchTerms=${encodeURIComponent(searchTermsParam)}`;
        }

        console.log("URL utilisée pour la requête Airtable :", url);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des recettes');
        }

        const data = await response.json();
        console.log("Recettes reçues :", data);

        const recipesContainer = document.querySelector('#recettes-list');
        if (!recipesContainer) {
            console.warn("Le conteneur de recettes n'est pas présent sur cette page.");
            return;
        }

        recipesContainer.innerHTML = '';

        if (data.length === 0) {
            recipesContainer.innerHTML = '<p>Aucune recette trouvée.</p>';
            return;
        }

        data.forEach(record => {
            const recipe = record.fields;
            const title = recipe['Titre recettes'] || 'Titre non disponible';
            const description = recipe['Description recette'] || '';
            const imageUrl = recipe['img.'] && recipe['img.'][0] ? recipe['img.'][0].url : '';
            const slug = recipe['slug'];
            const urlRecette = `/recettes/${slug}`;

            console.log("Ajout de la recette :", title);

            const recipeElement = document.createElement('a');
            recipeElement.href = urlRecette;
            recipeElement.className = 'recette-item';
            recipeElement.innerHTML = `
                <div class="recette-item__container_img">
                    <p class="recette-description">"${description}"</p> 
                    <div class="recette-image_overlay"></div>
                    ${imageUrl ? `<img class="recette-image" src="${imageUrl}" alt="${title}">` : ''}          
                </div>
                <h3 class="recette_titre">${title}</h3> 
            `;
            recipesContainer.appendChild(recipeElement);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des recettes :', error);
    }
}
