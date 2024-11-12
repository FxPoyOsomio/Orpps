require('dotenv').config();
const { exec } = require('child_process');
const fetch = require('node-fetch');

// Fonction pour récupérer toutes les IDs de recettes
async function fetchRecipeIds() {
    const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE__RECETTES__TABLE_ID}?filterByFormula=Is_COMMIT_Recette=TRUE()`;

    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}` }
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.records.map(record => record.id);
    } catch (error) {
        console.error("Erreur lors de la récupération des IDs de recettes :", error);
        return [];
    }
}


// Fonction pour générer chaque recette en attendant le message de fin
async function generateAllRecipes() {
    const recipeIds = await fetchRecipeIds();

    if (recipeIds.length === 0) {
        console.log("Aucune recette à traiter.");
        return;
    }

    for (const id of recipeIds) {
        await new Promise((resolve) => {
            const process = exec(`node generateStaticRecipe.js ${id}`);

            process.stdout.on('data', (data) => {
                console.log(data);  // Affiche la sortie en temps réel

                // Vérifie si le message de fin est reçu
                if (data.includes(`Génération terminée pour : ${id}`)) {
                    resolve();  // La génération est terminée, passe à l'ID suivant
                }
            });

            process.stderr.on('data', (data) => {
                console.error(`Erreur pour la recette ${id} : ${data}`);
            });

            process.on('close', (code) => {
                if (code !== 0) {
                    console.error(`Processus pour la recette ${id} terminé avec le code : ${code}`);
                }
            });
        });
    }
}

generateAllRecipes();