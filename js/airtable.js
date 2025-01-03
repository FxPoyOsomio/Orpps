// Fonction pour encoder un ArrayBuffer en Base64 sans utiliser btoa
function arrayBufferToBase64(buffer) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    let base64 = '';

    for (let i = 0; i < len; i += 3) {
        const a = bytes[i];
        const b = i + 1 < len ? bytes[i + 1] : 0;
        const c = i + 2 < len ? bytes[i + 2] : 0;

        const triplet = (a << 16) | (b << 8) | c;

        base64 += chars[(triplet >> 18) & 0x3F];
        base64 += chars[(triplet >> 12) & 0x3F];
        base64 += i + 1 < len ? chars[(triplet >> 6) & 0x3F] : '=';
        base64 += i + 2 < len ? chars[triplet & 0x3F] : '=';
    }

    return base64;
}

// Configuration d'entrée
let config = input.config();
let nomRecette = config.Nom_Recette;
let recipeRecordId = config.RECETTE_RecordID; // ID de la recette en cours
let ingredientRecette = config.Ingrédient_Recette; // Ingrédients principaux
let preparationsRecetteBase = config.PRÉPARATIONS_RECETTE_base; // IDs des préparations
let ingredientsPreparationsRecette = config.INGRÉDIENTS_PRÉPARATIONS_RECETTE; // IDs des ingrédients des préparations
let nbPortions = config.Nb_Portions; // Récupérer le nombre de portions

// infos pour github

let nomRecetteBase64 = encodeURIComponent(nomRecette);

const GITHUB_USERNAME = 'FxPoyOsomio';
const GITHUB_TOKEN = 'REPLACE-BY-TOKEN-GITHUB'; // !!ATTNETION : to replace !!!!!!!!!!!!!!!!
const REPO_NAME = 'Orpps';
const RECIPE = nomRecette; // nom de votre recette
const RECIPE_NAME = nomRecetteBase64; // nom de votre recette en base 64
const FILE_NAME = 'index.html'; // Nom du fichier
const IMAGE_PATH = `recettes/${RECIPE_NAME}/assets/images/img_recette/${RECIPE_NAME}.jpg`;
const FILE_PATH = `recettes/${RECIPE_NAME}/${FILE_NAME}`;



async function uploadRecipeImage() {
    // Récupérer l'enregistrement de la recette dans Airtable
    let table = base.getTable('RECETTES [base]');
    let record = await table.selectRecordAsync(recipeRecordId);

    if (record) {
        // Récupérer l'URL de l'image depuis le champ d'attachement 'img.'
        let imgAttachment = record.getCellValue('img.');

        if (imgAttachment && imgAttachment.length > 0) {
            // Extraire le nom de l'image depuis l'URL
            let imgUrl = imgAttachment[0].url;
            let imgName = imgUrl.substring(imgUrl.lastIndexOf('/') + 1);

            // Construire le chemin complet de l'image
            const IMAGE_PATH = `recettes/${RECIPE_NAME}/assets/images/img_recette/${RECIPE_NAME}.jpg`;
            console.log(`Le chemin de l'image est : ${IMAGE_PATH}`);

            try {
                // Récupérer le blob de l'image
                let response = await fetch(imgUrl);
                let imgBlob = await response.blob();
                let imgArrayBuffer = await imgBlob.arrayBuffer();
                let imgBase64 = arrayBufferToBase64(imgArrayBuffer);

                // Préparer les données pour le commit sur GitHub
                let githubApiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${IMAGE_PATH}`;
                let payload = {
                    message: `Ajout de l'image de la recette ${nomRecette}`,
                    content: imgBase64
                };

                // Commit de l'image sur GitHub
                let uploadResponse = await fetch(githubApiUrl, {
                    method: "PUT",
                    headers: {
                        "Authorization": `token ${GITHUB_TOKEN}`,
                        "Accept": "application/vnd.github.v3+json"
                    },
                    body: JSON.stringify(payload)
                });

                if (uploadResponse.ok) {
                    let imageUrl = `https://fxpoyosomio.github.io/${REPO_NAME}/${IMAGE_PATH}`;
                    console.log(`L'image de la recette ${nomRecette} a été uploadée avec succès.`);
                    console.log(`URL de l'image : ${imageUrl}`);
                    
                    // Mettre à jour le champ URL de l'image dans Airtable
                    await table.updateRecordAsync(record.id, {
                        'url_img_recette': imageUrl // Utilisez 'url_img_recette' pour stocker l'URL de l'image
                    });
                    console.log(`Le champ 'url_img_recette' a été mis à jour avec : ${imageUrl}`);

                    return imageUrl; // Retourner l'URL de l'image ici
                } else {
                    console.log("Erreur lors de l'upload de l'image sur GitHub.", await uploadResponse.json());
                }
            } catch (error) {
                console.log("Erreur lors de la récupération ou de l'encodage de l'image : " + error.message);
            }
        } else {
            console.log("Aucune image trouvée pour cette recette.");
        }
    } else {
        console.log("Aucun enregistrement trouvé pour l'ID de la recette fourni.");
    }
}

// Appel de la fonction et gestion de la valeur retournée
uploadRecipeImage().then(imageUrl => {
    if (imageUrl) {
        console.log("URL de l'image retournée : ", imageUrl);
    } else {
        console.log("Aucune URL d'image n'a été retournée.");
    }
});


// Après l'exécution du script, imageUrl contient l'URL de l'image, si elle a été définie avec succès.
console.log("Valeur finale de imageUrl : " + imageUrl);



// Log des valeurs pour vérifier
console.log("Nom de la recette :", nomRecette);
console.log("Ingrédients :", ingredientRecette);
console.log("ID des préparations :", preparationsRecetteBase);
console.log("ID des ingrédients préparations :", ingredientsPreparationsRecette);
console.log("Nombre de portions :", nbPortions); // Log du nombre de portions

// Récupérer les enregistrements de la table "PRÉPARATIONS (RECETTE) [base]"
let tablePreparations = base.getTable("PRÉPARATIONS (RECETTE) [base]");
let queryPreparations = await tablePreparations.selectRecordsAsync();

// Récupérer les enregistrements de la table "ÉTAPES PRÉPARATIONS (RECETTE) [base]"
let tableEtapes = base.getTable("ÉTAPES PRÉPARATIONS (RECETTE) [base]");
let queryEtapes = await tableEtapes.selectRecordsAsync();


// Récupérer les ingrédients de la table 'INGRÉDIENTS [PRÉPARATIONS (RECETTE)]'
let tableIngredients = base.getTable("INGRÉDIENTS [PRÉPARATIONS (RECETTE)]");
let queryIngredients = await tableIngredients.selectRecordsAsync();

// Récupérer les préparations
let preparations = preparationsRecetteBase.map(id => {
    let record = queryPreparations.getRecord(id);
    if (record) {
        let titrePreparation = record.getCellValue("Préparation");
        let etapesPreparation = record.getCellValue("ÉTAPES PRÉPARATIONS (RECETTE) [base]");
        let ingredientPreparation = record.getCellValue("INGRÉDIENTS [RECETTES PRÉPARATION]");

        // Extraire uniquement les recordId des étapes
        let etapesPreparationIds = etapesPreparation ? etapesPreparation.map(etape => etape.id) : [];

        // Extraire les IDs des ingrédients
        let ingredientPreparationIds = ingredientPreparation ? ingredientPreparation.map(ingredient => ingredient.id) : [];

        return {
            titre: titrePreparation,
            etapes: etapesPreparationIds,
            ingredientsId: ingredientPreparationIds // Utilisez le tableau d'IDs des ingrédients
        };
    } else {
        console.error(`Préparation avec l'ID ${id} introuvable.`);
        return null;
    }
}).filter(preparation => preparation !== null);

// Log des préparations pour vérification
console.log("Préparations après extraction des étapes :", preparations);

let preparationsDetails = preparations.map(preparation => {
    if (preparation.etapes) {
        let etapesDetails = preparation.etapes.map(etapeId => {
            if (typeof etapeId === 'string') {
                let record = queryEtapes.getRecord(etapeId);
                if (record) {
                    let ordre = record.getCellValue("Ordre étape recette");
                    let instructions = record.getCellValue("Instructions");

                    return {
                        ordre: ordre,
                        originalInstructions: instructions,
                    };
                } else {
                    console.error(`Étape avec l'ID ${etapeId} introuvable.`);
                    return null;
                }
            } else {
                console.error(`ID d'étape non valide : ${etapeId}`);
                return null;
            }
        }).filter(etape => etape !== null);

        let ingredientsDetails = preparation.ingredientsId.map(ingredientId => {
            if (typeof ingredientId === 'string') {
                let record = queryIngredients.getRecord(ingredientId);
                if (record) {
                    let quantite = record.getCellValue("Qté. [base]");
                    let uniteObj = record.getCellValue("Unité");
                    let unite = uniteObj ? uniteObj.name : "";
                    let nomIngredient = record.getCellValue("Nom ingrédient (sans quantité)");
                    let ordernb = record.getCellValue("Ordre d'ingrédient");
                    let order = '[' + ordernb + ']';
                    let img = record.getCellValue("url_Img (from INGRÉDIENTS [Base])");

                    return { quantity: quantite, unit: unite || '', name: nomIngredient, order: order, ordernb: ordernb, img: img };
                } else {
                    console.error(`Ingrédient avec l'ID ${ingredientId} introuvable.`);
                    return null;
                }
            } else {
                console.error(`ID de l'ingrédient non valide : ${ingredientId}`);
                return null;
            }
        }).filter(ingredient => ingredient !== null); // Assurez-vous de filtrer les ingrédients nulls

        return {
            ...preparation,
            etapes: etapesDetails,
            ingredientsDetails: ingredientsDetails
        };
    } else {
        return preparation;
    }
});

// Log des préparations avec étapes
console.log("Préparations avec étapes détaillées :", preparationsDetails);



// Récupérer les ingrédients de la table 'INGRÉDIENTS [PRÉPARATIONS (RECETTES)]'
let ingredientsList = ingredientsPreparationsRecette.map(id => {
    let record = queryIngredients.getRecord(id);
    if (record) {
        let quantite = record.getCellValue("Qté. [base]");
        let uniteObj = record.getCellValue("Unité");  // Récupérer l'objet de la sélection unique
        let unite = uniteObj ? uniteObj.name : "";    // Utiliser la propriété 'name' pour obtenir la valeur
        let nomIngredient = record.getCellValue("Nom ingrédient (sans quantité)");
        let nomSimpleIngredient = record.getCellValue("Nom ingrédient");
        let ordernb = record.getCellValue("Ordre d'ingrédient");
        let order = '[' + ordernb + ']';
        let img = record.getCellValue("url_Img (from INGRÉDIENTS [Base])");

        return { quantite, unite, nom: nomIngredient, simplename: nomSimpleIngredient, order, ordernb, img };
    } else {
        return null;
    }
}).filter(ingredient => ingredient !== null);

// Log des ingrédients
console.log("Ingrédients préparations :", ingredientsList);

// Récupérer les détails des ingrédients pour HTML
let ingredientsDetailsForHTML = ingredientsList.map((ingredient, index) => ({
    order: ingredient.ordernb,
    quantity: ingredient.quantite,
    unit: ingredient.unite || '', // Vérifiez si l'unité existe
    name: ingredient.nom,
    simplename: ingredient.simplename,
    img: ingredient.img,
}));

console.log("Ingrédients infos :", ingredientsDetailsForHTML);



let categorieRecette = config.Categorie_Recette;
console.log("Catégorie recette :", categorieRecette);

let subCategorieRecette = config.Sub_Categorie_Recette;
console.log("Sous-catégorie recette :", subCategorieRecette);



let tempsRecette = config.Temps_Recette;
console.log("Temps recette :", tempsRecette);

let difficulteRecette = config.Difficulté_Recette;
console.log("Difficulté recette :", difficulteRecette);

let prixRecette = config.Prix_Recette;
console.log("Prix recette :", prixRecette);



let descriptionRecette = config.Desciption_Recette;
console.log("Desciption recette :", descriptionRecette);



let tempsPreparation = config.Temps_Préparation;
console.log("Temps préparation :", tempsPreparation);

let tempsRepos = config.Temps_Repos;
console.log("Temps repos :", tempsRepos);

let tempsCuisson = config.Temps_Cuisson;
console.log("Temps cuisson :", tempsCuisson);

let tempsTotal = config.Temps_Total;
console.log("Temps total :", tempsTotal);





// Génération du code HTML
let newHtmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${nomRecette}</title>
    <script type="application/ld+json">
        {
        "@context": "http://schema.org",
        "@type": "Recipe",
        "name": "${nomRecette}",
        "recipeIngredient": [${ingredientsDetailsForHTML.map(item => `"${item.simplename},${item.quantity}${item.unit}"`).join(", ")}]
        }
    </script>


    <script async="async" src="//platform.getbring.com/widgets/import.js"></script>
    <link rel="stylesheet" href="/Orpps/css/styles.css"> <!-- fichiers global CSS ici -->
    <link rel="stylesheet" href="/Orpps/css/recettes.css"> <!--  fichiers recettes CSS ici -->  
</head>
<body>
    <div id="header"></div> <!-- Conteneur pour charger le header -->

    <div class="page-container">
    
        <div class="container__img-recette__two-column-page">
            <img src="https://fxpoyosomio.github.io/${REPO_NAME}/${IMAGE_PATH}"
                class="img-recette" alt="image-recette"></img>
        </div>

        <div class="container__info-recette">

            <div class="bread-crumbs">
                <a class="bread-crumbs__link" href="https://fxpoyosomio.github.io/${REPO_NAME}/">
                    <h6>Accueil</h6>
                </a>
                <span style="padding: 0 8px;">
                    <h6 style="color: #CB6863;">></h6>
                </span>
                <a class="bread-crumbs__link" href="https://fxpoyosomio.github.io/${REPO_NAME}/recettes.html">
                    <h6>Recettes</h6>
                </a>
                <span style="padding: 0 8px;">
                    <h6 style="color: #CB6863;">></h6>
                </span>
                <a class="bread-crumbs__link" href="https://fxpoyosomio.github.io/${REPO_NAME}/recettes/${categorieRecette}/">
                    <h6>${categorieRecette}</h6>
                </a>
                <span style="padding: 0 8px;">
                    <h6 style="color: #CB6863;">></h6>
                </span>
                <a class="bread-crumbs__link" href="https://fxpoyosomio.github.io/${REPO_NAME}/recettes/${categorieRecette}/${subCategorieRecette}/">
                    <h6>${subCategorieRecette}</h6>
                </a>

            </div> 
            

            <h1 class="titre-recette">
                ${nomRecette}
            </h1>

            <div class="container__img-recette__one-column-page">
                <img src="https://fxpoyosomio.github.io/${REPO_NAME}/${IMAGE_PATH}"
                    class="img-recette" alt="image-recette"></img>
            </div>

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
                        <h7>
                            ${tempsRecette}
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
                        <h7>
                            ${difficulteRecette}
                        </h7>
                    </div>
                </div>
                <div class="top-info">
                    <div class="top-info__img">
                        <svg id="Calque_2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52.29 64">
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
                                            d="M26.14,64c-14.42,0-26.14-11.73-26.14-26.14v-12.9h4.69v12.9c0,11.83,9.62,21.45,21.45,21.45s21.45-9.62,21.45-21.45v-12.9h4.69v12.9c0,14.42-11.73,26.14-26.14,26.14Z" />
                                        <rect class="cls-1" x="12.96" y="21.34" width="19.87" height="3.5" />
                                        <rect class="cls-1" x="12.83" y="27.44" width="20" height="3.5" />
                                        <path class="cls-1"
                                            d="M26.14,42.29c-5.01,0-9.09-4.08-9.09-9.09v-14.11c0-5.01,4.08-9.09,9.09-9.09s9.09,4.08,9.09,9.09h-4.69c0-2.42-1.97-4.39-4.39-4.39s-4.39,1.97-4.39,4.39v14.11c0,2.42,1.97,4.39,4.39,4.39s4.39-1.97,4.39-4.39h4.69c0,5.01-4.08,9.09-9.09,9.09Z" />
                                        <path class="cls-1"
                                            d="M26.14,52.29C11.73,52.29,0,40.56,0,26.14S11.73,0,26.14,0s26.14,11.73,26.14,26.14-11.73,26.14-26.14,26.14ZM26.14,4.69C14.32,4.69,4.69,14.32,4.69,26.14s9.62,21.45,21.45,21.45,21.45-9.62,21.45-21.45S37.97,4.69,26.14,4.69Z" />
                                    </g>
                                </g>
                            </g>
                        </svg>
                    </div>
                    <div class="top-info__label">
                        <h7>
                            ${prixRecette}
                        </h7>
                    </div>
                </div>
            </div>

            <div class="call-to-action__buttons">

                <primary-button text="liste de course" href="/Orpps/liste_de_course.html">
                    <svg width="64px" height="64px" viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg"
                        xmlns:xlink="http://www.w3.org/1999/xlink" class="si-glyph si-glyph-basket-plus" fill="#000000">
                        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                        <g id="SVGRepo_iconCarrier">
                            <title>625</title>
                            <defs> </defs>
                            <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                <g transform="translate(0.000000, 1.000000)" fill="#ffffff">
                                    <path
                                        d="M9.927,11.918 C9.887,11.833 9.86,11.741 9.86,11.639 L9.86,7.483 C9.86,7.145 10.146,6.907 10.448,6.907 L10.469,6.907 C10.77,6.907 11.063,7.145 11.063,7.483 L11.063,10.943 L11.965,10.943 L11.965,8.982 L13.258,8.982 L13.422,5.976 L14.188,5.976 C14.588,5.976 14.913,4.756 14.913,4.756 C14.913,4.386 14.589,4.084 14.188,4.084 L12.26,4.084 L11.225,0.447 C11.074,0.13 10.699,0.00199999998 10.387,0.161 L10.315,0.197 C10.005,0.357 9.876,0.743 10.027,1.06 L10.768,4.083 L4.114,4.083 L4.882,1.064 C5.036,0.75 4.909,0.362 4.601,0.199 L4.531,0.163 C4.22,0.000999999981 3.843,0.125 3.689,0.44 L2.616,4.083 L0.726,4.083 C0.326,4.083 0.000999999931,4.385 0.000999999931,4.755 C0.000999999931,4.755 0.325,5.975 0.726,5.975 L1.362,5.975 L1.811,12.652 C1.811,12.652 1.863,13.961 3.924,13.961 L9.928,13.961 L9.928,11.918 L9.927,11.918 Z M11.969,5 L13.031,5 L13.031,6.062 L11.969,6.062 L11.969,5 L11.969,5 Z M3.094,6.031 L1.912,6.031 L1.912,4.906 L3.094,4.906 L3.094,6.031 L3.094,6.031 Z M5.006,11.742 C5.006,12.092 4.755,12.375 4.447,12.375 L4.424,12.375 C4.113,12.375 3.863,12.092 3.863,11.742 L3.863,7.413 C3.863,7.063 4.113,6.781 4.424,6.781 L4.447,6.781 C4.755,6.781 5.006,7.063 5.006,7.413 L5.006,11.742 L5.006,11.742 Z M8.004,11.547 C8.004,11.881 7.774,12.152 7.49,12.152 L7.469,12.152 C7.185,12.152 6.955,11.881 6.955,11.547 L6.955,7.448 C6.955,7.114 7.184,6.844 7.469,6.844 L7.49,6.844 C7.773,6.844 8.004,7.115 8.004,7.448 L8.004,11.547 L8.004,11.547 Z"
                                        class="si-glyph-fill"> </path>
                                    <path
                                        d="M16,12.012 L13.992,12.012 L13.992,10.106 L13.055,10.106 L13.055,12.012 L11.052,12.012 L11.052,12.906 L13.055,12.906 L13.055,14.938 L13.992,14.938 L13.992,12.906 L16,12.906 L16,12.012 Z"
                                        class="si-glyph-fill"> </path>
                                </g>
                            </g>
                        </g>
                    </svg>
                </primary-button>

                <div class="portion-bring-conteneur">
                    <div class="bring-container">
                        <div id="bring-import-container" data-bring-import data-bring-language="fr" data-bring-theme="light" data-bring-base-quantity="${nbPortions}" data-bring-requested-quantity="${nbPortions}">
                            <a href="https://www.getbring.com">Bring! Einkaufsliste App pour iPhone et Android</a>
                        </div>
                    </div>
                </div>

                <div text="Bring!" class="secondary-buttons">
                    <secondary-button text="" href="">
                        <svg width="64px" height="64px" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                            <g id="SVGRepo_iconCarrier">
                                <path fill-rule="evenodd" clip-rule="evenodd"
                                    d="M5.62436 4.4241C3.96537 5.18243 2.75 6.98614 2.75 9.13701C2.75 11.3344 3.64922 13.0281 4.93829 14.4797C6.00072 15.676 7.28684 16.6675 8.54113 17.6345C8.83904 17.8642 9.13515 18.0925 9.42605 18.3218C9.95208 18.7365 10.4213 19.1004 10.8736 19.3647C11.3261 19.6292 11.6904 19.7499 12 19.7499C12.3096 19.7499 12.6739 19.6292 13.1264 19.3647C13.5787 19.1004 14.0479 18.7365 14.574 18.3218C14.8649 18.0925 15.161 17.8642 15.4589 17.6345C16.7132 16.6675 17.9993 15.676 19.0617 14.4797C20.3508 13.0281 21.25 11.3344 21.25 9.13701C21.25 6.98614 20.0346 5.18243 18.3756 4.4241C16.9023 3.75065 14.9662 3.85585 13.0725 5.51217L14.5302 6.9694C14.8232 7.26224 14.8233 7.73711 14.5304 8.03006C14.2376 8.323 13.7627 8.32309 13.4698 8.03025L11.4698 6.03097L11.4596 6.02065C9.40166 3.88249 7.23607 3.68739 5.62436 4.4241ZM12 4.45873C9.68795 2.39015 7.09896 2.10078 5.00076 3.05987C2.78471 4.07283 1.25 6.42494 1.25 9.13701C1.25 11.8025 2.3605 13.836 3.81672 15.4757C4.98287 16.7888 6.41022 17.8879 7.67083 18.8585C7.95659 19.0785 8.23378 19.292 8.49742 19.4998C9.00965 19.9036 9.55954 20.3342 10.1168 20.6598C10.6739 20.9853 11.3096 21.2499 12 21.2499C12.6904 21.2499 13.3261 20.9853 13.8832 20.6598C14.4405 20.3342 14.9903 19.9036 15.5026 19.4998C15.7662 19.292 16.0434 19.0785 16.3292 18.8585C17.5898 17.8879 19.0171 16.7888 20.1833 15.4757C21.6395 13.836 22.75 11.8025 22.75 9.13701C22.75 6.42494 21.2153 4.07283 18.9992 3.05987C16.901 2.10078 14.3121 2.39015 12 4.45873Z"
                                    fill="#CB6863"></path>
                            </g>
                        </svg>
                    </secondary-button>

                    <secondary-button text="" href="">
                        <svg width="64px" height="64px" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                            <g id="SVGRepo_iconCarrier">
                                <path
                                    d="M15.7285 3.88396C17.1629 2.44407 19.2609 2.41383 20.4224 3.57981C21.586 4.74798 21.5547 6.85922 20.1194 8.30009L17.6956 10.7333C17.4033 11.0268 17.4042 11.5017 17.6976 11.794C17.9911 12.0863 18.466 12.0854 18.7583 11.7919L21.1821 9.35869C23.0934 7.43998 23.3334 4.37665 21.4851 2.5212C19.6346 0.663551 16.5781 0.905664 14.6658 2.82536L9.81817 7.69182C7.90688 9.61053 7.66692 12.6739 9.51519 14.5293C9.80751 14.8228 10.2824 14.8237 10.5758 14.5314C10.8693 14.2391 10.8702 13.7642 10.5779 13.4707C9.41425 12.3026 9.44559 10.1913 10.8809 8.75042L15.7285 3.88396Z"
                                    fill="#CB6863"></path>
                                <path
                                    d="M14.4851 9.47074C14.1928 9.17728 13.7179 9.17636 13.4244 9.46868C13.131 9.76101 13.1301 10.2359 13.4224 10.5293C14.586 11.6975 14.5547 13.8087 13.1194 15.2496L8.27178 20.1161C6.83745 21.556 4.73937 21.5863 3.57791 20.4203C2.41424 19.2521 2.44559 17.1408 3.88089 15.6999L6.30473 13.2667C6.59706 12.9732 6.59614 12.4984 6.30268 12.206C6.00922 11.9137 5.53434 11.9146 5.24202 12.2081L2.81818 14.6413C0.906876 16.5601 0.666916 19.6234 2.51519 21.4789C4.36567 23.3365 7.42221 23.0944 9.33449 21.1747L14.1821 16.3082C16.0934 14.3895 16.3334 11.3262 14.4851 9.47074Z"
                                    fill="#CB6863"></path>
                            </g>
                        </svg>
                    </secondary-button>
                </div>

            </div>
            <p2 class="desciption-recette">
                "${descriptionRecette}“
            </p2>





        </div>  

         <div class="ingredients">
            <div class="section-ingredient">
                <div class="section-ingredient-container">
                    <div class="titre-section-container" style="padding:0 0 0 15px">
                        <div id="toggleViewButtonContainer" data-view="grid">
                             <svg class="titre-section-image" id="toggleViewButton" height="64px" width="64px" version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="-122.88 -122.88 757.76 757.76" xml:space="preserve" fill="#CB6863"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <style type="text/css"> .st0{fill:#CB6863;} </style> <g> <path class="st0" d="M512,182.161c0-12.088-4.164-23.909-11.996-33.389c-9.964-12.046-24.792-19.027-40.42-19.027H349.003 c-2.382-8.597-7.88-15.895-15.245-20.56l-0.133-66.82l-0.017-0.124c-0.283-13.546-7.797-25.892-19.71-32.323 c-5.582-3.016-11.763-4.532-17.895-4.532c-6.697,0-13.429,1.832-19.377,5.423l-0.016-0.025l-65.146,37.538l-0.216,0.15 c-15.696,9.78-25.725,26.492-27.041,44.919l-0.033,0.624v35.764c-20.844,0.1-40.904,7.864-56.366,21.826l-108.732,98.21 C6.732,260.969,0,276.639,0,292.726c0,5.839,0.883,11.763,2.732,17.511L54.499,472.9c6.381,20.077,25.008,33.714,46.085,33.714 h230.092c25.208,0,49.45-9.706,67.711-27.083l66.995-63.813c8.714-8.314,14.628-19.11,16.911-30.939l0.066-0.383l28.841-193.054 h-0.033C511.701,188.3,512,185.227,512,182.161z M218.996,95.539c0.6-7.164,4.515-13.628,10.597-17.477l64.696-37.288l0.266-0.159 c0.45-0.275,0.916-0.425,1.449-0.425c0.45,0,0.883,0.101,1.316,0.351h0.017c0.883,0.483,1.433,1.399,1.466,2.365l0.149,64.404 c-9.014,4.44-15.861,12.571-18.577,22.435h-36.105v34.813h215.313c2.632,0,5.198,0.592,7.514,1.683l-93.636,86.863 c-9.964,9.03-22.959,14.012-36.388,14.012h-92.07c-2.749-14.778-12.696-26.991-26.075-32.93L218.996,95.539z M151.134,177.438 c9.064-8.188,20.826-12.721,33.022-12.862l-0.033,68.902c-14.245,5.616-24.925,18.244-27.791,33.639H51.85L151.134,177.438z M48.901,340.56l-13.013-40.87c-0.666-2.15-0.999-4.298-1.016-6.464h64.629l5.998,47.334H48.901z M55.832,362.311h52.417 l5.348,42.378H69.328L55.832,362.311z M100.584,471.809c-5.898,0-11.13-3.84-12.912-9.456l-11.43-35.888h40.104l5.732,45.344 H100.584z M188.922,471.809h-44.918l-5.732-45.344h50.65V471.809z M188.922,404.689h-53.399l-5.348-42.378h58.747V404.689z M188.922,340.56h-61.497l-5.998-47.334h67.494V340.56z M198.802,277.28c-6.615,0-11.98-5.381-11.98-11.971 c0-6.623,5.365-11.971,11.98-11.971c6.597,0,11.962,5.348,11.962,11.971C210.765,271.899,205.4,277.28,198.802,277.28z M265.564,471.809h-54.882v-45.344h56.015L265.564,471.809z M267.246,404.689h-56.564v-42.378h57.631L267.246,404.689z M268.846,340.56h-58.164v-47.334h59.364L268.846,340.56z M336.541,471.517c-1.949,0.176-3.916,0.292-5.864,0.292h-43.352 l1.133-45.344h50.666L336.541,471.517z M340.373,404.689h-51.367l1.066-42.378h52.733L340.373,404.689z M344.055,340.56h-53.432 l1.182-47.334h45.27c3.282,0,6.514-0.276,9.747-0.658L344.055,340.56z M399.288,430.598l-24.909,23.716 c-3.416,3.25-7.198,6.041-11.196,8.44l2.449-42.52l36.538-29.357L399.288,430.598z M404.336,361.22l-37.005,29.732l2.315-40.445 l37.655-30.274L404.336,361.22z M409.451,290.593l-38.122,30.64l2.1-36.738c6.298-3.191,12.212-7.19,17.528-11.996l21.243-19.71 L409.451,290.593z M448.055,378.322c-0.917,4.657-3.249,8.906-6.682,12.204l-18.66,17.744l2.616-36.022l26.874-21.592 L448.055,378.322z M456.935,318.966l-29.44,23.643l2.966-40.995l33.022-26.516L456.935,318.966z M468.214,243.366l-35.588,28.616 l2.966-40.886l40.004-37.122L468.214,243.366z"></path> </g> </g></svg>
                        </div>
                        <div class="titre-section-titre_border">
                            <h2 class="titre-section-title">Ingrédients</h3>
                                <div class="titre-section-border" style="margin-right: 20px;"></div>
                        </div>
                    </div>
                </div>

                <div class="section-ingredient-container" style="padding-top: 10px;">
                    <div class="portion-control">
                        <div class="portion-control__decrement minus" onclick="updatePortions(-1)">
                            <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24"
                                height="24"> <!-- Ajout de width et height -->
                                <path class="icon-fill" d="M3 12H21" stroke="#3f3735" stroke-width="2"
                                    stroke-linecap="round" /> <!-- Ajout de stroke, stroke-width, et stroke-linecap -->
                            </svg>
                        </div>
                        <div class="portion-control__value_container">
                            <div class="portion-control__value">
                                <input type="text" inputmode="decimal" id="portion-input" class="portion-control__value_number" value="6">
                                <span class="portion-control__unit">portions</span>
                            </div>

                        </div>
                        <div class="portion-control__increment plus" onclick="updatePortions(1)">
                            <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24"
                                height="24"> <!-- Ajout de width et height -->
                                <path class="icon-fill" d="M12 3V21" stroke="#3f3735" stroke-width="2"
                                    stroke-linecap="round" /> <!-- Ligne verticale -->
                                <path class="icon-fill" d="M3 12H21" stroke="#3f3735" stroke-width="2"
                                    stroke-linecap="round" /> <!-- Ligne horizontale -->
                            </svg>
                        </div>

                    </div>

                    <div class="bouton-reset__portion" id="reset-portion" onclick="resetPortion()">
                        <svg width="24px" height="24px" viewBox="0 0 512.00 512.00" data-name="Layer 1" id="Layer_1" xmlns="http://www.w3.org/2000/svg">
                            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                            <g id="SVGRepo_iconCarrier">
                                <path d="M64,256H34A222,222,0,0,1,430,118.15V85h30V190H355V160h67.27A192.21,192.21,0,0,0,256,64C150.13,64,64,150.13,64,256Zm384,0c0,105.87-86.13,192-192,192A192.21,192.21,0,0,1,89.73,352H157V322H52V427H82V393.85A222,222,0,0,0,478,256Z"></path>
                            </g>
                        </svg>
                    </div>                    

                </div>
            </div>




            ${preparationsDetails.map(preparation => {
                // Vérifiez si la préparation a des détails d'ingrédients
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
                    return ''; // Retourne une chaîne vide si aucune information d'ingrédients
                }
            }).join("")}


        </div>


        <div class="preparations">
            
            <div class="titre-section-container">
                <svg class="titre-section-image" fill="#CB6863" height="200px" width="200px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="-102.4 -102.4 716.80 716.80" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M301.283,205.972c-4.5-2.115-8.983-4.213-13.44-6.289c-5.105-2.377-11.174-0.165-13.552,4.94 c-2.377,5.107-0.166,11.173,4.94,13.552c4.433,2.063,8.894,4.151,13.37,6.257c1.402,0.659,2.879,0.971,4.334,0.971 c3.829,0,7.5-2.166,9.236-5.86C308.57,214.445,306.381,208.37,301.283,205.972z"></path> </g> </g> <g> <g> <path d="M476.165,303.14c-16.708-16.709-63.253-43.412-142.294-81.636c-5.07-2.449-11.169-0.33-13.622,4.742 c-2.452,5.071-0.329,11.169,4.742,13.622c94.518,45.708,126.534,67.48,136.751,77.696c19.255,19.255,29.86,44.856,29.86,72.088 c0,11.983-2.055,23.649-5.995,34.598c-0.754-3.032-1.669-6.134-2.754-9.304c-8.133-23.76-24.871-49.104-47.131-71.364 c-33.38-33.38-174.505-130.807-243.769-177.961l8.642-8.643c3.983-3.983,3.983-10.441,0-14.425L61.027,2.986 c-3.983-3.982-10.441-3.982-14.425,0L2.987,46.602C1.075,48.516,0,51.109,0,53.814c0,2.705,1.075,5.298,2.987,7.212 l139.57,139.569c1.912,1.912,4.506,2.987,7.212,2.987c2.706,0,5.299-1.075,7.212-2.987l2.185-2.185 c42.13,95.439,111.166,244.945,143.975,277.754C326.248,499.273,356.972,512,389.652,512s63.404-12.727,86.513-35.835 S512,422.333,512,389.652S499.273,326.249,476.165,303.14z M149.768,178.959L24.623,53.814l29.192-29.191L178.96,149.767 L149.768,178.959z M389.652,491.602c-27.231,0-52.833-10.605-72.088-29.861c-19.421-19.42-61.084-98.012-114.436-215.116 c49.654,71.804,114.471,163.113,140.455,189.097c22.26,22.26,47.604,38.998,71.364,47.13c3.18,1.088,6.286,1.989,9.328,2.744 C413.319,489.542,401.645,491.602,389.652,491.602z M466.785,452.36L280.551,266.126c-3.983-3.982-10.441-3.982-14.425,0 c-3.983,3.983-3.983,10.441,0,14.425l186.233,186.233c-7.9,2.017-18.546,0.966-30.807-3.23 c-20.875-7.146-43.442-22.152-63.546-42.256c-31.246-31.246-123.119-163.97-171.225-234.516 c70.659,48.182,203.275,139.985,234.517,171.227c20.104,20.103,35.11,42.669,42.255,63.544 C467.751,433.814,468.802,444.46,466.785,452.36z"></path> </g> </g> </g></svg>
                <div class="titre-section-titre_border">
                    <h2 class="titre-section-title">Preparation</h3>
                        <div class="titre-section-border"></div>
                </div>
            </div>

            <!-- section timing recette -->
            <div class="container__timings-recette">
                <div class="sub-timing">
                    <div class="timing">
                        <svg class="timing__icon" width="22px" height="22px" viewBox="0 0 24.00 24.00" fill="none"
                            xmlns="http://www.w3.org/2000/svg" transform="matrix(1, 0, 0, -1, 0, 0)">
                            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                            <g id="SVGRepo_iconCarrier">
                                <path fill-rule="evenodd" clip-rule="evenodd"
                                    d="M11.2334 3.65379C13.9918 0.895558 18.4782 0.320685 21.0789 2.92126C23.6796 5.52187 23.1046 10.0082 20.3463 12.7664C18.4985 14.6141 15.5113 15.8786 12.9616 15.7876C12.7379 15.7796 12.5153 15.7611 12.2954 15.7309L6.85993 21.1662C5.74815 22.278 3.94561 22.278 2.83383 21.1662C1.72206 20.0545 1.72206 18.252 2.83383 17.1403L8.26895 11.7053C8.23881 11.4856 8.22021 11.2632 8.21219 11.0396C8.12062 8.48974 9.38534 5.50182 11.2334 3.65379ZM12.2941 4.71447C13.9349 3.07369 16.1404 2.46752 17.952 2.87396C17.6843 3.00026 17.4171 3.14514 17.1559 3.30026C15.8484 4.07644 14.4911 5.228 13.5767 6.14231C12.6636 7.05539 11.3192 8.60515 10.3482 10.0978C10.1197 10.4491 9.90527 10.8071 9.72026 11.1608C9.71635 11.1031 9.71334 11.0448 9.71122 10.9858C9.6359 8.8884 10.7139 6.29463 12.2941 4.71447ZM19.432 3.93099C19.8406 3.84723 19.9729 3.93668 20.0182 3.98194C20.0635 4.02722 20.153 4.15957 20.0692 4.56831C19.9866 4.97165 19.7599 5.48974 19.4103 6.07882C18.7166 7.24751 17.6538 8.50698 16.7976 9.36308C15.9402 10.2204 14.4706 11.4931 13.0845 12.3945C12.3863 12.8485 11.7531 13.1793 11.2548 13.3314C11.0065 13.4072 10.8321 13.4258 10.7217 13.4176C10.6699 13.4138 10.6413 13.4047 10.6284 13.3994C10.6174 13.3948 10.6137 13.3915 10.611 13.3888C10.6083 13.386 10.605 13.3824 10.6004 13.3714C10.5951 13.3585 10.586 13.3299 10.5822 13.2782C10.574 13.1679 10.5926 12.9935 10.6685 12.7452C10.8206 12.247 11.1514 11.6139 11.6056 10.9158C12.5071 9.52982 13.78 8.06039 14.6374 7.20299C15.4936 6.34684 16.753 5.28383 17.9216 4.59009C18.5106 4.24041 19.0286 4.01365 19.432 3.93099ZM13.9023 13.652C13.5511 13.8803 13.1932 14.0946 12.8397 14.2795C12.8975 14.2834 12.956 14.2865 13.0152 14.2886C15.1125 14.3635 17.7057 13.2856 19.2856 11.7057C20.9263 10.065 21.5326 7.85988 21.1263 6.04843C21 6.3161 20.8552 6.58316 20.7002 6.8444C19.9241 8.15199 18.7727 9.5094 17.8583 10.4238C16.9451 11.3369 15.3951 12.6811 13.9023 13.652Z"
                                    fill="#555555"></path>
                            </g>
                        </svg>
                        <div class="timing__info">
                            <div class="timing__label">
                                <h6>Préparation</h6>
                            </div>
                            <div class="timing__time">
                                <h7>${tempsPreparation}</h7>
                            </div>
                        </div>
                    </div>
                    <div class="timing">
                        <svg class="timing__icon" width="22px" height="22px" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                            <g id="SVGRepo_iconCarrier">
                                <path
                                    d="M5.06152 12C5.55362 8.05369 8.92001 5 12.9996 5C17.4179 5 20.9996 8.58172 20.9996 13C20.9996 17.4183 17.4179 21 12.9996 21H8M13 13V9M11 3H15M3 15H8M5 18H10"
                                    stroke="#555555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                </path>
                            </g>
                        </svg>
                        <div class="timing__info">
                            <div class="timing__label">
                                <h6>Repos</h6>
                            </div>
                            <div class="timing__time">
                                <h7>${tempsRepos}</h7>
                            </div>
                        </div>
                    </div>
                    <div class="timing">
                        <svg class="timing__icon" fill="#555555" width="22px" height="22px" viewBox="0 0 256 256"
                            id="Flat" xmlns="http://www.w3.org/2000/svg">
                            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                            <g id="SVGRepo_iconCarrier">
                                <path
                                    d="M76,40V16a12,12,0,0,1,24,0V40a12,12,0,0,1-24,0Zm52,12a12,12,0,0,0,12-12V16a12,12,0,0,0-24,0V40A12,12,0,0,0,128,52Zm40,0a12,12,0,0,0,12-12V16a12,12,0,0,0-24,0V40A12,12,0,0,0,168,52Zm83.2002,53.6001L224,126v58a36.04061,36.04061,0,0,1-36,36H68a36.04061,36.04061,0,0,1-36-36V126L4.7998,105.6001A12.0002,12.0002,0,0,1,19.2002,86.3999L32,96V88A20.02229,20.02229,0,0,1,52,68H204a20.02229,20.02229,0,0,1,20,20v8l12.7998-9.6001a12.0002,12.0002,0,0,1,14.4004,19.2002ZM200,92H56v92a12.01375,12.01375,0,0,0,12,12H188a12.01375,12.01375,0,0,0,12-12Z">
                                </path>
                            </g>
                        </svg>
                        <div class="timing__info">
                            <div class="timing__label">
                                <h6>Cuisson</h6>
                            </div>
                            <div class="timing__time">
                                <h7>${tempsCuisson}</h7>
                            </div>
                        </div>
                    </div>
                    <div class="total-timing">
                        <div class="timing">
                            <div class="timing__info">
                                <div class="timing__label">
                                    <h6>Temps total</h6>
                                </div>
                                <div class="timing__time">
                                    <h7>${tempsTotal}</h7>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="total-timing">
                    <div class="timing">
                        <div class="timing__info">
                            <div class="timing__label">
                                <h6>Temps total</h6>
                            </div>
                            <div class="timing__time">
                                <h7>${tempsTotal}</h7>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            ${preparationsDetails.map(preparation => `
                <div class="preparation-instruction">
                    <h3 >${preparation.titre}</h3>
                    ${preparation.etapes.map(etape => `
                        <div class="etape">
                            <h4>ÉTAPE ${etape.ordre}</h4>
                            <p>${etape.originalInstructions
                                .replace(/\\n/g, '<br>') // Remplacer les retours à la ligne par <br>
                                .replace(/\*\*(.*?)\*\*/g, '<span style="font-weight:400; font-style: italic;">$1</span>')
                                .replace(/\[(\d+)\]/g, (match, p1) => {
                                    const ingredientOrder = parseInt(p1, 10); // Convertir p1 en nombre

                                    // Trouver l'ingrédient correspondant par son ordre
                                    const ingredient = ingredientsDetailsForHTML.find(ing => ing.order === ingredientOrder);

                                    // Vérifier si l'ingrédient a été trouvé
                                    if (ingredient) {
                                        return `<span id="ingredients" class="ingredient-preparation">
                                                    <span id="ingredient-${ingredient.order}">
                                                        ${ingredient.quantity !== null ? `                                                        
                                                            <span class="highlight-quantity">
                                                                <input type="text" inputmode="decimal"  id="quantite-input" class="quantite-control__value_number" value="${ingredient.quantity}"><span> ${ingredient.unit}</span>
                                                            </span>
                                                        ` : ''}
                                                        ${ingredient.name}
                                                    </span>
                                                </span>`;
                                        }

                                        // Retourner la correspondance originale si l'ingrédient n'est pas trouvé
                                        return match;
                                    })
                            }</p>
                        </div>
                    `).join("")}
                </div>
            `).join("")}
        </div>
    </div>
   <script> 
        // Récupération des ingrédients pour la mise à jour
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
    </script>
    
    
    <!-- Script le bouton toggleViewButton qui switch entre grille et liste -->
    <script>
        document.getElementById("toggleViewButtonContainer").addEventListener("click", function () {
            const containers = document.querySelectorAll(".recette_ingredients-items");
    
            // Définir les deux SVG (Grid et List)
            const gridSVG = \`
                <svg class="titre-section-image" id="toggleViewButton" height="64px" width="64px" version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="-122.88 -122.88 757.76 757.76" xml:space="preserve" fill="#CB6863"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <style type="text/css"> .st0{fill:#CB6863;} </style> <g> <path class="st0" d="M512,182.161c0-12.088-4.164-23.909-11.996-33.389c-9.964-12.046-24.792-19.027-40.42-19.027H349.003 c-2.382-8.597-7.88-15.895-15.245-20.56l-0.133-66.82l-0.017-0.124c-0.283-13.546-7.797-25.892-19.71-32.323 c-5.582-3.016-11.763-4.532-17.895-4.532c-6.697,0-13.429,1.832-19.377,5.423l-0.016-0.025l-65.146,37.538l-0.216,0.15 c-15.696,9.78-25.725,26.492-27.041,44.919l-0.033,0.624v35.764c-20.844,0.1-40.904,7.864-56.366,21.826l-108.732,98.21 C6.732,260.969,0,276.639,0,292.726c0,5.839,0.883,11.763,2.732,17.511L54.499,472.9c6.381,20.077,25.008,33.714,46.085,33.714 h230.092c25.208,0,49.45-9.706,67.711-27.083l66.995-63.813c8.714-8.314,14.628-19.11,16.911-30.939l0.066-0.383l28.841-193.054 h-0.033C511.701,188.3,512,185.227,512,182.161z M218.996,95.539c0.6-7.164,4.515-13.628,10.597-17.477l64.696-37.288l0.266-0.159 c0.45-0.275,0.916-0.425,1.449-0.425c0.45,0,0.883,0.101,1.316,0.351h0.017c0.883,0.483,1.433,1.399,1.466,2.365l0.149,64.404 c-9.014,4.44-15.861,12.571-18.577,22.435h-36.105v34.813h215.313c2.632,0,5.198,0.592,7.514,1.683l-93.636,86.863 c-9.964,9.03-22.959,14.012-36.388,14.012h-92.07c-2.749-14.778-12.696-26.991-26.075-32.93L218.996,95.539z M151.134,177.438 c9.064-8.188,20.826-12.721,33.022-12.862l-0.033,68.902c-14.245,5.616-24.925,18.244-27.791,33.639H51.85L151.134,177.438z M48.901,340.56l-13.013-40.87c-0.666-2.15-0.999-4.298-1.016-6.464h64.629l5.998,47.334H48.901z M55.832,362.311h52.417 l5.348,42.378H69.328L55.832,362.311z M100.584,471.809c-5.898,0-11.13-3.84-12.912-9.456l-11.43-35.888h40.104l5.732,45.344 H100.584z M188.922,471.809h-44.918l-5.732-45.344h50.65V471.809z M188.922,404.689h-53.399l-5.348-42.378h58.747V404.689z M188.922,340.56h-61.497l-5.998-47.334h67.494V340.56z M198.802,277.28c-6.615,0-11.98-5.381-11.98-11.971 c0-6.623,5.365-11.971,11.98-11.971c6.597,0,11.962,5.348,11.962,11.971C210.765,271.899,205.4,277.28,198.802,277.28z M265.564,471.809h-54.882v-45.344h56.015L265.564,471.809z M267.246,404.689h-56.564v-42.378h57.631L267.246,404.689z M268.846,340.56h-58.164v-47.334h59.364L268.846,340.56z M336.541,471.517c-1.949,0.176-3.916,0.292-5.864,0.292h-43.352 l1.133-45.344h50.666L336.541,471.517z M340.373,404.689h-51.367l1.066-42.378h52.733L340.373,404.689z M344.055,340.56h-53.432 l1.182-47.334h45.27c3.282,0,6.514-0.276,9.747-0.658L344.055,340.56z M399.288,430.598l-24.909,23.716 c-3.416,3.25-7.198,6.041-11.196,8.44l2.449-42.52l36.538-29.357L399.288,430.598z M404.336,361.22l-37.005,29.732l2.315-40.445 l37.655-30.274L404.336,361.22z M409.451,290.593l-38.122,30.64l2.1-36.738c6.298-3.191,12.212-7.19,17.528-11.996l21.243-19.71 L409.451,290.593z M448.055,378.322c-0.917,4.657-3.249,8.906-6.682,12.204l-18.66,17.744l2.616-36.022l26.874-21.592 L448.055,378.322z M456.935,318.966l-29.44,23.643l2.966-40.995l33.022-26.516L456.935,318.966z M468.214,243.366l-35.588,28.616 l2.966-40.886l40.004-37.122L468.214,243.366z"></path> </g> </g></svg>   
            \`;
    
            const listSVG = \`
                <svg class="titre-section-image" width="64px" height="64px" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M8.5 10.5H5L6.5 19.5H18.5L20 10.5H16.5M8.5 10.5L10.2721 5.18377C10.4082 4.77543 10.7903 4.5 11.2208 4.5H13.7792C14.2097 4.5 14.5918 4.77543 14.7279 5.18377L16.5 10.5M8.5 10.5H16.5" stroke="#CB6863" stroke-width="1.2"></path> <path d="M12.5 10.5V19.5" stroke="#CB6863" stroke-width="1.2"></path> <path d="M9.5 19.5L8.5 10.5" stroke="#CB6863" stroke-width="1.2"></path> <path d="M15.5 19.5L16.5 10.5" stroke="#CB6863" stroke-width="1.2"></path> <path d="M19.5 13.5H5.5" stroke="#CB6863" stroke-width="1.2"></path> <path d="M19 16.5H6" stroke="#CB6863" stroke-width="1.2"></path> </g></svg>    
            \`;
    
            // Basculer la classe 'list-view' sur chaque conteneur
            containers.forEach(container => {
                container.classList.toggle("list-view");
            });
    
            // Sélectionner le conteneur du bouton
            const buttonContainer = document.getElementById("toggleViewButtonContainer");
    
            // Vérifier l'état actuel en utilisant le dataset
            if (buttonContainer.dataset.view === "grid") {
                // Passer à l'affichage List
                buttonContainer.innerHTML = listSVG;
                buttonContainer.dataset.view = "list";
            } else {
                // Passer à l'affichage Grid
                buttonContainer.innerHTML = gridSVG;
                buttonContainer.dataset.view = "grid";
            }
        });
    </script>

    <script src="/Orpps/js/script.js"></script> <!-- Incluez votre fichier JS ici -->


    <!-- Script pour forcer le nom du bouton Bring! et remplacer l'image -->
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const checkElement = setInterval(function () {
                const textElement = document.querySelector('.bring-import-text-light');
                const imageElement = document.querySelector('.bring-import-image-light img');

                if (textElement) {
                    console.log("Text element found.");
                    textElement.textContent = 'Bring!';
                    clearInterval(checkElement);
                }
            }, 5); // Vérification toutes les 500 ms
        });
    </script>


</body>
</html>
`;

console.log("HTML généré :", newHtmlContent);

// Fonction pour encoder en base64
function encodeBase64(str) {
    let buffer = Buffer.from(str, 'utf-8');
    return buffer.toString('base64');
}

// Fonction pour vérifier si le fichier existe
async function checkFileExists() {
    const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`
        }
    });

    if (response.ok) {
        const data = await response.json();
        return data; // Retourne les données si le fichier existe
    } else if (response.status === 404) {
        return null; // Fichier non trouvé
    } else {
        throw new Error(`Error: ${response.statusText}`);
    }
}

// Fonction pour créer ou mettre à jour le fichier
async function createOrUpdateFile() {
    const fileData = await checkFileExists();
    const sha = fileData ? fileData.sha : undefined; // Récupère le SHA si le fichier existe

    const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${FILE_PATH}`;
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: sha ? `${RECIPE} : Update index.html` : `${RECIPE} : Create index.html`,
            content: encodeBase64(newHtmlContent), // Encode le contenu en base64
            sha: sha // Inclure le SHA si le fichier existe
        })
    });

    if (response.ok) {
        const result = await response.json();
        const fileUrl = result.content.html_url; // URL du fichier sur GitHub

        console.log("File URL:", fileUrl); // Affiche l'URL du fichier

        // Mise à jour du champ 'url_recette' dans Airtable
        await updateRecipeUrlInAirtable(fileUrl);
    } else {
        throw new Error(`Error: ${response.statusText}`);
    }
}

// Fonction pour mettre à jour l'URL dans le champ 'url_recette' de la recette dans Airtable
async function updateRecipeUrlInAirtable(fileUrl) {
    const table = base.getTable('RECETTES [base]');
    await table.updateRecordAsync(RECORD_ID, {
        'url_recette': fileUrl
    });
}

// Exécute la fonction
createOrUpdateFile().catch(error => {
    console.error(error.message);
});