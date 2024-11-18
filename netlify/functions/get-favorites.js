const Airtable = require('airtable');

exports.handler = async (event) => {
    try {
        const userEmail = event.queryStringParameters.userEmail;
        if (!userEmail) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Email utilisateur manquant.' }),
            };
        }

        const base = new Airtable({ apiKey: process.env.AIRTABLE_API_TOKEN }).base(process.env.AIRTABLE_BASE_ID);
        const userTable = base(process.env.AIRTABLE__UTILISATEURS__TABLE_ID);

        // Rechercher l'utilisateur
        const userRecords = await userTable
            .select({ filterByFormula: `{Email} = "${userEmail}"` })
            .firstPage();

        if (userRecords.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Utilisateur non trouvé.' }),
            };
        }

        const userRecord = userRecords[0];
        const currentFavorites = userRecord.fields['Recettes favorites'] || [];

        return {
            statusCode: 200,
            body: JSON.stringify(currentFavorites),
        };
    } catch (error) {
        console.error('Erreur serveur :', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erreur interne du serveur.' }),
        };
    }
};
