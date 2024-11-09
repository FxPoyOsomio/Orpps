const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const apiKey = process.env.AIRTABLE_API_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const recettePreparationsTableId = process.env.AIRTABLE__RECETTE_PREPARATIONS__TABLE_ID;

  // Vérifiez si un id est passé dans les paramètres d'URL
  const recordId = event.queryStringParameters.id;
  const url = recordId
    ? `https://api.airtable.com/v0/${baseId}/${recettePreparationsTableId}/${recordId}`
    : `https://api.airtable.com/v0/${baseId}/${recettePreparationsTableId}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      return { statusCode: response.status, body: 'Error fetching data' };
    }

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(recordId ? [data] : data.records) // Si un id est passé, encapsuler la réponse dans un tableau
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
