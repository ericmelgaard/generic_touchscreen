(function (window, $) {
    "use strict";

    var HOTSPOT_NAME_PREFIX = "hotspot-data-";
    var TEXT_ITEM_TYPE_ID = 1;
    var PORTAL_BATCH_URL = "/Trm.Portal/ApiServices/json/reply/MenuItemBatchEditRequest";
    var PORTAL_CREATE_URL = "/Trm.Portal/ApiServices/json/reply/InsertMenuItemRequest";
    var PORTAL_MENU_ITEMS_URL = "/Trm.Portal/ApiServices/json/reply/MenuItemCollectionRequest";
    var PORTAL_DETAILS_URL = "/Trm.Portal/ApiServices/json/reply/MenuItemDetailsRequest";
    var LEVEL_KEYS = {
        Concept: ["conceptKey"],
        Company: ["conceptKey", "companyKey"],
        Group: ["conceptKey", "companyKey", "groupKey"],
        Store: ["conceptKey", "companyKey", "groupKey", "storeKey"]
    };

    var state = {
        enabled: false,
        initialized: false,
        dataInitialized: false,
        parent: null,
        detail: null,
        ccgs: null,
        document: { version: 1, hotspots: [] },
        savedDocument: { version: 1, hotspots: [] },
        currentLayer: 1,
        editing: null,
        contextPoint: null,
        drag: null,
        placement: false,
        configuring: false,
        screen: "overview",
        saveLevel: "Concept",
        effectiveLevel: null,
        effectiveDetail: null,
        editingSnapshot: null,
        dirty: false,
        selectedHotspotId: null,
        pages: [],
        menuItems: [],
        previewPanel: null,
        previewPanelOriginalWidth: null
    };

    function isAuthoringContext() {
        var topLocation = "";
        try {
            topLocation = String(self.top.location.href || "");
        } catch (error) {
            topLocation = "";
        }

        return Boolean(window.isCF)
            && Boolean(window.client)
            && topLocation.indexOf("/Trm.Portal/") >= 0;
    }

    function readMostRecentCCGS() {
        var exact = window.localStorage.getItem("MostRecentCCGS");
        if (exact) {
            return parseJson(exact);
        }

        for (var index = 0; index < window.localStorage.length; index += 1) {
            var key = window.localStorage.key(index);
            if (key && key.toLowerCase() === "mostrecentccgs") {
                return parseJson(window.localStorage.getItem(key));
            }
        }
        return null;
    }

    function parseJson(value) {
        if (!value) {
            return null;
        }
        try {
            return JSON.parse(value);
        } catch (error) {
            return null;
        }
    }

    function numberOrNull(value) {
        if (value === null || value === undefined || value === "") {
            return null;
        }
        var number = Number(value);
        return isFinite(number) ? number : null;
    }

    function normalizeCCGS(value) {
        var source = value || {};
        return {
            conceptKey: numberOrNull(source.conceptKey),
            companyKey: numberOrNull(source.companyKey),
            groupKey: numberOrNull(source.groupKey),
            storeKey: numberOrNull(source.storeKey),
            conceptName: source.conceptName || "",
            companyName: source.companyName || "",
            groupName: source.groupName || "",
            storeName: source.storeName || ""
        };
    }

    function getLevelKeys(level, ccgs) {
        var keys = LEVEL_KEYS[level];
        if (!keys) {
            throw new Error("Unsupported hotspot detail level: " + level);
        }

        return {
            conceptKey: keys.indexOf("conceptKey") >= 0 ? ccgs.conceptKey : null,
            companyKey: keys.indexOf("companyKey") >= 0 ? ccgs.companyKey : null,
            groupKey: keys.indexOf("groupKey") >= 0 ? ccgs.groupKey : null,
            storeKey: keys.indexOf("storeKey") >= 0 ? ccgs.storeKey : null
        };
    }

    function availableLevels(ccgs) {
        var ownKey = { Concept: "conceptKey", Company: "companyKey", Group: "groupKey", Store: "storeKey" };
        return ["Concept", "Company", "Group", "Store"].filter(function (level) {
            return ccgs.conceptKey !== null && ccgs[ownKey[level]] !== null;
        });
    }

    function requestJson(url, options) {
        var request = options || {};
        request.credentials = "include";
        request.headers = Object.assign({ "Content-Type": "application/json" }, request.headers || {});
        return window.fetch(url, request).then(function (response) {
            return response.text().then(function (text) {
                var data = text ? parseJson(text) : null;
                if (!response.ok) {
                    throw new Error("Request failed (" + response.status + ")");
                }
                return data;
            });
        });
    }

    function normalizeDocument(value) {
        var parsed = typeof value === "string" ? parseJson(value) : value;
        var hotspots;
        if (Array.isArray(parsed)) {
            hotspots = parsed;
        } else if (parsed && Array.isArray(parsed.hotspots)) {
            hotspots = parsed.hotspots;
        } else {
            hotspots = [];
        }

        return {
            version: parsed && parsed.version ? parsed.version : 1,
            hotspots: hotspots.map(normalizeHotspot).filter(Boolean)
        };
    }

    function normalizeHotspot(value, index) {
        var source = value || {};
        var position = source.position || {};
        var size = source.size || {};
        var x = numberOrNull(source.x !== undefined ? source.x : position.x);
        var y = numberOrNull(source.y !== undefined ? source.y : position.y);
        var width = numberOrNull(source.width !== undefined ? source.width : size.width);
        var height = numberOrNull(source.height !== undefined ? source.height : size.height);
        var sourceLayer = numberOrNull(source.sourceLayer !== undefined ? source.sourceLayer : source.source_layer);
        var targetLayer = numberOrNull(source.targetLayer !== undefined ? source.targetLayer : source.target_layer);

        if (x === null || y === null || width === null || height === null || sourceLayer === null) {
            return null;
        }

        return {
            id: String(source.id || ("hotspot-" + Date.now() + "-" + index)),
            name: String(source.name || ""),
            x: Math.max(0, x),
            y: Math.max(0, y),
            width: Math.max(1, width),
            height: Math.max(1, height),
            sourceLayer: Math.max(1, sourceLayer),
            targetLayer: targetLayer === null ? null : Math.max(1, targetLayer)
        };
    }

    function getHotspotItemName() {
        var config = window.AssetConfiguration || {};
        var assetId = String(config.Aid || config.aid || "").trim();
        return HOTSPOT_NAME_PREFIX + assetId;
    }

    function findParent(menuItems) {
        var wanted = getHotspotItemName();
        return (Array.isArray(menuItems) ? menuItems : []).find(function (item) {
            var typeId = item.typeId !== undefined ? item.typeId : item.TypeId;
            return String(item.name || item.Name || "").trim() === wanted
                && (typeId === undefined || numberOrNull(typeId) === TEXT_ITEM_TYPE_ID);
        }) || null;
    }

    function findTextValue(item) {
        if (!item) {
            return "";
        }
        return item.value !== undefined ? item.value : (item.textValue !== undefined ? item.textValue : item.text || "");
    }

    function loadCanonicalDocument() {
        // TRMData from wandLib is already resolved for the current store and forecast date; trust it for display.
        state.document = state.parent
            ? normalizeDocument(state.parent.value)
            : { version: 1, hotspots: [] };
        state.savedDocument = cloneDocument(state.document);
        var levels = state.ccgs ? availableLevels(state.ccgs) : ["Concept"];
        if (!state.saveLevel || levels.indexOf(state.saveLevel) < 0) {
            state.saveLevel = levels.indexOf("Concept") >= 0 ? "Concept" : (levels[0] || "Concept");
        }
        return Promise.resolve(null);
    }

    function ensureParent() {
        if (state.parent && state.parent.id) {
            return Promise.resolve(state.parent);
        }

        var existing = findParent(state.menuItems);
        if (existing && (existing.id || existing.MenuItemId)) {
            state.parent = {
                id: numberOrNull(existing.id || existing.MenuItemId),
                name: getHotspotItemName(),
                value: findTextValue(existing)
            };
            return loadCanonicalDocument().then(function () { return state.parent; });
        }

        if (!state.enabled) {
            return Promise.resolve(null);
        }

        if (!state.ccgs || state.ccgs.conceptKey === null) {
            return Promise.reject(new Error("MostRecentCCGS does not contain a concept key."));
        }

        return requestJson(PORTAL_MENU_ITEMS_URL, {
            method: "POST",
            body: JSON.stringify({
                ConceptKey: state.ccgs.conceptKey,
                TypeId: TEXT_ITEM_TYPE_ID,
                ShowDeleted: false
            })
        }).then(function (items) {
            var found = findParent(items && (items.menuItems || items.MenuItems || items));
            if (found) {
                state.parent = {
                    id: numberOrNull(found.id || found.MenuItemId),
                    name: getHotspotItemName(),
                    value: findTextValue(found)
                };
                return loadCanonicalDocument().then(function () { return state.parent; });
            }

            return requestJson(PORTAL_CREATE_URL, {
                method: "POST",
                body: JSON.stringify({
                    MenuItemId: -1,
                    Name: getHotspotItemName(),
                    Descr: "",
                    CustomerId: null,
                    TypeId: TEXT_ITEM_TYPE_ID,
                    ConceptKey: state.ccgs.conceptKey
                })
            }).then(function (result) {
                var parentId = typeof result === "number" ? result : numberOrNull(result && result.AffectedId);
                if (parentId === null) {
                    throw new Error("Hotspot data creation did not return a menu-item ID.");
                }
                state.parent = { id: parentId, name: getHotspotItemName(), value: "" };
                state.document = { version: 1, hotspots: [] };
                state.savedDocument = cloneDocument(state.document);
                return state.parent;
            });
        });
    }

    function normalizeDetailResponse(data) {
        var obj = data;
        if (Array.isArray(data)) {
            obj = data.filter(function (d) { return d && d.active !== false; })
                .sort(function (a, b) { return Number(b.id || b.Id || 0) - Number(a.id || a.Id || 0); })[0] || null;
        }
        if (obj && (obj.id || obj.Id) && (obj.domainLevel || obj.DomainLevel)) {
            return {
                id: numberOrNull(obj.id || obj.Id),
                parentId: numberOrNull(obj.parentId || obj.ParentId),
                domainLevel: String(obj.domainLevel || obj.DomainLevel || ""),
                text: obj.text !== undefined ? obj.text : (obj.TextValue !== undefined ? obj.TextValue : ""),
                effectiveDate: obj.effectiveDate || obj.EffectiveDate || "",
                active: obj.active !== false
            };
        }
        return null;
    }

    function currentCCGSKeys() {
        return {
            conceptKey: state.ccgs ? state.ccgs.conceptKey : null,
            companyKey: state.ccgs ? state.ccgs.companyKey : null,
            groupKey: state.ccgs ? state.ccgs.groupKey : null,
            storeKey: state.ccgs ? state.ccgs.storeKey : null
        };
    }

    function fetchDetail(keys) {
        var query = new URLSearchParams();
        query.set("ConceptKey", keys.conceptKey === null ? "" : keys.conceptKey);
        query.set("CompanyKey", keys.companyKey === null ? "" : keys.companyKey);
        query.set("GroupKey", keys.groupKey === null ? "" : keys.groupKey);
        query.set("StoreKey", keys.storeKey === null ? "" : keys.storeKey);
        query.set("MenuItemId", state.parent.id);
        query.set("cb", Date.now());
        return window.fetch(PORTAL_DETAILS_URL + "?" + query.toString(), { credentials: "include" })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error("Unable to read hotspot override (" + response.status + ").");
                }
                return response.json();
            })
            .then(normalizeDetailResponse);
    }

    // One CCGS-scoped lookup that reports the narrowest active override for this store (or null).
    function resolveEffectiveDetail() {
        if (!state.parent || !state.parent.id || !state.ccgs) {
            state.effectiveDetail = null;
            state.effectiveLevel = null;
            return Promise.resolve(null);
        }
        return fetchDetail(currentCCGSKeys()).then(function (detail) {
            state.effectiveDetail = detail;
            state.effectiveLevel = detail ? detail.domainLevel : null;
            return detail;
        });
    }

    function fetchBaseValue() {
        if (!state.ccgs || state.ccgs.conceptKey === null) {
            return Promise.resolve(state.parent ? state.parent.value : "");
        }
        return requestJson(PORTAL_MENU_ITEMS_URL, {
            method: "POST",
            body: JSON.stringify({ ConceptKey: state.ccgs.conceptKey, TypeId: TEXT_ITEM_TYPE_ID, ShowDeleted: false })
        }).then(function (items) {
            var found = findParent(items && (items.menuItems || items.MenuItems || items));
            return found ? findTextValue(found) : "";
        }).catch(function () {
            return state.parent ? state.parent.value : "";
        });
    }

    function allowedSaveLevels() {
        var levels = availableLevels(state.ccgs);
        if (!state.effectiveLevel) {
            return levels;
        }
        var order = ["Concept", "Company", "Group", "Store"];
        var effIdx = order.indexOf(state.effectiveLevel);
        if (effIdx < 0) {
            return levels;
        }
        return levels.filter(function (lvl) { return order.indexOf(lvl) >= effIdx; });
    }

    function saveAtLevel(level) {
        var keys = getLevelKeys(level, state.ccgs);
        return fetchDetail(keys).then(function (detail) {
            var forecastDate = getForecastDate();
            var reuse = Boolean(detail && detail.id > 0 && isSameDay(new Date(detail.effectiveDate), forecastDate));
            var detailId = reuse ? detail.id : -1;
            var effectiveDate = reuse ? detail.effectiveDate : formatPortalDate(forecastDate);
            var payload = {
                MenuItemDetails: [{
                    id: detailId,
                    parentId: state.parent.id,
                    price: reuse && detail.price ? detail.price : "",
                    calories: reuse && detail.calories ? detail.calories : "",
                    text: JSON.stringify(state.document),
                    effectiveDate: effectiveDate,
                    active: true,
                    hasDate: Boolean(effectiveDate),
                    conceptKey: keys.conceptKey,
                    companyKey: keys.companyKey,
                    groupKey: keys.groupKey,
                    storeKey: keys.storeKey,
                    readOnlyCalories: ""
                }]
            };

            return requestJson(PORTAL_BATCH_URL, {
                method: "POST",
                body: JSON.stringify(payload)
            }).then(function (result) {
                state.detail = Object.assign({}, detail || {}, {
                    id: detailId,
                    parentId: state.parent.id,
                    effectiveDate: effectiveDate,
                    text: JSON.stringify(state.document),
                    domainLevel: level
                });
                return result;
            });
        });
    }

    function formatPortalDate(date) {
        var month = String(date.getMonth() + 1).padStart(2, "0");
        var day = String(date.getDate()).padStart(2, "0");
        var year = date.getFullYear();
        var hours = date.getHours();
        var suffix = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        return month + "/" + day + "/" + year + " " + hours + ":00 " + suffix;
    }

    // Effective date = the Content Forecaster day at 00:00 (falls back to today when not forecasting).
    function getForecastDate() {
        var iso = (typeof window !== "undefined" && window.cfCurrentTime) ? String(window.cfCurrentTime) : "";
        var match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        }
        var now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
    }

    function isSameDay(a, b) {
        return a instanceof Date && b instanceof Date && !isNaN(a.getTime()) && !isNaN(b.getTime())
            && a.getFullYear() === b.getFullYear()
            && a.getMonth() === b.getMonth()
            && a.getDate() === b.getDate();
    }

    function cloneDocument(documentValue) {
        return JSON.parse(JSON.stringify(documentValue || { version: 1, hotspots: [] }));
    }

    function makeId() {
        return "hotspot-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    }

    function currentLayer() {
        return window.menuLayout && window.menuLayout.currentLayerId
            ? Number(window.menuLayout.currentLayerId)
            : 1;
    }

    function render() {
        $(".hotspot-authoring").remove();
        $(".hotspot-runtime").remove();
        state.currentLayer = currentLayer();
        var layers = [];
        state.document.hotspots.forEach(function (hotspot) {
            layers.push(hotspot.sourceLayer);
            if (hotspot.targetLayer) {
                layers.push(hotspot.targetLayer);
            }
        });
        if (window.menuLayout && typeof window.menuLayout.ensureLayerPages === "function") {
            window.menuLayout.ensureLayerPages(layers);
        }
        state.document.hotspots.filter(function (hotspot) {
            return hotspot.sourceLayer === state.currentLayer;
        }).forEach(function (hotspot) {
            var authoring = state.configuring;
            var className = authoring ? "cms-hotspot hotspot-authoring" : "cms-hotspot hotspot-runtime";
            if (authoring && hotspot.id === state.selectedHotspotId) {
                className += " is-selected";
            }
            var button = $("<button type='button' class='" + className + "'></button>");
            button.attr("data-hotspot-id", hotspot.id);
            if (hotspot.targetLayer) {
                button.attr("data-target-layer", hotspot.targetLayer);
            }
            button.attr("title", hotspot.targetLayer
                ? (hotspot.name || getPageName(hotspot.targetLayer))
                : "No target page set");
            button.css({ left: hotspot.x, top: hotspot.y, width: hotspot.width, height: hotspot.height });
            if (authoring) {
                button.append($('<span class="cms-hotspot-label"></span>').text(hotspot.name || getPageName(hotspot.targetLayer) || "Unnamed"));
                if (hotspot.targetLayer) {
                    button.append($('<span role="button" tabindex="0" class="hotspot-test-button" title="Test navigation">Test</span>'));
                } else {
                    button.append($('<span class="hotspot-target-error" title="No target page set">No target</span>'));
                }
                button.append($('<span class="hotspot-move-handle" aria-hidden="true"><span class="material-icons">open_with</span></span>'));
                button.append($('<span class="hotspot-resize-handle" aria-hidden="true"></span>'));
            }
            $("#layer_" + state.currentLayer + "_hotspots").append(button);
        });
    }

    function highlightSelected() {
        $(".hotspot-authoring").removeClass("is-selected");
        if (state.selectedHotspotId) {
            $("[data-hotspot-id='" + state.selectedHotspotId + "']").addClass("is-selected");
        }
    }

    function showStatus(message, isError) {
        var host = getModalDocument();
        var status = host.querySelector("#hotspot-authoring-status");
        if (status) {
            status.textContent = message;
            status.className = isError ? "hotspot-status error" : "hotspot-status";
        }
    }

    function getModalDocument() {
        try {
            if (self.top && self.top !== self && self.top.document) {
                return self.top.document;
            }
        } catch (error) {
            return document;
        }
        return document;
    }

    function getModalHost() {
        var hostDocument = getModalDocument();
        try {
            var previewRoot = hostDocument.getElementById("MainContentPane_Content_pnlPreview");
            var previewPanel = getDirectChildByClass(previewRoot, "preview-container-preview-panel");

            if (previewPanel) {
                var previewContainer = getDirectChildByClass(previewPanel, "preview-container");
                if (previewContainer) {
                    previewContainer.classList.add("hotspot-authoring-host");
                    if (state.previewPanel !== previewPanel) {
                        state.previewPanel = previewPanel;
                        state.previewPanelOriginalWidth = previewPanel.style.width;
                    }
                    if (state.previewPanelOriginalWidth !== null && !previewPanel.classList.contains("hotspot-authoring-expanded")) {
                        var panelWidth = parseFloat(hostDocument.defaultView.getComputedStyle(previewPanel).width) || 432;
                        previewPanel.style.width = (panelWidth + 500) + "px";
                        previewPanel.classList.add("hotspot-authoring-expanded");
                    }
                    return previewContainer;
                }
            }

            return previewRoot || hostDocument.body;
        } catch (error) {
            return hostDocument.body;
        }
    }

    function restorePreviewPanelWidth() {
        if (!state.previewPanel || !state.previewPanel.classList.contains("hotspot-authoring-expanded")) {
            return;
        }
        state.previewPanel.style.width = state.previewPanelOriginalWidth || "";
        state.previewPanel.classList.remove("hotspot-authoring-expanded");
    }

    function getDirectChildByClass(parent, className) {
        if (!parent) {
            return null;
        }
        for (var index = 0; index < parent.children.length; index += 1) {
            if (parent.children[index].classList.contains(className)) {
                return parent.children[index];
            }
        }
        return null;
    }

    function ensureModal() {
        var host = getModalDocument();
        var modalHost = getModalHost();
        ensureModalStyles(host);
        var existingModal = host.querySelector("#hotspot-authoring-modal");
        if (existingModal) {
            if (existingModal.parentElement !== modalHost) {
                modalHost.prepend(existingModal);
            }
            return existingModal;
        }
        var modal = host.createElement("div");
        modal.id = "hotspot-authoring-modal";
        modal.className = "hs-modal";
        modal.hidden = true;
        modal.innerHTML =
            "<div class='hs-head'>"
          +   "<button type='button' class='hs-iconbtn hs-back' data-hs='back' title='Back' aria-label='Back'><span class='material-icons'>arrow_back</span></button>"
          +   "<span class='hs-title' data-hs-title>Configure</span>"
          +   "<button type='button' class='hs-iconbtn hs-close' data-hs='exit' title='Close' aria-label='Close'><span class='material-icons'>close</span></button>"
          + "</div>"
          + "<div class='hs-body'>"
          +   "<section class='hs-screen' data-screen='overview'>"
          +     "<label class='hs-field hs-scope' data-hs-scope style='display:none'><span>Applies to</span><select data-hs-field='scope'></select></label>"
          +     "<div class='hs-hint' data-hs-scopehint style='display:none'></div>"
          +     "<label class='hs-field'><span>Page</span><select data-hs-field='sourcePage'></select></label>"
          +     "<div class='hs-listhead'>Hotspots on this page</div>"
          +     "<ul class='hs-list' data-hs-list></ul>"
          +   "</section>"
          +   "<section class='hs-screen' data-screen='editor' hidden>"
          +     "<label class='hs-field'><span>Name</span><input data-hs-field='name' type='text' placeholder='Hotspot name'></label>"
          +     "<label class='hs-field'><span>Target page</span><select data-hs-field='target'></select></label>"
          +     "<fieldset class='hs-geo'><legend>Position &amp; size</legend><div class='hs-geogrid'>"
          +       "<label><span>Left</span><input data-hs-field='x' type='number' min='0' step='1'></label>"
          +       "<label><span>Top</span><input data-hs-field='y' type='number' min='0' step='1'></label>"
          +       "<label><span>Width</span><input data-hs-field='width' type='number' min='1' step='1'></label>"
          +       "<label><span>Height</span><input data-hs-field='height' type='number' min='1' step='1'></label>"
          +     "</div></fieldset>"
          +     "<div class='hs-hint'>Drag or resize the highlighted hotspot on the preview.</div>"
          +     "<div class='hs-status' data-hs-status></div>"
          +   "</section>"
          + "</div>"
          + "<div class='hs-foot'>"
          +   "<div class='hs-foot-overview' data-foot='overview'>"
          +     "<button type='button' class='hs-btn hs-ghost hs-block' data-hs='removeOverride' style='display:none'></button>"
          +     "<button type='button' class='hs-btn hs-primary hs-block' data-hs='create'><span class='material-icons'>add</span>Create hotspot</button>"
          +   "</div>"
          +   "<div class='hs-foot-editor' data-foot='editor' hidden>"
          +     "<button type='button' class='hs-btn hs-danger' data-hs='remove'>Remove</button>"
          +     "<span class='hs-foot-gap'></span>"
          +     "<button type='button' class='hs-btn hs-ghost' data-hs='revert' disabled>Revert</button>"
          +     "<button type='button' class='hs-btn hs-primary' data-hs='save' disabled>Save</button>"
          +   "</div>"
          + "</div>";
        modalHost.prepend(modal);

        var $modal = $(modal);
        $modal.on("click", "[data-hs]", function () {
            var action = $(this).attr("data-hs");
            if (action === "exit") { exitConfigure(); }
            else if (action === "back") { backToOverview(); }
            else if (action === "create") { createHotspot(); }
            else if (action === "remove") { removeSelected(); }
            else if (action === "removeOverride") { removeOverride(); }
            else if (action === "revert") { revertEditor(); }
            else if (action === "save") { saveEditor(); }
        });
        $modal.on("change", "[data-hs-field='sourcePage']", function () {
            var page = numberOrNull($(this).val());
            if (page && window.menuLayout && typeof window.menuLayout.navigateToLayer === "function") {
                window.menuLayout.navigateToLayer(page);
            }
            renderOverview();
        });
        $modal.on("click", "[data-hs-item]", function () {
            var id = $(this).attr("data-hs-item");
            var hotspot = state.document.hotspots.find(function (h) { return h.id === id; });
            if (hotspot) { openEditor(hotspot); }
        });
        $modal.on("input change", "[data-hs-field='name'],[data-hs-field='x'],[data-hs-field='y'],[data-hs-field='width'],[data-hs-field='height']", function () {
            updateEditingField($(this).attr("data-hs-field"), $(this).val());
        });
        $modal.on("change", "[data-hs-field='target']", function () {
            markDirty();
        });
        $modal.on("change", "[data-hs-field='scope']", function () {
            onScopeChange($(this).val());
        });
        return modal;
    }

    function showScreen(screen) {
        state.screen = screen;
        var $m = $(ensureModal());
        $m.find("[data-screen]").each(function () {
            this.hidden = $(this).attr("data-screen") !== screen;
        });
        $m.find("[data-foot]").each(function () {
            this.hidden = $(this).attr("data-foot") !== screen;
        });
        $m.find(".hs-back").css("visibility", screen === "editor" ? "visible" : "hidden");
        $m.find("[data-hs-title]").text(screen === "editor" ? "Edit hotspot" : "Configure");
        $m.prop("hidden", false);
    }

    function ensureModalStyles(host) {
        if (host.getElementById("hotspot-authoring-styles")) {
            return;
        }
        var styles = host.createElement("style");
        styles.id = "hotspot-authoring-styles";
        styles.textContent = [
            ".hotspot-authoring-host{display:flex;justify-content:space-around;align-items:flex-start;gap:16px;overflow:visible!important}",
            ".hs-modal{z-index:2147483000;width:320px;flex:0 0 320px;display:flex;flex-direction:column;max-height:760px;color:#17313b;background:#fff;border:1px solid #d5dee2;border-radius:10px;box-shadow:0 18px 48px rgba(9,35,44,.18);font:14px/1.4 'Segoe UI',system-ui,sans-serif;overflow:hidden}",
            ".hs-modal[hidden]{display:none}",
            ".hs-head{display:flex;align-items:center;gap:8px;padding:10px 10px;border-bottom:1px solid #eef2f4}",
            ".hs-title{flex:1;text-align:center;font-size:16px;font-weight:600}",
            ".hs-iconbtn{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;color:#5f7078;background:transparent;border:0;border-radius:6px;cursor:pointer}",
            ".hs-iconbtn:hover{background:#eef2f4;color:#243c45}",
            ".hs-iconbtn .material-icons{font-size:20px}",
            ".hs-body{padding:14px;overflow:auto}",
            ".hs-field{display:grid;gap:5px;margin:0 0 12px}",
            ".hs-field>span{font-size:12px;font-weight:600;color:#54666d;text-transform:uppercase;letter-spacing:.03em}",
            ".hs-modal input,.hs-modal select{width:100%;min-height:36px;padding:6px 9px;color:#17313b;background:#fff;border:1px solid #c5d0d4;border-radius:6px;font:inherit;box-sizing:border-box}",
            ".hs-modal input:focus,.hs-modal select:focus{outline:2px solid #3586bd;outline-offset:0;border-color:#3586bd}",
            ".hs-listhead{margin:2px 0 8px;font-size:12px;font-weight:600;color:#54666d;text-transform:uppercase;letter-spacing:.03em}",
            ".hs-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}",
            ".hs-item{display:flex;flex-direction:column;gap:2px;padding:10px 12px;background:#f5f8f9;border:1px solid #e1e8ea;border-radius:8px;cursor:pointer}",
            ".hs-item:hover{border-color:#3586bd;background:#eef6fb}",
            ".hs-item-name{font-weight:600}",
            ".hs-item-target{font-size:12px;color:#6a7c82}",
            ".hs-item.is-warn{border-color:#e0b48a;background:#fdf3e9}",
            ".hs-item.is-warn .hs-item-target{color:#a4611c}",
            ".hs-empty{padding:14px;color:#7a8b90;text-align:center;background:#f5f8f9;border:1px dashed #cdd8db;border-radius:8px}",
            ".hs-geo{margin:2px 0 4px;padding:10px;border:1px solid #d5dee2;border-radius:8px}",
            ".hs-geo legend{padding:0 6px;font-size:12px;font-weight:600;color:#54666d;text-transform:uppercase;letter-spacing:.03em}",
            ".hs-geogrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}",
            ".hs-geogrid label{display:grid;gap:3px;font-size:12px;color:#54666d}",
            ".hs-hint{margin:8px 0 0;font-size:12px;color:#7a8b90}",
            ".hs-status{margin:8px 0 0;font-size:13px;min-height:1em}",
            ".hs-status.error{color:#b23a3a}",
            ".hs-foot{padding:12px 14px;border-top:1px solid #eef2f4;background:#fafcfc}",
            ".hs-foot-overview,.hs-foot-editor{display:flex;align-items:center;gap:8px}",
            ".hs-foot-editor[hidden],.hs-foot-overview[hidden]{display:none}",
            ".hs-foot-gap{flex:1}",
            ".hs-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:38px;padding:0 14px;font:inherit;font-weight:600;border:0;border-radius:7px;cursor:pointer}",
            ".hs-btn .material-icons{font-size:18px}",
            ".hs-block{width:100%}",
            ".hs-primary{color:#fff;background:#3586bd}",
            ".hs-primary:hover{background:#2c72a3}",
            ".hs-primary:disabled{background:#9cc2dc;cursor:default}",
            ".hs-ghost{color:#2c5a72;background:#e6eef3}",
            ".hs-ghost:hover{background:#d6e3ec}",
            ".hs-ghost:disabled{color:#9fb2bc;background:#eef2f4;cursor:default}",
            ".hs-danger{color:#fff;background:#c0453f}",
            ".hs-danger:hover{background:#a83a35}"
        ].join("");
        (host.head || host.body).appendChild(styles);
    }

    function openEditor(hotspot) {
        state.editing = cloneDocument({ hotspots: [hotspot] }).hotspots[0];
        state.editingSnapshot = cloneDocument({ hotspots: [hotspot] }).hotspots[0];
        state.selectedHotspotId = hotspot.id;
        state.dirty = false;
        var $modal = $(ensureModal());
        $modal.find("[data-hs-field='name']").val(state.editing.name);
        fillTargetSelect($modal);
        $modal.find("[data-hs-field='target']").val(state.editing.targetLayer || "");
        syncGeoFields($modal);
        showScreen("editor");
        highlightSelected();
        updateEditorButtons($modal);
        showStatus("", false);
    }

    function fillTargetSelect($modal) {
        var select = $modal.find("[data-hs-field='target']").empty();
        select.append('<option value="">Select a page\u2026</option>');
        state.pages.forEach(function (page) {
            select.append($('<option></option>').val(page.id).text(page.name));
        });
    }

    function scopeLabel(level) {
        var names = {
            Concept: state.ccgs && state.ccgs.conceptName,
            Company: state.ccgs && state.ccgs.companyName,
            Group: state.ccgs && state.ccgs.groupName,
            Store: state.ccgs && state.ccgs.storeName
        };
        var name = names[level];
        return name ? (level + " \u2014 " + name) : level;
    }

    function onScopeChange(level) {
        if (!level) {
            return;
        }
        state.saveLevel = level;
        renderOverview();
    }

    function deactivateDetail(detail, level) {
        var keys = getLevelKeys(level, state.ccgs);
        var payload = {
            MenuItemDetails: [{
                id: detail.id,
                parentId: state.parent.id,
                price: "",
                calories: "",
                text: detail.text || "",
                effectiveDate: detail.effectiveDate || formatPortalDate(getForecastDate()),
                active: false,
                hasDate: Boolean(detail.effectiveDate),
                conceptKey: keys.conceptKey,
                companyKey: keys.companyKey,
                groupKey: keys.groupKey,
                storeKey: keys.storeKey,
                readOnlyCalories: ""
            }]
        };
        return requestJson(PORTAL_BATCH_URL, { method: "POST", body: JSON.stringify(payload) });
    }

    // After a removal the client's TRMData is stale, so pull the now-effective value ourselves.
    function refreshDisplayToEffective() {
        if (state.effectiveDetail) {
            state.document = normalizeDocument(state.effectiveDetail.text);
            state.savedDocument = cloneDocument(state.document);
            return Promise.resolve();
        }
        return fetchBaseValue().then(function (baseValue) {
            state.document = normalizeDocument(baseValue);
            state.savedDocument = cloneDocument(state.document);
        });
    }

    function removeOverride() {
        if (!state.effectiveDetail || !state.effectiveDetail.id || !state.effectiveLevel) {
            return;
        }
        var level = state.effectiveLevel;
        if (!window.confirm("Remove the " + level + " override? The layout will revert to the inherited value for this store.")) {
            return;
        }
        var $btn = $(ensureModal()).find("[data-hs='removeOverride']");
        $btn.prop("disabled", true).text("Removing\u2026");
        deactivateDetail(state.effectiveDetail, level)
            .then(resolveEffectiveDetail)
            .then(refreshDisplayToEffective)
            .then(function () {
                state.saveLevel = null;
                render();
                renderOverview();
            })
            .catch(function (error) {
                $btn.prop("disabled", false);
                window.alert(error && error.message ? error.message : "Unable to remove override.");
            });
    }

    function syncGeoFields($modal) {
        $modal = $modal || $(ensureModal());
        if (!state.editing) {
            return;
        }
        $modal.find("[data-hs-field='x']").val(Math.round(state.editing.x));
        $modal.find("[data-hs-field='y']").val(Math.round(state.editing.y));
        $modal.find("[data-hs-field='width']").val(Math.round(state.editing.width));
        $modal.find("[data-hs-field='height']").val(Math.round(state.editing.height));
    }

    function updateEditorButtons($modal) {
        $modal = $modal || $(ensureModal());
        $modal.find("[data-hs='save']").prop("disabled", !state.dirty);
        $modal.find("[data-hs='revert']").prop("disabled", !state.dirty);
    }

    function markDirty() {
        state.dirty = true;
        updateEditorButtons($(ensureModal()));
    }

    function updateEditingField(field, value) {
        if (!state.editing) {
            return;
        }
        if (["x", "y", "width", "height"].indexOf(field) >= 0) {
            value = numberOrNull(value);
            if (value === null) {
                return;
            }
            value = field === "width" || field === "height" ? Math.max(1, value) : Math.max(0, value);
        }
        state.editing[field] = value;
        var index = state.document.hotspots.findIndex(function (item) { return item.id === state.editing.id; });
        if (index >= 0) {
            state.document.hotspots[index] = state.editing;
        }
        state.dirty = true;
        var element = $("[data-hotspot-id='" + state.editing.id + "']");
        if (element.length) {
            element.css({ left: state.editing.x, top: state.editing.y, width: state.editing.width, height: state.editing.height });
            if (field === "name") {
                element.find(".cms-hotspot-label").text(state.editing.name || getPageName(state.editing.targetLayer) || "Unnamed");
            }
        }
        updateEditorButtons($(ensureModal()));
    }

    function hideModal() {
        var modal = getModalDocument().querySelector("#hotspot-authoring-modal");
        if (modal) {
            modal.hidden = true;
        }
        restorePreviewPanelWidth();
    }

    function finishToOverview() {
        state.editing = null;
        state.editingSnapshot = null;
        state.dirty = false;
        state.selectedHotspotId = null;
        render();
        renderOverview();
        showScreen("overview");
    }

    function getPageName(layerId) {
        var page = state.pages.find(function (item) { return item.id === layerId; });
        return page ? page.name : "Page " + layerId;
    }

    function renderOverview() {
        var $modal = $(ensureModal());
        var levels = availableLevels(state.ccgs);
        var allowed = allowedSaveLevels();
        if (!state.saveLevel || allowed.indexOf(state.saveLevel) < 0) {
            if (state.effectiveLevel && allowed.indexOf(state.effectiveLevel) >= 0) {
                state.saveLevel = state.effectiveLevel;
            } else if (allowed.indexOf("Concept") >= 0) {
                state.saveLevel = "Concept";
            } else {
                state.saveLevel = allowed[0] || "Concept";
            }
        }
        var scopeSelect = $modal.find("[data-hs-field='scope']").empty();
        levels.forEach(function (lvl) {
            var option = $('<option></option>').val(lvl).text(scopeLabel(lvl));
            if (allowed.indexOf(lvl) < 0) {
                option.prop("disabled", true).text(scopeLabel(lvl) + " \u2014 blocked");
            }
            scopeSelect.append(option);
        });
        scopeSelect.val(state.saveLevel);
        $modal.find("[data-hs-scope]").toggle(levels.length > 1);
        var blocked = levels.length > 1 && allowed.length < levels.length;
        var scopeHint = $modal.find("[data-hs-scopehint]");
        if (state.effectiveLevel && blocked) {
            scopeHint.text("A " + state.effectiveLevel + " override is in place. Broader scopes are blocked until it is removed.").show();
        } else if (levels.length > 1) {
            scopeHint.text("Edits save as a " + state.saveLevel + " override for this scope.").show();
        } else {
            scopeHint.hide();
        }
        var removeBtn = $modal.find("[data-hs='removeOverride']");
        if (state.effectiveLevel && blocked) {
            removeBtn.text("Remove " + state.effectiveLevel + " override").css("display", "");
        } else {
            removeBtn.hide();
        }
        var pageSelect = $modal.find("[data-hs-field='sourcePage']").empty();
        state.pages.forEach(function (page) {
            pageSelect.append($('<option></option>').val(page.id).text(page.name));
        });
        var current = currentLayer();
        if (state.pages.some(function (page) { return page.id === current; })) {
            pageSelect.val(current);
        }
        var selectedPage = numberOrNull(pageSelect.val()) || current;
        var list = $modal.find("[data-hs-list]").empty();
        var items = state.document.hotspots.filter(function (hotspot) {
            return hotspot.sourceLayer === selectedPage;
        });
        if (!items.length) {
            list.append('<li class="hs-empty">No hotspots on this page yet.</li>');
            return;
        }
        items.forEach(function (hotspot) {
            var item = $('<li class="hs-item" tabindex="0"></li>').attr("data-hs-item", hotspot.id);
            item.append($('<span class="hs-item-name"></span>').text(hotspot.name || "Unnamed hotspot"));
            var targetText = hotspot.targetLayer ? ("\u2192 " + getPageName(hotspot.targetLayer)) : "\u26a0 no target page";
            item.append($('<span class="hs-item-target"></span>').text(targetText));
            if (!hotspot.targetLayer) {
                item.addClass("is-warn");
            }
            list.append(item);
        });
    }

    function configure() {
        if (!state.enabled) {
            return;
        }
        state.configuring = true;
        state.selectedHotspotId = null;
        render();
        ensureModal();
        getModalHost();
        showScreen("overview");
        renderOverview();
        resolveEffectiveDetail().then(function () {
            renderOverview();
        }).catch(function () {});
    }

    function createHotspot() {
        var sourcePage = numberOrNull($(ensureModal()).find("[data-hs-field='sourcePage']").val()) || currentLayer();
        if (window.menuLayout && typeof window.menuLayout.navigateToLayer === "function") {
            window.menuLayout.navigateToLayer(sourcePage);
        }
        var layerEl = $("#layer_" + sourcePage + "_hotspots").get(0);
        var width = 240;
        var height = 160;
        var centerX = layerEl ? layerEl.clientWidth / 2 : 540;
        var centerY = layerEl ? layerEl.clientHeight / 2 : 960;
        var hotspot = {
            id: makeId(),
            name: "",
            x: Math.max(0, centerX - width / 2),
            y: Math.max(0, centerY - height / 2),
            width: width,
            height: height,
            sourceLayer: sourcePage,
            targetLayer: null
        };
        state.document.hotspots.push(hotspot);
        state.selectedHotspotId = hotspot.id;
        render();
        openEditor(hotspot);
        state.dirty = true;
        updateEditorButtons($(ensureModal()));
        showStatus("Set a target page, then Save.", false);
    }

    function backToOverview() {
        if (state.editing) {
            var savedHas = state.savedDocument.hotspots.some(function (item) { return item.id === state.editing.id; });
            if (!savedHas) {
                state.document.hotspots = state.document.hotspots.filter(function (item) { return item.id !== state.editing.id; });
            } else if (state.editingSnapshot) {
                state.document.hotspots = state.document.hotspots.map(function (item) {
                    return item.id === state.editing.id
                        ? cloneDocument({ hotspots: [state.editingSnapshot] }).hotspots[0]
                        : item;
                });
            }
        }
        finishToOverview();
    }

    function exitConfigure() {
        state.document = cloneDocument(state.savedDocument);
        state.configuring = false;
        state.editing = null;
        state.editingSnapshot = null;
        state.dirty = false;
        state.placement = false;
        state.selectedHotspotId = null;
        hideModal();
        render();
    }

    function saveEditor() {
        if (!state.editing) {
            return;
        }
        var $modal = $(ensureModal());
        var name = ($modal.find("[data-hs-field='name']").val() || "").trim();
        var target = numberOrNull($modal.find("[data-hs-field='target']").val());
        var level = state.saveLevel || "Concept";
        if (!target) {
            showStatus("Choose a target page before saving.", true);
            return;
        }
        if (allowedSaveLevels().indexOf(level) < 0) {
            showStatus("A " + state.effectiveLevel + " override is in place. Remove it before saving to " + level + ".", true);
            return;
        }
        state.editing.name = name;
        state.editing.targetLayer = target;
        ["x", "y", "width", "height"].forEach(function (field) {
            var value = numberOrNull($modal.find("[data-hs-field='" + field + "']").val());
            if (value !== null) {
                state.editing[field] = field === "width" || field === "height" ? Math.max(1, value) : Math.max(0, value);
            }
        });
        var index = state.document.hotspots.findIndex(function (item) { return item.id === state.editing.id; });
        if (index >= 0) {
            state.document.hotspots[index] = state.editing;
        } else {
            state.document.hotspots.push(state.editing);
        }
        showStatus("Saving\u2026", false);
        $modal.find("[data-hs='save'],[data-hs='revert']").prop("disabled", true);
        saveAtLevel(level).then(function () {
            state.savedDocument = cloneDocument(state.document);
            return resolveEffectiveDetail();
        }).then(function () {
            finishToOverview();
        }).catch(function (error) {
            showStatus(error.message, true);
            updateEditorButtons($modal);
        });
    }

    function revertEditor() {
        if (!state.editing || !state.editingSnapshot) {
            return;
        }
        state.editing = cloneDocument({ hotspots: [state.editingSnapshot] }).hotspots[0];
        var index = state.document.hotspots.findIndex(function (item) { return item.id === state.editing.id; });
        if (index >= 0) {
            state.document.hotspots[index] = state.editing;
        }
        state.dirty = false;
        var $modal = $(ensureModal());
        $modal.find("[data-hs-field='name']").val(state.editing.name);
        $modal.find("[data-hs-field='target']").val(state.editing.targetLayer || "");
        syncGeoFields($modal);
        render();
        highlightSelected();
        updateEditorButtons($modal);
        showStatus("", false);
    }

    function removeSelected() {
        if (!state.editing) {
            return;
        }
        var id = state.editing.id;
        var savedHas = state.savedDocument.hotspots.some(function (item) { return item.id === id; });
        if (savedHas && !window.confirm("Remove this hotspot?")) {
            return;
        }
        state.document.hotspots = state.document.hotspots.filter(function (item) { return item.id !== id; });
        if (!savedHas) {
            finishToOverview();
            return;
        }
        var level = state.saveLevel || "Concept";
        showStatus("Removing\u2026", false);
        saveAtLevel(level).then(function () {
            state.savedDocument = cloneDocument(state.document);
            return resolveEffectiveDetail();
        }).then(function () {
            finishToOverview();
        }).catch(function (error) {
            showStatus(error.message, true);
        });
    }

    function contextPoint(event) {
        var layer = $("#layer_" + currentLayer() + "_hotspots").get(0);
        if (!layer) {
            return { x: 0, y: 0 };
        }
        var rect = layer.getBoundingClientRect();
        var scaleX = rect.width / 1080 || 1;
        var scaleY = rect.height / 1920 || 1;
        return { x: (event.clientX - rect.left) / scaleX, y: (event.clientY - rect.top) / scaleY };
    }

    function bindInteractions() {
        $(document).off("pointerdown.hotspot-authoring", ".hotspot-authoring");
        $(document).on("pointerdown.hotspot-authoring", ".hotspot-authoring", function (event) {
            if (event.button !== 0) {
                return;
            }
            if ($(event.target).closest(".hotspot-test-button, .hotspot-target-error").length) {
                return;
            }
            var id = $(this).attr("data-hotspot-id");
            var hotspot = state.document.hotspots.find(function (item) { return item.id === id; });
            if (!hotspot) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            var resize = $(event.target).closest(".hotspot-resize-handle").length > 0;
            if (!state.editing || state.editing.id !== id) {
                openEditor(hotspot);
            }
            state.drag = {
                id: id,
                resize: resize,
                start: contextPoint(event),
                original: cloneDocument({ hotspots: [state.editing] }).hotspots[0],
                moved: false
            };
        });

        $(document).off("click.hotspot-test", ".hotspot-test-button");
        $(document).on("click.hotspot-test", ".hotspot-test-button", function (event) {
            event.preventDefault();
            event.stopPropagation();
            var targetLayer = numberOrNull($(this).closest(".hotspot-authoring").attr("data-target-layer"));
            if (targetLayer && window.menuLayout && typeof window.menuLayout.navigateToLayer === "function") {
                window.menuLayout.navigateToLayer(targetLayer);
                if (state.configuring) {
                    setTimeout(function () { render(); highlightSelected(); }, 0);
                }
            }
        });

        $(document).off("pointermove.hotspot-authoring");
        $(document).on("pointermove.hotspot-authoring", function (event) {
            if (!state.drag || !state.editing) {
                return;
            }
            var point = contextPoint(event);
            var deltaX = point.x - state.drag.start.x;
            var deltaY = point.y - state.drag.start.y;
            if (state.drag.resize) {
                state.editing.width = Math.max(1, state.drag.original.width + deltaX);
                state.editing.height = Math.max(1, state.drag.original.height + deltaY);
            } else {
                state.editing.x = Math.max(0, state.drag.original.x + deltaX);
                state.editing.y = Math.max(0, state.drag.original.y + deltaY);
            }
            if (Math.abs(deltaX) >= 2 || Math.abs(deltaY) >= 2) {
                state.dirty = true;
            }
            var index = state.document.hotspots.findIndex(function (item) { return item.id === state.editing.id; });
            if (index >= 0) {
                state.document.hotspots[index] = state.editing;
            }
            var element = $("[data-hotspot-id='" + state.editing.id + "']");
            element.css({ left: state.editing.x, top: state.editing.y, width: state.editing.width, height: state.editing.height });
            syncGeoFields();
        });

        $(document).off("pointerup.hotspot-authoring");
        $(document).on("pointerup.hotspot-authoring", function () {
            if (!state.drag) {
                return;
            }
            state.drag = null;
            updateEditorButtons($(ensureModal()));
        });
    }

    function extendOptionsMenu(dropdownMenu) {
        if (!state.enabled || !dropdownMenu || dropdownMenu.querySelector("[data-action='configure']")) {
            return;
        }
        var item = document.createElement("div");
        item.className = "dropdown-item hotspot-configure-action";
        item.setAttribute("data-action", "configure");
        item.innerHTML = "<span class='material-icons' aria-hidden='true'>settings</span><span>Configure</span>";
        dropdownMenu.appendChild(item);
        dropdownMenu.addEventListener("click", function (event) {
            if (event.target.closest("[data-action='configure']")) {
                configure();
            }
        });
    }

    function onMenuItems(menuItems) {
        state.menuItems = Array.isArray(menuItems) ? menuItems : [];
        if (state.dataInitialized) {
            return;
        }
        state.dataInitialized = true;
        state.ccgs = normalizeCCGS(readMostRecentCCGS());
        ensureParent().then(function () {
            if (state.enabled) {
                bindInteractions();
            }
            render();
        }).catch(function (error) {
            console.error("Hotspot authoring initialization failed:", error);
        });
    }

    function onAssets(assets) {
        state.pages = [{ id: 1, name: "Home" }];
        (Array.isArray(assets) ? assets : []).forEach(function (asset) {
            var id = numberOrNull(asset && (asset.layerZOrder !== undefined ? asset.layerZOrder : asset.ZOrder));
            if (!id || state.pages.some(function (page) { return page.id === id; })) {
                return;
            }
            state.pages.push({
                id: id,
                name: String(asset.regionName || asset.zoneName || ("Page " + id))
            });
        });
        state.pages.sort(function (left, right) { return left.id - right.id; });
        if (state.configuring && state.screen === "overview") {
            renderOverview();
        }
    }

    function init() {
        if (state.initialized) {
            return;
        }
        state.enabled = isAuthoringContext();
        state.initialized = true;
        if (!state.enabled) {
            return;
        }
        window.addEventListener("contextmenu", function (event) {
            state.contextPoint = contextPoint(event);
        });
        var existingDropdown = document.querySelector(".options-dropdown");
        if (existingDropdown) {
            extendOptionsMenu(existingDropdown);
        }
        window.addEventListener("trm:layerChanged", render);
        window.HotspotController = api;
    }

    var api = {
        init: init,
        onMenuItems: onMenuItems,
        onAssets: onAssets,
        configure: configure,
        extendOptionsMenu: extendOptionsMenu,
        getState: function () { return state; }
    };

    window.HotspotController = api;
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
}(window, window.jQuery));
