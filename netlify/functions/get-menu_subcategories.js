const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const apiKey = process.env.AIRTABLE_API_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const subcategoriesTableId = process.env.AIRTABLE__MENUS_SOUS_CATEGORIE__TABLE_ID;

  // Vérifier les variables d'environnement
  if (!apiKey || !baseId || !subcategoriesTableId) {
    console.error("Erreur : Variables d'environnement manquantes");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing environment variables' })
    };
  }

  // Récupérer les IDs fournis dans les paramètres d'URL
  const ids = event.queryStringParameters.ids;
  let url = `https://api.airtable.com/v0/${baseId}/${subcategoriesTableId}`;

  // Si des IDs sont fournis, appliquer le filtre
  if (ids) {
    const idList = ids.split(',').map(id => `RECORD_ID()='${id}'`).join(',');
    url += `?filterByFormula=OR(${idList})`;
  }

  console.log("URL de requête vers Airtable (Sous-catégories) :", url);

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      console.error(`Erreur lors de la récupération des sous-catégories : ${response.statusText}`);
      return { statusCode: response.status, body: `Error fetching data from Airtable: ${response.statusText}` };
    }

    const data = await response.json();
    console.log("Données reçues de Airtable (Sous-catégories) :", JSON.stringify(data, null, 2));

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
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message })
    };
  }
};
