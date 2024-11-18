const Airtable = require('airtable');

exports.handler = async (event) => {
    try {
        const { userEmail, recipeId } = JSON.parse(event.body);

        // Initialiser Airtable
        const base = new Airtable({ apiKey: process.env.AIRTABLE_API_TOKEN }).base(process.env.AIRTABLE_BASE_ID);
        const utilisateursTable = base(process.env.AIRTABLE__UTILISATEURS__TABLE_ID);

        // Récupérer l'utilisateur via son email
        const records = await utilisateursTable.select({
            filterByFormula: `{Mail} = "${userEmail}"`,
        }).firstPage();

        if (records.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Utilisateur non trouvé' }),
            };
        }

        const userRecord = records[0];
        const currentFavorites = userRecord.fields['Recettes favorites'] || []; // Liste actuelle des favoris

        // Ajouter l'ID de la recette si non déjà présent
        if (!currentFavorites.includes(recipeId)) {
            currentFavorites.push(recipeId);

            // Mettre à jour le champ `Recettes favorites`
            await utilisateursTable.update(userRecord.id, {
                'Recettes favorites': currentFavorites,
            });

            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Recette ajoutée aux favoris', favorites: currentFavorites }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Recette déjà présente dans les favoris', favorites: currentFavorites }),
        };
    } catch (error) {
        console.error('Erreur lors de l’ajout aux favoris :', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erreur serveur lors de l’ajout aux favoris' }),
        };
    }
};
