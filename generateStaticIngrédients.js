const fs = require("fs");
const fetch = require("node-fetch");
require("dotenv").config();

const AIRTABLE_API_TOKEN = process.env.AIRTABLE_API_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = "INGRÉDIENTS [Base]";

// Fonction pour récupérer les données d'Airtable
async function fetchIngredients() {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;
    const headers = {
        Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
    };

    let allRecords = [];
    let offset = null;

    try {
        do {
            const response = await fetch(`${url}?offset=${offset || ""}`, { headers });
            const data = await response.json();

            if (response.ok) {
                allRecords = [...allRecords, ...data.records];
                offset = data.offset; // Gérer la pagination
            } else {
                console.error("Erreur lors de la récupération des données :", data);
                break;
            }
        } while (offset);

        return allRecords;
    } catch (error) {
        console.error("Erreur lors de l'appel à Airtable :", error);
        return [];
    }
}

// Générer uniquement le contenu HTML des ingrédients
async function generateIngredientsHTML() {
    const ingredients = await fetchIngredients();

    const customEncodeUrl = (url) => {
        // Remplace uniquement les espaces tout en conservant les caractères accentués
        return url.replace(/ /g, "%20");
    };

    const ingredientCards = ingredients.map((record, index) => {
        const fields = record.fields;
        const id = record.id;
        const category = fields["Catégorie"] || "Non spécifié";
        const categoryOrder = fields["Ordre d'affichage Catégorie"] || "Non spécifié";
        const rayon = fields["Rayon"] || "Non spécifié";
        const sousRayons = fields["Sous rayon"] || ["Non spécifié"]; // Tableau de sous-rayons
        const pricing = fields["Prix / Unité"] || "0";
        const name = fields["Nom ingrédient"] || "Ingrédient inconnu";
        const unit = fields["Unité [CONVERSION]"] || "unité";
        const img = fields["url_Img"] || "https://fxpoyosomio.github.io/Orpps/assets/images/no_image.jpg";

        // Générer les divs pour chaque sous-rayon
        const sousRayonHTML = sousRayons
            .map((sousRayon) => `
                <div class="sousRayon-container">
                    <h7>${sousRayon}</h7>
                </div>
            `)
            .join("");

        return `
        <div class="card-ingredient" 
            data-ref-id="${id}" 
            data-ref-name="${name}" 
            data-ref-category="${category}"
            data-ref-category_order="${categoryOrder}"
            data-ref-rayon="${rayon}"
            data-ref-sousRayon="${sousRayons}"
            data-ref-pricing="${pricing}"
            >
        
            <div class="card-ingredient-image">
                <div class="sousRayon-containers_grid">
                    ${sousRayonHTML}
                </div>
                <img src="${img}" alt="${name}">
            </div>
            <span class="ingredients-details" id="ingredients">
                <div class="sousRayon-containers_list">
                    ${sousRayonHTML}
                </div>
                <span class="ingredient-detail">
                    <span class="ingredients-qtunit">
                        <span class="highlight-quantity">
                            <input type="text" inputmode="decimal" id="${id}" class="quantite-control__value_number" value="0">
                            <span> ${unit}</span>
                        </span>
                    </span>
                    ${name}
                </span>
            </span>
        </div>
        `;
    }).join("");

    // Écrire uniquement le contenu généré dans le fichier `ingredients.html`
    fs.writeFileSync("./dist/ingredients.html", ingredientCards, "utf-8");
    console.log("Le fichier /dist/ingredients.html a été généré avec succès !");
}



// Exécuter le script
generateIngredientsHTML();
