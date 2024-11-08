const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const apiKey = process.env.AIRTABLE_API_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const categoriesTableId = process.env.AIRTABLE__MENUS_CATEGORIE__TABLE_ID;

  if (!apiKey || !baseId || !categoriesTableId) {
    console.error("Erreur : Variables d'environnement manquantes");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing environment variables' })
    };
  }

  // URL avec filtre pour ne récupérer que les catégories ayant des recettes associées
  const url = `https://api.airtable.com/v0/${baseId}/${categoriesTableId}?filterByFormula=NOT({RECETTES}='')`;

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

    let data = await response.json();
    console.log("Données reçues de Airtable (Catégories) :", JSON.stringify(data, null, 2));

    // Trier les catégories par le champ 'Menu (ordre d'affichage)'
    data.records.sort((a, b) => {
      const ordreA = a.fields['Menu (ordre d\'affichage)'] || 0;
      const ordreB = b.fields['Menu (ordre d\'affichage)'] || 0;
      return ordreA - ordreB;
    });

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
 