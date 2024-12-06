document.addEventListener("DOMContentLoaded", () => {
    const user = netlifyIdentity.currentUser();
    console.log(user);

    const addEventButton = document.getElementById("addEvent");

    if (addEventButton) {
        addEventButton.addEventListener("click", openEventModal);
    }
    // Charger et afficher les événements existants
    displayUserEvents();

    const globalPortionsInput = document.getElementById("portion-input");

    if (globalPortionsInput) {
        // Événements "input" et "change" pour synchronisation en temps réel
        globalPortionsInput.addEventListener("input", synchronizeGlobalPortions);
        globalPortionsInput.addEventListener("change", synchronizeGlobalPortions);
    }

    // Attacher l'événement sur le document pour capturer les éléments dynamiques
    document.addEventListener("mouseenter", (event) => {
        if (!(event.target instanceof Element)) return;

        const button = event.target.closest(".remove_recipeInput");
        if (button) {
            const recipeContainer = button.closest(".recipeInput")?.querySelector(".recipe");
            if (recipeContainer) {
                recipeContainer.classList.add("shake-animation");

                // Supprimer la classe à la fin de l'animation
                recipeContainer.addEventListener("animationend", () => {
                    recipeContainer.classList.remove("shake-animation");
                }, { once: true }); // `once: true` garantit que cet écouteur est appelé une seule fois
            }
        }
    }, true);
});



// Fonction pour ouvrir le modal des événements (ajouter ou modifier)
function openEventModal(eventIndex = null) {
    const user = netlifyIdentity.currentUser();
    const events = user?.user_metadata.events || [];
    const event = eventIndex !== null ? events[eventIndex] : null;

    // Créer le modal dynamiquement
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
        <div class="modal">
            <h4>${event ? "Modifier un évènement" : "Nouvel évènement"}</h4>
            <input type="text" id="eventNameInput" placeholder="Nom de l'évènement" value="${event?.name || ""}" required />
            <div class="modal_buttons">
                ${
                    event
                        ? '<button class="primary-button danger-button" id="deleteEvent">Supprimer</button>'
                        : ""
                }
                ${
                    event
                        ? '<button class="secondary-button danger-button" id="validateEvent">Modifier</button>'
                        : '<button class="primary-button" id="validateEvent">Ajouter</button>'
                }
                <button class="secondary-button" id="closeModal">Annuler</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Ajouter les événements au modal
    document.getElementById("validateEvent").addEventListener("click", () => {
        if (event) {
            updateEvent(eventIndex); // Modifier l'événement
        } else {
            validateEvent(); // Ajouter un nouvel événement
        }
    });

    if (event) {
        document.getElementById("deleteEvent").addEventListener("click", () => {
            deleteEvent(eventIndex); // Supprimer l'événement
        });
    }

    document.getElementById("closeModal").addEventListener("click", closeEventModal);
}


// Fonction pour mettre à jour un événement existant
function updateEvent(eventIndex) {
    const eventNameInput = document.getElementById("eventNameInput");
    const eventName = eventNameInput ? eventNameInput.value.trim() : "";

    if (!eventName) {
        alert("Veuillez entrer un nom pour l'évènement.");
        return;
    }

    const user = netlifyIdentity.currentUser();
    if (user) {
        const events = user.user_metadata.events || [];
        const event = events[eventIndex];
        if (event) {
            event.name = eventName;
            event.last_modified = new Date().toISOString();

            user.update({ data: { events } })
                .then((updatedUser) => {
                    console.log("Événement modifié avec succès :", updatedUser.user_metadata.events[eventIndex]);
                    closeEventModal();
                    displayUserEvents(); // Actualiser l'affichage des événements
                })
                .catch((error) => {
                    console.error("Erreur lors de la modification de l'événement :", error);
                });
        }
    }
}

// Fonction pour supprimer un événement
function deleteEvent(eventIndex) {
    const user = netlifyIdentity.currentUser();
    if (user) {
        const events = user.user_metadata.events || [];
        if (events[eventIndex]) {
            events.splice(eventIndex, 1); // Supprimer l'événement

            user.update({ data: { events } })
                .then((updatedUser) => {
                    console.log("Événement supprimé avec succès :", updatedUser.user_metadata.events);
                    closeEventModal();
                    displayUserEvents(); // Actualiser l'affichage des événements
                })
                .catch((error) => {
                    console.error("Erreur lors de la suppression de l'événement :", error);
                });
        }
    }
}

// Fonction pour fermer le modal
function closeEventModal() {
    const modal = document.querySelector(".modal-overlay");
    if (modal) modal.remove();
}

function validateEvent() {
    const eventNameInput = document.getElementById("eventNameInput");
    const eventName = eventNameInput ? eventNameInput.value.trim() : "";

    if (!eventName) {
        alert("Veuillez entrer un nom pour l'évènement.");
        return;
    }

    // Récupérer l'utilisateur actuel
    const user = netlifyIdentity.currentUser();

    if (user) {
        // Ajouter l'événement avec la date de création/mise à jour
        const newEvent = {
            name: eventName,
            last_modified: new Date().toISOString(), // Timestamp actuel
        };

        const updatedEvents = [
            ...(user.user_metadata.events || []), // Événements existants
            newEvent, // Nouvel événement
        ];

        // Mettre à jour les métadonnées utilisateur
        user.update({
            data: {
                events: updatedEvents,
            },
        })
        .then(() => {
            console.log("Événement ajouté avec succès.");
            
            // Recharger les données utilisateur pour garantir leur actualisation
            return netlifyIdentity.refresh();
        })
        .then((updatedUser) => {
            console.log("Utilisateur actualisé :", updatedUser);
            closeEventModal(); // Fermer le modal après validation
            displayUserEvents(); // Actualiser l'affichage des événements avec les nouvelles données
        })
        .catch((error) => {
            console.error("Erreur lors de l'ajout de l'événement :", error);
        });
    } else {
        alert("Utilisateur non connecté. Veuillez vous connecter pour ajouter un évènement.");
    }
}




// Fonction pour afficher les événements existants avec les repas associés
function displayUserEvents() {
    const user = netlifyIdentity.currentUser();

    if (user) {
        const events = user.user_metadata.events || [];
        const eventList = document.getElementById("eventList");

        if (eventList) {
            // Vider la liste avant d'ajouter les événements
            eventList.innerHTML = "";

            // Parcourir les événements et créer les divs
            events.forEach((event, eventIndex) => {
                const eventHTML = `
                    <div class="event">
                        <div class="event_cardContainer">
                            <div class="titre-section-container">
                                <svg class="titre-section-image" fill="#cb6863" width="50px" height="50px" viewBox="0 -2.89 122.88 122.88" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="enable-background:new 0 0 122.88 117.09" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <style type="text/css">.st0{fill-rule:evenodd;clip-rule:evenodd;}</style> <g> <path class="st0" d="M36.82,107.86L35.65,78.4l13.25-0.53c5.66,0.78,11.39,3.61,17.15,6.92l10.29-0.41c4.67,0.1,7.3,4.72,2.89,8 c-3.5,2.79-8.27,2.83-13.17,2.58c-3.37-0.03-3.34,4.5,0.17,4.37c1.22,0.05,2.54-0.29,3.69-0.34c6.09-0.25,11.06-1.61,13.94-6.55 l1.4-3.66l15.01-8.2c7.56-2.83,12.65,4.3,7.23,10.1c-10.77,8.51-21.2,16.27-32.62,22.09c-8.24,5.47-16.7,5.64-25.34,1.01 L36.82,107.86L36.82,107.86z M29.74,62.97h91.9c0.68,0,1.24,0.57,1.24,1.24v5.41c0,0.67-0.56,1.24-1.24,1.24h-91.9 c-0.68,0-1.24-0.56-1.24-1.24v-5.41C28.5,63.53,29.06,62.97,29.74,62.97L29.74,62.97z M79.26,11.23 c25.16,2.01,46.35,23.16,43.22,48.06l-93.57,0C25.82,34.23,47.09,13.05,72.43,11.2V7.14l-4,0c-0.7,0-1.28-0.58-1.28-1.28V1.28 c0-0.7,0.57-1.28,1.28-1.28h14.72c0.7,0,1.28,0.58,1.28,1.28v4.58c0,0.7-0.58,1.28-1.28,1.28h-3.89L79.26,11.23L79.26,11.23 L79.26,11.23z M0,77.39l31.55-1.66l1.4,35.25L1.4,112.63L0,77.39L0,77.39z"></path> </g> </g></svg>
                                <div class="titre-section-titre_border">
                                    <h2 class="titre-section-title">${event.name}</h2>
                                    <div class="titre-section-border"></div>
                                </div>
                            </div>
                            <div class="event_buttons">
                                <button class="modifyEventButton" event-id="${eventIndex}">
                                    <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M20.8477 1.87868C19.6761 0.707109 17.7766 0.707105 16.605 1.87868L2.44744 16.0363C2.02864 16.4551 1.74317 16.9885 1.62702 17.5692L1.03995 20.5046C0.760062 21.904 1.9939 23.1379 3.39334 22.858L6.32868 22.2709C6.90945 22.1548 7.44285 21.8693 7.86165 21.4505L22.0192 7.29289C23.1908 6.12132 23.1908 4.22183 22.0192 3.05025L20.8477 1.87868ZM18.0192 3.29289C18.4098 2.90237 19.0429 2.90237 19.4335 3.29289L20.605 4.46447C20.9956 4.85499 20.9956 5.48815 20.605 5.87868L17.9334 8.55027L15.3477 5.96448L18.0192 3.29289ZM13.9334 7.3787L3.86165 17.4505C3.72205 17.5901 3.6269 17.7679 3.58818 17.9615L3.00111 20.8968L5.93645 20.3097C6.13004 20.271 6.30784 20.1759 6.44744 20.0363L16.5192 9.96448L13.9334 7.3787Z" fill="#696969"></path> </g></svg>
                                </button>
                                <primary-button text="" class="addEvent_IngredientList_Button" event-id="${eventIndex}" href="/liste_de_course.html">
                                    <svg width="64px" height="64px" viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg"
                                        xmlns:xlink="http://www.w3.org/1999/xlink" class="si-glyph si-glyph-basket-plus" fill="#000000">
                                        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                                        <g id="SVGRepo_iconCarrier">
                                            <title>625</title>
                                            <defs> </defs>
                                            <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
                                                <g transform="translate(0.000000, 1.000000)" fill="#ffffff">
                                                    <path
                                                        d="M9.927,11.918 C9.887,11.833 9.86,11.741 9.86,11.639 L9.86,7.483 C9.86,7.145 10.146,6.907 10.448,6.907 L10.469,6.907 C10.77,6.907 11.063,7.145 11.063,7.483 L11.063,10.943 L11.965,10.943 L11.965,8.982 L13.258,8.982 L13.422,5.976 L14.188,5.976 C14.588,5.976 14.913,4.756 14.913,4.756 C14.913,4.386 14.589,4.084 14.188,4.084 L12.26,4.084 L11.225,0.447 C11.074,0.13 10.699,0.00199999998 10.387,0.161 L10.315,0.197 C10.005,0.357 9.876,0.743 10.027,1.06 L10.768,4.083 L4.114,4.083 L4.882,1.064 C5.036,0.75 4.909,0.362 4.601,0.199 L4.531,0.163 C4.22,0.000999999981 3.843,0.125 3.689,0.44 L2.616,4.083 L0.726,4.083 C0.326,4.083 0.000999999931,4.385 0.000999999931,4.755 C0.000999999931,4.755 0.325,5.975 0.726,5.975 L1.362,5.975 L1.811,12.652 C1.811,12.652 1.863,13.961 3.924,13.961 L9.928,13.961 L9.928,11.918 L9.927,11.918 Z M11.969,5 L13.031,5 L13.031,6.062 L11.969,6.062 L11.969,5 L11.969,5 Z M3.094,6.031 L1.912,6.031 L1.912,4.906 L3.094,4.906 L3.094,6.031 L3.094,6.031 Z M5.006,11.742 C5.006,12.092 4.755,12.375 4.447,12.375 L4.424,12.375 C4.113,12.375 3.863,12.092 3.863,11.742 L3.863,7.413 C3.863,7.063 4.113,6.781 4.424,6.781 L4.447,6.781 C4.755,6.781 5.006,7.063 5.006,7.413 L5.006,11.742 L5.006,11.742 Z M8.004,11.547 C8.004,11.881 7.774,12.152 7.49,12.152 L7.469,12.152 C7.185,12.152 6.955,11.881 6.955,11.547 L6.955,7.448 C6.955,7.114 7.184,6.844 7.469,6.844 L7.49,6.844 C7.773,6.844 8.004,7.115 8.004,7.448 L8.004,11.547 L8.004,11.547 Z"
                                                        class="si-glyph-fill"> </path>
                                                    <path
                                                        d="M16,12.012 L13.992,12.012 L13.992,10.106 L13.055,10.106 L13.055,12.012 L11.052,12.012 L11.052,12.906 L13.055,12.906 L13.055,14.938 L13.992,14.938 L13.992,12.906 L16,12.906 L16,12.012 Z"
                                                        class="si-glyph-fill"> </path>
                                                </g>
                                            </g>
                                        </g>
                                    </svg>
                                </primary-button>
                            </div>
                        </div>
                        <div class="event_ovelayContainer">
                            <div class="event_meals" id="eventMeals_${eventIndex}">
                            </div>
                            <button class="addMeal" event-id="${eventIndex}">ajouter un repas</button>
                        </div>
                    </div>
                `;
                eventList.innerHTML += eventHTML;

                // Appeler la fonction pour afficher les repas
                displayEventMeals(event, eventIndex);
            });
        }
    } else {
        console.warn("Utilisateur non connecté. Impossible de charger les événements.");
    }
}

function formatDateToFrench(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
    }).format(date);
}

// Fonction pour afficher les repas pour un événement donné, groupés par date
function displayEventMeals(event, eventIndex) {
    const mealContainer = document.getElementById(`eventMeals_${eventIndex}`);
    if (mealContainer && event.meal && Array.isArray(event.meal)) {
        mealContainer.innerHTML = "";

        // Grouper les repas par date
        const mealsByDate = event.meal.reduce((groupedMeals, meal) => {
            if (!groupedMeals[meal.mealDate]) {
                groupedMeals[meal.mealDate] = [];
            }
            groupedMeals[meal.mealDate].push(meal);
            return groupedMeals;
        }, {});

        // Trier les dates dans l'ordre croissant
        const sortedDates = sortDates(Object.keys(mealsByDate));

        let globalMealIndex = 0;

        // Parcourir les dates triées
        sortedDates.forEach((mealDate) => {
            const meals = mealsByDate[mealDate];

            // Trier les repas de cette date selon leur ordre défini
            const sortedMeals = sortMealsByOrder(meals);

            // Créer un conteneur pour les repas de cette date
            let dateHTML = `
                <div class="mealItems_byDate">
                    <h3 class="mealDate">${formatDateToFrench(mealDate)}</h3>
                    <div class="mealItems-container">
            `;

            // Parcourir les repas triés de cette date
            sortedMeals.forEach((meal) => {
                const mealHTML = `
                    <div class="mealItem_container" event-id="${eventIndex}" meal-id="${globalMealIndex}">
                        <div class="mealItem">
                            <div class="meal">
                                <h3 class="mealTitle">${meal.mealType}</h3>
                                <h3 class="mealPortion">${meal.mealPortion} personnes</h3>
                            </div>
                            <button class="modifyMealButton" event-id="${eventIndex}" meal-id="${globalMealIndex}">
                                <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M20.8477 1.87868C19.6761 0.707109 17.7766 0.707105 16.605 1.87868L2.44744 16.0363C2.02864 16.4551 1.74317 16.9885 1.62702 17.5692L1.03995 20.5046C0.760062 21.904 1.9939 23.1379 3.39334 22.858L6.32868 22.2709C6.90945 22.1548 7.44285 21.8693 7.86165 21.4505L22.0192 7.29289C23.1908 6.12132 23.1908 4.22183 22.0192 3.05025L20.8477 1.87868ZM18.0192 3.29289C18.4098 2.90237 19.0429 2.90237 19.4335 3.29289L20.605 4.46447C20.9956 4.85499 20.9956 5.48815 20.605 5.87868L17.9334 8.55027L15.3477 5.96448L18.0192 3.29289ZM13.9334 7.3787L3.86165 17.4505C3.72205 17.5901 3.6269 17.7679 3.58818 17.9615L3.00111 20.8968L5.93645 20.3097C6.13004 20.271 6.30784 20.1759 6.44744 20.0363L16.5192 9.96448L13.9334 7.3787Z" fill="#696969"></path> </g></svg>
                            </button>
                        </div>
                        <div class="meal_menu" id="eventMealMenu_${eventIndex}_${globalMealIndex}"></div>
                    </div>
                `;

                dateHTML += mealHTML;
                globalMealIndex++;
            });

            dateHTML += `
                    </div> <!-- Fin de mealItems-container -->
                </div> <!-- Fin de mealItems_byDate -->
            `;

            mealContainer.innerHTML += dateHTML;
        });

        // Générer les menus après avoir ajouté tous les repas au DOM
        event.meal.forEach((meal, mealIndex) => {
            const mealMenuContainer = document.getElementById(`eventMealMenu_${eventIndex}_${mealIndex}`);
            if (mealMenuContainer) {
                generateMealMenu(meal, mealMenuContainer);
            }
        });
    }
}








// Fonction pour générer le contenu du menu d'un repas
function generateMealMenu(meal, mealMenuContainer) {
    if (!meal || !meal.menu || !Array.isArray(meal.menu)) {
        console.warn("Données du menu non valides :", meal);
        return;
    }

    console.log("Génération du menu pour le repas :", meal);

    // Vider le conteneur avant d'ajouter les catégories
    mealMenuContainer.innerHTML = "";

    // Parcourir les catégories du menu
    meal.menu.forEach((category, categoryIndex) => {
        if (category.activCategory) {
            console.log(`Catégorie active trouvée : ${category.categoryMenu} (index ${categoryIndex})`);

            let categoryHTML = `
                <div class="menuCategorie">
                    <h4 class="menuCategorie_title">${category.categoryMenu.toUpperCase()}</h4>
                    <div class="menuCategorie_recipes">
            `;

            // Ajouter les recettes de cette catégorie
            if (category.recipes && Array.isArray(category.recipes)) {
                category.recipes.forEach((recipe) => {
                    const ingredientsData = recipe.ingredients
                        ? JSON.stringify(recipe.ingredients.map((ingredient) => ({
                              "record-id": ingredient.recordId,
                              qté: ingredient.quantity,
                          })))
                        : null;

                    const portionBase = recipe.portionBase || 1; // Défaut à 1 si non défini

                    categoryHTML += `
                        <div class="recipeItem" id="${recipe.recipeId}" 
                            ${ingredientsData ? `data-ref-ingrédient-RecordId-Qt='${ingredientsData}'` : ""}
                            data-ref-portion-base="${portionBase}">
                            <p class="recipeTitle">${recipe.recipeName}</p>
                            <p class="recipePortion"> ${recipe.recipePortion} portions</p>
                        </div>
                    `;
                });
            } else {
                console.warn(`Aucune recette trouvée pour la catégorie "${category.categoryMenu}"`);
            }

            categoryHTML += `
                    </div> <!-- Fin de menuCategorie_recipes -->
                </div> <!-- Fin de menuCategorie -->
            `;

            mealMenuContainer.innerHTML += categoryHTML;
        } else {
            console.log(`Catégorie inactive : ${category.categoryMenu}`);
        }
    });

    // Vérification finale
    if (!mealMenuContainer.innerHTML.trim()) {
        mealMenuContainer.innerHTML = "<p>Aucune catégorie active trouvée pour ce repas.</p>";
    }
}


















// Ajouter un gestionnaire pour le bouton "Nouveau repas" & nouveau event
document.addEventListener("click", (event) => {

    const addMealButton = event.target.closest(".addMeal");
    if (addMealButton) {
        const eventIndex = parseInt(addMealButton.getAttribute("event-id"), 10);
        openMealModal(eventIndex);
    }

    const modifyEventButton = event.target.closest(".modifyEventButton");
    if (modifyEventButton) {
        const eventIndex = parseInt(modifyEventButton.getAttribute("event-id"), 10);
        openEventModal(eventIndex); // Ouvrir le modal pour modifier l'événement
    }

    const button = event.target.closest(".addEvent_IngredientList_Button");
    if (button) {
        const eventIndex = parseInt(button.getAttribute("event-id"), 10);
        addIngredientsToShoppingList(eventIndex);
    }
});
// Gestionnaire global pour les boutons "Modifier le repas"
document.addEventListener("click", (event) => {
    const modifyMealButton = event.target.closest(".modifyMealButton");
    if (modifyMealButton) {
        const eventIndex = parseInt(modifyMealButton.getAttribute("event-id"), 10);
        const mealIndex = parseInt(modifyMealButton.getAttribute("meal-id"), 10);
        openMealModal(eventIndex, mealIndex); // Ouvrir le modal avec les métadonnées existantes
    }
});

const mealTypes = [
    "Petit-Déjeuner",
    "Brunch",
    "Déjeuner",
    "Goûter",
    "Diner",
    "Soirée",
];
const mealOrder = {
    "Petit-Déjeuner": 1,
    "Brunch": 2,
    "Déjeuner": 3,
    "Goûter": 4,
    "Diner": 5,
    "Soirée": 6,
};
function sortMealsByOrder(meals) {
    return meals.sort((a, b) => {
        const orderA = mealOrder[a.mealType] || Infinity;
        const orderB = mealOrder[b.mealType] || Infinity;
        return orderA - orderB;
    });
}
function sortDates(dates) {
    return dates.sort((a, b) => new Date(a) - new Date(b));
}


const categoryMenus = {
    "Petit-Déjeuner": ["Dessert", "Céréales", "Boisson", "Boulangerie"],
    Brunch: ["Entrée", "Tapas", "Plat", "Dessert", "Céréales", "Boisson", "Boulangerie"],
    Déjeuner: ["Apéritif", "Entrée", "Tapas", "Plat", "Dessert", "Boisson", "Boulangerie"],
    Goûter: ["Dessert", "Céréales", "Boisson", "Boulangerie"],
    Diner: ["Apéritif", "Entrée", "Tapas", "Plat", "Dessert", "Boisson", "Boulangerie"],
    Soirée: ["Apéritif", "Entrée", "Tapas", "Plat", "Dessert", "Boisson", "Boulangerie"],
};


function openMealModal(eventIndex, mealIndex = null) {
    const user = netlifyIdentity.currentUser();
    const events = user?.user_metadata.events || [];
    const event = events[eventIndex];
    const meal = mealIndex !== null ? event.meal[mealIndex] : null;

    const today = new Date().toISOString().split("T")[0];
    const mealTypeIndex = meal ? mealTypes.indexOf(meal.mealType) : null;
    const mealPortion = meal?.mealPortion || 6;

    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
        <div class="modal">
            <h2 class="modal_Title">${meal ? "Modifier un repas" : "Ajouter un repas"}</h2>
            <div class="input_meal">
                <div class="input_mealDate">
                    <h7 class="modal_SubTitle">Date du repas</h7>
                    <input type="date" id="mealDateInput" value="${meal?.mealDate || today}" required />
                </div>
                <div class="input_mealType">
                    <h7 class="modal_SubTitle">Type de repas</h7>
                    <select id="mealTypeInput" required>
                        <option value="" disabled ${meal ? "" : "selected"}>Sélectionnez...</option>
                        ${mealTypes
                            .map(
                                (type, index) =>
                                    `<option value="${index}" ${
                                        index === mealTypeIndex ? "selected" : ""
                                    }>${type}</option>`
                            )
                            .join("")}
                    </select>
                </div>
                <div class="input_mealPortions">
                    <h7 class="modal_SubTitle">Portions</h7> 
                    <div class="portion-control">
                        <div class="portion-control__decrement minus">
                            <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                                <path class="icon-fill" d="M3 12H21" stroke="#3f3735" stroke-width="2" stroke-linecap="round"></path>
                            </svg>
                        </div>
                        <div class="portion-control__value_container">
                            <input type="text" inputmode="decimal" id="portion-input" class="portion-control__value_number" value="${mealPortion}">
                            <span class="portion-control__unit">portions</span>
                        </div>
                        <div class="portion-control__increment plus">
                            <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                                <path class="icon-fill" d="M12 3V21" stroke="#3f3735" stroke-width="2" stroke-linecap="round"></path>
                                <path class="icon-fill" d="M3 12H21" stroke="#3f3735" stroke-width="2" stroke-linecap="round"></path>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
            <div class="input_menu">
                <h3 class="modal_SubTitle">Menu avec ...</h3>
                <div id="menuCategories" class="input_menuCategories"></div>
            </div>
            <div class="modal_buttons">
                <button class="primary-button" id="validateMeal">${meal ? "Modifier" : "Ajouter"}</button>
                ${
                    meal
                        ? '<button class="primary-button danger-button" id="deleteMeal">Supprimer</button>'
                        : ""
                }
                <button class="secondary-button" id="closeMealModal">Annuler</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const mealTypeInput = document.getElementById("mealTypeInput");
    const menuCategories = document.getElementById("menuCategories");
    const modalTitle = document.querySelector(".modal_Title");

    // Mise à jour dynamique du titre
    function updateModalTitle() {
        const selectedTypeIndex = parseInt(mealTypeInput.value, 10);
        const selectedType = selectedTypeIndex >= 0 ? mealTypes[selectedTypeIndex] : null;
        modalTitle.textContent = meal
            ? `Modifier ${selectedType || "un repas"}`
            : `Ajouter ${selectedType || "un repas"}`;
    }

    function updateCategories(meal) {
        const selectedTypeIndex = parseInt(mealTypeInput.value, 10);
        const selectedType = mealTypes[selectedTypeIndex];
        const categories = categoryMenus[selectedType] || [];
    
        menuCategories.innerHTML = categories
            .map((category, index) => {
                const isActive = meal?.menu.some((menuItem) => menuItem.categoryMenu === category && menuItem.activCategory);
                const recipesHTML = meal
                    ? meal.menu
                          .filter((menuItem) => menuItem.categoryMenu === category)
                          .flatMap((menuItem) =>
                              menuItem.recipes.map((recipe) => {
                                  const ingredientsData = recipe.ingredients
                                      ? JSON.stringify(recipe.ingredients.map((ingredient) => ({
                                            "record-id": ingredient.recordId,
                                            qté: ingredient.quantity,
                                        })))
                                      : null;
    
                                  // Récupération de la portion base
                                  const portionBase = recipe.portionBase || 1;
    
                                  return `
                                    <div class="recipeInput" id="${recipe.recipeId}" 
                                        ${ingredientsData ? `data-ref-ingrédient-RecordId-Qt='${ingredientsData}'` : ""}
                                        data-ref-portion-base="${portionBase}">
                                        <div class="recipe">
                                            <p>${recipe.recipeName}</p>
                                            <div class="portion-control">
                                                <div class="portion-control__decrement minus">
                                                    <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15">
                                                        <path class="icon-fill" d="M3 12H21" stroke="#3f3735" stroke-width="2" stroke-linecap="round"></path>
                                                    </svg>
                                                </div>
                                                <div class="portion-control__value_container">
                                                    <input type="text" inputmode="decimal" class="portion-control__value_number" value="${recipe.recipePortion}" />
                                                    <span class="portion-control__unit">portions</span>
                                                </div>
                                                <div class="portion-control__increment plus">
                                                    <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15">
                                                        <path class="icon-fill" d="M12 3V21" stroke="#3f3735" stroke-width="2" stroke-linecap="round"></path>
                                                        <path class="icon-fill" d="M3 12H21" stroke="#3f3735" stroke-width="2" stroke-linecap="round"></path>
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                        <button class="remove_recipeInput">×</button>
                                    </div>
                                `;
                              })
                          )
                          .join("")
                    : "";
    
                return `
                <div class="input_menuCategorie" value="${category}" data-index="${index}">
                    <label>
                        <input type="checkbox" class="categoryCheckbox" data-index="${index}" ${isActive ? "checked" : ""} />
                        <h4>${category}</h4>
                    </label>
                    <div class="menuCategorie_inputs" style="${isActive ? "display: block;" : "display: none;"}">
                        <div class="menuCategorie_recipesInputs">
                            <div class="menuCategorie_recipeInput">
                                ${recipesHTML}
                            </div>
                        </div>
                    </div>
                    <div class="menuCategorie_inputsButtons" style="${isActive ? "display: flex;" : "display: none;"}">
                        <button class="menuCategorie_recipeInput_button">Ajouter recette</button>
                        <button class="menuCategorie_ingredientInput_button">Ajouter ingrédient</button>
                    </div>
                </div>`;
            })
            .join("");
    
        // Gestion des changements d'état des catégories
        document.querySelectorAll(".categoryCheckbox").forEach((checkbox) => {
            checkbox.addEventListener("change", (event) => {
                const parent = event.target.closest(".input_menuCategorie");
                const inputs = parent.querySelector(".menuCategorie_inputs");
                const buttons = parent.querySelector(".menuCategorie_inputsButtons");
    
                if (event.target.checked) {
                    inputs.style.display = "block";
                    buttons.style.display = "flex";
                } else {
                    inputs.style.display = "none";
                    buttons.style.display = "none";
                }
            });
        });
    }
    

    updateCategories(meal);
    updateModalTitle();
    mealTypeInput.addEventListener("change", () => {
        updateCategories(meal);
        updateModalTitle();
    });

    document.getElementById("validateMeal").addEventListener("click", () => {
        if (meal) {
            updateMeal(eventIndex, mealIndex);
        } else {
            validateMeal(eventIndex);
        }
    });

    if (meal) {
        document.getElementById("deleteMeal").addEventListener("click", () => {
            deleteMeal(eventIndex, mealIndex);
        });
    }

    document.getElementById("closeMealModal").addEventListener("click", closeMealModal);
}






function updateMeal(eventIndex, mealIndex) {
    const user = netlifyIdentity.currentUser();
    const events = user?.user_metadata.events || [];
    const event = events[eventIndex];
    const meal = event.meal[mealIndex];

    const mealDateInput = document.getElementById("mealDateInput");
    const mealTypeInput = document.getElementById("mealTypeInput");
    const globalPortionInput = document.querySelector(".input_mealPortions #portion-input");

    meal.mealDate = mealDateInput.value;
    meal.mealType = mealTypes[parseInt(mealTypeInput.value, 10)];
    meal.mealPortion = parseInt(globalPortionInput.value, 10);

    // Mettre à jour les catégories et recettes
    const selectedCategories = [...document.querySelectorAll("#menuCategories .input_menuCategorie")];
    meal.menu = selectedCategories.map((categoryElement) => {
        const categoryName = categoryElement.getAttribute("value");
        const isActive = categoryElement.querySelector("input[type='checkbox']").checked;

        const recipes = [...categoryElement.querySelectorAll(".recipeInput")].map((recipeDiv) => {
            const recipeId = recipeDiv.id;
            const recipeName = recipeDiv.querySelector("p").textContent;
            const recipePortion = parseInt(recipeDiv.querySelector("input").value, 10);
            
            // Récupérer `data-ref-portion-base`
            const portionBaseAttr = recipeDiv.getAttribute("data-ref-portion-base");
            const portionBase = portionBaseAttr ? parseFloat(portionBaseAttr) : 1;

            // Récupérer les ingrédients
            let recipeIngredients = [];
            const ingredientData = recipeDiv.getAttribute("data-ref-ingrédient-RecordId-Qt");
            if (ingredientData) {
                try {
                    const decodedData = JSON.parse(ingredientData);
                    recipeIngredients = decodedData.map((ingredient) => ({
                        recordId: ingredient["record-id"],
                        quantity: ingredient["qté"],
                    }));
                } catch (error) {
                    console.error(`Erreur de parsing JSON pour les ingrédients de la recette ${recipeId} :`, error);
                }
            }

            return {
                recipeId: recipeId,
                recipeName: recipeName,
                recipePortion: recipePortion,
                portionBase: portionBase, // Inclure la portion de base
                ingredients: recipeIngredients,
            };
        });

        return {
            categoryMenu: categoryName,
            activCategory: isActive,
            recipes: recipes,
        };
    });

    user.update({
        data: {
            events: events,
        },
    })
        .then((updatedUser) => {
            console.log("Repas mis à jour avec succès :", updatedUser.user_metadata.events[eventIndex].meal[mealIndex]);
            closeMealModal();
            displayUserEvents();
        })
        .catch((error) => {
            console.error("Erreur lors de la mise à jour du repas :", error);
        });
}


// Fonction pour supprimer un repas
function deleteMeal(eventIndex, mealIndex) {
    const user = netlifyIdentity.currentUser();
    const events = user?.user_metadata.events || [];
    if (events[eventIndex]?.meal) {
        events[eventIndex].meal.splice(mealIndex, 1);
        user.update({ data: { events } })
            .then(() => {
                console.log("Repas supprimé avec succès.");
                closeMealModal();
                displayUserEvents();

            })
            .catch((error) => console.error("Erreur lors de la suppression :", error));
    }
}


// Fonction pour ouvrir le modal des recettes
function openRecipeModal(category, menuCategorieRecipeInput) {
    // Créer un modal en plein écran
    const modal = document.createElement("div");
    modal.className = "modal-fullscreen";
    modal.innerHTML = `
        <div class="modal-content">
            <h2 class="modal_Title">Ajouter ${category}</h2>
            <button class="modal-close-button">×</button>
            <div id="recettes-list" class="recettes-list"></div>
        </div>
    `;

    // Ajouter le modal au body
    document.body.appendChild(modal);

    // Charger le fichier /dist/recettes.html et filtrer les recettes
    fetch("/dist/recettes.html")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Erreur lors du chargement des recettes.");
            }
            return response.text();
        })
        .then((html) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const recettes = doc.querySelectorAll("a[data-ref-categorie]");

            // Filtrer les recettes par catégorie
            const filteredRecettes = Array.from(recettes).filter((recette) => {
                const categories = recette
                    .getAttribute("data-ref-categorie")
                    .split(",")
                    .map((cat) => decodeURIComponent(cat.trim())); // Décoder les catégories
                return categories.includes(category); // Vérifier si la catégorie correspond
            });

            // Ajouter les recettes filtrées au modal
            const recettesList = document.getElementById("recettes-list");
            if (filteredRecettes.length === 0) {
                recettesList.innerHTML = `<p>Aucune recette trouvée pour la catégorie "${category}".</p>`;
            } else {
                filteredRecettes.forEach((recette) => {
                    const recipeClone = recette.cloneNode(true);

                    // Bloquer le clic par défaut
                    recipeClone.addEventListener("click", (event) => {
                        event.preventDefault();

                        const recipeId = recette.getAttribute("id");
                        const recipeTitle = recette.getAttribute("data-ref-titre");

                        // Vérifier si la recette est déjà ajoutée
                        if (menuCategorieRecipeInput.querySelector(`#${CSS.escape(recipeId)}`)) {
                            alert(`La recette "${recipeTitle}" est déjà ajoutée.`);
                            return;
                        }

                        // Ajouter une nouvelle div pour la recette
                        const recipeDiv = document.createElement("div");
                        recipeDiv.className = "recipeInput";
                        recipeDiv.id = recipeId;

                        // Ajouter data-ref-ingrédient-RecordId-Qt
                        const ingredientData = recette.getAttribute("data-ref-ingrédient-RecordId-Qt");
                        if (ingredientData) {
                            recipeDiv.setAttribute("data-ref-ingrédient-RecordId-Qt", ingredientData);
                        } else {
                            console.warn(`Aucune donnée d'ingrédient trouvée pour la recette ${recipeId}`);
                        }

                        // Ajouter data-ref-portion-base
                        const portionBase = recette.getAttribute("data-ref-portion-base");
                        if (portionBase) {
                            recipeDiv.setAttribute("data-ref-portion-base", portionBase);
                        } else {
                            console.warn(`Aucune donnée de portion base trouvée pour la recette ${recipeId}`);
                        }

                        // Récupérer la valeur actuelle du champ des portions globales
                        const globalPortionsInput = document.getElementById("portion-input");
                        const globalPortionsValue = globalPortionsInput ? globalPortionsInput.value : "1";

                        recipeDiv.innerHTML = `
                            <div class="recipe">
                                <p class="recipeTitle">${recipeTitle}</p>
                                <div class="portion-control">
                                    <div class="portion-control__decrement minus">
                                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15">
                                            <path class="icon-fill" d="M3 12H21" stroke="#3f3735" stroke-width="2" stroke-linecap="round"></path>
                                        </svg>
                                    </div>
                                    <div class="portion-control__value_container">
                                        <div class="portion-control__value">
                                            <input type="text" inputmode="decimal" class="portion-control__value_number" value="${globalPortionsValue}">
                                            <span class="portion-control__unit">portions</span>
                                        </div>
                                    </div>
                                    <div class="portion-control__increment plus">
                                        <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15">
                                            <path class="icon-fill" d="M12 3V21" stroke="#3f3735" stroke-width="2" stroke-linecap="round"></path>
                                            <path class="icon-fill" d="M3 12H21" stroke="#3f3735" stroke-width="2" stroke-linecap="round"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <button class="remove_recipeInput">×</button>
                        `;

                        // Ajouter la recette à la section correspondante
                        menuCategorieRecipeInput.appendChild(recipeDiv);

                        // Gérer la suppression de la recette
                        recipeDiv
                            .querySelector(".remove_recipeInput")
                            .addEventListener("click", () => {
                                recipeDiv.remove();
                            });

                        // Fermer le modal
                        modal.remove();
                    });

                    recettesList.appendChild(recipeClone);
                });
            }
        })
        .catch((error) => {
            console.error(error);
            const recettesList = document.getElementById("recettes-list");
            recettesList.innerHTML = `<p>Erreur lors du chargement des recettes. Veuillez réessayer plus tard.</p>`;
        });

    // Fermer le modal lorsqu'on clique sur le bouton de fermeture
    modal.querySelector(".modal-close-button").addEventListener("click", () => {
        modal.remove();
    });
}



// Gestionnaire pour ouvrir le modal des recettes
document.addEventListener("click", (event) => {
    // Vérifier si le clic vient d'un bouton avec la classe 'menuCategorie_recipeInput_button'
    const recipeButton = event.target.closest(".menuCategorie_recipeInput_button");
    if (recipeButton) {
        // Trouver l'élément parent représentant la catégorie
        const categoryElement = recipeButton.closest(".input_menuCategorie");

        // Récupérer la valeur de la catégorie
        const category = categoryElement ? categoryElement.getAttribute("value") : null;

        // Trouver la div pour ajouter les recettes sélectionnées
        const menuCategorieRecipeInput = categoryElement.querySelector(
            ".menuCategorie_recipesInputs .menuCategorie_recipeInput"
        );

        if (category && menuCategorieRecipeInput) {
            // Appeler le modal avec la catégorie et l'élément cible pour ajouter les recettes
            openRecipeModal(category, menuCategorieRecipeInput);
        } else {
            // Gérer les erreurs si la catégorie ou la cible ne peut pas être déterminée
            console.error("Impossible d'ouvrir le modal : catégorie ou conteneur introuvable.");
        }
    }
});




// Fonction pour fermer le modal
function closeMealModal() {
    const modal = document.querySelector(".modal-overlay");
    if (modal) modal.remove();
}

// Fonction pour valider et ajouter un repas
function validateMeal(eventIndex) {
    const mealDateInput = document.getElementById("mealDateInput");
    const mealTypeInput = document.getElementById("mealTypeInput");
    const globalPortionInput = document.querySelector(".input_mealPortions #portion-input");
    const selectedCategories = [...document.querySelectorAll("#menuCategories .input_menuCategorie")];

    const mealDate = mealDateInput ? mealDateInput.value : "";
    const mealTypeIndex = mealTypeInput ? parseInt(mealTypeInput.value, 10) : null;
    const mealType = mealTypeIndex !== null ? mealTypes[mealTypeIndex] : "";
    const mealPortion = globalPortionInput ? parseInt(globalPortionInput.value, 10) || 1 : 1;

    if (!mealDate || mealTypeIndex === null || isNaN(mealTypeIndex)) {
        alert("Veuillez entrer une date et sélectionner un type de repas.");
        return;
    }

    // Construction du tableau des recettes
    const recipes = selectedCategories.flatMap((categoryElement) => {
        const recipeInputs = [...categoryElement.querySelectorAll(".recipeInput")];

        return recipeInputs.map((recipeDiv) => {
            const recipeId = recipeDiv.id; // ID de la recette
            const recipeName = recipeDiv.querySelector("p").textContent; // Nom de la recette
            const recipePortionInput = recipeDiv.querySelector(".portion-control__value_number");
            const recipePortion = recipePortionInput ? parseInt(recipePortionInput.value, 10) || 1 : 1;

            // Récupérer les ingrédients depuis `data-ref-ingrédient-RecordId-Qt`
            let recipeIngredients = [];
            const ingredientData = recipeDiv.getAttribute("data-ref-ingrédient-RecordId-Qt");
            console.log("Attribut data-ref-ingrédient-RecordId-Qt pour la recette :", recipeDiv.id, ingredientData);

            if (ingredientData) {
                try {
                    // Décoder et parser les données JSON
                    const decodedData = JSON.parse(ingredientData);
                    console.log("Données JSON des ingrédients :", decodedData);

                    recipeIngredients = decodedData.map((ingredient) => ({
                        recordId: ingredient["record-id"],
                        quantity: ingredient["qté"],
                    }));
                } catch (error) {
                    console.error(`Erreur de parsing JSON pour les ingrédients de la recette ${recipeId} :`, error);
                }
            }

            // Récupérer `data-ref-portion-base`
            const portionBaseAttr = recipeDiv.getAttribute("data-ref-portion-base");
            const portionBase = portionBaseAttr ? parseFloat(portionBaseAttr) : 1;

            return {
                recipeId: recipeId,
                recipeName: recipeName,
                recipePortion: recipePortion,
                portionBase: portionBase, // Inclure la portion de base
                ingredients: recipeIngredients, // Ajout des ingrédients extraits et parsés
            };
        });
    });

    console.log("Recettes extraites :", recipes);

    // Ajouter le repas dans le menu
    const menu = selectedCategories.map((categoryElement) => {
        const categoryName = categoryElement.getAttribute("value");
        const isActive = categoryElement.querySelector("input[type='checkbox']").checked;

        const recipes = [...categoryElement.querySelectorAll(".recipeInput")].map((recipeDiv) => {
            const recipeId = recipeDiv.id;
            const recipeName = recipeDiv.querySelector("p").textContent;
            const recipePortion = parseInt(recipeDiv.querySelector("input").value, 10);

            // Récupérer `data-ref-portion-base`
            const portionBaseAttr = recipeDiv.getAttribute("data-ref-portion-base");
            const portionBase = portionBaseAttr ? parseFloat(portionBaseAttr) : 1;

            // Récupérer les ingrédients
            let recipeIngredients = [];
            const ingredientData = recipeDiv.getAttribute("data-ref-ingrédient-RecordId-Qt");
            if (ingredientData) {
                try {
                    const decodedData = JSON.parse(ingredientData);
                    recipeIngredients = decodedData.map((ingredient) => ({
                        recordId: ingredient["record-id"],
                        quantity: ingredient["qté"],
                    }));
                } catch (error) {
                    console.error(`Erreur de parsing JSON pour les ingrédients de la recette ${recipeId} :`, error);
                }
            }

            return {
                recipeId: recipeId,
                recipeName: recipeName,
                recipePortion: recipePortion,
                portionBase: portionBase, // Inclure la portion de base
                ingredients: recipeIngredients,
            };
        });

        return {
            categoryMenu: categoryName,
            activCategory: isActive,
            recipes: recipes,
        };
    });

    console.log("Menu à sauvegarder :", menu);

    // Récupérer l'utilisateur actuel
    const user = netlifyIdentity.currentUser();

    if (user) {
        // Récupérer les événements actuels
        const events = user.user_metadata.events || [];
        const targetEvent = events[eventIndex];

        if (targetEvent) {
            // Ajouter le nouveau repas à l'événement
            const newMeal = {
                mealDate: mealDate,
                mealType: mealType,
                mealPortion: mealPortion,
                menu: menu,
            };

            targetEvent.meal = targetEvent.meal || [];
            targetEvent.meal.push(newMeal);

            // Mettre à jour les métadonnées utilisateur
            user.update({
                data: {
                    events: events,
                },
            })
                .then((updatedUser) => {
                    console.log(
                        "Repas ajouté avec succès :",
                        updatedUser.user_metadata.events[eventIndex].meal
                    );
                    closeMealModal(); // Fermer le modal après validation
                    displayUserEvents(); // Actualiser la liste des événements et repas

                })
                .catch((error) => {
                    console.error("Erreur lors de l'ajout du repas :", error);
                });
        } else {
            console.error("Événement introuvable.");
        }
    } else {
        alert("Utilisateur non connecté. Veuillez vous connecter pour ajouter un repas.");
    }
}












// Fonction pour mettre à jour les portions via boutons incrémentation/décrémentation
function updatePortions(button, increment) {
    // Trouver le conteneur parent pour cibler l'input associé
    const portionControl = button.closest('.portion-control');
    if (portionControl) {
        const portionInput = portionControl.querySelector('.portion-control__value_number');
        if (portionInput) {
            // Convertir la valeur actuelle en nombre
            let currentValue = parseInt(portionInput.value, 10) || 0;

            // Ajouter ou soustraire selon l'incrément
            currentValue += increment;

            // Empêcher des valeurs négatives
            if (currentValue < 1) currentValue = 1;

            // Mettre à jour la valeur de l'input
            portionInput.value = currentValue;

            // Si c'est l'input global, synchroniser toutes les recettes
            if (portionInput.id === "portion-input") {
                synchronizeGlobalPortions();
            }
        }
    }
}

// Gestionnaire global pour les boutons d'incrémentation/décrémentation
document.addEventListener('click', (event) => {
    // Bouton de décrémentation
    if (event.target.closest('.minus')) {
        const button = event.target.closest('.minus');
        updatePortions(button, -1);
    }

    // Bouton d'incrémentation
    if (event.target.closest('.plus')) {
        const button = event.target.closest('.plus');
        updatePortions(button, 1);
    }
});

// Fonction pour synchroniser les portions globales avec toutes les recettes existantes
function synchronizeGlobalPortions() {
    // Récupérer la valeur actuelle de l'input global
    const globalPortionsInput = document.getElementById("portion-input");
    const globalPortionsValue = globalPortionsInput ? parseInt(globalPortionsInput.value, 10) || 1 : 1;

    // Sélectionner tous les inputs de portions des recettes
    const recipePortionInputs = document.querySelectorAll(".recipeInput .portion-control__value_number");

    // Mettre à jour chaque input de portion de recette avec la valeur globale
    recipePortionInputs.forEach((input) => {
        input.value = globalPortionsValue;
    });
}





function addIngredientsToShoppingList(eventIndex) {
    const user = netlifyIdentity.currentUser();
    if (!user) {
        alert("Veuillez vous connecter pour ajouter des ingrédients à la liste de courses.");
        return;
    }

    const events = user.user_metadata.events || [];
    const targetEvent = events[eventIndex];

    if (!targetEvent) {
        console.error("Événement introuvable.");
        return;
    }

    // Récupérer ou initialiser la liste de courses
    let shoppingList = user.user_metadata.liste_de_courses || [];

    // Parcourir les recettes de l'événement
    targetEvent.meal?.forEach((meal) => {
        meal.menu?.forEach((menuCategory) => {
            menuCategory.recipes?.forEach((recipe) => {
                recipe.ingredients?.forEach((ingredient) => {
                    const recordId = ingredient.recordId;
                    const ingredientQuantity =
                        (ingredient.quantity * recipe.recipePortion) / recipe.portionBase;

                    // Vérifier si l'ingrédient existe déjà dans la liste de courses
                    const existingIngredient = shoppingList.find((item) => item.recordId === recordId);

                    if (existingIngredient) {
                        // Ajouter la quantité à l'ingrédient existant
                        existingIngredient.quantity += ingredientQuantity;
                    } else {
                        // Ajouter un nouvel ingrédient
                        shoppingList.push({
                            recordId: recordId,
                            quantity: ingredientQuantity,
                        });
                    }
                });
            });
        });
    });

    // Sauvegarder la liste mise à jour dans user_metadata
    user.update({
        data: {
            ...user.user_metadata,
            liste_de_courses: shoppingList,
        },
    })
        .then((updatedUser) => {
            console.log("Liste de courses mise à jour avec succès :", updatedUser.user_metadata.liste_de_courses);
            alert("Les ingrédients ont été ajoutés à votre liste de courses !");
        })
        .catch((error) => {
            console.error("Erreur lors de la mise à jour de la liste de courses :", error);
        });
}
