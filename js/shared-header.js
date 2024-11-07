// Fonction pour charger les catégories dans le header
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
            categoryButton.setAttribute('style', 'opacity: 0');
            categoryButton.setAttribute('href', `/recettes?categorie=${encodeURIComponent(categoryName)}`);

            // Ajouter l'événement de clic pour gérer la classe active
            categoryButton.addEventListener('click', (event) => {
                event.preventDefault();

                // Supprimer la classe active de tous les boutons
                const allButtons = categoriesContainer.querySelectorAll('secondary-button');
                allButtons.forEach(button => button.classList.remove('active'));

                // Ajouter la classe active au bouton cliqué
                categoryButton.classList.add('active');

                // Rediriger vers la page des recettes avec le filtre
                window.location.href = categoryButton.getAttribute('href');
            });

            categoriesContainer.appendChild(categoryButton);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des catégories pour le header :', error);
    }
}
