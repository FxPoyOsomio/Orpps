const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const apiKey = process.env.AIRTABLE_API_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const subcategoriesTableId = process.env.AIRTABLE__MENUS_SOUS_CATEGORIE__TABLE_ID;

  const url = `https://api.airtable.com/v0/${baseId}/${subcategoriesTableId}`;

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
      body: JSON.stringify(data.records)
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
