require('dotenv').config();

const { exec } = require('child_process');


const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const TEMPLATE_PATH = path.join(__dirname, 'recipeTemplate.html');
const OUTPUT_DIR = path.join(__dirname, 'dist', 'recettes');




// Fonction pour récupérer les recettes depuis Airtable
async function fetchRecipes() {
    const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE__RECETTES__TABLE_ID}?filterByFormula=Is_COMMIT_Recette=TRUE()&view=Grid%20view`;
    // const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE__RECETTES__TABLE_ID}?filterByFormula=${encodeURIComponent('AND(Is_COMMIT_Recette=TRUE(), RECORD_ID()="recPqNxsvRy54EKST")')}&view=Grid%20view`;


    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`
        }
    });
    const data = await response.json();

    const recipes = await Promise.all(data.records.map(async recipe => {
        const preparationIds = recipe.fields['PRÉPARATIONS (RECETTE) [base]'] || [];
        const preparations = await fetchPreparations(preparationIds);
        return {
            ...recipe,
            preparationsDetails: preparations // Ajout correct des préparations
        };
    }));

    return recipes;
}


// Fonction pour récupérer les détails des préparations
async function fetchPreparations(preparationIds) {
    // On utilise Promise.all pour exécuter chaque requête de manière asynchrone
    const preparations = await Promise.all(preparationIds.map(async id => {
        // URL spécifique pour chaque préparation
        const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE__RECETTE_PREPARATIONS__TABLE_ID}/${id}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`
                }
            });

            if (!response.ok) {
                console.log(`Erreur lors de la récupération de la préparation ${id}`);
                return null; // Si erreur, on retourne null pour cet enregistrement
            }

            const data = await response.json();

            // Si les données sont bien présentes, on continue avec la récupération des ingrédients et des étapes
            if (data && data.fields) {
                const ingredientIds = data.fields['INGRÉDIENTS [RECETTES PRÉPARATION]'] || [];
                const ingredientsDetails = await fetchIngredients(ingredientIds);

                // Récupérer les étapes de préparation
                const stepIds = data.fields['ÉTAPES PRÉPARATIONS (RECETTE) [base]'] || [];
                const etapesDetails = await fetchPreparationSteps(stepIds, ingredientsDetails);

                return {
                    titre: data.fields['Préparation'],
                    ingredientsDetails,
                    etapes: etapesDetails
                };
            } else {
                console.log(`Aucune donnée trouvée pour la préparation avec l'ID: ${id}`);
                return null;
            }
        } catch (error) {
            console.log(`Erreur lors de la récupération de la préparation ${id}: ${error}`);
            return null; // En cas d'erreur de requête, on retourne null pour cet enregistrement
        }
    }));

    // Filtrer pour éliminer les préparations nulles (non trouvées)
    return preparations.filter(preparation => preparation !== null);
}


async function fetchIngredients(ingredientIds) {
    const apiKey = process.env.AIRTABLE_API_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const ingredientsTableId = process.env.AIRTABLE__RECETTE_PREPARATION_ETAPE_INGREDIENTS__TABLE_ID;

    const ingredients = await Promise.all(ingredientIds.map(async (id) => {
        const url = `https://api.airtable.com/v0/${baseId}/${ingredientsTableId}/${id}`;
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        });
        const ingredient = await response.json();

        // Vérification de l'image
        const imgUrlArray = ingredient.fields['url_Img (from INGRÉDIENTS [Base])'];
        
        const relativeImgUrl = (Array.isArray(imgUrlArray) && imgUrlArray.length > 0)
            ? imgUrlArray[0].replace('https://fxpoyosomio.github.io/Orpps', '')
            : '';
        
        return {
            ordernb: ingredient.fields['Ordre d\'ingrédient'],
            name: ingredient.fields['Nom ingrédient (sans quantité)'],
            quantity: ingredient.fields['Qté. [base]'],
            unit: ingredient.fields['Unité'],
            img: relativeImgUrl
        };

    }));

    return ingredients;
}


// Fonction pour récupérer les étapes de chaque préparation
async function fetchPreparationSteps(stepIds, ingredientsDetails) {
    const apiKey = process.env.AIRTABLE_API_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const stepsTableId = process.env.AIRTABLE__RECETTE_PREPARATION_ETAPES__TABLE_ID;

    const steps = await Promise.all(stepIds.map(async (id) => {
        const url = `https://api.airtable.com/v0/${baseId}/${stepsTableId}/${id}`;
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        });
        const step = await response.json();

        // Remplacement dynamique des références d'ingrédients dans les instructions
        const instructions = step.fields['Instructions'].replace(/\[(\d+)\]/g, (match, p1) => {
            const ingredientOrder = parseInt(p1, 10);
            const ingredient = ingredientsDetails.find(ing => ing.ordernb === ingredientOrder);

            if (ingredient) {
                return `<span id="ingredients" class="ingredient-preparation">
                            <span id="ingredient-${ingredient.ordernb}">
                                ${ingredient.quantity !== null ? `
                                    <span class="highlight-quantity">
                                        <input type="text" inputmode="decimal" id="quantite-input" class="quantite-control__value_number" value="${ingredient.quantity}">
                                        <span> ${ingredient.unit}</span>
                                    </span>
                                ` : ''} 
                                ${ingredient.name}
                            </span>
                        </span>`;
            }
            return match;
        });

        return {
            ordre: step.fields['Ordre étape recette'],
            originalInstructions: instructions
        };
    }));

    return steps;
}


// Fonction pour récupérer le contenu des ingrédients (ingredientsListContent)
async function fetchIngredientsListContent(ingredientIds) {
    const apiKey = process.env.AIRTABLE_API_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const ingredientsTableId = process.env.AIRTABLE__RECETTE_PREPARATION_ETAPE_INGREDIENTS__TABLE_ID;

    const ingredients = await Promise.all(ingredientIds.map(async (id) => {
        const url = `https://api.airtable.com/v0/${baseId}/${ingredientsTableId}/${id}`;
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            console.log(`Erreur lors de la récupération de l'ingrédient ${id}`);
            return null;
        }

        const ingredient = await response.json();
        if (ingredient && ingredient.fields) {
            const quantite = ingredient.fields['Qté. [base]'] || "";
            const uniteObj = ingredient.fields['Unité'];
            const unite = uniteObj && uniteObj.name ? uniteObj.name : "";
            const nomIngredient = ingredient.fields['Nom ingrédient (sans quantité)'] || "";
            const nomSimpleIngredient = ingredient.fields['Nom ingrédient'] || "";
            const ordernb = ingredient.fields["Ordre d'ingrédient"] || "";
            const order = `[${ordernb}]`;

            // Traitement pour l'URL de l'image
            const imgArray = ingredient.fields['url_Img (from INGRÉDIENTS [Base])'];
            const img = Array.isArray(imgArray) && imgArray.length > 0
                ? imgArray[0].replace('https://fxpoyosomio.github.io/Orpps', '')
                : "";

            return { quantite, unite, nom: nomIngredient, simplename: nomSimpleIngredient, order, ordernb, img };
        } else {
            console.log(`Aucune donnée trouvée pour l'ingrédient avec l'ID: ${id}`);
            return null;
        }
    }));

    // Filtrer pour éliminer les ingrédients nulles (non trouvés)
    return ingredients.filter(ingredient => ingredient !== null);
}





// Fonctions pour récupérer les noms de catégories et sous-catégories
async function fetchCategories(ids) {
    if (!ids || ids.length === 0) {
        return [];
    }
    const response = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE__MENUS_CATEGORIE__TABLE_ID}?filterByFormula=OR(${ids.map(id => `RECORD_ID()='${id}'`).join(',')})`, {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}` }
    });
    const data = await response.json();
    return data.records.map(record => ({ id: record.id, name: record.fields['Nom Menu'] }));
}

async function fetchSubCategories(ids) {
    if (!ids || ids.length === 0) {
        return [];
    }
    const response = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE__MENUS_SOUS_CATEGORIE__TABLE_ID}?filterByFormula=OR(${ids.map(id => `RECORD_ID()='${id}'`).join(',')})`, {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}` }
    });
    const data = await response.json();
    return data.records.map(record => ({ id: record.id, name: record.fields['Nom sous-catégorie menus'] }));
}

// Fonction pour générer le contenu HTML pour les ingrédients et étapes de préparation
function generateDynamicContent(recipeData, preparationsDetails, ingredientsListContent) {

    const preparationIngredientsHTML = recipeData.preparationsDetails && recipeData.preparationsDetails.length > 0 
        ? recipeData.preparationsDetails.map(preparation => {
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
                                                <input type="text" inputmode="decimal" id="quantite-input" class="quantite-control__value_number" value="${ingredient.quantity}">
                                                <span> ${ingredient.unit}</span>
                                            </span>
                                        </span>` : ''} 
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
        }).join("")
        : "<div>Aucun ingrédient disponible</div>";

    const preparationEtapesHTML = recipeData.preparationsDetails && recipeData.preparationsDetails.length > 0
        ? recipeData.preparationsDetails.map(preparation => `
            <div class="preparation-instruction">
                <h3>${preparation.titre}</h3>
                ${preparation.etapes && preparation.etapes.length > 0 
                    ? preparation.etapes.map(etape => `
                        <div class="etape">
                            <h4>ÉTAPE ${etape.ordre}</h4>
                            <p>${etape.originalInstructions}</p>
                        </div>
                    `).join("")
                    : "<div>Aucune étape disponible</div>"}
            </div>
        `).join("")
        : "<div>Aucune préparation disponible</div>";


    const ingredientsListContentJSON = JSON.stringify(ingredientsListContent);

    

    return {
        preparationIngredientsHTML,
        preparationEtapesHTML,
        ingredientsListContent: ingredientsListContentJSON
        
    };
}



// Fonction principale pour générer les pages statiques
async function generateStaticPages() {
    const templateContent = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
    const recipes = await fetchRecipes();

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    for (const recipe of recipes) {
        const slug = recipe.fields['Titre recettes']
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
        .toLowerCase()
        .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
        .replace(/[^\w-]+/g, '-'); // Supprimer les caractères non alphanumériques
        let finalHTML = templateContent;

        // Vérification des catégories et sous-catégories
        const categoryIds = recipe.fields['CATÉGORIE MENUS [base]'] || [];
        const subCategoryIds = recipe.fields['SOUS-CATÉGORIE MENUS [base]'] || [];
        
        // Logs pour vérifier les valeurs des catégories

        const categoryNames = await fetchCategories(categoryIds);
        const subCategoryNames = await fetchSubCategories(subCategoryIds);

        const categoriesDisplay = [
            ...categoryNames.map(category => category.name),
            ...subCategoryNames.map(subCategory => subCategory.name)
        ].join(', ');

        // Traitement des timing PT pour schema.org
        const prepDurationPT = 
            (recipe.fields['Temps PRÉPARATION - Heure'] ? recipe.fields['Temps PRÉPARATION - Heure'] + "H" : "") +
            (recipe.fields['Temps PRÉPARATION - Minute'] ? recipe.fields['Temps PRÉPARATION - Minute'] + "M" : "") ;  
        const restDurationPT =
            (recipe.fields['Temps REPOS - Heure'] ? recipe.fields['Temps REPOS - Heure'] + "H" : "") +
            (recipe.fields['Temps REPOS - Minute'] ? recipe.fields['Temps REPOS - Minute'] + "M" : "") ;
        const cookDurationPT =
            (recipe.fields['Temps CUISSON - Heure'] ? recipe.fields['Temps CUISSON - Heure'] + "H" : "") +
            (recipe.fields['Temps CUISSON - Minute'] ? recipe.fields['Temps CUISSON - Minute'] + "M" : "") ;
        const totalDurationPT =
            (recipe.fields['Temps TOTAL - Heure'] ? recipe.fields['Temps TOTAL - Heure'] + "H" : "") +
            (recipe.fields['Temps TOTAL - Minute'] ? recipe.fields['Temps TOTAL - Minute'] + "M" : "") ;

        // Traitement des catégories & sous-catégories pour le BreadCrumbs
        const categorieMenu = categoryNames.map(category => 
            `<a href="/recettes?categorie=${category.name}" class="bread-crumbs__link">
                <h6>${category.name}</h6>
            </a>`).join('<span style="padding: 0 8px;"><h6 style="color: #CB6863;">•</h6></span>');

        const subCategorieMenu = subCategoryNames.map(subCategory => 
            `<a href="/recettes?subcategorie=${subCategory.name}" class="bread-crumbs__link">
                <h6>${subCategory.name}</h6>
            </a>`).join('<span style="padding: 0 8px;"><h6 style="color: #CB6863;">•</h6></span>');

        
        
         // Récupérez les IDs des ingrédients depuis le champ 'INGRÉDIENTS [PRÉPARATIONS (RECETTE)]'
        const ingredientIds = recipe.fields['INGRÉDIENTS [PRÉPARATIONS (RECETTE)]'] || [];

        console.log("IDs des ingrédients récupérés directement depuis la recette :", ingredientIds);

        // Utilisez `fetchIngredientsListContent` pour obtenir `ingredientsListContent`
        const ingredientsListContent = await fetchIngredientsListContent(ingredientIds);
        const ingredientsListContentJSON = JSON.stringify(ingredientsListContent);



        // Traitement des détails pour preparationIngrédients & preparationEtapes
        const dynamicContent = generateDynamicContent(recipe, recipe.preparationsDetails, ingredientsListContent);


        const imageUrl = Array.isArray(recipe.fields['img.']) && recipe.fields['img.'].length > 0
        ? recipe.fields['img.'][0].url
        : '';




        // Remplacement des placeholders dans le template
        finalHTML = finalHTML
            .replace(/{{recipe-title}}/g, recipe.fields['Titre recettes'])
            .replace(/{{recipe-description}}/g, recipe.fields['Description recette'])
            .replace(/{{recipe-image}}/g, imageUrl)
            .replace(/{{slug}}/g, slug)
            .replace(/{{recipe-createdDate}}/g, recipe.fields['created'])
            .replace(/{{recipe-categoriesSubCategories}}/g, categoriesDisplay)
            .replace(/{{recipe-prepDurationPT}}/g, prepDurationPT)
            .replace(/{{recipe-restDurationPT}}/g, restDurationPT)
            .replace(/{{recipe-cookDurationPT}}/g, cookDurationPT)
            .replace(/{{recipe-totalDurationPT}}/g, totalDurationPT)
            .replace(/{{recipe-portion}}/g, recipe.fields['Nb. de portion [base]'])
            .replace(/{{recipe-ingredientsList}}/g, recipe.fields['recipeIngredient [Bring!] (from INGRÉDIENTS [PRÉPARATIONS (RECETTE)])'])
            .replace(/{{breadCrumbs__categorieMenu}}/g, categorieMenu)
            .replace(/{{breadCrumbs__subCategorieMenu}}/g, subCategorieMenu)
            .replace(/{{recipe-duration}}/g, recipe.fields['Temps recette'])
            .replace(/{{recipe-difficultiesLevel}}/g, recipe.fields['Difficulté recette'])
            .replace(/{{recipe-pricingLevel}}/g, recipe.fields['Prix recette'])
            .replace(/{{recipe-prepDuration}}/g, recipe.fields['Temps PRÉPARATION'])
            .replace(/{{recipe-restDuration}}/g, recipe.fields['Temps REPOS'])
            .replace(/{{recipe-cookDuration}}/g, recipe.fields['Temps CUISSON'])
            .replace(/{{recipe-totalDuration}}/g, recipe.fields['Temps TOTAL'])
            .replace(/{{recipe-preparationIngrédients}}/g, dynamicContent.preparationIngredientsHTML)
            .replace(/{{recipe-preparationEtapes}}/g, dynamicContent.preparationEtapesHTML)
            .replace(/{{recipe-ingredientsListContent}}/g, ingredientsListContentJSON);

        fs.writeFileSync(path.join(OUTPUT_DIR, `${slug}.html`), finalHTML);
        console.log(`Page générée pour la recette: ${slug}`);

        // Appel du script de génération de carte avec l'ID de la recette
        exec(`node generateRecipeCard.js ${recipe.id}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Erreur lors de la génération de la carte de recette ${recipe.id}: ${error}`);
                return;
            }
            console.log(stdout);
            if (stderr) console.error(stderr);
        });
    }
}

generateStaticPages().catch(console.error);
