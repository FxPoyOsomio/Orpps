require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const sharp = require('sharp'); 

const TEMPLATE_PATH = path.join(__dirname, 'recipeTemplate.html');
const OUTPUT_DIR = path.join(__dirname, 'dist', 'recettes');
const IMAGE_DIR = path.join(__dirname, 'assets', 'images', 'img_recette');

const recipeId = process.argv[2]; // L'ID de la recette en argument


// Fonction utilitaire pour introduire un délai
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}



// Fonction pour récupérer la recette spécifique depuis Airtable
async function fetchRecipes(id) {
    const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE__RECETTES__TABLE_ID}/${id}`;
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`
        }
    });
    const data = await response.json();

    if (!data || !data.fields) {
        console.error(`Erreur : Les données de la recette avec l'ID ${id} sont introuvables.`);
        return null;
    }

    const preparationIds = data.fields['PRÉPARATIONS (RECETTE) [base]'] || [];
    const preparations = await fetchPreparations(preparationIds);

    return {
        ...data,
        preparationsDetails: preparations // Ajout correct des préparations
    };
}



// Fonction pour récupérer les détails des préparations avec délais
async function fetchPreparations(preparationIds) {
    const preparations = [];
    for (const id of preparationIds) {
        // Introduire un délai entre chaque requête pour éviter les conflits
        await delay(200); // Délai de 200ms

        const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE__RECETTE_PREPARATIONS__TABLE_ID}/${id}`;

        try {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`
                }
            });

            if (!response.ok) {
                console.log(`Erreur lors de la récupération de la préparation ${id}`);
                continue;
            }

            const data = await response.json();

            if (data && data.fields) {
                const ingredientIds = data.fields['INGRÉDIENTS [RECETTES PRÉPARATION]'] || [];
                const ingredientsDetails = await fetchIngredients(ingredientIds);

                const stepIds = data.fields['ÉTAPES PRÉPARATIONS (RECETTE) [base]'] || [];
                const etapesDetails = await fetchPreparationSteps(stepIds, ingredientsDetails);

                preparations.push({
                    titre: data.fields['Préparation'],
                    ingredientsDetails,
                    etapes: etapesDetails
                });
            } else {
                console.log(`Aucune donnée trouvée pour la préparation avec l'ID: ${id}`);
            }
        } catch (error) {
            console.log(`Erreur lors de la récupération de la préparation ${id}: ${error}`);
        }
    }

    return preparations;
}


// Fonction pour récupérer les ingrédients avec délais
async function fetchIngredients(ingredientIds) {
    const ingredients = [];
    for (const id of ingredientIds) {
        await delay(150); // Délai de 150ms

        const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE__RECETTE_PREPARATION_ETAPE_INGREDIENTS__TABLE_ID}/${id}`;

        try {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`
                }
            });

            if (!response.ok) {
                console.log(`Erreur lors de la récupération de l'ingrédient ${id}`);
                continue;
            }

            const ingredient = await response.json();

            const img = ingredient.fields['relative_url_img'] && ingredient.fields['relative_url_img'].trim() !== ''
                ? ingredient.fields['relative_url_img']
                : '/assets/images/no_image.jpg';

            ingredients.push({
                ordernb: ingredient.fields['Ordre d\'ingrédient'],
                name: ingredient.fields['Nom ingrédient (sans quantité)'],
                quantity: ingredient.fields['Qté. [base]'] || "",
                unit: ingredient.fields['Unité'] || "",
                img: img
            });
        } catch (error) {
            console.log(`Erreur lors de la récupération de l'ingrédient ${id}: ${error}`);
        }
    }

    return ingredients;
}


// Fonction pour récupérer les étapes avec délais
async function fetchPreparationSteps(stepIds, ingredientsDetails) {
    const steps = [];
    for (const id of stepIds) {
        await delay(100); // Délai de 100ms

        const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE__RECETTE_PREPARATION_ETAPES__TABLE_ID}/${id}`;

        try {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`
                }
            });

            if (!response.ok) {
                console.log(`Erreur lors de la récupération de l'étape ${id}`);
                continue;
            }

            const step = await response.json();

            const instructions = step.fields['Instructions'].replace(/\[(\d+)\]/g, (match, p1) => {
                const ingredientOrder = parseInt(p1, 10);
                const ingredient = ingredientsDetails.find(ing => ing.ordernb === ingredientOrder);

                if (ingredient) {
                    return `<span id="ingredients" class="ingredient-preparation">
                                <span id="ingredient-${ingredient.ordernb}">
                                    ${ingredient.quantity !== "" ? `
                                        <span class="highlight-quantity">
                                            <input type="text" inputmode="decimal" id="quantite-input" class="quantite-control__value_number" value="${ingredient.quantity}">
                                            ${ingredient.unit !== "" ? `<span> ${ingredient.unit}</span>` : ''} 
                                        </span>
                                    ` : ''} 
                                    ${ingredient.name}
                                </span>
                            </span>`;
                }
                return match;
            });

            steps.push({
                ordre: step.fields['Ordre étape recette'],
                originalInstructions: instructions
            });
        } catch (error) {
            console.log(`Erreur lors de la récupération de l'étape ${id}: ${error}`);
        }
    }

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
            const img = ingredient.fields['relative_url_img'] && ingredient.fields['relative_url_img'].trim() !== '' 
            ? ingredient.fields['relative_url_img'] 
            : '/assets/images/no_image.jpg';


            return { quantite, unite, nom: nomIngredient, simplename: nomSimpleIngredient, order, ordernb, img };
        } else {
            console.log(`Aucune donnée trouvée pour l'ingrédient avec l'ID: ${id}`);
            return null;
        }
    }));

    // Filtrer pour éliminer les ingrédients nulles (non trouvés)
    return ingredients.filter(ingredient => ingredient !== null);
}





// Fonctions pour récupérer les noms des catégories
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
// Fonctions pour récupérer les noms des sous-catégories ainsi que les id des category parent
async function fetchSubCategories(ids) {
    if (!ids || ids.length === 0) {
        return [];
    }

    // Récupération des sous-catégories
    const response = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE__MENUS_SOUS_CATEGORIE__TABLE_ID}?filterByFormula=OR(${ids.map(id => `RECORD_ID()='${id}'`).join(',')})`, {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}` }
    });
    const data = await response.json();

    // Pour chaque sous-catégorie, récupérer les noms des catégories parentes
    const subCategoriesWithCategories = await Promise.all(data.records.map(async record => {
        const categoryIds = record.fields['CATÉGORIE MENUS [base]'] || [];

        // Récupérer les noms de catégories parentes pour chaque sous-catégorie
        const categoryNames = await fetchCategories(categoryIds);

        return {
            id: record.id,
            name: record.fields['Nom sous-catégorie menus'],
            categoryNames: categoryNames.map(category => category.name) // Ajouter les noms des catégories parentes
        };
    }));

    return subCategoriesWithCategories;
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
                                        ${ingredient.quantity !== "" ? `
                                        <span class="recette_ingredients-qtunit">
                                            <span class="highlight-quantity">
                                                <input type="text" inputmode="decimal" id="quantite-input" class="quantite-control__value_number" value="${ingredient.quantity}">
                                                ${ingredient.unit !== "" ? `<span> ${ingredient.unit}</span>` : ''} 
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

// Fonction pour créer des versions redimensionnées de l'image
async function createResizedImages(inputPath, slug) {
    const sizes = [1024, 600, 450, 300];
    const imagePaths = {};
    for (const size of sizes) {
        const outputPath = path.join(IMAGE_DIR, `${slug}_${size}px.jpg`);
        await sharp(inputPath)
            .resize(size, size, { fit: 'cover' })
            .toFile(outputPath);
        console.log(`Image redimensionnée et sauvegardée : ${outputPath}`);
        imagePaths[size] = `/assets/images/img_recette/${slug}_${size}px.jpg`;
    }
    return imagePaths;
}

// Fonction principale pour traiter l'image de la recette
async function processRecipeImage(recipe) {
    const slug = recipe.slug;
    const imageUrl = Array.isArray(recipe.fields['img.']) && recipe.fields['img.'].length > 0
        ? recipe.fields['img.'][0].url
        : '';

    const localImagePath = path.join(IMAGE_DIR, `${slug}.jpg`);
    if (imageUrl) {
        await downloadImage(imageUrl, localImagePath);
        const imagePaths = await createResizedImages(localImagePath, slug);
        return imagePaths;
    }
    return null;
}

// Fonction pour télécharger l'image depuis une URL et la sauvegarder localement
async function downloadImage(url, outputPath) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erreur lors du téléchargement de l'image: ${response.statusText}`);
    const buffer = await response.buffer();
    fs.writeFileSync(outputPath, buffer);
    console.log(`Image téléchargée et sauvegardée : ${outputPath}`);
}

// chat gpt
// Fonction pour transformer un titre en slug
function generateSlug(title) {
    return title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
        .toLowerCase()
        .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
        .replace(/[^\w-]+/g, '-'); // Supprimer les caractères non alphanumériques
}

// Fonction pour remplacer les record IDs dans 'Description recette' par des liens
async function replaceRecordIdsWithLinks(description) {
    const recordIdRegex = /\[([a-zA-Z0-9]+)\]/g; // Regex pour trouver les IDs entre crochets
    let match;
    const replacements = {}; // Cache pour éviter des appels API redondants

    // Trouver tous les record IDs dans la description
    while ((match = recordIdRegex.exec(description)) !== null) {
        const recordId = match[1];

        // Si le remplacement est déjà dans le cache, ne pas refaire l'appel API
        if (!replacements[recordId]) {
            try {
                // Appel API pour récupérer le titre de la recette
                const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE__RECETTES__TABLE_ID}/${recordId}`;
                const response = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
                    },
                });

                if (response.ok) {
                    const recipeData = await response.json();
                    const recipeTitle = recipeData.fields['Titre recettes'];
                    const recipeSlug = generateSlug(recipeTitle);

                    // Générer le lien HTML
                    replacements[recordId] = `<a href="/dist/recettes/${recipeSlug}.html">${recipeTitle}</a>`;
                } else {
                    console.warn(`Impossible de récupérer la recette avec ID: ${recordId}`);
                    replacements[recordId] = `[${recordId}]`; // Garder l'ID original si l'appel échoue
                }
            } catch (error) {
                console.error(`Erreur lors de la récupération de la recette avec ID ${recordId}:`, error);
                replacements[recordId] = `[${recordId}]`; // Garder l'ID original en cas d'erreur
            }
        }
    }

    // Remplacer tous les IDs dans la description par les liens HTML générés
    return description.replace(recordIdRegex, (_, recordId) => replacements[recordId]);
}

// Fonction pour remplacer les record IDs dans 'Description recette' par les titres des recettes
async function replaceRecordIdsWithRecipeTitle(description) {
    const recordIdRegex = /\[([a-zA-Z0-9]+)\]/g; // Regex pour trouver les IDs entre crochets
    let match;
    const replacements = {}; // Cache pour éviter des appels API redondants

    // Trouver tous les record IDs dans la description
    while ((match = recordIdRegex.exec(description)) !== null) {
        const recordId = match[1];

        // Si le remplacement est déjà dans le cache, ne pas refaire l'appel API
        if (!replacements[recordId]) {
            try {
                // Appel API pour récupérer le titre de la recette
                const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE__RECETTES__TABLE_ID}/${recordId}`;
                const response = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
                    },
                });

                if (response.ok) {
                    const recipeData = await response.json();
                    const recipeTitle = recipeData.fields['Titre recettes'];

                    // Stocker le titre de la recette dans le cache
                    replacements[recordId] = recipeTitle;
                } else {
                    console.warn(`Impossible de récupérer la recette avec ID: ${recordId}`);
                    replacements[recordId] = `[${recordId}]`; // Garder l'ID original si l'appel échoue
                }
            } catch (error) {
                console.error(`Erreur lors de la récupération de la recette avec ID ${recordId}:`, error);
                replacements[recordId] = `[${recordId}]`; // Garder l'ID original en cas d'erreur
            }
        }
    }

    // Remplacer tous les IDs dans la description par les titres des recettes
    return description.replace(recordIdRegex, (_, recordId) => replacements[recordId]);
}


// Fonction principale pour générer les pages statiques
async function generateStaticPages() {
    const templateContent = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
    const recipe = await fetchRecipes(recipeId);

    if (!recipe) {
        console.log(`Aucune recette trouvée pour l'ID ${recipeId}`);
        return;
    }

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    if (!fs.existsSync(IMAGE_DIR)) {
        fs.mkdirSync(IMAGE_DIR, { recursive: true });
    }


    const slug = recipe.fields['Titre recettes']
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
        .toLowerCase()
        .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
        .replace(/[^\w-]+/g, '-'); // Supprimer les caractères non alphanumériques
    let finalHTML = templateContent;


    // Génération de l'image principale et des versions redimensionnées
    const imagePaths = await processRecipeImage({ ...recipe, slug });
    if (imagePaths) {
        const relativeImagePath = `/assets/images/img_recette/${slug}_1024px.jpg`;
        const srcset = Object.entries(imagePaths)
            .map(([size, path]) => `${path} ${size}w`) // Pas de `path.join` ici, car les chemins doivent être relatifs pour le HTML
            .join(', ');


        // Remplacer les placeholders dans le template
        finalHTML = finalHTML
            .replace(/{{recipe-image}}/g, relativeImagePath)
            .replace(/{{recipe-image_srcset}}/g, srcset);
    }

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
        (recipe.fields['Temps PRÉPARATION - Minute'] ? recipe.fields['Temps PRÉPARATION - Minute'] + "M" : "");
    const restDurationPT =
        (recipe.fields['Temps REPOS - Heure'] ? recipe.fields['Temps REPOS - Heure'] + "H" : "") +
        (recipe.fields['Temps REPOS - Minute'] ? recipe.fields['Temps REPOS - Minute'] + "M" : "");
    const cookDurationPT =
        (recipe.fields['Temps CUISSON - Heure'] ? recipe.fields['Temps CUISSON - Heure'] + "H" : "") +
        (recipe.fields['Temps CUISSON - Minute'] ? recipe.fields['Temps CUISSON - Minute'] + "M" : "");
    const totalDurationPT =
        (recipe.fields['Temps TOTAL - Heure'] ? recipe.fields['Temps TOTAL - Heure'] + "H" : "") +
        (recipe.fields['Temps TOTAL - Minute'] ? recipe.fields['Temps TOTAL - Minute'] + "M" : "");

    // Traitement des catégories & sous-catégories pour le BreadCrumbs
    const categorieMenu = categoryNames.map(category =>
        `<a href="/recettes?categorie=${encodeURIComponent(category.name)}" class="bread-crumbs__link">
                <h6>${category.name}</h6>
            </a>`).join('<span style="padding: 0 8px;"><h6 style="color: #CB6863;">•</h6></span>');

    const subCategorieMenu = subCategoryNames.map(subCategory => {
        const relevantParentCategory = subCategory.categoryNames.find(categoryName =>
            categoryNames.some(cat => cat.name === categoryName)
        );

        if (relevantParentCategory) {
            return `<a href="/recettes?categorie=${encodeURIComponent(relevantParentCategory)}&subcategorie=${encodeURIComponent(subCategory.name)}" class="bread-crumbs__link">
                            <h6>${subCategory.name}</h6>
                        </a>`;
        } else {
            return '';
        }
    }).filter(Boolean)
    .join('<span style="padding: 0 8px;"><h6 style="color: #CB6863;">•</h6></span>');






    // Récupérez les IDs des ingrédients depuis le champ 'INGRÉDIENTS [PRÉPARATIONS (RECETTE)]'
    const ingredientIds = recipe.fields['INGRÉDIENTS [PRÉPARATIONS (RECETTE)]'] || [];

    console.log("IDs des ingrédients récupérés directement depuis la recette :", ingredientIds);

    // Utilisez `fetchIngredientsListContent` pour obtenir `ingredientsListContent`
    const ingredientsListContent = await fetchIngredientsListContent(ingredientIds);
    const ingredientsListContentJSON = JSON.stringify(ingredientsListContent);



    // Traitement des détails pour preparationIngrédients & preparationEtapes
    const dynamicContent = generateDynamicContent(recipe, recipe.preparationsDetails, ingredientsListContent);


    // Gestion des images
    const imageUrl = Array.isArray(recipe.fields['img.']) && recipe.fields['img.'].length > 0
        ? recipe.fields['img.'][0].url
        : '';

        try {
            const imagePath = await processRecipeImage(recipe);
            console.log(`Chemin de l'image principale : ${imagePath}`);
        } catch (error) {
            console.error(`Erreur : ${error.message}`);
        }

    // Utiliser le chemin de l'image locale dans le HTML
    const relativeImagePath = path.join('/assets/images/img_recette', `${slug}.jpg`);

    // Génération de la description mise à jour
    const updatedDescriptionWithLinks = await replaceRecordIdsWithLinks(recipe.fields['Description recette']);
    const updatedDescriptionWithTitle = await replaceRecordIdsWithRecipeTitle(recipe.fields['Description recette']);


    // Remplacement des placeholders dans le template
    finalHTML = finalHTML
        .replace(/{{recipe-title}}/g, recipe.fields['Titre recettes'])
        .replace(/{{recipe-id}}/g, recipe.fields['RECORD-ID'])
        .replace(/{{recipe-description-with-link}}/g, updatedDescriptionWithLinks)
        .replace(/{{recipe-description-with-title}}/g, updatedDescriptionWithTitle)
        .replace(/{{recipe-image}}/g, relativeImagePath)
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
        .replace(/{{recipe-pricingLevel}}/g, recipe.fields['Prix recette / portions (FORMATÉ)'])
        .replace(/{{recipe-calorie}}/g, recipe.fields['Energie [ kcal / portion ] (FORMATÉ)'])
        .replace(/{{recipe-prepDuration}}/g, recipe.fields['Temps PRÉPARATION'])
        .replace(/{{recipe-restDuration}}/g, recipe.fields['Temps REPOS'])
        .replace(/{{recipe-cookDuration}}/g, recipe.fields['Temps CUISSON'])
        .replace(/{{recipe-totalDuration}}/g, recipe.fields['Temps TOTAL'])
        .replace(/{{recipe-preparationIngrédients}}/g, dynamicContent.preparationIngredientsHTML)
        .replace(/{{recipe-preparationEtapes}}/g, dynamicContent.preparationEtapesHTML)
        .replace(/{{recipe-ingredientsListContent}}/g, ingredientsListContentJSON);

    fs.writeFileSync(path.join(OUTPUT_DIR, `${slug}.html`), finalHTML);
    console.log(`Page générée pour la recette: ${slug}`);

    const srcset = Object.entries(imagePaths)
        .map(([size, path]) => `${path} ${size}w`)
        .join(', ');

    // Appel du script de génération de carte avec l'ID de la recette et `srcset`
    exec(`node generateRecipeCard.js ${recipe.id} "${srcset}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erreur lors de la génération de la carte de recette ${recipe.id}: ${error}`);
            return;
        }
        console.log(stdout);
        if (stderr) console.error(stderr);
    });

   console.log(`Génération terminée pour : ${recipeId}`);
}

generateStaticPages().catch(console.error);






