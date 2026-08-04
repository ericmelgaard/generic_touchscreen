"use strict";

var NUTRITION_MODAL_ROOT_ID = "nutrition-modal-root";
var NUTRITION_MODAL_TEMPLATE = `
    <div id="item-modal" class="modal" role="dialog" aria-labelledby="modal-title" aria-modal="true" hidden>
        <div class="modal-overlay"></div>
        <div class="modal-container">
            <div class="modal-header">
                <h2 id="modal-title" class="modal-title">{{title}}</h2>
                <button id="modal-close" class="icon-button" aria-label="Close">
                    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>
            <div class="modal-content">
                <div class="modal-meta">
                    <div class="item-quick-info">
                        {{#showPrice}}<span class="item-price">{{price}}</span>{{/showPrice}}
                        {{#showCaloriesSummary}}<span class="item-calories">{{caloriesSummary}}</span>{{/showCaloriesSummary}}
                        {{#showServing}}<span class="item-serving">{{serving}}</span>{{/showServing}}
                    </div>
                    {{#showIcons}}
                    <div id="modal-icons" class="item-icons">
                        {{#icons}}
                        <img src="{{src}}" alt="{{alt}}" class="diet-icon diet-icon-fallback-url" data-fallback-url="{{fallbackUrl}}" data-fallback-tried="{{fallbackTried}}" />
                        {{/icons}}
                    </div>
                    {{/showIcons}}
                </div>

                {{#showDescription}}<p class="item-description">{{description}}</p>{{/showDescription}}

                <section class="item-section">
                    <h3 class="section-title">Ingredients</h3>
                    <p class="ingredients-list">{{ingredients}}</p>
                </section>

                {{#showAllergens}}
                <section class="item-section" id="allergens-section">
                    <h3 class="section-title">Allergens</h3>
                    <p class="allergens-list">{{allergens}}</p>
                </section>
                {{/showAllergens}}

                <section class="item-section">
                    <h3 class="section-title">Nutrition Facts</h3>
                    <div class="nutrition-label">
                        <div class="nutrition-header">
                            <div class="nutrition-title-group">
                                <h4 class="nutrition-title">Nutrition Facts</h4>
                                <p class="nutrition-serving"><span class="serving-label">Serving Size</span> <span>{{serving}}</span></p>
                            </div>
                        </div>
                        <div class="nutrition-divider thick"></div>

                        <div class="nutrition-row major">
                            <span class="nutrition-label-text">Calories</span>
                            <span class="nutrition-value bold">{{nutritionCalories}}</span>
                        </div>
                        <div class="nutrition-divider"></div>

                        <div class="nutrition-row daily-value-header">
                            <span></span>
                            <span class="nutrition-value bold">% Daily Value*</span>
                        </div>

                        {{#mainRows}}
                        <div class="nutrition-divider thin"></div>
                        <div class="nutrition-row{{#rowClass}} {{rowClass}}{{/rowClass}}">
                            <span class="nutrition-label-text">{{{labelHtml}}} <span>{{value}}</span>{{unit}}</span>
                            <span class="nutrition-value{{#dailyValueClass}} {{dailyValueClass}}{{/dailyValueClass}}">{{#showDailyValue}}<span>{{dailyValue}}</span>%{{/showDailyValue}}</span>
                        </div>
                        {{/mainRows}}

                        <div class="nutrition-divider thick"></div>

                        {{#micronutrientRows}}
                        <div class="nutrition-row micronutrient">
                            <span class="nutrition-label-text">{{label}} <span>{{value}}</span>{{unit}}</span>
                            <span class="nutrition-value"><span>{{dailyValue}}</span>%</span>
                        </div>
                        {{#showDividerAfter}}<div class="nutrition-divider thin"></div>{{/showDividerAfter}}
                        {{/micronutrientRows}}

                        {{#optionalRows}}
                        <div class="nutrition-divider thin"></div>
                        <div class="nutrition-row {{rowClass}}">
                            <span class="nutrition-label-text">{{label}} <span>{{value}}</span>{{unit}}</span>
                            <span class="nutrition-value{{#dailyValueClass}} {{dailyValueClass}}{{/dailyValueClass}}"><span>{{dailyValue}}</span>%</span>
                        </div>
                        {{/optionalRows}}

                        <div class="nutrition-divider thick"></div>

                        <div class="nutrition-footnote">
                            * Percent Daily Values are based on a 2,000 calorie diet. Your daily values may be higher or lower depending on your calorie needs.
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </div>
`;

function ensureNutritionModalRoot() {
    if (!document.getElementById(NUTRITION_MODAL_ROOT_ID)) {
        document.body.insertAdjacentHTML("beforeend", '<div id="' + NUTRITION_MODAL_ROOT_ID + '"></div>');
    }

    return $("#" + NUTRITION_MODAL_ROOT_ID);
}

function createNutrientMap(nutrients) {
    var nutrientMap = {};

    (nutrients || []).forEach(function (nutrient) {
        if (nutrient && nutrient.name) {
            nutrientMap[nutrient.name.toLowerCase()] = nutrient;
        }
    });

    return nutrientMap;
}

function getNutrientByNames(nutrientMap, names) {
    var nameList = Array.isArray(names) ? names : [names];

    for (var i = 0; i < nameList.length; i++) {
        var nutrient = nutrientMap[nameList[i].toLowerCase()];
        if (nutrient) {
            return nutrient;
        }
    }

    return null;
}

function getNutrientValue(nutrient) {
    if (!nutrient || nutrient.value === undefined || nutrient.value === null || nutrient.value === "-") {
        return "0";
    }

    return String(nutrient.value);
}

function getDailyValue(nutrient) {
    if (!nutrient || !nutrient.dailyValuePercentage) {
        return "0";
    }

    return String(nutrient.dailyValuePercentage).replace("%", "");
}

function buildIconViewModel(icons) {
    return (icons || []).map(function (icon) {
        var primaryUrl = String(icon.fileURL || "").trim();
        var fallbackUrl = String(icon.url || icon.iconUrl || icon.iconURL || "").trim();

        if (!primaryUrl && !fallbackUrl) {
            return null;
        }

        return {
            src: primaryUrl || fallbackUrl,
            alt: icon.name || "",
            fallbackUrl: fallbackUrl,
            fallbackTried: primaryUrl ? "" : "1"
        };
    }).filter(function (icon) {
        return Boolean(icon);
    });
}

function createNutritionRow(labelHtml, nutrient, options) {
    var rowOptions = options || {};

    return {
        labelHtml: labelHtml,
        value: getNutrientValue(nutrient),
        unit: rowOptions.unit || "",
        rowClass: rowOptions.rowClass || "",
        showDailyValue: Boolean(rowOptions.showDailyValue),
        dailyValue: rowOptions.showDailyValue ? getDailyValue(nutrient) : "",
        dailyValueClass: rowOptions.dailyValueClass || ""
    };
}

function createMicronutrientRow(label, nutrient, unit) {
    return {
        label: label,
        value: getNutrientValue(nutrient),
        unit: unit || "",
        dailyValue: getDailyValue(nutrient)
    };
}

function buildOptionalRows(nutrientMap) {
    var optionalDefinitions = [
        { names: ["Vitamin A (IU)", "Vitamin A (RE)", "Vitamin A"], label: "Vitamin A", rowClass: "micronutrient", dailyValueClass: "", unit: null },
        { names: ["Vitamin C (mg)", "Vitamin C"], label: "Vitamin C", rowClass: "micronutrient", dailyValueClass: "", unit: "mg" },
        { names: ["Added Sugars (g)", "Added Sugars"], label: "Added Sugars", rowClass: "indent", dailyValueClass: "bold", unit: "g" }
    ];

    return optionalDefinitions.map(function (definition) {
        var nutrient = getNutrientByNames(nutrientMap, definition.names);
        var value = getNutrientValue(nutrient);

        if (!nutrient || value === "0") {
            return null;
        }

        return {
            label: definition.label,
            value: value,
            unit: definition.unit === null ? (nutrient.unit || "") : definition.unit,
            rowClass: definition.rowClass,
            dailyValue: getDailyValue(nutrient),
            dailyValueClass: definition.dailyValueClass
        };
    }).filter(function (row) {
        return Boolean(row);
    });
}

function buildNutritionModalViewModel(itemData) {
    var nutrientMap = createNutrientMap(itemData.nutrients || []);
    var price = String(itemData.price == null ? "" : itemData.price).trim();
    var iconViewModel = buildIconViewModel(itemData.icons);
    var serving = itemData.portion || "";
    var calories = getNutrientByNames(nutrientMap, "Calories");
    var optionalRows = buildOptionalRows(nutrientMap);

    return {
        title: itemData.name || "",
        price: price,
        showPrice: Boolean(price) && price !== "$0.00" && price !== "0",
        caloriesSummary: itemData.calories ? itemData.calories + " cal" : "",
        showCaloriesSummary: Boolean(itemData.calories),
        serving: serving,
        showServing: Boolean(serving),
        showIcons: iconViewModel.length > 0,
        icons: iconViewModel,
        description: itemData.description || "",
        showDescription: Boolean(itemData.description),
        ingredients: itemData.ingredients || "Not available",
        allergens: itemData.allergens || "",
        showAllergens: Boolean(itemData.allergens),
        nutritionCalories: getNutrientValue(calories),
        mainRows: [
            createNutritionRow("<strong>Total Fat</strong>", getNutrientByNames(nutrientMap, "Total Fat (g)"), { unit: "g", showDailyValue: true, dailyValueClass: "bold" }),
            createNutritionRow("Saturated Fat", getNutrientByNames(nutrientMap, "Saturated Fat (g)"), { unit: "g", rowClass: "indent", showDailyValue: true, dailyValueClass: "bold" }),
            createNutritionRow("Trans Fat", getNutrientByNames(nutrientMap, "Trans Fat (g)"), { unit: "g", rowClass: "indent" }),
            createNutritionRow("<strong>Cholesterol</strong>", getNutrientByNames(nutrientMap, "Cholesterol (mg)"), { unit: "mg", showDailyValue: true, dailyValueClass: "bold" }),
            createNutritionRow("<strong>Sodium</strong>", getNutrientByNames(nutrientMap, "Sodium (mg)"), { unit: "mg", showDailyValue: true, dailyValueClass: "bold" }),
            createNutritionRow("<strong>Total Carbohydrate</strong>", getNutrientByNames(nutrientMap, "Total Carbohydrates (g)"), { unit: "g", showDailyValue: true, dailyValueClass: "bold" }),
            createNutritionRow("Dietary Fiber", getNutrientByNames(nutrientMap, "Dietary Fiber (g)"), { unit: "g", rowClass: "indent", showDailyValue: true, dailyValueClass: "bold" }),
            createNutritionRow("Total Sugars", getNutrientByNames(nutrientMap, "Sugars (g)"), { unit: "g", rowClass: "indent" }),
            createNutritionRow("<strong>Protein</strong>", getNutrientByNames(nutrientMap, "Protein (g)"), { unit: "g" })
        ],
        micronutrientRows: [
            createMicronutrientRow("Vitamin D", getNutrientByNames(nutrientMap, "Vitamin D (mcg)"), "mcg"),
            createMicronutrientRow("Calcium", getNutrientByNames(nutrientMap, "Calcium (mg)"), "mg"),
            createMicronutrientRow("Iron", getNutrientByNames(nutrientMap, "Iron (mg)"), "mg"),
            createMicronutrientRow("Potassium", getNutrientByNames(nutrientMap, "Potassium (mg)"), "mg")
        ].map(function (row, index, rows) {
            row.showDividerAfter = index < rows.length - 1 || optionalRows.length > 0;
            return row;
        }),
        optionalRows: optionalRows
    };
}

function bindNutritionIconFallback($modal) {
    $modal.find("#modal-icons img").off("error.nutritionFallback").on("error.nutritionFallback", function () {
        var fallbackUrl = this.getAttribute("data-fallback-url");
        var fallbackAlreadyTried = this.getAttribute("data-fallback-tried") === "1";
        var $iconsContainer = $modal.find("#modal-icons");

        if (fallbackAlreadyTried || !fallbackUrl) {
            this.style.display = "none";
            if ($iconsContainer.find("img:visible").length === 0) {
                $iconsContainer.hide();
            }
            return;
        }

        this.setAttribute("data-fallback-tried", "1");
        this.classList.add("diet-icon-fallback-url");
        this.src = fallbackUrl;
    });
}

function renderNutritionModal(itemData) {
    var $root = ensureNutritionModalRoot();
    var viewModel = buildNutritionModalViewModel(itemData);
    var modalHtml = Mustache.render(NUTRITION_MODAL_TEMPLATE, viewModel);

    $root.html(modalHtml);
    return $root.find("#item-modal");
}

function openNutritionModal(itemData) {
    var $modal = renderNutritionModal(itemData);

    console.log("Opening nutrition modal with data:", itemData);

    bindNutritionIconFallback($modal);

    $modal.removeAttr("hidden").fadeIn(300);

    if (typeof InactivityManager !== "undefined") {
        InactivityManager.extendForNutrition();
    }
}

function closeNutritionModal() {
    $("#item-modal").fadeOut(300, function () {
        $(this).attr("hidden", true);
    });

    if (typeof InactivityManager !== "undefined") {
        InactivityManager.reset();
    }
}

$(document).ready(function () {
    ensureNutritionModalRoot();

    $(document).off("click.nutritionClose", "#modal-close").on("click.nutritionClose", "#modal-close", closeNutritionModal);
    $(document).off("click.nutritionOverlay", "#item-modal .modal-overlay").on("click.nutritionOverlay", "#item-modal .modal-overlay", closeNutritionModal);
    $(document).off("keydown.nutritionModal").on("keydown.nutritionModal", function (e) {
        if (e.key === "Escape" && $("#item-modal:visible").length > 0) {
            closeNutritionModal();
        }
    });
});

function setupNutritionOverlayHandlers() {
    $(document).off("click.menuNutritionGlobal").on("click.menuNutritionGlobal", ".menu-item-wrapper", function (e) {
        if ($(e.target).closest(".goHome").length > 0) {
            return;
        }
        e.stopPropagation();
        var nutritionData = $(this).find(".item-wrapper").data("nutrition");
        if (nutritionData && typeof openNutritionModal === "function") {
            openNutritionModal(nutritionData);
        }
    });
}
