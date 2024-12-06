// generateRecipeCard.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const RECIPES_LIST_PATH = path.join(__dirname, 'dist', 'recettes.html');

function sanitizeText(text) {
    if (typeof text !== 'string') {
        text = text ? String(text) : ''; // Convertit en chaîne ou retourne une chaîne vide
    }
    return text
        .replace(/\\/g, '')       // Supprime les backslashes
        .replace(/"/g, '&quot; ')  // Échappe les guillemets doubles pour éviter les conflits HTML
        .replace(/'/g, '&#39; ')   // Échappe les apostrophes
        .replace(/</g, '&lt; ')    // Échappe les chevrons <
        .replace(/>/g, '&gt; ');   // Échappe les chevrons >
}





// Fonction pour vérifier si une carte existe déjà dans recettes.html
function recipeExistsInHTML(existingContent, recordId) {
    const regex = new RegExp(`id="${recordId}"`, 'g');
    return regex.test(existingContent);
}

// Fonction pour récupérer une recette spécifique avec ses catégories depuis Airtable
async function fetchRecipeWithCategories(recordId) {
    const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE__RECETTES__TABLE_ID}/${recordId}`;
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`
        }
    });
    const recipe = await response.json();

    // Récupérez les IDs de catégories et sous-catégories
    const categoryIds = recipe.fields['CATÉGORIE MENUS [base]'] || [];
    const subCategoryIds = recipe.fields['SOUS-CATÉGORIE MENUS [base]'] || [];

    // Obtenez les noms des catégories et sous-catégories
    const categoryNames = await fetchCategories(categoryIds);
    const subCategoryNames = await fetchSubCategories(subCategoryIds);

    return { recipe, categoryNames, subCategoryNames };
}

// Fonction pour récupérer les noms de catégories
async function fetchCategories(ids) {
    if (!ids || ids.length === 0) return [];
    const response = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE__MENUS_CATEGORIE__TABLE_ID}?filterByFormula=OR(${ids.map(id => `RECORD_ID()='${id}'`).join(',')})`, {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}` }
    });
    const data = await response.json();
    return data.records.map(record => ({ id: record.id, name: record.fields['Nom Menu'] }));
}

// Fonction pour récupérer les noms de sous-catégories
async function fetchSubCategories(ids) {
    if (!ids || ids.length === 0) return [];
    const response = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE__MENUS_SOUS_CATEGORIE__TABLE_ID}?filterByFormula=OR(${ids.map(id => `RECORD_ID()='${id}'`).join(',')})`, {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}` }
    });
    const data = await response.json();
    return data.records.map(record => ({ id: record.id, name: record.fields['Nom sous-catégorie menus'] }));
}

// Fonction pour générer le HTML d'une carte de recette
function generateRecipeCardHTML(recipe, categoryNames, subCategoryNames, srcset) {
    const title = recipe.fields['Titre recettes'] || 'Titre non disponible';
    const slug = recipe.fields['Titre recettes']
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
        .toLowerCase()
        .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
        .replace(/[^\w-]+/g, '-'); // Supprimer les caractères non alphanumériques
    const urlRecette = `/dist/recettes/${slug}.html`;
    const recipeDuration = recipe.fields['Temps recette'] || '';
    const difficultiesLevel = recipe.fields['Difficulté recette'] || '';
    const pricingLevel = recipe.fields['Prix recette / portions (FORMATÉ)'] || '';
    const relativeImagePath = path.join('/assets/images/img_recette', `${slug}.jpg`);

    // Encoder chaque catégorie et sous-catégorie avec `encodeURIComponent` 
    const categories = Array.isArray(categoryNames)
        ? categoryNames.map(c => encodeURIComponent(c.name).replace(/'/g, '%27')).join(',')
        : '';

    const subCategories = Array.isArray(subCategoryNames)
        ? subCategoryNames.map(sc => encodeURIComponent(sc.name).replace(/'/g, '%27')).join(',')
        : '';

    // Génération des sous-catégories pour les affichages spécifiques avec encodage standard
    const subCategory = subCategoryNames.map(subCategory =>
        `<div class="subCategory"><h7>${encodeURIComponent(subCategory.name)}</h7></div>`
    ).join('');

    const ingredients = sanitizeText(recipe.fields['Cumul de INGRÉDIENTS [Base] (à partir de INGRÉDIENTS [PRÉPARATIONS (RECETTE)])'] || '');
    const portionBase = recipe.fields['Nb. de portion [base]'] || '';
    const ingrédientRecordIdQt = recipe.fields['data-ref-ingrédient_RecordID_Qt'] || '';
    const instructions = sanitizeText(recipe.fields['Instruction'] || '');
    const description = sanitizeText(recipe.fields['Description recette'] || '');

    const pricing = recipe.fields['Prix recette / portions'] || '';
    const calorie = recipe.fields['Energie [ kcal / portion ]'] || '';
    const timing = recipe.fields['Temps recette'] || '';

    console.log('Generated HTML:', `
        <a href="${urlRecette}" 
            class="recette-item" 
            style="text-decoration: none;" 
            id="${recipe.id}" 
            data-ref-titre="${title}"
            data-ref-description="${description}"
            data-ref-categorie="${categories}" 
            data-ref-subcategorie="${subCategories}" 
            data-ref-timing="${timing}"
            data-ref-pricing="${pricing}"
            data-ref-calorie="${calorie}"
            data-ref-ingredients="${ingredients}" 
            data-ref-portion-base="${portionBase}"
            data-ref-ingrédient-RecordId-Qt='${ingrédientRecordIdQt}'
            data-ref-instructions="${instructions}">
        </a>
    `);

    // Génération de la carte recette avec encodage complet pour les `data-ref`
    return `
        <a href="${urlRecette}" 
            class="recette-item" 
            style="text-decoration: none;" 
            id="${recipe.id}" 
            data-ref-titre="${title}"
            data-ref-description="${description}"
            data-ref-categorie="${categories}" 
            data-ref-subcategorie="${subCategories}" 
            data-ref-ingredients="${ingredients}" 
            data-ref-portion-base="${portionBase}"
            data-ref-ingrédient-RecordId-Qt='${ingrédientRecordIdQt}'
            data-ref-instructions="${instructions}">
            <add-favorite-button data-recipe-id="${recipe.id}" style="
                    position: absolute;
                    top: 20px;
                    right: 12px;
                    z-index: 3;
                    cursor: pointer;
                    " onclick="event.preventDefault(); addToFavorites(event)">
                </add-favorite-button>
            <div class="recette-item__container_img">
                
                <div class="subCategories">
                    ${subCategory}
                </div>

                <div class="recette-image_overlay"></div>
                    <img class="recette-image" src="${relativeImagePath}" srcset="${srcset}" alt="${title}">       
                </div>
                <div class="infos__recette">
                    <div class="top-infos__recette">
                        <div class="top-info">
                            <div class="top-info__img">
                                <svg id="Calque_2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 47.95 63.21">
                                    <defs>
                                        <style>
                                            .cls-1 {
                                                fill: #cb6863;
                                            }
                                        </style>
                                    </defs>
                                    <g id="Calque_1-2" data-name="Calque_1">
                                        <g id="SVGRepo_iconCarrier">
                                            <g>
                                                <path class="cls-1"
                                                    d="M41.19,14.95C36.19,5.31,30.08,0,23.97,0S11.76,5.31,6.76,14.95C2.72,22.75,0,32.48,0,39.15c0,13.26,10.75,24.06,23.97,24.06s23.97-10.79,23.97-24.06c0-6.67-2.72-16.4-6.76-24.2ZM9.95,16.99c2-3.84,4.27-7.03,6.58-9.21,2.5-2.37,5-3.57,7.44-3.57s4.94,1.2,7.44,3.57c2.31,2.18,4.58,5.37,6.58,9.21,2.9,5.58,5.06,12.21,5.84,17.69h-3.36v-1.34c0-.77-.63-1.4-1.4-1.4s-1.4.63-1.4,1.4v1.34h-2.63v-1.34c0-.77-.63-1.4-1.4-1.4s-1.4.63-1.4,1.4v1.34h-2.63v-3.02c0-.77-.63-1.4-1.4-1.4s-1.4.63-1.4,1.4v3.02h-2.63v-1.34c0-.77-.63-1.4-1.4-1.4s-1.4.63-1.4,1.4v1.34h-2.63v-1.34c0-.77-.63-1.4-1.4-1.4s-1.4.63-1.4,1.4v1.34h-2.63v-3.02c0-.77-.63-1.4-1.4-1.4s-1.4.63-1.4,1.4v3.02h-6.46c.78-5.48,2.94-12.11,5.84-17.69ZM23.97,59c-11.13,0-20.18-9.05-20.18-20.18,0-.43.01-.88.04-1.34h40.29c.03.46.04.91.04,1.34,0,11.13-9.05,20.18-20.18,20.18Z" />
                                                <path class="cls-1"
                                                    d="M29.15,42.54c-.25-.43-.71-.7-1.21-.7s-.96.27-1.21.7l-1.42,2.46c-.25.43-.25.97,0,1.4s.71.7,1.21.7h2.84c.5,0,.96-.27,1.21-.7s.25-.97,0-1.4l-1.42-2.46Z" />
                                            </g>
                                        </g>
                                    </g>
                                </svg>
                            </div>
                            <div class="top-info__label">
                                <h7 id="tempsRecette">
                                    ${recipeDuration}
                                </h7>
                            </div>
                        </div>
                        <div class="top-info">
                            <div class="top-info__img">
                                <svg id="Calque_2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 53.43 64">
                                    <defs>
                                        <style>
                                            .cls-1 {
                                                fill: #cb6863;
                                            }
                                        </style>
                                    </defs>
                                    <g id="Calque_1-2" data-name="Calque_1">
                                        <g id="SVGRepo_iconCarrier">
                                            <g>
                                                <path class="cls-1"
                                                    d="M6.18,28.19c1.07.46,2.13,1.61,2.29,2.76l2.4,17.41c.16,1.16.29,3.04.29,4.21v9.32c0,1.17.95,2.11,2.11,2.11h27.07c1.17,0,2.11-.95,2.11-2.11v-9.32c0-1.17.13-3.05.29-4.21l2.41-17.45c.16-1.16,1.22-2.31,2.28-2.79,3.57-1.61,6-4.79,6-8.44s-2.44-6.91-6.09-8.5c-1.07-.47-2.39-1.54-3.02-2.52C40.93,3.41,34.23,0,26.72,0S12.51,3.41,9.12,8.65c-.63.98-1.95,2.06-3.02,2.52C2.44,12.77,0,15.99,0,19.67c0,3.71,2.52,6.93,6.18,8.52ZM38.74,57.55c0,1.11-.91,2.02-2.02,2.02h-19.82c-1.12,0-2.02-.91-2.02-2.02v-3.49c0-1.12.9-2.02,2.02-2.02h19.82c1.11,0,2.02.9,2.02,2.02v3.49ZM9.14,14.52c1.07-.33,2.23-1.26,2.74-2.25,2.4-4.6,8.13-7.84,14.84-7.84s12.44,3.24,14.84,7.84c.52.99,1.68,1.92,2.74,2.25,2.89.89,4.94,3.1,4.94,5.69s-2.08,4.84-5.01,5.72c-1.07.32-2.01.53-2.04.73l-.05.36-.02.17-.33,2.16-1.46,9.73c-.17,1.1-.33,2-.36,2s-.18.9-.34,2l-.41,2.94c-.15,1.11-1.18,2-2.3,2h-20.21c-1.12,0-2.14-.9-2.3-2l-1.57-11.37-.8-5.29-.33-2.17-.03-.19s-.02-.15-.05-.34c-.03-.19-.97-.35-2.05-.63-3.12-.79-5.38-3.09-5.38-5.81,0-2.59,2.05-4.8,4.94-5.69Z" />
                                                <path class="cls-1"
                                                    d="M20.31,43.45c.93,0,1.68-.75,1.68-1.68v-11.21c0-.93-.75-1.68-1.68-1.68s-1.68.75-1.68,1.68v11.21c0,.93.75,1.68,1.68,1.68Z" />
                                                <path class="cls-1"
                                                    d="M27.04,43.45c.93,0,1.68-.75,1.68-1.68v-11.21c0-.93-.75-1.68-1.68-1.68s-1.68.75-1.68,1.68v11.21c0,.93.75,1.68,1.68,1.68Z" />
                                                <path class="cls-1"
                                                    d="M33.76,43.45c.93,0,1.68-.75,1.68-1.68v-11.21c0-.93-.75-1.68-1.68-1.68s-1.68.75-1.68,1.68v11.21c0,.93.75,1.68,1.68,1.68Z" />
                                            </g>
                                        </g>
                                    </g>
                                </svg>
                            </div>
                            <div class="top-info__label">
                                <h7 id="difficulteRecette">
                                    ${difficultiesLevel}
                                </h7>
                            </div>
                        </div>
                        <div class="top-info">
                            <div class="top-info__img">
                                <svg id="Calque_2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 55.29 67">
                                    <defs>
                                        <style>
                                        .cls-1 {
                                            fill: #cd6a65;
                                        }
                                        </style>
                                    </defs>
                                    <g id="Calque_2-2" data-name="Calque_2">
                                        <g>
                                        <path class="cls-1" d="M19.8,23.87v-.99c0-2.54.9-4.7,2.7-6.5s3.96-2.7,6.5-2.7,4.95,1.14,7.21,3.42l-2.41,2.41c-1.6-1.59-3.2-2.38-4.79-2.38s-2.96.56-4.09,1.68-1.69,2.48-1.69,4.06v.99h10.04l-.68,3.04h-9.36v.91h9.41l-.66,3.03-8.74-.05c0,1.6.56,2.96,1.69,4.08s2.49,1.68,4.09,1.68,2.96-.57,4.08-1.7c.7-.7,1.26-1.72,1.67-3.06h3.48c-.58,2.43-1.49,4.26-2.72,5.51-1.79,1.79-3.96,2.69-6.51,2.69s-4.7-.9-6.5-2.7-2.7-3.96-2.7-6.5v.05h-2.74l.66-3.03h2.07v-.91h-2.11l.66-3.04h1.44Z"/>
                                        <path class="cls-1" d="M54.39,32.62c.32-1.68.5-3.41.5-5.18C54.88,12.31,42.57,0,27.44,0S0,12.31,0,27.44c0,2.4.31,4.73.9,6.96-.32,1.67-.49,3.39-.49,5.16,0,15.13,12.31,27.44,27.44,27.44s27.44-12.31,27.44-27.44c0-2.4-.32-4.72-.9-6.94ZM27.44,4c12.93,0,23.44,10.52,23.44,23.44s-10.52,23.44-23.44,23.44S4,40.37,4,27.44,14.52,4,27.44,4ZM27.85,63c-11.88,0-21.71-8.88-23.23-20.35,4.93,7.37,13.32,12.23,22.83,12.23,10.16,0,19.05-5.56,23.79-13.79-.79,12.21-10.98,21.91-23.39,21.91Z"/>
                                        </g>
                                    </g>
                                </svg>
                            </div>
                            <div class="top-info__label">
                                <h7 id="prixRecette">
                                    ${pricingLevel}
                                </h7>
                            </div>
                        </div>
                    </div>
                </div>
                <h3 class="recette_titre">${title}</h3>         
        </div>
    </a>`;
}


// Fonction principale pour ajouter ou mettre à jour la carte de recette
async function addOrUpdateRecipeCard(recordId, srcset) {
    const { recipe, categoryNames, subCategoryNames } = await fetchRecipeWithCategories(recordId);

    const existingContent = fs.existsSync(RECIPES_LIST_PATH) ? fs.readFileSync(RECIPES_LIST_PATH, 'utf-8') : '';
    const newCardHTML = generateRecipeCardHTML(recipe, categoryNames, subCategoryNames, srcset);

    if (recipeExistsInHTML(existingContent, recordId)) {
        const updatedContent = existingContent.replace(
            new RegExp(`<a[^>]*id="${recordId}"[^>]*>[\\s\\S]*?<\\/a>`),
            newCardHTML
        );
        fs.writeFileSync(RECIPES_LIST_PATH, updatedContent);
        console.log(`Carte mise à jour pour la recette: ${recipe.fields['Titre recettes']}`);
    } else {
        const updatedContent = existingContent + newCardHTML;
        fs.writeFileSync(RECIPES_LIST_PATH, updatedContent);
        console.log(`Carte ajoutée pour la recette: ${recipe.fields['Titre recettes']}`);
    }

}

// Récupération de l'ID de la recette et du srcset depuis les arguments en ligne de commande
const recordId = process.argv[2];
const srcset = process.argv[3]; // Utiliser directement la chaîne de texte passée
if (recordId) {
    addOrUpdateRecipeCard(recordId, srcset).catch(console.error);
} else {
    console.log("Aucun ID de recette spécifié.");
}