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

  // Récupérer les paramètres d'URL pour les IDs de sous-catégories et le nom de catégorie
  const ids = event.queryStringParameters.ids;
  const categoryName = event.queryStringParameters.categoryName; // Nom de la catégorie pour le filtre
  let url = `https://api.airtable.com/v0/${baseId}/${subcategoriesTableId}`;

  // Construire le filtre en fonction des paramètres
  let filterByFormula = '';

  if (ids) {
    // Filtre pour des IDs de sous-catégories spécifiques
    const idList = ids.split(',').map(id => `RECORD_ID()='${id}'`).join(',');
    filterByFormula = `OR(${idList})`;
  }

  if (categoryName) {
    // Ajouter un filtre pour rechercher le nom de catégorie dans le champ "Nom Catégorie Menu"
    const categoryFilter = `SEARCH('${categoryName}', {Nom Catégorie Menu})`;
    filterByFormula = filterByFormula ? `AND(${filterByFormula}, ${categoryFilter})` : categoryFilter;
  }

  // Ajouter le filtre à l'URL s'il est défini
  if (filterByFormula) {
    url += `?filterByFormula=${encodeURIComponent(filterByFormula)}`;
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

    let data = await response.json();
    console.log("Données reçues de Airtable (Sous-catégories) :", JSON.stringify(data, null, 2));

    // Éliminer les doublons de sous-catégories basés sur le nom, si aucune catégorie spécifique n'est fournie
    if (!categoryName) {
      const uniqueSubCategories = [];
      const namesSeen = new Set();

      data.records.forEach(record => {
        const name = record.fields['Nom sous-catégorie menus'];
        if (!namesSeen.has(name)) {
          namesSeen.add(name);
          uniqueSubCategories.push(record);
        }
      });

      data.records = uniqueSubCategories;
    }

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
