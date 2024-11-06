const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const apiKey = process.env.AIRTABLE_API_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const recettesTableId = process.env.AIRTABLE__RECETTES__TABLE_ID;

  if (!apiKey || !baseId || !recettesTableId) {
    console.error("Erreur : Variables d'environnement manquantes");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing environment variables' })
    };
  }

  const filterByCategory = event.queryStringParameters.filterByCategory || null;
  let filterByFormula = 'Is_COMMIT_Recette=TRUE()';

  // Si des catégories sont fournies, ajoutez un filtre pour chaque catégorie
  if (filterByCategory) {
    filterByFormula = `AND(${filterByFormula}, ${filterByCategory})`;
  }

  const url = `https://api.airtable.com/v0/${baseId}/${recettesTableId}?filterByFormula=${encodeURIComponent(filterByFormula)}&sort%5B0%5D%5Bfield%5D=last-modification&sort%5B0%5D%5Bdirection%5D=desc`;

  console.log("URL de requête vers Airtable :", url); // Debug URL

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      console.error(`Erreur lors de la récupération des données : ${response.statusText}`);
      return { statusCode: response.status, body: `Error fetching data from Airtable: ${response.statusText}` };
    }

    const data = await response.json();
    console.log("Données reçues de Airtable (Recettes) :", JSON.stringify(data, null, 2));

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
