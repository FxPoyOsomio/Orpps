console.log('Fonction add-favorite appelée');

const Airtable = require('airtable');

exports.handler = async (event) => {
    console.log('Requête reçue pour ajouter/retirer un favori');
    try {
        const { userEmail, recipeId, action } = JSON.parse(event.body);

        console.log('Données reçues :', { userEmail, recipeId, action });

        if (!userEmail || !recipeId || !action) {
            console.error('Données manquantes');
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Email, ID recette ou action manquant.' }),
            };
        }

        const base = new Airtable({ apiKey: process.env.AIRTABLE_API_TOKEN }).base(process.env.AIRTABLE_BASE_ID);
        const userTable = base(process.env.AIRTABLE__UTILISATEURS__TABLE_ID);

        const userRecords = await userTable
            .select({ filterByFormula: `{Email} = "${userEmail}"` })
            .firstPage();

        if (userRecords.length === 0) {
            console.error('Utilisateur non trouvé');
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Utilisateur non trouvé.' }),
            };
        }

        const userRecord = userRecords[0];
        const currentFavorites = userRecord.fields['Recettes favorites'] || [];

        if (action === 'add' && !currentFavorites.includes(recipeId)) {
            currentFavorites.push(recipeId);
        } else if (action === 'remove' && currentFavorites.includes(recipeId)) {
            const index = currentFavorites.indexOf(recipeId);
            currentFavorites.splice(index, 1);
        } else {
            console.log('Aucune modification nécessaire');
        }

        await userTable.update(userRecord.id, { 'Recettes favorites': currentFavorites });

        console.log('Favoris mis à jour avec succès');
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `Recette ${action === 'add' ? 'ajoutée' : 'retirée'} avec succès !`,
            }),
        };
    } catch (error) {
        console.error('Erreur serveur :', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erreur interne du serveur.' }),
        };
    }
};
