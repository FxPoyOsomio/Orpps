const { OAuth2Client } = require('google-auth-library');
const Airtable = require('airtable');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.handler = async (event) => {
  try {
    const { idToken } = JSON.parse(event.body);

    // Vérifier le token Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;

    // Initialiser Airtable avec l'ID de la base
    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_TOKEN }).base(process.env.AIRTABLE_BASE_ID);

    // Utiliser l'ID de la table `UTILISATEURS`
    const utilisateursTable = base(process.env.AIRTABLE__UTILISATEURS__TABLE_ID);

    // Vérifier si l'utilisateur est autorisé (e-mail présent dans Airtable)
    const records = await utilisateursTable.select({
      filterByFormula: `{Mail} = "${email}"`,
    }).firstPage();

    if (records.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ authorized: true, userEmail: email }),
      };
    } else {
      return {
        statusCode: 403,
        body: JSON.stringify({ authorized: false }),
      };
    }
  } catch (error) {
    console.error('Erreur lors de la validation du token Google :', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Erreur serveur lors de la validation du token.' }),
    };
  }
};
