"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
//Publisher: Wand Digital
//Date: 06.22.2026
//Version: 65.0
var IMSintegration;
(function (wandDigital) {
    var Integration = (function () {
        var Integration = /** @class */ (function () {
            function Integration(isLeader, isUsingIndexedDB) {
                this.TABLE_NAME = "";
                this.apiKey = "";
                this.lastSync;
                this.minUpdate = 600000; //10 min
                this.maxUpdate = 1800000; //30 min
                this.integrationUpdateInterval = this.maxUpdate;
                this.settingsMinUpdate = 900000; //15 min
                this.settingsMaxUpdate = 3600000; //60 min
                this.IMSminUpdate = 3600000; //60 min
                this.IMSmaxUpdate = 7200000; //120 min
                this.fallbackInterval = 2000;
                this.IMS_TimeOuts = [];
                this.Integration_TimeOuts = [];
                this.setting_TimeOuts = [];
                this.IMSUpdateCount = 0; //update que counter
                this.app = app;
                this.websocket = null;
                this.updateQueue = null;
                this.settings = [];
                this.brand = "";
                this.establishment = "";
                this.trmStoreId = "";
                this.store = "";
                this.API = "";
                this.business_unit = "";
                this.location = "";
                this.webtritionRequestQueue = Promise.resolve();
                this.webtritionPageSize = typeof webtritionPageSize !== "undefined" && parseInt(webtritionPageSize, 10) > 0
                    ? parseInt(webtritionPageSize, 10)
                    : 1000;
                this.imsItemsUpdateInterval =
                    Math.floor(Math.random() * (this.IMSmaxUpdate - this.IMSminUpdate + 1)) + this.IMSminUpdate;
                this.trmUpdateInterval =
                    Math.floor(Math.random() * (600000 - 300000 + 1)) + 300000; // 5–10 min
                this.imsSettingsUpdateInterval =
                    Math.floor(Math.random() * (this.settingsMaxUpdate - this.settingsMinUpdate + 1)) + this.settingsMinUpdate;
                this.db = null;
                this.attempts = 0; // exponential retries limit since expectin 204s
                this.settingsRetries = 2; // hard limit
                this.imsRetries = 3; // hard limit
                //          //***QA Environment***
                //          this.orderStatus = "orderstatus-qa.wanddigital.com";
                //          this.IMSwand = "https://api-qa.wanddigital.com";
                //          this.wand = "api-qa.wanddigital.com";
                //***Production Environment***
                this.orderStatus = "orderstatus-prod.wanddigital.com";
                this.IMSwand = "https://api.wanddigital.com";
                this.wand = "api.wanddigital.com";
                this.init(isLeader, isUsingIndexedDB);
            }
            Integration.prototype.init = function (isLeader, isUsingIndexedDB) {
                var _this = this;
                if ($(".loading").length === 0) {
                    var loading = Mustache.to_html(Integration.loading);
                    $("body").append(loading);
                }
                else {
                    $(".loading").remove();
                    var loading = Mustache.to_html(Integration.loading);
                    $("body").append(loading);
                }
                //inform.. no action
                if (development && !isPreview) {
                    _this.showConnect(true, "black", "devmode", "Development Mode", "error_outline");
                }
                //future action with dummy data
                if (isPreview) { }
                //confirm whitelisting in place
                if (isLeader) {
                    this.checkConnections();
                    //future action to warn offline and menus not up to date    
                }
                //store key must exist
                _this.getKeys().then(function () {
                    _this.TABLE_NAME = "IMS_" + _this.store + "(" + version + ")";
                    _this.getStartMethod(isLeader, isUsingIndexedDB);
                });
                ///populate TRM data for use in assets
                _this.getTrmData();
            };
            Integration.prototype.getKeys = function () {
                var _this = this;
                var attempts = 0;
                //windows forces complexity and promise use..
                return new Promise(function (resolve, reject) {
                    function queryKeys() {
                        if (!development && !isPreview) {
                            _this.store = AssetConfiguration.SKey || $("#storeKey").text().trim().toLowerCase();
                            _this.apiKey = $("#apiKey").text().trim().toLowerCase() || settingKey;
                            //remove after windows dies
                            if (platform === "windows" && _this.store.length && _this.apiKey.length) {
                                //dev mode
                                if (devSiteKeys.includes(_this.store)) {
                                    AssetConfiguration.Daypart = Daypart_Name || AssetConfiguration.Daypart || $(window.frameElement.parentElement).parent().attr("trm-daypart");
                                    _this.store = Store_Key || AssetConfiguration.SKey;
                                    _this.showConnect(true, "black", "devmode", "Development Mode", "error_outline");
                                    _this.apiKey = apiKey || settingKey || $("#apiKey").text().trim().toLowerCase();
                                    development = true;
                                }
                                else {
                                    var trmEle = $(window.frameElement.parentElement).parent();
                                    var trmDaypart = $(trmEle).attr("trm-daypart");
                                    AssetConfiguration.Daypart = AssetConfiguration.Daypart || trmDaypart;
                                    _this.showConnect(false, "black", "devmode", "Development Mode", "error_outline");
                                }
                            }
                        }
                        else {
                            _this.store = Store_Key || AssetConfiguration.SKey || $("#storeKey").text().trim().toLowerCase();
                            _this.apiKey = apiKey || settingKey || $("#apiKey").text().trim().toLowerCase();
                        }
                        if ((_this.apiKey.length === 0 && isUsingSettings) || !_this.store) {
                            if (!_this.store) {
                                if (!attempts) {
                                    console.warn("Looking for store key...");
                                    _this.showConnect(true, "darkgrey", "initStore", "Store key is missing", "error");
                                }
                            }
                            else {
                                _this.showConnect(false, "darkgrey", "initStore");
                            }
                            if (_this.apiKey.length === 0 && isUsingSettings) {
                                if (!attempts) {
                                    console.warn("Looking for API key...");
                                    _this.showConnect(true, "grey", "initAPI", "API key is missing", "error");
                                }
                            }
                            else {
                                _this.showConnect(false, "grey", "initAPI");
                            }
                            attempts++;
                            setTimeout(queryKeys, 250);
                        }
                        else {
                            _this.showConnect(false, "darkgrey", "initStore");
                            _this.showConnect(false, "grey", "initAPI");
                            resolve();
                        }
                    }
                    queryKeys();
                });
            };
            Integration.prototype.getStartMethod = function (isLeader, isUsingIndexedDB) {
                var _this = this;
                var trmAnchors = JSON.parse(self.localStorage.getItem(_this.store + "_" + "anchors" + "(" + version + ")")) || null;
                var trmConfigs = JSON.parse(self.localStorage.getItem(_this.store + "_" + "store_context" + "(" + version + ")")) || null;
                if (trmConfigs && trmConfigs.indexedDB !== isUsingIndexedDB) {
                    //off chance a device upgrades version past threshold of v70
                    trmConfigs = null;
                }
                if (trmConfigs) {
                    //make cached values avialable for cached start
                    this.setconfigs(trmConfigs);
                }
                if (trmAnchors && Object.keys(trmAnchors).length > 1) {
                    if (trmAnchors.IMS) {
                        //IMS and Settings: should load menu - cached start
                        $(".loading").remove();
                        $(".asset-wrapper").removeClass("blur");
                        trmAnchors = true;
                    }
                    else {
                        //Settings and API: should not load - but still cached start since API update isn't enough alone for full start
                        trmAnchors = true;
                    }
                }
                else if (trmAnchors && Object.keys(trmAnchors).length === 1) {
                    //Settings only: should not load and go full start
                    trmAnchors = null;
                }
                if (isUsingIndexedDB) {
                    _this.openDatabase().then(function () {
                        if (trmAnchors && trmConfigs) {
                            if (isLeader) {
                                _this.cached_start(isUsingIndexedDB);
                            }
                            else {
                                _this.observer_cachedStart(isUsingIndexedDB);
                            }
                        }
                        else {
                            if (isLeader) {
                                _this.full_start(isUsingIndexedDB);
                            }
                            else {
                                _this.observer_fullstart(isUsingIndexedDB);
                            }
                        }
                        //dont stack instances on each other!
                        if (!_this.websocket) {
                            _this.websocket = _this.connectWebsocket();
                        }
                        if (!_this.updateQueue) {
                            _this.updateQueue = _this.IMSUpdateQueue();
                        }
                    }).catch(function (error) {
                        console.error("Failed to open database:", error);
                    });
                }
                else {
                    if (isLeader) {
                        if (trmAnchors && trmConfigs) {
                            _this.cached_start(isUsingIndexedDB);
                        }
                        else {
                            _this.full_start(isUsingIndexedDB);
                        }
                        if (!_this.websocket) {
                            _this.websocket = _this.connectWebsocket();
                        }
                        if (!_this.updateQueue) {
                            _this.updateQueue = _this.IMSUpdateQueue();
                        }
                    }
                    else {
                        if (trmAnchors && trmConfigs) {
                            _this.observer_cachedStart(isUsingIndexedDB);
                        }
                        else {
                            _this.observer_fullstart(isUsingIndexedDB);
                        }
                    }
                }
            };
            Integration.prototype.checkConnections = function () {
                var _this = this;
                //Status Checks
                function checkConnection(url, source, color) {
                    fetch(url)
                        .then(function (response) {
                        if (response.ok) {
                            // Connection restored - remove error if present
                            if ($(".full-screen-error-wrapper." + source).length > 0) {
                                var obj = {
                                    "issue": "Connection Restored",
                                    "source": source,
                                    "detail": "Connectivity to " + "https://" + source + ".com" + " has been restored."
                                };
                                var connect = Mustache.to_html(FULLSCREENERROR, obj);
                                $(".full-screen-error-wrapper." + source).replaceWith(connect);
                                if (leader) {
                                    setTimeout(function () {
                                        self.localStorage.removeItem(heartbeatKey);
                                        location.reload();
                                    }, 5000);
                                }
                            }
                            _this.showConnect(false, "black", source);
                        }
                        else {
                            handleConnectionError(url, source, color);
                        }
                    })
                        .catch(function (error) {
                        handleConnectionError(url, source, color);
                    });
                }
                function handleConnectionError(url, source, color) {
                    // Check if error already displayed to avoid duplicates
                    if ($(".full-screen-error-wrapper." + source).length > 0) {
                        // Already showing error, just retry
                        setTimeout(function () {
                            checkConnection(url, source, color);
                        }, 30000);
                        return;
                    }
                    var obj = {
                        "issue": "Connection Issue",
                        "source": source,
                        "detail": "https://" + source + ".com" + " is not responding"
                    };
                    _this.showConnect(true, color, source, url.split(".com/")[0] + ".com/ is not accessible", "warning");
                    var connect = Mustache.to_html(FULLSCREENERROR, obj);
                    $(".loading").replaceWith(connect);
                    // Retry after 30 seconds
                    setTimeout(function () {
                        checkConnection(url, source, color);
                    }, 30000);
                }
                checkConnection('https://trm-client01.wandcorp.com/Trm.Api.Webservices.1412/json/reply/DefaultRequest', "wandcorp", "#f8b02d");
                checkConnection('https://api.wanddigital.com/defaultrequest', "wanddigital", "#b12228");
            };
            Integration.prototype.removeDuplicates = function (originalArray, objKey) {
                //for Qu basically.. would like to address API side.
                var trimmedArray = [];
                var values = {};
                var _loop_1 = function (i) {
                    var value = originalArray[i][objKey];
                    var price = originalArray[i].price;
                    if (values[value] !== undefined) {
                        // Remove the previously seen item
                        trimmedArray = trimmedArray.filter(function (item) { return item[objKey] !== value; });
                        // If the current item has a price of 0, skip adding it
                        if (price === 0) {
                            return "continue";
                        }
                    }
                    // If the current item does not have a price of 0, remove the previously added item with price 0
                    if (price !== 0 && values[value] === 0) {
                        trimmedArray = trimmedArray.filter(function (item) { return item[objKey] !== value || item.price !== 0; });
                    }
                    trimmedArray.push(originalArray[i]);
                    values[value] = price;
                };
                for (var i = 0; i < originalArray.length; i++) {
                    _loop_1(i);
                }
                return trimmedArray;
            };
            Integration.prototype.updateConfigs = function (settings) {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    try {
                        var configsObj_1 = {};
                        settings.forEach(function (each) {
                            if (typeof settingId_PartnerAPI === "string") {
                                // If it's a string, use it directly as the API value
                                configsObj_1.API = settingId_PartnerAPI.trim().toLowerCase();
                            }
                            else if (Array.isArray(settingId_PartnerAPI) && settingId_PartnerAPI.indexOf(each.settingID) > -1) {
                                // If it's an array (object), match to setting value
                                configsObj_1.API = each.value.trim().toLowerCase();
                            }
                            if (settingId_PartnerSite.indexOf(each.settingID) > -1) {
                                configsObj_1.siteId = each.value.trim().toLowerCase();
                            }
                            if (settingsId_Brand.indexOf(each.settingID) > -1) {
                                configsObj_1.brand = each.value.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
                            }
                        });
                        if (development || isPreview) {
                            configsObj_1.API = Partner_API ? Partner_API.toLowerCase() : configsObj_1.API;
                            configsObj_1.siteId = Establishment ? Establishment.toLowerCase() : configsObj_1.siteId;
                            configsObj_1.brand = Brand ? Brand.toLowerCase() : configsObj_1.brand;
                        }
                        //catch no settings values and set defaults
                        if (!configsObj_1.API) {
                            configsObj_1.API = "ims";
                        }
                        //allow webt business_unit and location override if no settings exist.
                        if (!configsObj_1.brand && configsObj_1.API) {
                            configsObj_1.brand = staticBusinessUnit;
                        }
                        if (!configsObj_1.siteId && configsObj_1.API) {
                            configsObj_1.siteId = staticLocation;
                        }
                        // watch for webos versions upgrades and changing of database use
                        configsObj_1.indexedDB = isUsingIndexedDB ? true : false;
                        _this.setconfigs(configsObj_1);
                        // Check for integration updates
                        var previous = self.localStorage.getItem(_this.store + "_" + "store_context" + "(" + version + ")") || null;
                        if (previous !== JSON.stringify(configsObj_1)) {
                            // Important
                            if (previous) {
                                console.log("Integration change detected...");
                                _this.deleteAnchors();
                                _this.getIntegrationData("update");
                            }
                            else {
                                //first run
                            }
                        }
                        self.localStorage.setItem(_this.store + "_" + "store_context" + "(" + version + ")", JSON.stringify(configsObj_1));
                        resolve(configsObj_1);
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            };
            Integration.prototype.setconfigs = function (configsObj) {
                var _this = this;
                if (!configsObj) {
                    return;
                }
                this.brand = configsObj.brand;
                this.establishment = configsObj.siteId;
                this.API = configsObj.API;
                //webt support 04.04.2025
                _this.business_unit = _this.business_unit ? _this.business_unit : this.brand;
                _this.location = _this.location ? _this.location : this.establishment;
                // No change for dev
                this.trmStoreId = AssetConfiguration.SId;
            };
            Integration.prototype.cached_start = function () {
                var _this = this;
                if (isUsingIndexedDB) {
                    _this.app.db = _this.db;
                }
                _this.app.store = _this.store;
                _this.app.init(_this.API, false);
                _this.getSettings();
                _this.getIMSData(false);
                if (_this.API != "ims" || _this.API != "trm") {
                    _this.getIntegrationData("patch");
                }
            };
            Integration.prototype.observer_fullstart = function () {
                var _this = this;
                //start but do not get data
                if (isUsingIndexedDB) {
                    _this.app.db = _this.db;
                }
                _this.app.store = _this.store;
                _this.app.init(_this.API, true);
            };
            Integration.prototype.observer_cachedStart = function () {
                var _this = this;
                //start but do not get data
                if (isUsingIndexedDB) {
                    _this.app.db = _this.db;
                }
                _this.app.store = _this.store;
                _this.app.init(_this.API, false);
            };
            Integration.prototype.full_start = function () {
                var _this = this;
                // Start with empty or changed databases
                _this.getSettings().then(function () {
                    if (isUsingIndexedDB) {
                        _this.app.db = _this.db;
                    }
                    _this.app.store = _this.store;
                    _this.app.init(_this.API, true);
                    _this.getIMSData(true);
                    if (_this.API != "ims" && _this.API != "trm") {
                        _this.getIntegrationData("update");
                    }
                }).catch(function (error) {
                    console.error("Failed to sync settings:", error);
                    setTimeout(function () {
                        _this.full_start();
                    }, _this.imsSettingsUpdateInterval);
                });
            };
            Integration.prototype.new_leader = function () {
                var _this = this;
                //new leader established, assume fresh calls are needed
                _this.getSettings();
                _this.getIMSData(true);
                if (_this.API != "ims" && _this.API != "trm") {
                    _this.getIntegrationData("patch");
                }
                if (!_this.websocket) {
                    _this.websocket = _this.connectWebsocket();
                }
                if (!_this.updateQueue) {
                    _this.updateQueue = _this.IMSUpdateQueue();
                }
            };
            Integration.prototype.openDatabase = function () {
                var _this = this;
                if (!_this.db) {
                    _this.db = new Dexie(_this.TABLE_NAME);
                }
                // Function to initialize database.. 
                function initializeDatabase() {
                    var db = _this.db;
                    // Define schema and versions as per your control
                    _this.db.version(version).stores({
                        IMS_settings: "settingID, setting, value",
                        IMS_products: "productId, productName, externalId, categoryId, subCategoryId, price",
                        IMS_menuItems: "menuItemId, menuZoneName, imsDaypartName, day",
                        TRM_assetZones: "azId, assetId, layerZOrder, zoneName",
                        TRM_menuItems: "id, name, value",
                        integration_products: "mappingId, name, category, price",
                        integration_modifiers: "mappingId, name, category, price",
                        integration_discounts: "mappingId, name, price",
                    });
                    return db.open().then(function () {
                        //no message
                    }).catch(function (error) {
                        if (error.name === 'NotFoundError' || error.name === 'VersionError') {
                            console.warn('Upgrade error detected. Needs upgrade.');
                            throw error; // Rethrow to handle in the outer Promise
                        }
                        else {
                            console.error('Error opening database:', error.message);
                            throw error; // Rethrow to handle in the outer Promise
                        }
                    });
                }
                //handle a close.. not sure where it come from
                _this.db.on("close", function () {
                    _this.openDatabase().then(function () {
                        _this.app.db = _this.db;
                    });
                });
                return initializeDatabase().then(function () {
                    //no action
                }).catch(function (error) {
                    console.error('Failed to initialize and upgrade database:', error);
                    isUsingIndexedDB = false;
                    _this.init(true, false);
                    console.warn("IndexedDB is not available, switching to localStorage.");
                });
            };
            Integration.prototype.getSettings = function () {
                var _this = this;
                if (!leader) {
                    return;
                }
                _this.setting_TimeOuts.forEach(function (each) {
                    clearTimeout(each);
                });
                // Return a promise
                return new Promise(function (resolve, reject) {
                    if (!isUsingSettings) {
                        resolve();
                        return;
                    }
                    function fetchSettings(retries) {
                        var url = "https://trm-client01.wandcorp.com/trmws.digitalproxyws/json/reply/StoreSettingsRequest?apiKey=".concat(_this.apiKey, "&deviceNumber=&storeKey=").concat(_this.store);
                        $.get(url)
                            .done(function (data) {
                            _this.addSettings(data).then(function () {
                                resolve();
                                _this.setSync("settings");
                                _this.showConnect(false, "steelblue", "settings");
                                _this.setting_TimeOuts.push(setTimeout(function () {
                                    _this.getSettings();
                                }, _this.imsSettingsUpdateInterval));
                            }).catch(function (error) {
                                console.error("Error in addSettings:", error);
                                reject(error);
                            });
                        })
                            .fail(function () {
                            console.warn("Could not load settings data!");
                            if (retries > 0) {
                                console.log("Retrying... Remaining retries:", retries);
                                setTimeout(function () {
                                    fetchSettings(retries - 1);
                                }, 30000);
                            }
                            else {
                                _this.setting_TimeOuts.push(setTimeout(function () {
                                    _this.getSettings();
                                }, _this.imsSettingsUpdateInterval));
                                _this.showConnect(true, "steelblue", "settings", "Failed to sync settings", "error");
                                reject(new Error("Failed to load settings data after retries."));
                            }
                        });
                    }
                    fetchSettings(_this.settingsRetries);
                });
            };
            Integration.prototype.forceIMSUpdate = function (table, item, action) {
                var _this = this;
                window.dispatchEvent(new CustomEvent('dbChangeEvent', {
                    detail: {
                        table: table,
                        item: item,
                        action: action
                    }
                }));
                localStorage.setItem(_this.store + '_dbChangeEvent' + "(" + version + ")", JSON.stringify({
                    table: table,
                    item: item,
                    action: action
                }));
            };
            Integration.prototype.getPagedWebtritionData = function (requestOptions) {
                return __awaiter(this, void 0, void 0, function () {
                    var pageSize, endpoint, baseBody, getPage, firstPage, firstData, allItems, totalItems, requests, nextPage, totalPages, page, pages;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                pageSize = this.webtritionPageSize;
                                endpoint = requestOptions && requestOptions.url ? requestOptions.url : "";
                                baseBody = requestOptions && requestOptions.body ? requestOptions.body : {};
                                getPage = function (offset) {
                                    return new Promise(function (resolve, reject) {
                                        var payload = Object.assign({}, baseBody);
                                        payload.offset = offset;
                                        payload.limit = pageSize;
                                        Object.keys(payload).forEach(function (key) {
                                            if (payload[key] === undefined || payload[key] === null || payload[key] === "") {
                                                delete payload[key];
                                            }
                                        });
                                        $.ajax({
                                            url: endpoint,
                                            type: "POST",
                                            contentType: "application/json; charset=utf-8",
                                            dataType: "json",
                                            data: JSON.stringify(payload)
                                        }).done(function (data, status, xhr) {
                                            resolve({
                                                data: data,
                                                statusCode: xhr.status
                                            });
                                        }).fail(function (xhr, status, error) {
                                            reject({
                                                xhr: xhr,
                                                status: status,
                                                error: error
                                            });
                                        });
                                    });
                                };
                                return [4 /*yield*/, getPage(1)];
                            case 1:
                                firstPage = _a.sent();
                                firstData = firstPage.data || {};
                                allItems = firstData.menuItems ? firstData.menuItems.slice() : [];
                                totalItems = parseInt(firstData.totalItems, 10) || allItems.length;
                                if (firstPage.statusCode !== 200 || totalItems <= allItems.length) {
                                    return [2 /*return*/, {
                                            data: firstData,
                                            statusCode: firstPage.statusCode
                                        }];
                                }
                                requests = [];
                                nextPage = (parseInt(firstData.offset, 10) || 1) + 1;
                                totalPages = Math.ceil(totalItems / pageSize);
                                for (page = nextPage; page <= totalPages; page++) {
                                    requests.push(getPage(page));
                                }
                                return [4 /*yield*/, Promise.all(requests)];
                            case 2:
                                pages = _a.sent();
                                pages.forEach(function (page) {
                                    var pageItems = page.data && page.data.menuItems ? page.data.menuItems : [];
                                    allItems = allItems.concat(pageItems);
                                });
                                firstData.menuItems = allItems;
                                firstData.count = allItems.length;
                                firstData.limit = pageSize;
                                firstData.offset = 1;
                                firstData.totalItems = totalItems;
                                return [2 /*return*/, {
                                        data: firstData,
                                        statusCode: firstPage.statusCode
                                    }];
                        }
                    });
                });
            };
            ;
            Integration.prototype.getTrmData = function () {
                var _this = this;
                if (client && leader) {
                    var normalizeTrmPayload_1 = function (payload) {
                        var nowEpoch = Math.floor(new Date(currentTime()).getTime() / 1000);
                        var toNumber = function (value) {
                            var n = Number(value);
                            return Number.isFinite(n) ? n : 0;
                        };
                        var getEffectiveEpoch = function (item) {
                            return toNumber(item && item.effectiveEpoch);
                        };
                        var getModifiedEpoch = function (item) {
                            if (!item) {
                                return 0;
                            }
                            if (item.modifiedEpoch !== undefined && item.modifiedEpoch !== null) {
                                return toNumber(item.modifiedEpoch);
                            }
                            if (item.aggregatedModifiedEpoch !== undefined && item.aggregatedModifiedEpoch !== null) {
                                return toNumber(item.aggregatedModifiedEpoch);
                            }
                            if (item.modified && item.modified.EpochSeconds !== undefined && item.modified.EpochSeconds !== null) {
                                return toNumber(item.modified.EpochSeconds);
                            }
                            if (item.modified && item.modified.epochSeconds !== undefined && item.modified.epochSeconds !== null) {
                                return toNumber(item.modified.epochSeconds);
                            }
                            return 0;
                        };
                        var isEffectiveNow = function (item) {
                            var eff = getEffectiveEpoch(item);
                            return eff === 0 || eff <= nowEpoch;
                        };
                        var chooseNewestEffective = function (currentItem, nextItem) {
                            if (!currentItem) {
                                return nextItem;
                            }
                            var currentEffective = isEffectiveNow(currentItem);
                            var nextEffective = isEffectiveNow(nextItem);
                            if (currentEffective !== nextEffective) {
                                return nextEffective ? nextItem : currentItem;
                            }
                            var currentEffEpoch = getEffectiveEpoch(currentItem);
                            var nextEffEpoch = getEffectiveEpoch(nextItem);
                            if (nextEffEpoch !== currentEffEpoch) {
                                return nextEffEpoch > currentEffEpoch ? nextItem : currentItem;
                            }
                            var currentModEpoch = getModifiedEpoch(currentItem);
                            var nextModEpoch = getModifiedEpoch(nextItem);
                            if (nextModEpoch !== currentModEpoch) {
                                return nextModEpoch > currentModEpoch ? nextItem : currentItem;
                            }
                            var currentDetailId = toNumber(currentItem.menuItemDetailId || currentItem.key);
                            var nextDetailId = toNumber(nextItem.menuItemDetailId || nextItem.key);
                            return nextDetailId > currentDetailId ? nextItem : currentItem;
                        };
                        var toCamelCaseKey = function (key) {
                            var raw = String(key || "");
                            if (raw === "") {
                                return raw;
                            }
                            var normalized = raw
                                .replace(/[_\-\s]+(.)?/g, function (match, chr) { return chr ? chr.toUpperCase() : ""; })
                                .replace(/[^a-zA-Z0-9]/g, "");
                            if (normalized === "") {
                                return "";
                            }
                            return normalized.charAt(0).toLowerCase() + normalized.slice(1);
                        };
                        var toCamelCaseObject = function (obj) {
                            var output = {};
                            Object.keys(obj || {}).forEach(function (key) {
                                var camelKey = toCamelCaseKey(key);
                                if (camelKey) {
                                    output[camelKey] = obj[key];
                                }
                            });
                            return output;
                        };
                        var source = payload || {};
                        var normalizedAssetDetail = (Array.isArray(source.assetDetail) ? source.assetDetail : [])
                            .filter(function (each) { return each && each.azId !== undefined && each.azId !== null && String(each.azId).trim() !== ""; })
                            .map(function (each) { return Object.assign({}, each); });
                        var normalizedMenuItems = (Array.isArray(source.menuItems) ? source.menuItems : [])
                            .map(function (each) {
                            var item = toCamelCaseObject(Object.assign({}, each));
                            // id may already be set from CF "Id" field via camelCase; only derive from other fields if missing
                            item.id = String(item.id || item.menuItemId || item.menuItemDetailId || item.itemId || "").trim();
                            return item;
                        })
                            .filter(function (item) { return item.id !== ""; });
                        var dedupedMenuItems = [];
                        var dedupedMenuIndex = {};
                        normalizedMenuItems.forEach(function (item) {
                            var key = item.id;
                            var existingIndex = dedupedMenuIndex[key];
                            if (existingIndex === undefined) {
                                dedupedMenuIndex[key] = dedupedMenuItems.length;
                                dedupedMenuItems.push(item);
                                return;
                            }
                            dedupedMenuItems[existingIndex] = chooseNewestEffective(dedupedMenuItems[existingIndex], item);
                        });
                        normalizedAssetDetail.sort(function (a, b) { return String(a.azId).localeCompare(String(b.azId), undefined, { numeric: true }); });
                        dedupedMenuItems.sort(function (a, b) { return String(a.id).localeCompare(String(b.id), undefined, { numeric: true }); });
                        return {
                            assetZones: normalizedAssetDetail,
                            menuItems: dedupedMenuItems
                        };
                    };
                    readClientDB({
                        platform: platform,
                        daypartId: AssetConfiguration.DAYid,
                        storeKey: AssetConfiguration.SKey,
                        displayId: AssetConfiguration.DISid
                    }).then(function (data) {
                        var normalizedData = normalizeTrmPayload_1(data);
                        if (clientDB && _.isEqual(clientDB, normalizedData)) {
                            // do nothing
                        }
                        else {
                            clientDB = normalizedData;
                            _this.addItems(normalizedData.assetZones, "update", "TRM_assetZones", "azId");
                            _this.addItems(normalizedData.menuItems, "update", "TRM_menuItems", "id");
                        }
                    }).catch(function (error) {
                        console.error("Failed to read TRM data from IndexedDB:", error);
                    });
                    setTimeout(function () {
                        _this.getTrmData();
                    }, _this.trmUpdateInterval);
                }
                else {
                    console.warn("TRM client is not available.");
                }
            };
            Integration.prototype.getIMSData = function (fullStart) {
                var _this = this;
                if (!leader) {
                    return;
                }
                _this.IMS_TimeOuts.forEach(function (each) {
                    clearTimeout(each);
                });
                var url = _this.IMSwand + "/services/ims/client/V3/menusystem?" + "StoreKey=" + _this.store + "&Date=" + currentTime().split("T")[0];
                $.get(url, function (data) {
                    if (fullStart && data && !data.error.code && data.value.response.products.length === 0) {
                        _this.forceIMSUpdate("IMS_menuItems", "forceUpdate", "update");
                        console.warn("IMS not in use for this location");
                        return;
                    }
                    _this.addIMSData(data);
                })
                    .done(function () {
                    _this.showConnect(false, "blueviolet", "IMS");
                    _this.setSync("IMS");
                    _this.IMS_TimeOuts.push(setTimeout(function () {
                        _this.getIMSData();
                    }, _this.imsItemsUpdateInterval));
                })
                    .fail(function () {
                    console.warn("Could not load ims data!");
                    _this.showConnect(true, "blueviolet", "IMS", "Failed to sync IMS data", "error");
                    if (_this.imsRetries > 0) {
                        _this.imsRetries = _this.imsRetries - 1;
                        _this.IMS_TimeOuts.push(setTimeout(function () {
                            _this.getIMSData();
                        }, 30000));
                    }
                    else {
                        _this.IMS_TimeOuts.push(setTimeout(function () {
                            _this.imsRetries = 1;
                            _this.getIMSData();
                        }, _this.imsItemsUpdateInterval));
                    }
                });
            };
            Integration.prototype.addIMSData = function (data) {
                //format to store in indexedDB
                var _this = this;
                var menuItems = data.value.response.menuItems ? data.value.response.menuItems : [];
                var products = data.value.response.products ? data.value.response.products : [];
                products.forEach(function (each) {
                    //rich text editor support
                    each.menuDescription = each.menuDescription ? each.menuDescription.replace("<span>", "").replace("</span>", "") : "";
                    each.displayName = each.displayName ? each.displayName.replace("<span>", "").replace("</span>", "") : "";
                    each.menuDescription = each.menuDescription.replace("<p><br></p>", "").replace(/<\/p><p>/g, '<br>').replace(/<p>/, "").replace(/<\/p>/, "");
                    each.displayName = each.displayName.replace("<p><br></p>", "").replace(/<\/p><p>/g, '<br>').replace(/<p>/, "").replace(/<\/p>/, "");
                });
                if (data.isSuccess) {
                    if (menuItems.length > 0) {
                        _this.addItems(menuItems, "update", "IMS_menuItems", "menuItemId");
                    }
                    if (products.length > 0) {
                        _this.addItems(products, "patch", "IMS_products", "productId");
                    }
                    else {
                        console.warn("IMS products not found or empty!");
                        this.app.IMSUpdate = true;
                    }
                }
                try {
                }
                catch (err) {
                    console.error("this.app does not exist yet...");
                }
            };
            Integration.prototype.addSettings = function (data) {
                var _this_1 = this;
                //format to store in indexedDB
                var _this = this;
                return new Promise(function (resolve, reject) {
                    try {
                        var settings_1 = data.settings;
                        var setting;
                        var setting;
                        var value_1;
                        var settingID_1;
                        var groupID_1;
                        settings_1.forEach(function (each, idx) {
                            setting = each[0];
                            value_1 = each[1];
                            settingID_1 = each[2];
                            groupID_1 = each[3];
                            settings_1[idx] = {
                                setting: setting,
                                value: value_1,
                                settingID: settingID_1,
                                groupID: groupID_1,
                            };
                            // Add an id so the template works
                            settings_1[idx].id = settingID_1;
                        });
                        _this.updateConfigs(settings_1).then(resolve());
                        if (settings_1.length > 0) {
                            _this.addItems(settings_1, "update", "IMS_settings", "settingID");
                        }
                        else {
                            console.warn("No settings found in the response.");
                            _this_1.app.settingsUpdate = true;
                        }
                    }
                    catch (error) {
                        reject(error);
                    }
                });
            };
            Integration.prototype.getIntegrationData = function (action) {
                var _this = this;
                if (!_this.API || !leader) {
                    return;
                }
                _this.Integration_TimeOuts.forEach(function (each) {
                    clearTimeout(each);
                });
                var key = _this.store + "_" + "anchors" + "(" + version + ")";
                var anchors = JSON.parse(self.localStorage.getItem(key)) || {};
                var modifiedDate = anchors[_this.API] ? anchors[_this.API].date.split("T")[0] : "";
                var currentDateLocal = currentTime().split("T")[0];
                _this.integrationUpdateInterval = Math.floor(Math.random() * (_this.maxUpdate - _this.minUpdate + 1)) + _this.minUpdate;
                _this.fallbackInterval = _this.attempts === 0 ? 30000 : _this.fallbackInterval + 30000;
                _this.attempts++;
                if (_this.fallbackInterval > _this.integrationUpdateInterval) {
                    _this.fallbackInterval = _this.integrationUpdateInterval;
                }
                var url = "";
                if (_this.API === "revel") {
                    _this.maxUpdate = 9000000;
                    _this.minUpdate = 18000000;
                    _this.integrationUpdateInterval = Math.floor(Math.random() * (_this.maxUpdate - _this.minUpdate + 1)) + _this.minUpdate;
                    url = "https://revel-" + _this.wand + "/integration?client=" + _this.brand + "&id=" + _this.establishment + "&date=" + modifiedDate + "&storeId=" + _this.store;
                }
                if (_this.API === "qu") {
                    var timeOfDay = new Date().toTimeString().split(" ")[0];
                    //Qu should use current day instead of date modified so scheudled pricing works correctly
                    url = "https://qubeyond-" + _this.wand + "/integration?id=" + _this.establishment + "&concept=" + _this.brand + "&date=" + currentDateLocal + "&time=" + timeOfDay;
                }
                if (_this.API === "par") {
                    url = "https://" + _this.wand + "/integrations/parbrink/v1" + "?concept=" + _this.brand + "&id=" + _this.establishment;
                }
                if (_this.API === "toast") {
                    var apiEndpoint = "https://" + _this.wand + "/services/toast/client/menu/";
                    url = {
                        url: apiEndpoint,
                        headers: {
                            Authorization: _this.trmStoreId,
                        },
                    };
                }
                if (_this.API === "shift4") {
                    url = "https://shift4-" + _this.wand + "/integration" + "?id=" + _this.establishment;
                }
                if (_this.API === "simphony") {
                    url = "https://simphony-" + _this.wand + "/integration" + "?concept=" + _this.brand + "&id=" + _this.establishment;
                }
                if (_this.API === "transact") {
                    url = "https://transact-" + _this.wand + "/integration" + "?concept=" + _this.brand;
                }
                if (_this.API === "clover") {
                    url = "https://" + _this.wand + "/integrations/" + _this.API + "/v1/" + _this.brand + "?merchantId=" + _this.establishment;
                }
                if (_this.API === "mealtracker") {
                    var startDate = currentTime().split("T")[0];
                    url = "https://appjel-" + _this.wand + "/integration" + "?id=" + _this.establishment + "&startDate=" + startDate;
                }
                if (_this.API === "venuenext") {
                    url = "https://venuenext-" + _this.wand + "/integration" + "?id=" + _this.establishment + "&org=" + _this.brand;
                }
                if (_this.API === "bepoz") {
                    url = "https://bepoz-" + _this.wand + "/integration" + "?concept=" + _this.brand;
                }
                if (_this.API === "centricos") {
                    url = "https://centric-" + _this.wand + "/integration" + "?id=" + _this.establishment;
                }
                if (_this.API === "webtrition") {
                    url = {
                        url: "https://" + _this.wand + "/services/webtrition/client/wds",
                        body: {
                            sapCode: _this.brand,
                            venue: _this.establishment,
                            menuDate: currentTime(),
                            days: 7,
                            includeNutrients: true,
                            channel: "stable",
                            allergenMenu: "all"
                        }
                    };
                }
                if (_this.API === "bonappetit") {
                    url = "https://" + _this.wand + "/integrations/" + _this.API + "?campus=" + _this.brand + "&cafe=" + _this.establishment + "&menuDate=" + currentTime();
                }
                if (_this.API === "biggby") {
                    url = "https://biggby-api.wanddigital.com/integration?id=" + _this.establishment;
                }
                if (url === "") {
                    console.warn("No integration API configured for " + _this.API);
                    return;
                }
                var scheduleNextSync = function () {
                    _this.Integration_TimeOuts.forEach(function (each) {
                        clearTimeout(each);
                    });
                    _this.Integration_TimeOuts = [];
                    _this.Integration_TimeOuts.push(setTimeout(function () {
                        _this.getIntegrationData();
                    }, _this.integrationUpdateInterval));
                };
                var handleSuccess = function (statusCode, message) {
                    var hasError = !!(message && message.hasError);
                    if (statusCode === 200 && !hasError) {
                        integration.showConnect(false, "forestgreen", _this.API);
                        _this.setSync(_this.API);
                        _this.addIntegrationData(message, action);
                        _this.attempts = 0;
                        scheduleNextSync();
                        return;
                    }
                    if (statusCode === 204) {
                        _this.integrationUpdateInterval = _this.fallbackInterval;
                    }
                    handleFailure();
                };
                var handleFailure = function () {
                    console.warn("Could not load integration data!");
                    _this.integrationUpdateInterval = _this.attempts > 1 ? _this.integrationUpdateInterval : _this.fallbackInterval;
                    integration.showConnect(true, "forestgreen", _this.API, "Failed to sync Integration data", "error");
                    if (_this.attempts === 2) {
                        try {
                            _this.app.readDatabase();
                        }
                        catch (err) {
                            console.error("configuration for " + _this.API + " is incorrect");
                            _this.attempts = 0;
                        }
                    }
                    scheduleNextSync();
                };
                if (_this.API === "webtrition") {
                    _this.webtritionRequestQueue = (_this.webtritionRequestQueue || Promise.resolve())
                        .catch(function () { return null; })
                        .then(function () {
                        return _this.getPagedWebtritionData(url);
                    })
                        .then(function (response) {
                        handleSuccess(response.statusCode, response.data);
                        return response;
                    })
                        .catch(function () {
                        handleFailure();
                        return null;
                    });
                    return;
                }
                $.get(url, function (data, status, xhr) {
                    handleSuccess(xhr.status, data);
                })
                    .fail(function () {
                    handleFailure();
                });
            };
            Integration.prototype.addIntegrationData = function (data, action) {
                //format to store in indexedDB
                var _this = this;
                if (!data) {
                    return;
                }
                var products;
                var modifiers;
                var discounts;
                if (_this.API === "qu") {
                    action = "update";
                    products = data.menuItems ? _this.formatQu(data.menuItems) : {};
                    modifiers = data.modifiers ? _this.formatQu(data.modifiers) : {};
                    discounts = data.discounts ? _this.formatQu(data.discounts) : {};
                }
                if (_this.API === "revel") {
                    products = data.products ? _this.formatRevel(data.products) : {};
                    modifiers = data.modifiers ? _this.formatRevel(data.modifiers) : {};
                }
                if (_this.API === "toast") {
                    //gets full return, delete items not present
                    action = "update";
                    products = data ? _this.formatToast(data) : {};
                    modifiers = data ? _this.formatToast(data, true) : {};
                }
                if (_this.API === "par") {
                    //gets full return, delete items not present
                    action = "update";
                    products = data.items ? _this.formatPar(data.items, false) : {};
                    modifiers = data.modifier_groups ? _this.formatPar(data.modifier_groups, true) : {};
                }
                if (_this.API === "shift4") {
                    //gets full return, delete items not present
                    action = "update";
                    var shiftData = data.items ? _this.formatShift(data) : {};
                    products = shiftData.items ? shiftData.items : {};
                    modifiers = shiftData.modifiers ? shiftData.modifiers : {};
                }
                if (_this.API === "simphony") {
                    var simphonyData = data.data ? _this.formatSimphony(data.data) : {};
                    products = simphonyData.items ? simphonyData.items : {};
                    modifiers = simphonyData.modifiers ? simphonyData.modifiers : {};
                }
                if (_this.API === "transact") {
                    products = data.data ? _this.formatTransact(data.data) : {};
                }
                if (_this.API === "clover") {
                    products = data.menu ? _this.formatClover(data, "products") : {};
                    modifiers = data.mods ? _this.formatClover(data, "modifiers") : {};
                }
                if (_this.API === "mealtracker") {
                    action = "update";
                    products = data.data ? _this.formatMealtracker(data.data, "products") : {};
                }
                if (_this.API === "webtrition") {
                    action = "update";
                    products = data.menuItems ? _this.formatWebtrition(data.menuItems) : {};
                }
                if (_this.API === "venuenext") {
                    action = "update";
                    products = data ? _this.formatVenueNext(data) : {};
                }
                if (_this.API === "bonappetit") {
                    action = "update";
                    products = data.menuItems ? _this.formatBonappetit(data.menuItems) : {};
                }
                if (_this.API === "bepoz") {
                    action = "update";
                    products = data.data ? _this.formatBepoz(data.data) : {};
                }
                if (_this.API === "centricos") {
                    action = "update";
                    var centricData = data.data ? _this.formatcentric(data.data) : {};
                    products = centricData.products ? centricData.products : {};
                    modifiers = centricData.modifiers ? centricData.modifiers : {};
                }
                if (_this.API === "biggby") {
                    action = "update";
                    var biggbyData = data ? _this.formatBiggby(data) : {};
                    products = biggbyData.products ? biggbyData.products : {};
                    modifiers = biggbyData.modifiers ? biggbyData.modifiers : {};
                }
                if (products && products.length > 0) {
                    _this.addItems(products, action, "integration_products", "mappingId");
                }
                if (modifiers && modifiers.length > 0) {
                    _this.addItems(modifiers, action, "integration_modifiers", "mappingId");
                }
                if (discounts && discounts.length > 0) {
                    discounts.forEach(function (item, idx) {
                        if (_this.API === "qu") {
                            discounts[idx].mappingId = item.id.toString();
                            discounts[idx].price = item.discountAmount;
                        }
                    });
                    _this.addItems(discounts, action, "integration_discounts", "mappingId");
                }
            };
            Integration.prototype.addItems = function (items_1) {
                return __awaiter(this, arguments, void 0, function (items, action, table, id) {
                    var _this, handleDatabaseChangeEvent, handleIndexedDB, handleLocalStorage, error_1;
                    var _this_1 = this;
                    if (action === void 0) { action = "patch"; }
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _this = this;
                                handleDatabaseChangeEvent = function (table, item, action) {
                                    window.dispatchEvent(new CustomEvent('dbChangeEvent', {
                                        detail: {
                                            table: table,
                                            item: item,
                                            action: action
                                        }
                                    }));
                                    localStorage.setItem(_this.store + '_dbChangeEvent' + "(" + version + ")", JSON.stringify({
                                        table: table,
                                        item: item,
                                        action: action
                                    }));
                                };
                                handleIndexedDB = function () { return __awaiter(_this_1, void 0, void 0, function () {
                                    var _this_1 = this;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, _this.db.transaction('rw', _this.db[table], function () { return __awaiter(_this_1, void 0, void 0, function () {
                                                    var allItems, newIds, _i, items_2, item, existingItem, _a, allItems_1, item, _b, items_3, item, existingItem;
                                                    return __generator(this, function (_c) {
                                                        switch (_c.label) {
                                                            case 0: return [4 /*yield*/, _this.db[table].toArray()];
                                                            case 1:
                                                                allItems = _c.sent();
                                                                newIds = items.map(function (item) { return item[id]; });
                                                                if (!(action === 'patch' || action === 'update')) return [3 /*break*/, 14];
                                                                _i = 0, items_2 = items;
                                                                _c.label = 2;
                                                            case 2:
                                                                if (!(_i < items_2.length)) return [3 /*break*/, 9];
                                                                item = items_2[_i];
                                                                return [4 /*yield*/, _this.db[table].get(item[id])];
                                                            case 3:
                                                                existingItem = _c.sent();
                                                                if (!existingItem) return [3 /*break*/, 6];
                                                                if (!!_.isEqual(existingItem, item)) return [3 /*break*/, 5];
                                                                return [4 /*yield*/, _this.db[table].put(item)];
                                                            case 4:
                                                                _c.sent();
                                                                handleDatabaseChangeEvent(table, item, 'updated');
                                                                _c.label = 5;
                                                            case 5: return [3 /*break*/, 8];
                                                            case 6: return [4 /*yield*/, _this.db[table].add(item)];
                                                            case 7:
                                                                _c.sent();
                                                                handleDatabaseChangeEvent(table, item, 'added');
                                                                _c.label = 8;
                                                            case 8:
                                                                _i++;
                                                                return [3 /*break*/, 2];
                                                            case 9:
                                                                if (!(action === 'update')) return [3 /*break*/, 13];
                                                                _a = 0, allItems_1 = allItems;
                                                                _c.label = 10;
                                                            case 10:
                                                                if (!(_a < allItems_1.length)) return [3 /*break*/, 13];
                                                                item = allItems_1[_a];
                                                                if (!!newIds.includes(item[id])) return [3 /*break*/, 12];
                                                                return [4 /*yield*/, _this.db[table].delete(item[id])];
                                                            case 11:
                                                                _c.sent();
                                                                handleDatabaseChangeEvent(table, item, 'deleted');
                                                                _c.label = 12;
                                                            case 12:
                                                                _a++;
                                                                return [3 /*break*/, 10];
                                                            case 13: return [3 /*break*/, 19];
                                                            case 14:
                                                                if (!(action === 'delete')) return [3 /*break*/, 19];
                                                                _b = 0, items_3 = items;
                                                                _c.label = 15;
                                                            case 15:
                                                                if (!(_b < items_3.length)) return [3 /*break*/, 19];
                                                                item = items_3[_b];
                                                                return [4 /*yield*/, _this.db[table].get(item[id])];
                                                            case 16:
                                                                existingItem = _c.sent();
                                                                if (!existingItem) return [3 /*break*/, 18];
                                                                return [4 /*yield*/, _this.db[table].delete(item[id])];
                                                            case 17:
                                                                _c.sent();
                                                                handleDatabaseChangeEvent(table, item, 'deleted');
                                                                _c.label = 18;
                                                            case 18:
                                                                _b++;
                                                                return [3 /*break*/, 15];
                                                            case 19: return [2 /*return*/];
                                                        }
                                                    });
                                                }); })];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                }); };
                                handleLocalStorage = function () {
                                    var oldValue = JSON.parse(localStorage.getItem(_this.store + "_" + table + "(" + version + ")")) || [];
                                    var newProductMap = new Map(items.map(function (product) { return [product[id], product]; }));
                                    if (action === 'patch' || action === 'update') {
                                        oldValue = oldValue.filter(function (existingProduct) {
                                            if (!Array.from(newProductMap.keys()).includes(existingProduct[id]) && action === 'update') {
                                                handleDatabaseChangeEvent(table, existingProduct, 'delete');
                                                return false;
                                            }
                                            return true;
                                        });
                                        items.forEach(function (newProduct) {
                                            var existingProduct = oldValue.find(function (product) { return product[id] === newProduct[id]; });
                                            if (existingProduct) {
                                                if (!_.isEqual(existingProduct, newProduct)) {
                                                    oldValue = oldValue.map(function (product) { return product[id] === newProduct[id] ? newProduct : product; });
                                                    handleDatabaseChangeEvent(table, newProduct, 'updated');
                                                }
                                            }
                                            else {
                                                oldValue.push(newProduct);
                                                handleDatabaseChangeEvent(table, newProduct, 'added');
                                            }
                                        });
                                        if (action === 'update') {
                                            var currentIds_1 = Array.from(newProductMap.keys());
                                            oldValue = oldValue.filter(function (existingProduct) {
                                                if (!currentIds_1.includes(existingProduct[id])) {
                                                    handleDatabaseChangeEvent(table, existingProduct, 'delete');
                                                    return false;
                                                }
                                                return true;
                                            });
                                        }
                                    }
                                    else if (action === 'delete') {
                                        oldValue = oldValue.filter(function (product) {
                                            if (items.find(function (newProduct) { return newProduct[id] === product[id]; })) {
                                                handleDatabaseChangeEvent(table, product, 'delete');
                                                return false;
                                            }
                                            return true;
                                        });
                                    }
                                    localStorage.setItem(_this.store + "_" + table + "(" + version + ")", JSON.stringify(oldValue));
                                };
                                if (!isUsingIndexedDB) return [3 /*break*/, 5];
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 3, , 4]);
                                return [4 /*yield*/, handleIndexedDB()];
                            case 2:
                                _a.sent();
                                return [3 /*break*/, 4];
                            case 3:
                                error_1 = _a.sent();
                                if (error_1.name === "DatabaseClosedError") {
                                    _this.openDatabase().then(function () {
                                        _this.app.db = _this.db;
                                        _this.app.fullStart = true;
                                        _this.full_start();
                                    });
                                }
                                return [3 /*break*/, 4];
                            case 4: return [3 /*break*/, 6];
                            case 5:
                                handleLocalStorage();
                                _a.label = 6;
                            case 6: return [2 /*return*/];
                        }
                    });
                });
            };
            Integration.prototype.setUpdatedDate = function (anchor) {
                var _this = this;
                var key = _this.store + "_" + "anchors" + "(" + version + ")";
                // Retrieve existing anchors from local storage
                var anchors = JSON.parse(self.localStorage.getItem(key)) || {};
                // Update the specific anchor with new data
                anchors[anchor] = {
                    date: currentTime(),
                    lastSync: Date.now(),
                };
                // Save the updated anchors back to local storage
                self.localStorage.setItem(key, JSON.stringify(anchors));
            };
            Integration.prototype.deleteAnchors = function () {
                var _this = this;
                var key = _this.store + "_" + "anchors" + "(" + version + ")";
                // Remove the anchors key from local storage
                self.localStorage.removeItem(key);
            };
            Integration.prototype.setSync = function (anchor) {
                var _this = this;
                var key = _this.store + "_" + "anchors" + "(" + version + ")";
                // Retrieve existing anchors from local storage
                var anchors = JSON.parse(self.localStorage.getItem(key)) || {};
                // Retrieve the modifiedTime of the specific anchor
                var modifiedTime = anchors[anchor] ? anchors[anchor].date : "";
                // Update the specific anchor's lastSync value
                anchors[anchor] = {
                    date: modifiedTime,
                    lastSync: Date.now(),
                };
                // Save the updated anchors back to local storage
                self.localStorage.setItem(key, JSON.stringify(anchors));
            };
            Integration.prototype.showConnect = function (toggle, color, source, issue, error, lineNumber, errorDetails) {
                //added full screen error alert for development mode
                //set up errors and display with centered alert for errors
                if (toggle && $(".status-wrapper").length === 0) {
                    var statusWrapper = document.createElement("div");
                    $(statusWrapper).addClass("status-wrapper");
                    $("body").append(statusWrapper);
                }
                // Show centered alert for errors, otherwise show status icon
                if (toggle && typeof issue === "object" && development) {
                    // Extract line number from stack trace if not provided
                    if (!lineNumber && errorDetails && errorDetails.stack) {
                        // Try to match various patterns: integration.js:123, at integration.js:123, (integration.js:123:45)
                        // Also handle query parameters like integration.js?v=1:123
                        var stackMatch = errorDetails.stack.match(/integration\.js.*?:(\d+)/i);
                        // Fallback 1: Look for any .js file match if integration.js wasn't found
                        if (!stackMatch) {
                            stackMatch = errorDetails.stack.match(/\.js.*?:(\d+)/i);
                        }
                        // Fallback 2: Look for generic :line:column pattern (e.g. :123:45)
                        if (!stackMatch) {
                            stackMatch = errorDetails.stack.match(/:(\d+):\d+/);
                        }
                        if (stackMatch && stackMatch[1]) {
                            lineNumber = stackMatch[1];
                        }
                        else {
                            // Try to match from Error().stack pattern
                            var currentStack = new Error().stack;
                            if (currentStack) {
                                var currentMatch = currentStack.match(/integration\.js.*?:(\d+)/i);
                                if (currentMatch && currentMatch[1]) {
                                    lineNumber = currentMatch[1];
                                }
                            }
                        }
                    }
                    // Create centered error alert
                    if ($(".error-alert-overlay").length === 0) {
                        var issueMessage = issue;
                        var issueStack = null;
                        if (typeof issue === "object") {
                            issueMessage = issue.message || issue.toString();
                            if (issue.stack) {
                                issueStack = issue.stack.replace(/\n/g, "<br>");
                            }
                        }
                        var obj = {
                            color: color,
                            source: source,
                            issue: issueMessage || "Connection Error",
                            issueStack: issueStack,
                            error: error,
                            lineNumber: lineNumber || "N/A",
                            errorMessage: errorDetails && errorDetails.message ? errorDetails.message : "No error message available",
                            errorStack: errorDetails && errorDetails.stack ? errorDetails.stack.replace(/\n/g, "<br>") : "No stack trace available",
                        };
                        var alert_1 = Mustache.to_html(Integration.errorAlert, obj);
                        $("body").append(alert_1);
                        // Add click handler to dismiss
                        $(".error-alert-overlay, .error-alert-close").on("click", function () {
                            $(".error-alert-overlay").remove();
                        });
                        // Prevent click on alert content from closing
                        $(".error-alert-content").on("click", function (e) {
                            e.stopPropagation();
                        });
                    }
                }
                else {
                    // Show status icon for non-error states
                    var obj = {
                        color: color,
                        source: source,
                        issue: issue,
                        error: error,
                    };
                    if ($(".connect" + "." + source).length === 0 && toggle) {
                        var connect = Mustache.to_html(Integration.connect, obj);
                        $(".status-wrapper").append(connect);
                    }
                    if (!toggle) {
                        $(".connect" + "." + source).remove();
                        $(".error-alert-overlay." + source).remove();
                    }
                }
            };
            Integration.prototype.connectWebsocket = function () {
                var _this = this;
                // Base delay for throttling (in milliseconds)
                var baseDelay = 1000; // 1 second
                var maxDelay = 30000; // 30 seconds
                var delay = baseDelay;
                function connect(reload) {
                    try {
                        var url = "wss://" +
                            _this.orderStatus +
                            "/?device=IMS_MENUUPDATE_" +
                            _this.store;
                        var ws_1 = new WebSocket(url);
                        ws_1.onopen = function () {
                            _this.showConnect(false, "yellow", "websocket");
                            delay = baseDelay; // Reset the delay on successful connection
                        };
                        ws_1.onmessage = function (e) {
                            var data = JSON.parse(e.data);
                            if (data.eventType === "heartbeat") {
                                return;
                            }
                            if (data.eventType === "PRODUCT_UPDATE" || data.eventType === "IMS_BRANDMENU_UPDATE") {
                                if (_this.IMSUpdateCount === 0) {
                                    _this.getIMSData();
                                    _this.IMSUpdateCount++;
                                }
                                else {
                                    _this.IMSUpdateCount++;
                                }
                            }
                            if (data.eventType === "INTEGRATION_UPDATE") {
                                _this.getIntegrationData("patch");
                            }
                        };
                        ws_1.onclose = function (e) {
                            if (!leader) {
                                return;
                            }
                            setTimeout(function () {
                                // Increase the delay with exponential backoff, but cap it at maxDelay
                                delay = Math.min(delay * 2, maxDelay);
                                connect(true);
                            }, delay);
                        };
                        ws_1.onerror = function (err) {
                            console.error("Message:", "Socket encountered error: ", err.message, "Closing socket");
                            _this.showConnect(true, "yellow", "websocket", "Instant updated failed to connect", "warning");
                            ws_1.close();
                        };
                    }
                    catch (error) {
                        console.error(error);
                    }
                }
                connect(); // Initial connection attempt
                return true;
            };
            Integration.prototype.IMSUpdateQueue = function () {
                var _this = this;
                //clear queue
                setTimeout(function () {
                    //needs to process 
                    if (_this.IMSUpdateCount > 1) {
                        _this.getIMSData();
                        _this.IMSUpdateCount = 0;
                    }
                    //already processed
                    if (_this.IMSUpdateCount === 1) {
                        _this.IMSUpdateCount = 0;
                    }
                    _this.IMSUpdateQueue();
                }, 60000);
                return true;
            };
            Integration.prototype.formatPar = function (data, modifier) {
                var products = [];
                if (modifier) {
                    data.forEach(function (each, idx) {
                        each.items.forEach(function (item) {
                            item.category = each.displayName;
                            item.subCategory = each.description;
                            item.mappingId = each.id + "-" + item.itemId;
                            if (item.category.toLowerCase().indexOf("olo") > -1 || item.price === "0") {
                                return;
                            }
                            products.push(item);
                        });
                    });
                }
                if (!modifier) {
                    data.forEach(function (each, idx) {
                        try {
                            each.mappingId = each.id ? each.id.toString() : null;
                        }
                        catch (err) { }
                        if (each.price === "0") {
                            return;
                        }
                        products.push(each);
                    });
                }
                return products;
            };
            Integration.prototype.formatQu = function (data) {
                var _this = this;
                var products = [];
                data.forEach(function (eachItem) {
                    if (eachItem.menuCategory) {
                        eachItem.category = eachItem.menuCategory.name;
                        eachItem.categoryId = eachItem.menuCategory.id;
                    }
                    if (eachItem.modifierGroup) {
                        eachItem.category = eachItem.modifierGroup.name;
                        eachItem.categoryId = eachItem.modifierGroup.id;
                    }
                    // Ignore 3rd party delivery items
                    if (typeof eachItem.category === "string") {
                        if (eachItem.category.includes("OLO") || eachItem.category.includes("3PD") || eachItem.category.includes("3PO") || eachItem.category.includes("All Items")) {
                            return;
                        }
                    }
                    try {
                        eachItem.price = eachItem.discountAmount ? eachItem.discountAmount : eachItem.prices.prices[0].price;
                    }
                    catch (err) {
                        eachItem.price = "";
                    }
                    //line 1140 * allow focus brands to use ID since pathID is not in use there.
                    try {
                        //here to make choice of API mapping id - could use automation
                        eachItem.mappingId = eachItem.pathId || eachItem.id || "";
                        eachItem.mappingId = eachItem.mappingId.toString();
                    }
                    catch (err) {
                        eachItem.mappingId = null;
                    }
                    //is the below even necessary..should move to larger mapping IDs I think.
                    delete eachItem.prices;
                    delete eachItem.displayAttribute;
                    products.push(eachItem);
                });
                //required and in a beta state.. removes duplicates with same pathID, and attempts to keep the ones that price is not 0. Qu is a pita and we attempt somethign API side.
                products = _this.removeDuplicates(products, "mappingId");
                return products;
            };
            Integration.prototype.formatToast = function (data) {
                // Build O(1) lookup maps — avoids O(n²/n³) nested linear scans across 438 MGRs × 3177 MORs × 2348 items
                if (modifier) {
                    var modifiers = [];
                    Object.values(data.modifierOptionReferences).forEach(function (mod) {
                        mod.mappingId = mod.multiLocationId ? mod.multiLocationId.toString() : "";
                        modifiers.push(mod);
                    });
                    return modifiers;
                }
                var mgrMap = {};
                Object.values(data.modifierGroupReferences).forEach(function (mgr) {
                    mgrMap[mgr.referenceId] = mgr;
                });
                var morMap = {};
                Object.values(data.modifierOptionReferences).forEach(function (mor) {
                    morMap[mor.referenceId] = mor;
                });
                var menuItems = [];
                var menuItemByMappingId = {};
                var menuItemOrder = [];
                function is3POMenu(name) {
                    return typeof name === "string" && name.toLowerCase().indexOf("3po") > -1;
                }
                function hasKioskVisibility(item) {
                    return item && Array.isArray(item.visibility) && item.visibility.indexOf("KIOSK") > -1;
                }
                function shouldReplaceExistingItem(existingItem, nextItem) {
                    var existingIs3PO = is3POMenu(existingItem.menu);
                    var nextIs3PO = is3POMenu(nextItem.menu);
                    if (existingIs3PO && !nextIs3PO) {
                        return true;
                    }
                    if (!existingIs3PO && nextIs3PO) {
                        return false;
                    }
                    if (!hasKioskVisibility(existingItem) && hasKioskVisibility(nextItem)) {
                        return true;
                    }
                    return false;
                }
                function flat(array) {
                    var result = [];
                    array.forEach(function (a) {
                        if (Array.isArray(a.menuGroups)) {
                            a.menuGroups.forEach(function (each) {
                                // Propagate original menu name/id through nested group levels
                                each.menu = a.menu || a.name;
                                each.menuId = a.menuId || a.masterId;
                            });
                            result = result.concat(flat(a.menuGroups));
                        }
                        result.push(a);
                    });
                    return result;
                }
                var filteredMenus = Array.isArray(data.menus) ? data.menus.filter(function (menu) {
                    return !is3POMenu(menu && menu.name);
                }) : [];
                var groups = flat(filteredMenus);
                groups.forEach(function (group) {
                    if (!group.menuItems) {
                        return;
                    }
                    group.menuItems.forEach(function (item) {
                        var itemMappingId = item.multiLocationId ? item.multiLocationId.toString() : "";
                        item.category = group.name;
                        item.menu = group.menu;
                        item.menuId = group.menuId;
                        item.groupId = group.multiLocationId;
                        item.mappingId = itemMappingId;
                        item.active = true;
                        item.modifiers = [];
                        item.price = item.price ? parseFloat(item.price).toFixed(2) : "";
                        try {
                            if (Array.isArray(item.modifierGroupReferences)) {
                                item.modifierGroupReferences.forEach(function (modGroupId) {
                                    var modRef = mgrMap[modGroupId];
                                    if (!modRef) {
                                        return;
                                    }
                                    var modifier = {
                                        modifierType: modRef.name,
                                        masterId: modRef.masterId,
                                        options: [],
                                    };
                                    if (Array.isArray(modRef.modifierOptionReferences)) {
                                        modRef.modifierOptionReferences.forEach(function (modOptId) {
                                            var modRefOpt = morMap[modOptId];
                                            if (!modRefOpt) {
                                                return;
                                            }
                                            modifier.options.push({
                                                name: modRefOpt.name,
                                                price: parseFloat(modRefOpt.price).toFixed(2),
                                                masterId: modRefOpt.masterId,
                                                calories: modRefOpt.calories,
                                                description: modRefOpt.description,
                                            });
                                        });
                                    }
                                    item.modifiers.push(modifier);
                                });
                            }
                        }
                        catch (err) {
                            // Modifier build error — item still added below
                        }
                        if (!menuItemByMappingId[itemMappingId]) {
                            menuItemByMappingId[itemMappingId] = item;
                            menuItemOrder.push(itemMappingId);
                        }
                        else if (shouldReplaceExistingItem(menuItemByMappingId[itemMappingId], item)) {
                            menuItemByMappingId[itemMappingId] = item;
                        }
                    });
                });
                menuItemOrder.forEach(function (mappingId) {
                    menuItems.push(menuItemByMappingId[mappingId]);
                });
                return menuItems;
            };
            Integration.prototype.formatRevel = function (data) {
                var products = [];
                data.forEach(function (each, idx) {
                    if (!each.barcode) {
                        return;
                    }
                    try {
                        each.mappingId = each.barcode;
                    }
                    catch (err) { }
                    try {
                        each.category = each.category ? each.category.name : each.modifierClass.name;
                    }
                    catch (err) { }
                    if (typeof each.category === "string") {
                        if (each.category.includes("OLO") || each.category.includes("3PD") || each.category.includes("3PO")) {
                            return;
                        }
                    }
                    products.push(each);
                });
                return products;
            };
            Integration.prototype.formatClover = function (data, type) {
                var products = [];
                var modifiers = [];
                if (type && type === "products") {
                    data.menu.forEach(function (menu) {
                        if (menu.items && Array.isArray(menu.items)) {
                            menu.items.forEach(function (item) {
                                products.push({
                                    mappingId: menu.id + "-" + item.id,
                                    name: item.name,
                                    category: menu.name,
                                    price: typeof item.price === "number" ? (item.price / 100).toFixed(2) : "",
                                    available: item.available,
                                    alternateName: item.alternateName || "",
                                    hidden: item.hidden,
                                    priceType: item.priceType,
                                    sku: item.sku
                                });
                            });
                        }
                    });
                    return products;
                }
                if (type && type === "modifiers") {
                    data.mods.forEach(function (modGroup) {
                        if (modGroup.modifiers && Array.isArray(modGroup.modifiers)) {
                            modGroup.modifiers.forEach(function (mod) {
                                modifiers.push({
                                    mappingId: modGroup.id + "-" + mod.id,
                                    name: mod.name,
                                    category: modGroup.name,
                                    price: typeof mod.price === "number" ? (mod.price / 100).toFixed(2) : "",
                                    available: mod.available
                                });
                            });
                        }
                    });
                    return modifiers;
                }
            };
            Integration.prototype.formatTransact = function (data) {
                var products = [];
                if (!data.length) {
                    return products;
                }
                data.forEach(function (each, idx) {
                    var item = {};
                    try {
                        item.mappingId = each["Item Number"];
                    }
                    catch (err) { }
                    try {
                        item.category = each["Class"];
                        item.name = each["Label"];
                        if (each["Price"] !== undefined && each["Price"] !== null && each["Price"] !== "") {
                            var priceVal = each["Price"];
                            if (typeof priceVal === "number") {
                                item.price = priceVal.toFixed(2);
                            }
                            else if (typeof priceVal === "string") {
                                // Remove all non-numeric except . and -
                                var cleaned = priceVal.replace(/[^0-9.-]+/g, "");
                                if (cleaned !== "" && !isNaN(cleaned)) {
                                    item.price = parseFloat(cleaned).toFixed(2);
                                }
                                else {
                                    item.price = priceVal;
                                }
                            }
                            else {
                                item.price = priceVal;
                            }
                        }
                        else {
                            item.price = "";
                        }
                    }
                    catch (err) { }
                    products.push(item);
                });
                return products;
            };
            Integration.prototype.formatShift = function (data) {
                var shiftData = {};
                // Attach modifiers to groups
                data.items.forEach(function (each) {
                    each.mappingId = each.id.split("-")[0];
                    each.category = each.categoryName;
                    if (each.modifierCategories && each.modifierCategories.length > 0 && data.modifiers) {
                        each.modifiers = [];
                        data.modifiers.forEach(function (eachMod) {
                            if (each.modifierCategories.includes(eachMod.modifierCategoryId)) {
                                each.modifiers.push({
                                    name: eachMod.name,
                                    price: eachMod.price,
                                    active: each.active,
                                    description: eachMod.description,
                                    defaultPrice: eachMod.defaultPrice,
                                });
                            }
                        });
                    }
                });
                if (data.modifiers) {
                    data.modifiers.forEach(function (eachMod) {
                        eachMod.mappingId = eachMod.modifierCategoryId.split("-")[0] + "-" + eachMod.id.split("-")[0];
                    });
                }
                shiftData.modifiers = data.modifiers || [];
                shiftData.items = data.items;
                return shiftData;
            };
            Integration.prototype.formatMealtracker = function (data) {
                var products = [];
                if (!data.length) {
                    return products;
                }
                data.forEach(function (eachDay) {
                    eachDay.menu.forEach(function (eachMenu) {
                        eachMenu.meals.forEach(function (eachMeals) {
                            eachMeals.menu.forEach(function (eachProduct) {
                                eachProduct.mappingId = eachProduct.id.toString();
                                eachProduct.day = eachDay.day;
                                eachProduct.date = eachDay.date + "T00:00:00";
                                eachProduct.menuName = eachMenu.name;
                                eachProduct.type = eachMenu.menu_category;
                                eachProduct.period = eachMeals.name;
                                eachProduct.category = eachProduct.category_name.replace(/\s+/g, ' ').replace(/\s*BLD$/, '').trim();
                                products.push(eachProduct);
                            });
                        });
                    });
                });
                return products;
            };
            Integration.prototype.formatSimphony = function (data) {
                try {
                    var menuItems = data.menuItems || [];
                    var condimentGroups = data.condimentGroups || [];
                    var products_1 = {
                        items: [],
                        modifiers: []
                    };
                    menuItems.forEach(function (each) {
                        try {
                            var item_1 = {
                                mappingId: each.menuItemId ? each.menuItemId.toString() : null,
                                category: (each.familyGroup && each.familyGroup.name && each.familyGroup.name["en-US"]) || null,
                                name: (each.name && each.name["en-US"]) || null,
                                price: (each.price && each.price.price) || null,
                                modifiers: []
                            };
                            if (Array.isArray(each.condiments)) {
                                var modifiers_1 = [];
                                each.condiments.forEach(function (condiment) {
                                    try {
                                        var modifier = {
                                            name: (condiment.name && condiment.name["en-US"]) || null,
                                            price: (function () {
                                                // Find the first non-zero price
                                                var def = condiment.definitions.find(function (def) {
                                                    return def.prices && def.prices[0] && def.prices[0].price && def.prices[0].price > 0;
                                                });
                                                return def ? def.prices[0].price : null;
                                            })(),
                                            category: item_1.name || null,
                                            group: condiment.familyGroupRef || null
                                        };
                                        modifiers_1.push(modifier);
                                    }
                                    catch (modErr) {
                                        // Optionally log or handle modifier errors
                                    }
                                });
                                // Sort modifiers by name, placing null names at the end
                                modifiers_1.sort(function (a, b) {
                                    if (a.name === b.name)
                                        return 0;
                                    if (a.name === null)
                                        return 1;
                                    if (b.name === null)
                                        return -1;
                                    return a.name.localeCompare(b.name);
                                });
                                item_1.modifiers = modifiers_1;
                            }
                            products_1.items.push(item_1);
                        }
                        catch (itemErr) {
                            // Optionally log or handle item errors
                        }
                    });
                    // Group condimentItems by condimentId and collect all categories for each
                    var condimentMap_1 = {};
                    condimentGroups.forEach(function (each) {
                        if (Array.isArray(each.condimentItems)) {
                            each.condimentItems.forEach(function (condimentItem) {
                                try {
                                    var condimentId = condimentItem.condimentId;
                                    if (!condimentId)
                                        return;
                                    var category = (each.name && each.name["en-US"]) || null;
                                    if (!condimentMap_1[condimentId]) {
                                        condimentMap_1[condimentId] = {
                                            mappingId: condimentId.toString(),
                                            categories: [], // collect all categories here
                                            name: (condimentItem.name && condimentItem.name["en-US"]) || null,
                                            price: (function () {
                                                // Find the first non-zero price
                                                var def = condimentItem.definitions.find(function (def) {
                                                    return def.prices && def.prices[0] && def.prices[0].price && def.prices[0].price > 0;
                                                });
                                                return def ? def.prices[0].price : null;
                                            })()
                                        };
                                    }
                                    // Add the category if not already present
                                    if (category && !condimentMap_1[condimentId].categories.includes(category)) {
                                        condimentMap_1[condimentId].categories.push(category);
                                    }
                                }
                                catch (condErr) {
                                    // Optionally log or handle condiment errors
                                }
                            });
                        }
                    });
                    // Push all grouped modifiers to products.modifiers
                    Object.values(condimentMap_1).forEach(function (modifier) {
                        // Sort categories alphabetically, nulls last
                        modifier.categories.sort(function (a, b) {
                            if (a === b)
                                return 0;
                            if (a === null)
                                return 1;
                            if (b === null)
                                return -1;
                            return a.localeCompare(b);
                        });
                        // Concatenate categories into a comma-delimited string (excluding nulls)
                        modifier.category = modifier.categories.filter(function (c) { return c !== null; }).join(", ");
                        products_1.modifiers.push(modifier);
                    });
                    return products_1;
                }
                catch (err) {
                    // Optionally log or handle top-level errors
                    return { items: [], modifiers: [] };
                }
            };
            Integration.prototype.formatVenueNext = function (venueNext) {
                //align to DB
                //needs review..
                venueNext.forEach(function (each) {
                    each.category = each.category_name;
                    each.mappingId = each.product_sku.toString();
                    each.type = each.stand_display_name || "";
                    each.price = each.price_in_cents / 100 || "0.00";
                    each.enabled = each.available;
                });
                return venueNext;
            };
            Integration.prototype.formatWebtrition = function (webtrition) {
                var _this = this;
                //align to DB
                webtrition.forEach(function (each) {
                    each.category = each.mealStation;
                    each.mappingId = each.id.toString();
                });
                function handleComboItems(items) {
                    var comboItems = {};
                    var nonComboItems = [];
                    items.forEach(function (each) {
                        var stop = false;
                        if (each.comboOrder > 0) {
                            if (!comboItems[each.id]) {
                                comboItems[each.id] = {
                                    id: "0",
                                    stringId: "0",
                                    mappingId: each.id.toString(),
                                    mrn: 0,
                                    combo: true,
                                    calories: "0",
                                    description: "",
                                    date: each.date,
                                    comboItemNames: "",
                                    comboName: each.comboName,
                                    icons: each.icons,
                                    mealPeriod: each.mealPeriod,
                                    category: each.mealStation,
                                    mealStation: each.mealStation,
                                    price: each.price,
                                    items: []
                                };
                            }
                            comboItems[each.id].items.forEach(function (item) {
                                if (item.comboOrder === each.comboOrder) {
                                    stop = true;
                                }
                            });
                            if (stop) {
                                return;
                            }
                            comboItems[each.id].id = each.comboOrder === 1 ? each.id : comboItems[each.id].id;
                            comboItems[each.id].stringId = comboItems[each.id].id.toString();
                            comboItems[each.id].mrn = parseFloat(each.mrn) + parseFloat(comboItems[each.id].mrn);
                            comboItems[each.id].comboItemNames = comboItems[each.id].comboItemNames ? comboItems[each.id].comboItemNames + ", " + each.name : each.name;
                            comboItems[each.id].calories = parseFloat(each.calories) + parseFloat(comboItems[each.id].calories);
                            comboItems[each.id].items.push(each);
                        }
                        else {
                            nonComboItems.push(each);
                        }
                    });
                    // Add newly created combo items to nonComboItems
                    for (var _i = 0, _a = Object.values(comboItems); _i < _a.length; _i++) {
                        var combo = _a[_i];
                        nonComboItems.push(combo);
                    }
                    return nonComboItems;
                }
                webtrition = handleComboItems(webtrition);
                //return formatted items
                return webtrition;
            };
            Integration.prototype.formatBonappetit = function (data) {
                var products = [];
                //align to DB
                data.forEach(function (each) {
                    each.category = each.station;
                    each.mappingId = each.id.toString() + "-" + each.daypart_id.toString() + "-" + each.station_id.toString();
                    each.name = each.label;
                    each.date = currentTime();
                    products.push(each);
                });
                return products;
            };
            Integration.prototype.formatBepoz = function (data) {
                var products = [];
                // Helper to normalize id-like values to a non-empty string; preserves 0, avoids null/undefined
                var toIdString = function (v) {
                    if (v === null || v === undefined)
                        return "0";
                    var s = String(v);
                    return s.trim() === "" ? "0" : s;
                };
                //align to DB
                data.forEach(function (each) {
                    each.category = each.categoryName;
                    each.name = each.menuItemName;
                    each.sortOrder = each.ItemOrder || 0;
                    each.mappingId = toIdString(each.menuItemid);
                    each.categoryId = toIdString(each.categoryID);
                    each.subCategoryId = toIdString(each.subCategoryID);
                    each.brandId = toIdString(each.Brandid);
                    each.calories = (each.Calorie !== null && each.Calorie !== undefined && String(each.Calorie).trim() !== "")
                        ? String(each.Calorie)
                        : "0";
                    if (typeof each.Allergens === "string") {
                        // Split on newlines, commas, semicolons, pipes, or slashes and trim
                        each.allergens = each.Allergens.split(/[\r\n;,/|]+/).map(function (item) { return item.trim(); }).filter(Boolean);
                    }
                    else {
                        each.allergens = each.Allergens;
                    }
                    if (typeof each.Active === "string") {
                        var vA = each.Active.trim().toLowerCase();
                        each.active = (vA === "true" || vA === "1" || vA === "yes");
                    }
                    else {
                        each.active = Boolean(each.Active);
                    }
                    if (typeof each.outOfStock === "string") {
                        var vO = each.outOfStock.trim().toLowerCase();
                        each.outOfStock = (vO === "true" || vO === "1" || vO === "yes");
                    }
                    else {
                        each.outOfStock = Boolean(each.outOfStock);
                    }
                    // Normalize modifiers
                    if (Array.isArray(each.modifiers)) {
                        // keep as-is
                    }
                    else if (typeof each.modifiers === "string") {
                        var parsed = [];
                        try {
                            var tmp = JSON.parse(each.modifiers);
                            if (Array.isArray(tmp))
                                parsed = tmp;
                        }
                        catch (e) {
                            parsed = each.modifiers.split(/[\r\n;,/|]+/).map(function (s) { return s.trim(); }).filter(Boolean);
                        }
                        each.modifiers = parsed;
                    }
                    else {
                        each.modifiers = [];
                    }
                    //remove old values
                    delete each.Active;
                    delete each.Allergens;
                    delete each.Calorie;
                    delete each.productid;
                    delete each.categoryID;
                    delete each.subCategoryID;
                    delete each.menuItemName;
                    delete each.menuItemid;
                    delete each.categoryName;
                    delete each.ItemOrder;
                    delete each.Brandid;
                    products.push(each);
                });
                return products;
            };
            Integration.prototype.formatcentric = function (data) {
                var products = [];
                var modifiers = [];
                //align to DB
                var groups = (data.data && data.data.groups) ? data.data.groups : (data.groups || []);
                groups.forEach(function (group) {
                    group.items.forEach(function (each) {
                        each.category = group.name;
                        each.mappingId = each.meta.unique_id.toString();
                        each.name = each.name;
                        each.description = each.description.en || "";
                        each.price = each.price.amount ? parseFloat(each.price.amount).toFixed(2) : "";
                        each.calories = each.nutrition.calories ? each.nutrition.calories.amount : "";
                        each.sortOrder = each.meta.menu_sort_number || 0;
                        each.out_of_stock = each.is.out_of_stock || false;
                        each.featured = each.is.featured || false;
                        each.hidden = each.is.hidden || false;
                        each.tags = each.reporting.category || [];
                        //clean up products
                        delete each.id;
                        delete each.meta;
                        delete each.is;
                        delete each.nutrition;
                        delete each.reporting;
                        delete each.weight;
                        delete each.label;
                        delete each.menu_labels;
                        products.push(each);
                        var productOptions = [];
                        each.options.forEach(function (eachOpt) {
                            eachOpt.items.forEach(function (eachOptItem) {
                                eachOptItem.mappingId = eachOptItem.meta.unique_id.toString();
                                eachOptItem.name = eachOptItem.name;
                                eachOptItem.description = eachOptItem.description.en || "";
                                eachOptItem.price = eachOptItem.price.amount ? parseFloat(eachOptItem.price.amount).toFixed(2) : "";
                                eachOptItem.calories = eachOptItem.nutrition.calories ? eachOptItem.nutrition.calories.amount : "";
                                eachOptItem.out_of_stock = eachOptItem.is.out_of_stock || false;
                                eachOptItem.featured = eachOptItem.is.featured || false;
                                eachOptItem.hidden = eachOptItem.is.hidden || false;
                                //clean up products
                                delete eachOptItem.id;
                                delete eachOptItem.meta;
                                delete eachOptItem.is;
                                delete eachOptItem.nutrition;
                                delete eachOptItem.reporting;
                                delete eachOptItem.weight;
                                delete eachOptItem.label;
                                delete eachOptItem.menu_labels;
                                delete eachOptItem.parent_id;
                                modifiers.push(eachOptItem);
                                if (eachOptItem.price) {
                                    // eachOptItem.sortOrder = eachOptItem.meta.menu_sort_number || 0;
                                    productOptions.push(eachOptItem);
                                }
                            });
                        });
                        each.options = productOptions || [];
                    });
                });
                return { products: products, modifiers: modifiers };
            };
            Integration.prototype.formatBiggby = function (data) {
                var products = [];
                var modifiers = [];
                var menus = Array.isArray(data && data.menus) ? data.menus : [];
                var items = Array.isArray(data && data.items) ? data.items : [];
                var modifierDefs = Array.isArray(data && data.modifiers) ? data.modifiers : [];
                var toPrice = function (value) {
                    if (value === null || value === undefined || value === "") {
                        return "";
                    }
                    var n = Number(value);
                    return Number.isFinite(n) ? n.toFixed(2) : "";
                };
                var menuItemIds = new Set();
                menus.forEach(function (menu) {
                    if (!menu || !Array.isArray(menu.itemIds)) {
                        return;
                    }
                    var isActive = !menu.status || menu.status === "ACTIVE";
                    if (!isActive) {
                        return;
                    }
                    menu.itemIds.forEach(function (id) {
                        if (id !== null && id !== undefined && id !== "") {
                            menuItemIds.add(String(id));
                        }
                    });
                });
                var modifierById = {};
                modifierDefs.forEach(function (mod) {
                    if (!mod || mod.id === null || mod.id === undefined || mod.id === "") {
                        return;
                    }
                    modifierById[String(mod.id)] = mod;
                });
                var modifierMap = {};
                var upsertModifier = function (modifier, fallbackGroup) {
                    var modifierId = modifier && modifier.id !== undefined && modifier.id !== null
                        ? String(modifier.id)
                        : "";
                    if (!modifierId || modifierMap[modifierId]) {
                        return;
                    }
                    var groupRef = modifier.modifierGroupRef || {};
                    modifierMap[modifierId] = {
                        mappingId: modifierId,
                        name: modifier.name || modifierId,
                        category: modifier.categoryName || groupRef.name || fallbackGroup || "",
                        price: toPrice(modifier.priceAmount),
                        saleStatus: modifier.saleStatus || ""
                    };
                };
                items.forEach(function (item) {
                    if (!item || item.id === null || item.id === undefined || item.id === "") {
                        return;
                    }
                    var itemId = String(item.id);
                    if (menuItemIds.size > 0 && !menuItemIds.has(itemId)) {
                        return;
                    }
                    var product = {
                        mappingId: itemId,
                        name: item.name || itemId,
                        category: item.categoryName || "",
                        description: item.description || "",
                        price: toPrice(item.priceAmount),
                        saleStatus: item.saleStatus || "",
                        modifiers: []
                    };
                    var groups = Array.isArray(item.modifierGroups) ? item.modifierGroups : [];
                    groups.forEach(function (group) {
                        if (!group) {
                            return;
                        }
                        var groupOptions = [];
                        var modifierIds = Array.isArray(group.modifierIds) ? group.modifierIds : [];
                        modifierIds.forEach(function (modifierId) {
                            var resolvedId = modifierId !== null && modifierId !== undefined ? String(modifierId) : "";
                            if (!resolvedId) {
                                return;
                            }
                            var modifier = modifierById[resolvedId] || {
                                id: resolvedId,
                                name: resolvedId,
                                priceAmount: "",
                                saleStatus: ""
                            };
                            upsertModifier(modifier, group.name || "");
                            groupOptions.push({
                                mappingId: resolvedId,
                                name: modifier.name || resolvedId,
                                price: toPrice(modifier.priceAmount),
                                saleStatus: modifier.saleStatus || "",
                                category: (modifier.modifierGroupRef && modifier.modifierGroupRef.name) || group.name || ""
                            });
                        });
                        product.modifiers.push({
                            modifierType: group.name || "",
                            groupId: group.id || "",
                            minimumSelections: group.minimumSelections,
                            maximumSelections: group.maximumSelections,
                            maxPerModifierSelectionQuantity: group.maxPerModifierSelectionQuantity,
                            options: groupOptions
                        });
                    });
                    products.push(product);
                });
                Object.keys(modifierMap).forEach(function (key) {
                    modifiers.push(modifierMap[key]);
                });
                return {
                    products: products,
                    modifiers: modifiers
                };
            };
            return Integration;
        }());
        Integration.pingError = "\n     <div class=\"connectError {{source}}\">\n        <div class=\"message\">\n            <span class=\"material-icons\">error</span>\n            <span class=\"error-desc\">{{response}}</span>\n            <span class=\"url\">{{url}}</span>\n        </div>\n    </div>\n        ";
        Integration.pingSuccess = "\n     <div class=\"connectError success {{source}}\">\n        <div class=\"message\">\n            <span class=\"material-icons\">check_circle</span>\n            <span class=\"error-desc\">{{response}}</span>\n            <span class=\"url\">{{url}}</span>\n        </div>\n    </div>\n        ";
        Integration.loading = "\n    <div class=\"loading\">\n        <div class=\"spin\"></div>\n        <img src=\"resources/icon.png\">\n        <div class=\"loading-wrapper\">\n            <div class=\"spinner\">\n                <span class=\"loading-message\">Loading menu data</span> \n                <div class=\"bounce1\">.</div>\n                <div class=\"bounce2\">.</div>\n                <div class=\"bounce3\">.</div>\n            </div>\n        </div>\n    </div>\n";
        Integration.connect = "\n    <div title=\"{{issue}}\" data-tooltip=\"{{source}} Connectivity\" class=\"material-icons connect {{source}}\" style=\"color: {{color}}\">{{error}}</div>\n";
        // Template for a small top drop-down banner used in development mode
        Integration.DEV_BANNER = "\n        <div class=\"dev-banner\" id=\"dev-banner\">\n            <div class=\"dev-banner-inner\">\n                <span class=\"material-icons\" style=\"margin-right: 5px\">error_outline</span>\n                <span class=\"dev-flag\">Development</span>\n            </div>\n        </div>\n";
        Integration.errorAlert =
            "    <div class=\"error-alert-overlay {{source}}\"> <div class=\"error-alert-content\"\n            style=\"max-height: 90vh; display: flex; flex-direction: column;\"> <div class=\"error-alert-header\"> <span\n                    class=\"material-icons error-alert-icon\" style=\"color: {{color}}\">error</span> <h2\n                    class=\"error-alert-title\">Exception Detected</h2> <span\n                    class=\"material-icons error-alert-close\">close</span> </div> <div class=\"error-alert-body\"\n                style=\"flex: 1; overflow: hidden; display: flex; flex-direction: column;\"> <div\n                    class=\"error-alert-source\"> <strong>Source:</strong> <span\n                        class=\"error-alert-source-value\">{{source}}</span> </div> <div class=\"error-alert-issue\">\n                    <strong>Issue:</strong> <span class=\"error-alert-issue-value\">{{issue}}</span> </div>\n                {{#issueStack}} <div class=\"error-alert-stack\"\n                    style=\"flex: 1; display: flex; flex-direction: column; min-height: 0; margin-bottom: 10px;\">\n                    <strong>Issue Stack:</strong> <div class=\"error-alert-stack-value\"\n                        style=\"flex: 1; overflow: auto; max-height: none;\">{{{issueStack}}}</div> </div>\n                {{/issueStack}} </div> <div\n    </div>";
        return Integration;
    })();
    IMSintegration.Integration = Integration;
})(IMSintegration || (IMSintegration = {}));