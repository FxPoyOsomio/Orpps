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
  const searchTerms = event.queryStringParameters.searchTerms || null;
  let filterByFormula = 'Is_COMMIT_Recette=TRUE()';

  // Appliquer le filtre par catégorie si disponible
  if (filterByCategory) {
    filterByFormula = `AND(${filterByFormula}, OR(${filterByCategory}))`;
  }

  const url = `https://api.airtable.com/v0/${baseId}/${recettesTableId}?filterByFormula=${encodeURIComponent(filterByFormula)}&sort%5B0%5D%5Bfield%5D=last-modification&sort%5B0%5D%5Bdirection%5D=desc`;

  console.log("URL de requête vers Airtable :", url);

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

    // Appliquer le filtrage par termes de recherche en local
    const normalizedSearchTerms = searchTerms ? searchTerms.split(' ').map(normalizeText) : [];

    const filteredRecords = data.records.filter(record => {
      const title = normalizeText(record.fields['Titre recettes'] || '');
      const instructions = normalizeText(record.fields['Instruction'] || '');
      const ingredientsList = normalizeText((record.fields['List ingrédient pour Orpps'] || []).join(' '));
    
      console.log("Contenu du champ 'List ingrédient pour Orpps':", record.fields['List ingrédient pour Orpps']);
    
      return normalizedSearchTerms.every(term => {
        // Créer une expression régulière pour correspondre au début du mot avec une longueur similaire
        const regex = new RegExp(`\\b${term}\\w{0,2}\\b`, 'i');
        
        return regex.test(title) || regex.test(instructions) || regex.test(ingredientsList);
      });
    });
    
    

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(filteredRecords)
    };
  } catch (error) {
    console.error("Erreur interne :", error.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error', details: error.message }) };
  }
};

// Fonction pour supprimer les accents et mettre en minuscules
function normalizeText(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
