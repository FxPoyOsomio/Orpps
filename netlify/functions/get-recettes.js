const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  console.log("Fonction get-recettes appelée");  // Log pour indiquer que la fonction est appelée

  const apiKey = process.env.AIRTABLE_API_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const recettesTableId = process.env.AIRTABLE__RECETTES__TABLE_ID;

  // Vérifiez si les variables d'environnement sont bien définies
  if (!apiKey || !baseId || !recettesTableId) {
    console.error("Erreur : Variables d'environnement manquantes");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing environment variables' })
    };
  }

  console.log("Variables d'environnement OK");

  const url = `https://api.airtable.com/v0/${baseId}/${recettesTableId}`;
  console.log(`URL d'appel à Airtable : ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    console.log(`Statut de la réponse Airtable : ${response.status}`);

    if (!response.ok) {
      console.error(`Erreur lors de l'appel à Airtable : ${response.status}`);
      return { statusCode: response.status, body: 'Error fetching data from Airtable' };
    }

    const data = await response.json();
    console.log("Données reçues de Airtable :", data);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data.records)
    };
  } catch (error) {
    console.error("Erreur interne :", error.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error', details: error.message }) };
  }
};
