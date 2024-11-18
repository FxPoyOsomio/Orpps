const Airtable = require('airtable');

exports.handler = async (event) => {
    console.log('Requête reçue pour récupérer les favoris.');
    try {
        // Extraire l'e-mail utilisateur depuis la requête
        const { userEmail } = event.queryStringParameters;

        console.log('Email utilisateur reçu :', userEmail);

        if (!userEmail) {
            console.error('Email utilisateur manquant.');
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Email utilisateur manquant.' }),
            };
        }

        // Configurer Airtable
        const base = new Airtable({ apiKey: process.env.AIRTABLE_API_TOKEN }).base(process.env.AIRTABLE_BASE_ID);
        const userTable = base(process.env.AIRTABLE__UTILISATEURS__TABLE_ID);

        // Rechercher l'utilisateur dans Airtable
        const userRecords = await userTable
            .select({ filterByFormula: `{Mail} = "${userEmail}"` })
            .firstPage();

        if (userRecords.length === 0) {
            console.error('Utilisateur non trouvé.');
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Utilisateur non trouvé.' }),
            };
        }

        const userRecord = userRecords[0];
        const favorites = userRecord.fields['Recettes favorites'] || [];

        console.log('Favoris récupérés avec succès :', favorites);

        return {
            statusCode: 200,
            body: JSON.stringify(favorites),
        };
    } catch (error) {
        console.error('Erreur interne :', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erreur interne du serveur.' }),
        };
    }
};
