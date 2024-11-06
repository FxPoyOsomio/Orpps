document.addEventListener('DOMContentLoaded', () => {
  loadCategories();
  loadRecipes(); // Charger toutes les recettes par défaut
});

let activeCategories = new Set(); // Utiliser un Set pour stocker les catégories actives sans doublon

async function loadCategories() {
  try {
    console.log("Fetching categories...");
    const response = await fetch('/.netlify/functions/get-menu_categories');
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des catégories');
    }

    const data = await response.json();
    console.log("Categories received:", data);

    const categoriesContainer = document.querySelector('#categories-list');
    if (!categoriesContainer) {
      console.error("Element with ID 'categories-list' not found.");
      return;
    }

    categoriesContainer.innerHTML = '';

    // Itérer sur les catégories et les ajouter au HTML
    data.forEach(record => {
      const category = record.fields;
      const categoryId = record.id; // ID de la catégorie
      const categoryName = category['Nom Menu'] || 'Sans nom'; // Utiliser le nom de la catégorie

      // Création de l'élément HTML pour chaque catégorie
      const categoryElement = document.createElement('div');
      categoryElement.className = 'categorie-item';

      const categoryButton = document.createElement('button');
      categoryButton.className = 'category-button';
      categoryButton.textContent = categoryName;

      const removeButton = document.createElement('span');
      removeButton.className = 'remove-category';
      removeButton.textContent = '×';
      removeButton.style.display = 'none';

      categoryButton.addEventListener('click', () => {
        if (activeCategories.has(categoryName)) {
          activeCategories.delete(categoryName);
          categoryElement.classList.remove('active');
          removeButton.style.display = 'none';
        } else {
          activeCategories.add(categoryName);
          categoryElement.classList.add('active');
          removeButton.style.display = 'inline';
        }
        loadRecipes([...activeCategories]);
      });

      removeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        activeCategories.delete(categoryName);
        categoryElement.classList.remove('active');
        removeButton.style.display = 'none';
        loadRecipes([...activeCategories]);
      });

      categoryElement.appendChild(categoryButton);
      categoryElement.appendChild(removeButton);
      categoriesContainer.appendChild(categoryElement);
    });
  } catch (error) {
    console.error('Erreur lors du chargement des catégories :', error);
  }
}

async function loadRecipes(categoryNames = []) {
  try {
    console.log("Fetching recipes...");
    let url = '/.netlify/functions/get-recettes';

    if (categoryNames.length > 0) {
      const filterByCategory = categoryNames
        .map(name => `SEARCH('${name}', ARRAYJOIN({CATÉGORIE MENUS [base]}, ','))`)
        .join(', ');
      const filterFormula = `OR(${filterByCategory})`;
      url += `?filterByCategory=${encodeURIComponent(filterFormula)}`;
    }

    console.log("URL utilisée pour la requête :", url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des recettes');
    }

    const data = await response.json();
    console.log("Recipes received:", data);

    const recipesContainer = document.querySelector('#recettes-list');
    if (!recipesContainer) {
      console.error("Element with ID 'recettes-list' not found.");
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

      console.log("Adding recipe:", title);

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
