document.addEventListener('DOMContentLoaded', loadRecipes);

async function loadRecipes() {
  try {
    // Appel à la fonction serverless de Netlify pour obtenir les recettes
    const response = await fetch('/.netlify/functions/get-recettes');
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des recettes');
    }

    const data = await response.json();
    const recipesContainer = document.querySelector('#recipes-list');
    recipesContainer.innerHTML = '';

    // Itérer sur les recettes et les ajouter au HTML
    data.forEach(record => {
      const recipe = record.fields;

      // Création de l'élément HTML pour chaque recette
      const recipeElement = document.createElement('div');
      recipeElement.className = 'recipe-item';
      recipeElement.innerHTML = `
        <h2>${recipe['Titre recettes']}</h2>
        <p>${recipe['Description recette'] || 'Pas de description disponible'}</p>
        ${recipe['img.'] && recipe['img.'][0] ? `<img src="${recipe['img.'][0].url}" alt="${recipe['Titre recettes']}">` : ''}
      `;

      recipesContainer.appendChild(recipeElement);
    });
  } catch (error) {
    console.error('Erreur lors du chargement des recettes :', error);
  }
}
