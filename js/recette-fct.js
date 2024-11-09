document.addEventListener("DOMContentLoaded", function() {
    const ingredientDataContainer = document.getElementById("ingredientDataContainer");

    if (ingredientDataContainer) {
        const ingredientData = ingredientDataContainer.getAttribute("data-ingredients");
        if (ingredientData) {
            const originalIngredients = JSON.parse(ingredientData);
            initializeIngredientStyles(originalIngredients);
            updateIngredients(originalIngredients);
        }
    }

    // Ajouter les écouteurs pour les boutons d'incrémentation, de décrémentation et de réinitialisation
    document.querySelector('.portion-control__increment.plus')?.addEventListener('click', () => updatePortions(1));
    document.querySelector('.portion-control__decrement.minus')?.addEventListener('click', () => updatePortions(-1));
    document.getElementById("reset-portion")?.addEventListener("click", resetPortion);

    document.getElementById("portion-input").addEventListener("input", handlePortionInput);
});

// Fonction pour gérer la saisie dans le champ des portions
function handlePortionInput() {
    this.value = this.value.replace(/[^0-9,]/g, '');
    if (this.value !== "") {
        let newValue = parseFloat(this.value.replace(',', '.'));
        this.value = convertPointToComma(Number.isInteger(newValue) ? newValue : newValue.toFixed(2));
        adjustPortionInputStyle();
        updateIngredients(originalIngredients);
    }
}

// Fonction de mise à jour des portions
function updatePortions(delta) {
    const input = document.getElementById("portion-input");
    let currentValue = parseFloat(input.value.replace(',', '.'));

    if (currentValue + delta > 0) {
        let newValue = currentValue + delta;
        input.value = convertPointToComma(newValue);
        adjustPortionInputStyle();
        updateIngredients(originalIngredients);
    }
}

// Fonction de mise à jour des ingrédients
function updateIngredients(originalIngredients) {
    const input = document.getElementById("portion-input");
    let portionValue = parseFloat(input.value.replace(',', '.'));

    // Mise à jour des attributs Bring
    const bringContainer = document.getElementById("bring-import-container");
    if (bringContainer) {
        bringContainer.setAttribute("data-bring-base-quantity", portionValue);
        bringContainer.setAttribute("data-bring-requested-quantity", portionValue);
    }

    // Mise à jour des quantités des ingrédients
    originalIngredients.forEach(ingredient => {
        let newQuantite = ingredient.quantite ? (ingredient.quantite * portionValue / 6).toFixed(2) : '';
        newQuantite = convertPointToComma(newQuantite);

        const ingredientElements = document.querySelectorAll(`#ingredient-${ingredient.ordernb}`);
        ingredientElements.forEach(ingredientSpan => {
            const quantityInput = ingredientSpan.querySelector(".highlight-quantity input");
            if (quantityInput) {
                quantityInput.value = newQuantite;
                adjustInputWidth(quantityInput);
            }
        });
    });
}

// Ajuste le style de l'input pour les portions
function adjustPortionInputStyle() {
    const input = document.getElementById("portion-input");
    input.style.width = ((input.value.length + 1) * 0.5) + "em";
    input.style.textAlign = "center";
    input.style.border = "none";
    input.style.outline = "none";
}

// Ajuste la largeur d'un champ input
function adjustInputWidth(input) {
    input.style.width = ((input.value.length + 1) * 0.5) + "em";
    input.style.textAlign = "center";
    input.style.border = "none";
}

// Initialise les styles des ingrédients
function initializeIngredientStyles(originalIngredients) {
    originalIngredients.forEach(ingredient => {
        const ingredientElements = document.querySelectorAll(`#ingredient-${ingredient.ordernb}`);
        ingredientElements.forEach(ingredientSpan => {
            const quantityInput = ingredientSpan.querySelector(".highlight-quantity input");
            if (quantityInput) {
                adjustInputWidth(quantityInput);
                quantityInput.style.backgroundColor = "transparent";
                quantityInput.style.border = "none";
                quantityInput.style.textAlign = "center";
            }
        });
    });

    document.querySelectorAll(".card-ingredient").forEach(card => {
        const input = card.querySelector(".highlight-quantity input");
        if (input) {
            input.style.backgroundColor = "transparent";

            card.addEventListener("mouseover", () => {
                input.style.border = "1px solid #ccc";
                input.style.backgroundColor = "white";
            });
            card.addEventListener("mouseout", () => {
                input.style.border = "1px solid transparent";
                input.style.backgroundColor = "transparent";
            });
            card.addEventListener("click", () => {
                input.focus();
                input.select();
            });

            input.addEventListener("blur", function() {
                const ingredientId = parseInt(this.closest("[id^='ingredient-']").id.replace("ingredient-", ""), 10);
                const ingredient = originalIngredients.find(ing => ing.ordernb === ingredientId);
                if (ingredient) {
                    const newPortionValue = (parseFloat(this.value.replace(',', '.')) / ingredient.quantite) * 6;
                    document.getElementById("portion-input").value = convertPointToComma(Number.isInteger(newPortionValue) ? newPortionValue : newPortionValue.toFixed(2));
                    updateIngredients(originalIngredients);
                    adjustPortionInputStyle();
                }
            });

            input.addEventListener("keydown", e => e.key === "Enter" && input.blur());
            input.addEventListener("input", () => adjustInputWidth(input));
            adjustInputWidth(input);
        }
    });
}

// Fonction de réinitialisation des portions
function resetPortion() {
    const input = document.getElementById("portion-input");
    const initialValue = input.getAttribute("value");
    input.value = initialValue;
    adjustPortionInputStyle();
    updateIngredients(originalIngredients);
}

// Conversion du point en virgule
function convertPointToComma(value) {
    if (typeof value === 'number') value = value.toString();
    return value.replace('.', ',');
}
