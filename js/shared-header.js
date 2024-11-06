async function loadHeaderCategories() {
    try {
        console.log("Fetching categories for header...");
        const response = await fetch('/.netlify/functions/get-menu_categories');
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des catégories');
        }

        const data = await response.json();
        console.log("Header categories received:", data);

        const categoriesContainer = document.querySelector('.Menu_categorie');
        if (!categoriesContainer) {
            console.error("Element with class 'Menu_categorie' not found.");
            return;
        }

        categoriesContainer.innerHTML = '';

        // Itérer sur les catégories et les ajouter au HTML en tant que <secondary-button>
        data.forEach(record => {
            const category = record.fields;
            const categoryName = category['Nom Menu'] || 'Sans nom'; // Utiliser le nom de la catégorie

            // Création de l'élément <secondary-button> pour chaque catégorie
            const categoryButton = document.createElement('secondary-button');
            categoryButton.setAttribute('text', categoryName);
            categoryButton.setAttribute('href', `/recettes?categorie=${encodeURIComponent(categoryName)}`);

            categoriesContainer.appendChild(categoryButton);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des catégories pour le header :', error);
    }
}
