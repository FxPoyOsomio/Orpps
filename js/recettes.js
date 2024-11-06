document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const selectedCategory = urlParams.get('categorie');
  if (selectedCategory) {
    loadRecipes([selectedCategory]); // Charger les recettes en fonction de la catégorie sélectionnée
  } else {
    loadRecipes(); // Charger toutes les recettes par défaut
  }
});

// Modifier la fonction `loadRecipes` pour gérer les catégories sélectionnées ou non
async function loadRecipes(categoryNames = []) {
  try {
    console.log("Récupération des recettes...");
    let url = '/.netlify/functions/get-recettes';

    if (categoryNames.length > 0) {
      const filterByCategory = categoryNames
        .map(name => `SEARCH('${name}', ARRAYJOIN({CATÉGORIE MENUS [base]}, ','))`)
        .join(', ');
      const filterFormula = `OR(${filterByCategory})`;
      url += `?filterByCategory=${encodeURIComponent(filterFormula)}`;
    }

    console.log("URL utilisée pour la requête Airtable :", url); // Log de l'URL utilisée

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des recettes');
    }

    const data = await response.json();
    console.log("Recettes reçues :", data);

    const recipesContainer = document.querySelector('#recettes-list');
    if (!recipesContainer) {
      console.error("Élément avec l'ID 'recettes-list' introuvable.");
      return;
    }

    recipesContainer.innerHTML = '';

    if (data.length === 0) {
      recipesContainer.innerHTML = '<p>Aucune recette trouvée.</p>';
      return;
    }

    data.forEach(record => {
      const recipe = record.fields;

      const title = recipe['Titre recettes'] || 'Titre non disponible';
      const description = recipe['Description recette'] || '';
      const imageUrl = recipe['img.'] && recipe['img.'][0] ? recipe['img.'][0].url : '';

      console.log("Ajout de la recette :", title);

      const recipeElement = document.createElement('div');
      recipeElement.className = 'recette-item';
      recipeElement.innerHTML = `
        <h3 class="recette_titre">${title}</h3>
        <p class="recette-description">${description}</p>
        ${imageUrl ? `<img class="recette-image" src="${imageUrl}" alt="${title}">` : ''}
      `;

      recipesContainer.appendChild(recipeElement);
    });
  } catch (error) {
    console.error('Erreur lors du chargement des recettes :', error);
  }
}
