const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const apiKey = process.env.AIRTABLE_API_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const subcategoriesTableId = process.env.AIRTABLE__MENUS_SOUS_CATEGORIE__TABLE_ID;

  if (!apiKey || !baseId || !subcategoriesTableId) {
    console.error("Erreur : Variables d'environnement manquantes");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing environment variables' })
    };
  }

  // Récupérer le `recordId` passé dans la requête, si présent
  const recordId = event.queryStringParameters.id || null;
  let url = `https://api.airtable.com/v0/${baseId}/${subcategoriesTableId}`;

  // Si un `recordId` est fourni, ajouter un filtre pour récupérer uniquement cette sous-catégorie
  if (recordId) {
    url += `?filterByFormula=RECORD_ID()='${recordId}'`;
  }

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      return { statusCode: response.status, body: `Error fetching data: ${response.statusText}` };
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
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error', details: error.message }) };
  }
};
