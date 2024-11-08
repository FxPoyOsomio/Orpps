document.addEventListener('DOMContentLoaded', async () => {
    // Extraire le slug de l'URL
    const pathParts = window.location.pathname.split('/');
    const slug = decodeURIComponent(pathParts[pathParts.length - 1]);

    if (!slug) {
        console.error('Aucun slug trouvé dans l’URL');
        return;
    }

    try {
        // Construire l'URL pour appeler la fonction Netlify avec uniquement le slug
        const url = `/.netlify/functions/get-recettes?slug=${encodeURIComponent(slug)}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des détails de la recette');
        }

        const data = await response.json();

        // Afficher toutes les données reçues pour vérifier la structure
        console.log("Données reçues :", data);

        const recipe = data[0]?.fields;

        if (!recipe) {
            document.body.innerHTML = '<p>Recette non trouvée</p>';
            return;
        }

        // Remplir les métadonnées dynamiques
        document.getElementById("page-title").textContent = `${recipe['Titre recettes']} - Orpps`;
        document.getElementById("page-description").content = recipe['Description recette'];
        document.getElementById("og-title").content = `${recipe['Titre recettes']} - Orpps`;
        document.getElementById("og-description").content = recipe['Description recette'];
        document.getElementById("og-image").content = recipe['img.']?.[0]?.url || '';
        document.getElementById("twitter-title").content = `${recipe['Titre recettes']} - Orpps`;
        document.getElementById("twitter-description").content = recipe['Description recette'];
        document.getElementById("twitter-image").content = recipe['img.']?.[0]?.url || '';

        // Injecter le balisage Schema.org
        document.getElementById("schema-org").textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Recipe",
            "name": recipe['Titre recettes'],
            "description": recipe['Description recette'] || '',
            "image": recipe['img.']?.[0]?.url || '',
            "author": { "@type": "Person", "name": "François-Xavier Poy" },
            "datePublished": recipe['created'],
            "recipeCategory": categoryName,
            "prepTime": "PT" +
            (recipe['Temps PRÉPARATION - Heure'] ? recipe['Temps PRÉPARATION - Heure'] + "H" : "") +
            (recipe['Temps PRÉPARATION - Minute'] ? recipe['Temps PRÉPARATION - Minute'] + "M" : ""),
            "restTime": "PT" +
            (recipe['Temps REPOS - Heure'] ? recipe['Temps REPOS - Heure'] + "H" : "") +
            (recipe['Temps REPOS - Minute'] ? recipe['Temps REPOS - Minute'] + "M" : ""),
            "cookTime": "PT" +
            (recipe['Temps CUISSON - Heure'] ? recipe['Temps CUISSON - Heure'] + "H" : "") +
            (recipe['Temps CUISSON - Minute'] ? recipe['Temps CUISSON - Minute'] + "M" : ""),
            "totalTime": "PT" +
            (recipe['Temps TOTAL - Heure'] ? recipe['Temps TOTAL - Heure'] + "H" : "") +
            (recipe['Temps TOTAL - Minute'] ? recipe['Temps TOTAL - Minute'] + "M" : ""),
            "recipeYield": recipe['Nb. de portion [base]'],
            "recipeIngredient": recipe['recipeIngredient [Bring!] (from INGRÉDIENTS [PRÉPARATIONS (RECETTE)])'] || [],
        });

        // Remplir le MAIN de la recette
        document.querySelector('main').innerHTML = `
            <div class="container-bread-crumbs">
                <div class="bread-crumbs">
                    <a class="bread-crumbs__link" href="/index.html">
                        <h6>Accueil</h6>
                    </a>
                    <span style="padding: 0 8px;">
                        <h6 style="color: #CB6863;">></h6>
                    </span>
                    <a class="bread-crumbs__link" href="/recettes.html">
                        <h6>Recettes</h6>
                    </a>
                    <span style="padding: 0 8px;">
                        <h6 style="color: #CB6863;">></h6>
                    </span>
                    <a class="bread-crumbs__link" href="/recettes?categorie=${categoryName}">
                        <h6>${categoryName}</h6>
                    </a>
                    <span style="padding: 0 8px;">
                        <h6 style="color: #CB6863;">></h6>
                    </span>
                    <a class="bread-crumbs__link" href="">
                        <h6>${recipe['Titre recettes']}</h6>
                    </a>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Erreur lors du chargement de la recette :', error);
    }
});
