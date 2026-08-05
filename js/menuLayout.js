"use strict";
//Publisher: Wand Digital
//Date: 05.30.2025
//Version: 61.0
var IMSintegration;
(function (wandDigital) {
    var MenuLayout = (function () {
        function MenuLayout() {
            this.timeOuts = [];
            this.playlist = false;
            this.isRotating = false;
            this.navigationHistory = [];
            this.currentLayerId = 1;
            this._coreInitialized = false;
            this.homeIdleDelayMs = 30000;
            this.homeIdleLayer = 80;
            this.homeIdleTimer = null;
            this.isHomeIdleOverlayActive = false;
            this.homeIdleAssets = [];
            this._environmentConfig = null;
            this._homeIdleDismissEventsBound = false;
            this._hotspotDebugEnabled = false;
            this._hotspotDebugBindingsReady = false;
        }
        MenuLayout.prototype.init = function (IMSItems, IMSProducts, IMSSettings, integrationItems, API, TRMAssetZones, TRMMenuItems) {
            if (!API) {
                return;
            }
            try {
                this.applyThemeFromTRMMenuItems(TRMMenuItems);
            } catch (e) {
                console.error("Error in MenuLayout applyThemeFromTRMMenuItems: ", e);
            }
            try {
                this.updateTRMContent(TRMAssetZones, IMSItems);
            } catch (e) {
                console.error("Error in MenuLayout updateTRMContent: ", e);
            }
            try {
                this.injectPricing(IMSProducts);
            } catch (e) {
                console.error("Error in MenuLayout injectPricing: ", e);
                IMSintegration.Integration.prototype.showConnect(true, "Red", "injectPricing", e, "error");
            }
            try {
                this.handleProducts(IMSProducts);
            } catch (e) {
                console.error("Error in MenuLayout handleProducts: ", e);
                IMSintegration.Integration.prototype.showConnect(true, "Red", "handleProducts", e, "error");
            }
            try {
                this.handleLayout(IMSSettings);
            } catch (e) {
                console.error("Error in MenuLayout handleLayout: ", e);
                IMSintegration.Integration.prototype.showConnect(true, "Red", "handleLayout", e, "error");
            }
            if (this._coreInitialized) {
                return;
            }

            //optional starts
            // try {
            //     this.rotateEles();
            // } catch (e) {
            //     console.error("Error in MenuLayout rotateEles: ", e);
            //     IMSintegration.Integration.prototype.showConnect(true, "Red", "rotateEles", e, "error");
            // }

            try {
                this.initInactivityManager();
            } catch (e) {
                console.error("Error initializing InactivityManager: ", e);
            }

            this._coreInitialized = true;
        };
        MenuLayout.prototype.updateTRMContent = function (TRMAssetZones, IMSItems) {
            try {
                this.buildTRMInteractiveLayout(TRMAssetZones, IMSItems);
            } catch (e) {
                console.error("Error building TRM interactive layout: ", e);
            }
        };
        MenuLayout.prototype.applyThemeFromTRMMenuItems = function (TRMMenuItems) {
            var themeVars = {
                "--welcome-header-bg": true,
                "--header-text-color": true,
                "--sub-header-text-color": true,
                "--feature-card-bg": true,
                "--feature-card-hover-bg": true,
                "--feature-card-active-bg": true,
                "--card-label-bg": true,
                "--card-icon-outline-color": true,
                "--inactivity-overlay-bg": true,
                "--inactivity-modal-bg": true,
                "--inactivity-modal-heading-color": true,
                "--inactivity-modal-text-color": true,
                "--inactivity-primary-btn-bg": true,
                "--inactivity-primary-btn-hover-bg": true
            };

            var keyMap = {
                "welcomeheaderbg": "--welcome-header-bg",
                "headerbg": "--welcome-header-bg",
                "headerbackground": "--welcome-header-bg",
                "headertext": "--header-text-color",
                "headertextcolor": "--header-text-color",
                "subheadertext": "--sub-header-text-color",
                "subheadertextcolor": "--sub-header-text-color",
                "cardbackground": "--feature-card-bg",
                "cardbg": "--feature-card-bg",
                "cardhoverbackground": "--feature-card-hover-bg",
                "cardhoverbg": "--feature-card-hover-bg",
                "cardactivebackground": "--feature-card-active-bg",
                "cardactivebg": "--feature-card-active-bg",
                "cardlabelbackground": "--card-label-bg",
                "cardlabelbg": "--card-label-bg",
                "cardiconborder": "--card-icon-outline-color",
                "cardiconoutline": "--card-icon-outline-color",
                "cardiconoutlinecolor": "--card-icon-outline-color",
                "inactivityoverlay": "--inactivity-overlay-bg",
                "inactivityoverlaybg": "--inactivity-overlay-bg",
                "inactivitybackground": "--inactivity-modal-bg",
                "inactivitymodalbg": "--inactivity-modal-bg",
                "inactivityheading": "--inactivity-modal-heading-color",
                "inactivityheadingcolor": "--inactivity-modal-heading-color",
                "inactivitytext": "--inactivity-modal-text-color",
                "inactivitytextcolor": "--inactivity-modal-text-color",
                "inactivityprimarybutton": "--inactivity-primary-btn-bg",
                "inactivityprimarybuttonbg": "--inactivity-primary-btn-bg",
                "inactivityprimarybuttonhover": "--inactivity-primary-btn-hover-bg",
                "inactivityprimarybuttonhoverbg": "--inactivity-primary-btn-hover-bg"
            };

            var normalizeKey = function (value) {
                return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            };

            var isValidCssColor = function (value) {
                if (!value || typeof value !== "string") {
                    return false;
                }
                var probe = new Option().style;
                probe.color = "";
                probe.color = value.trim();
                return probe.color !== "";
            };

            var normalizeValue = function (value) {
                if (value === null || value === undefined) {
                    return "";
                }
                return String(value).trim();
            };

            var selected = {};

            (Array.isArray(TRMMenuItems) ? TRMMenuItems : []).forEach(function (item) {
                if (!item) {
                    return;
                }

                var rawKey = item.name || item.key || item.id || "";
                var rawValue = item.value;
                var normalizedItemKey = normalizeKey(rawKey);

                if (normalizedItemKey === "themecolors" || normalizedItemKey === "theme" || normalizedItemKey === "appcolors") {
                    try {
                        var parsed = JSON.parse(normalizeValue(rawValue));
                        Object.keys(parsed || {}).forEach(function (jsonKey) {
                            var mappedVar = keyMap[normalizeKey(jsonKey)] || (String(jsonKey).indexOf("--") === 0 ? String(jsonKey) : "");
                            var mappedValue = normalizeValue(parsed[jsonKey]);
                            if (!mappedVar || !mappedValue) {
                                return;
                            }
                            if (mappedVar.indexOf("--") === 0 && themeVars[mappedVar] && isValidCssColor(mappedValue)) {
                                selected[mappedVar] = mappedValue;
                            }
                        });
                    } catch (err) {
                        // Ignore malformed JSON and continue processing single entries.
                    }
                    return;
                }

                var cssVar = keyMap[normalizedItemKey] || "";
                var value = normalizeValue(rawValue);
                if (!cssVar || !value) {
                    return;
                }
                if (isValidCssColor(value)) {
                    selected[cssVar] = value;
                }
            });

            var root = document.documentElement;
            Object.keys(selected).forEach(function (cssVar) {
                root.style.setProperty(cssVar, selected[cssVar]);
            });
        };
        MenuLayout.prototype.getEnvironmentConfig = function () {
            if (this._environmentConfig) {
                return this._environmentConfig;
            }

            if (typeof environment !== "undefined" && environment) {
                var env = String(environment).toLowerCase();
                this._environmentConfig = {
                    environment: env,
                    apiHost: env === "qa" ? "api-qa.wanddigital.com" : (env === "uat" ? "api-uat.wanddigital.com" : "api.wanddigital.com"),
                    clientHost: env === "qa" ? "client-qa.wanddigital.com" : (env === "uat" ? "client-uat.wanddigital.com" : "client.wanddigital.com"),
                    orderStatusHost: env === "qa" ? "orderstatus-qa.wanddigital.com" : (env === "uat" ? "orderstatus-uat.wanddigital.com" : "orderstatus-prod.wanddigital.com")
                };
                return this._environmentConfig;
            }

            if (typeof window.getWandEnvironmentConfig === "function") {
                this._environmentConfig = window.getWandEnvironmentConfig();
                return this._environmentConfig;
            }

            var locationHost = String((window.location && window.location.hostname) || "").toLowerCase();
            var inClient = !!window.frameElement;
            var isLocal = !locationHost
                || locationHost === "localhost"
                || locationHost === "127.0.0.1"
                || locationHost.indexOf(".local") > -1;
            var trmMatch = locationHost.match(/(?:^|[.-])trm(?:-([a-z0-9]+))?(?:[.-]|$)/i);
            var envFromTrm = trmMatch ? String(trmMatch[1] || "prod").toLowerCase() : "";
            var environment = "prod";

            if (isLocal && !inClient) {
                environment = "local";
            } else if (envFromTrm === "qa" || /(^|[.-])qa([.-]|$)/.test(locationHost)) {
                environment = "qa";
            } else if (envFromTrm === "uat" || /(^|[.-])uat([.-]|$)/.test(locationHost)) {
                environment = "uat";
            }

            this._environmentConfig = {
                environment: environment,
                apiHost: environment === "qa" ? "api-qa.wanddigital.com" : (environment === "uat" ? "api-uat.wanddigital.com" : "api.wanddigital.com"),
                clientHost: environment === "qa" ? "client-qa.wanddigital.com" : (environment === "uat" ? "client-uat.wanddigital.com" : "client.wanddigital.com"),
                orderStatusHost: environment === "qa" ? "orderstatus-qa.wanddigital.com" : (environment === "uat" ? "orderstatus-uat.wanddigital.com" : "orderstatus-prod.wanddigital.com")
            };

            return this._environmentConfig;
        };
        MenuLayout.prototype.normalizeTRMAsset = function (asset) {
            var layer = parseInt(asset.layerZOrder, 10);
            var sequence = parseInt(asset.sequence, 10);
            var duration = parseInt(asset.duration, 10);
            var fileType = (asset.fileType || "").toLowerCase();

            return {
                raw: asset,
                layer: isNaN(layer) ? 0 : layer,
                sequence: isNaN(sequence) ? 0 : sequence,
                duration: isNaN(duration) ? 0 : duration,
                fileType: fileType,
                fullPath: asset.fullPath || "",
                elementId: asset.elementId || "",
                cardTitle: asset.zoneName || asset.regionName || "",
                zoneName: asset.zoneName || "",
                regionName: asset.regionName || ""
            };
        };
        MenuLayout.prototype.getTRMAssetsForLayer = function (TRMAssetZones, layer) {
            var _this = this;
            return (Array.isArray(TRMAssetZones) ? TRMAssetZones : [])
                .map(function (asset) { return _this.normalizeTRMAsset(asset); })
                .filter(function (asset) {
                    return asset.layer === layer && asset.fullPath && (asset.fileType === "image" || asset.fileType === "video" || asset.fileType === "html");
                })
                .sort(function (a, b) { return a.sequence - b.sequence; });
        };
        MenuLayout.prototype.ensureHomeIdleOverlay = function () {
            var $wrapper = $('#target.asset-wrapper');
            if (!$wrapper.length) {
                $wrapper = $('.asset-wrapper').first();
            }
            if (!$wrapper.length) {
                return;
            }

            if ($('#home_idle_overlay').length) {
                return;
            }

            $wrapper.append(
                '<div id="home_idle_overlay" class="home-idle-overlay" data-layer-z-order="80" aria-hidden="true">' +
                    '<div id="home_idle_media" class="cms-media home-idle-media"></div>' +
                '</div>'
            );

            this.bindHomeIdleDismissEvents();
        };
        MenuLayout.prototype.bindHomeIdleDismissEvents = function () {
            var _this = this;
            if (this._homeIdleDismissEventsBound) {
                return;
            }
            this._homeIdleDismissEventsBound = true;

            var dismiss = function (e) {
                if (!_this.isHomeIdleOverlayActive) {
                    return;
                }
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                _this.dismissHomeIdleOverlay(true);
            };

            $(document).off('click.menu-home-idle touchstart.menu-home-idle touchmove.menu-home-idle mousemove.menu-home-idle', '#home_idle_overlay');
            $(document).on('click.menu-home-idle touchstart.menu-home-idle touchmove.menu-home-idle mousemove.menu-home-idle', '#home_idle_overlay', dismiss);
        };
        MenuLayout.prototype.configureHomeIdleContent = function (TRMAssetZones) {
            this.ensureHomeIdleOverlay();

            var idleAssets = this.getTRMAssetsForLayer(TRMAssetZones, this.homeIdleLayer);
            this.homeIdleAssets = idleAssets;

            this.injectTRMAssetsIntoContainer('#home_idle_media', idleAssets);
            if (idleAssets && idleAssets.length) {
                $('#home_idle_media').attr('data-playlist-transition', 'crossFade');
                $('#home_idle_media').attr('data-playlist-transition-ms', '360');
            }

            if (this.isHomeIdleOverlayActive && idleAssets && idleAssets.length) {
                this.startMediaPlaylist($('#home_idle_media'));
            }

            if (!idleAssets || !idleAssets.length) {
                this.dismissHomeIdleOverlay(false);
                this.clearHomeIdleTimer();
                return;
            }

            if ($('.home:visible').length > 0 && $('.page:visible').length === 0) {
                this.startHomeIdleTimer();
            }
        };
        MenuLayout.prototype.clearHomeIdleTimer = function () {
            if (this.homeIdleTimer) {
                clearTimeout(this.homeIdleTimer);
                this.homeIdleTimer = null;
            }
        };
        MenuLayout.prototype.startHomeIdleTimer = function () {
            var _this = this;
            this.clearHomeIdleTimer();

            if (typeof InactivityManager !== 'undefined' && typeof InactivityManager.pause === 'function') {
                // Home idle uses a separate timer/overlay and should never show warning modal.
                InactivityManager.pause();
            }

            if (this.isHomeIdleOverlayActive) {
                return;
            }
            if (!$('.home:visible').length || $('.page:visible').length > 0) {
                return;
            }
            if (!this.homeIdleAssets || !this.homeIdleAssets.length) {
                return;
            }

            this.homeIdleTimer = setTimeout(function () {
                _this.showHomeIdleOverlay();
            }, this.homeIdleDelayMs);
        };
        MenuLayout.prototype.showHomeIdleOverlay = function () {
            if (this.isHomeIdleOverlayActive) {
                return;
            }
            if (!$('.home:visible').length || $('.page:visible').length > 0) {
                return;
            }
            if (!this.homeIdleAssets || !this.homeIdleAssets.length) {
                return;
            }

            this.clearHomeIdleTimer();

            var $overlay = $('#home_idle_overlay');
            var $media = $('#home_idle_media');
            if (!$overlay.length || !$media.length) {
                return;
            }

            if (typeof InactivityManager !== 'undefined' && typeof InactivityManager.pause === 'function') {
                InactivityManager.pause();
            }

            $overlay.addClass('active').attr('aria-hidden', 'false');
            this.isHomeIdleOverlayActive = true;
            this.startMediaPlaylist($media);
        };
        MenuLayout.prototype.dismissHomeIdleOverlay = function (restartTimer) {
            if (restartTimer === void 0) { restartTimer = false; }

            var $overlay = $('#home_idle_overlay');
            var $media = $('#home_idle_media');
            if ($media.length) {
                this.stopMediaPlaylist($media);
            }
            if ($overlay.length) {
                $overlay.removeClass('active').attr('aria-hidden', 'true');
            }

            this.isHomeIdleOverlayActive = false;

            if ($('.home:visible').length > 0 && typeof InactivityManager !== 'undefined' && typeof InactivityManager.pause === 'function') {
                InactivityManager.pause();
            }

            if (restartTimer && $('.home:visible').length > 0 && $('.page:visible').length === 0) {
                this.startHomeIdleTimer();
            }
        };
        MenuLayout.prototype.getLayerPageId = function (layerId) {
            return "layer_" + layerId + "_page";
        };
        MenuLayout.prototype.getLayerFromPageId = function (pageId) {
            var match = String(pageId || "").match(/^layer_(\d+)_page$/i);
            if (!match) {
                return null;
            }
            var layerId = parseInt(match[1], 10);
            return isNaN(layerId) ? null : layerId;
        };
        MenuLayout.prototype.toPositiveInt = function (value) {
            var parsed = parseInt(value, 10);
            if (isNaN(parsed) || parsed <= 0) {
                return null;
            }
            return parsed;
        };
        MenuLayout.prototype.normalizeClickArea = function (menuItem, index) {
            var rawArea = (menuItem && (menuItem.clickArea || menuItem.clickarea || menuItem.ClickArea)) || null;
            if (!rawArea || typeof rawArea !== "object") {
                return null;
            }

            var x = parseFloat(rawArea.x != null ? rawArea.x : (rawArea.position && rawArea.position.x));
            var y = parseFloat(rawArea.y != null ? rawArea.y : (rawArea.position && rawArea.position.y));
            var width = parseFloat(rawArea.width != null ? rawArea.width : (rawArea.size && rawArea.size.width));
            var height = parseFloat(rawArea.height != null ? rawArea.height : (rawArea.size && rawArea.size.height));
            if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
                return null;
            }

            var sourceLayer = this.toPositiveInt(rawArea.sourceLayer);
            if (!sourceLayer) {
                sourceLayer = this.toPositiveInt(rawArea.source)
                    || this.toPositiveInt(rawArea.source_layer)
                    || this.toPositiveInt(rawArea.layer)
                    || this.toPositiveInt(rawArea.parentLayer)
                    || 1;
            }

            var targetLayer = this.toPositiveInt(rawArea.targetLayer)
                || this.toPositiveInt(rawArea.target)
                || this.toPositiveInt(rawArea.target_layer);

            return {
                id: rawArea.id || ("click-area-" + index),
                name: rawArea.name || (menuItem && menuItem.displayName) || "",
                x: x,
                y: y,
                width: width,
                height: height,
                sourceLayer: sourceLayer,
                targetLayer: targetLayer,
                actionable: !!targetLayer
            };
        };
        MenuLayout.prototype.getClickAreasFromIMSItems = function (IMSItems) {
            var _this = this;
            var clickAreas = [];

            (Array.isArray(IMSItems) ? IMSItems : []).forEach(function (menuItem, index) {
                var normalized = _this.normalizeClickArea(menuItem, index);
                if (normalized) {
                    clickAreas.push(normalized);
                }
            });

            return clickAreas;
        };
        MenuLayout.prototype.getDiscoveredLayers = function (TRMAssetZones, clickAreas) {
            var _this = this;
            var discovered = { 1: true };

            (Array.isArray(TRMAssetZones) ? TRMAssetZones : [])
                .map(function (asset) { return _this.normalizeTRMAsset(asset); })
                .forEach(function (asset) {
                    if (asset && asset.layer > 0) {
                        discovered[asset.layer] = true;
                    }
                });

            (Array.isArray(clickAreas) ? clickAreas : []).forEach(function (area) {
                if (area.sourceLayer) {
                    discovered[area.sourceLayer] = true;
                }
                if (area.targetLayer) {
                    discovered[area.targetLayer] = true;
                }
            });

            return Object.keys(discovered)
                .map(function (layerId) { return parseInt(layerId, 10); })
                .filter(function (layerId) { return !isNaN(layerId) && layerId > 0; })
                .sort(function (a, b) { return a - b; });
        };
        MenuLayout.prototype.ensureLayerPage = function (layerId) {
            if (!layerId || layerId === 1) {
                if (!$('#layer_1_hotspots').length) {
                    $('#layer_1_home').append('<div id="layer_1_hotspots" class="hotspot-layer" aria-label="Layer 1 click areas"></div>');
                }
                return;
            }

            var pageId = this.getLayerPageId(layerId);
            if ($('#' + pageId).length) {
                return;
            }

            var html = ''
                + '<div id="' + pageId + '" class="page dynamic-layer-page" data-layer-id="' + layerId + '">'
                + '  <div id="layer_' + layerId + '_content_background" class="cms-media layer-media"><img src="" alt="Layer ' + layerId + '"></div>'
                + '  <div id="layer_' + layerId + '_hotspots" class="hotspot-layer" aria-label="Layer ' + layerId + ' click areas"></div>'
                + '</div>';
            $('#dynamic_pages_root').append(html);
        };
        MenuLayout.prototype.ensureLayerPages = function (layerIds) {
            var _this = this;
            (Array.isArray(layerIds) ? layerIds : []).forEach(function (layerId) {
                _this.ensureLayerPage(layerId);
            });
        };
        MenuLayout.prototype.renderLayerPreviewFallback = function (containerSelector, layerId, mode) {
            var $container = $(containerSelector);
            if (!$container.length) {
                return;
            }

            this.stopMediaPlaylist($container);
            $container.empty();
            $container.removeAttr("data-media-injected data-playlist-item-count data-playlist-total-ms data-playlist-playing");

            var previewMode = mode || "layer-missing";
            var title = "Touch Screen Template";
            var status = previewMode === "no-trm" ? "Awaiting TRM Content" : "Layer " + layerId + " Preview";
            var supportUrl = "https://wand123.my.site.com/wandknowledge/s/";
            var supportQrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent(supportUrl);

            var html = ''
                + '<div class="layer-preview-fallback" data-preview-mode="' + previewMode + '">'
                + '  <div class="layer-preview-panel">'
                + '    <img class="layer-preview-logo" src="./media/logo_transparent.png" alt="WAND Digital">'
                + '    <div class="layer-preview-kicker">WAND Digital</div>'
                + '    <h2 class="layer-preview-title">' + title + '</h2>'
                + '    <div class="layer-preview-meta">' + status + ' • 1080 x 1920</div>'
                + '    <div class="layer-preview-domain">wanddigital.com</div>'
                + '  </div>'
                + '  <div class="layer-preview-support">'
                + '    <img class="layer-preview-support-qr" src="' + supportQrUrl + '" alt="Support QR code">'
                + '    <div class="layer-preview-support-label">Support</div>'
                + '  </div>'
                + '</div>';

            $container.append(html);
        };
        MenuLayout.prototype.renderLayerMediaAssets = function (TRMAssetZones, layerIds) {
            var _this = this;
            var assetsByLayer = {};
            var normalizedAssets = (Array.isArray(TRMAssetZones) ? TRMAssetZones : [])
                .map(function (asset) { return _this.normalizeTRMAsset(asset); })
                .filter(function (asset) {
                    return asset.layer > 0 && asset.fullPath && (asset.fileType === "image" || asset.fileType === "video" || asset.fileType === "html");
                });
            var hasAnyTRMMedia = normalizedAssets.length > 0;

            normalizedAssets.forEach(function (asset) {
                if (!assetsByLayer[asset.layer]) {
                    assetsByLayer[asset.layer] = [];
                }
                assetsByLayer[asset.layer].push(asset);
            });

            Object.keys(assetsByLayer).forEach(function (layerKey) {
                assetsByLayer[layerKey].sort(function (a, b) {
                    return a.sequence - b.sequence;
                });
            });

            (Array.isArray(layerIds) ? layerIds : []).forEach(function (layerId) {
                var selector = '#layer_' + layerId + '_content_background';
                var layerAssets = assetsByLayer[layerId] || [];
                if (layerAssets.length > 0) {
                    _this.injectTRMAssetsIntoContainer(selector, layerAssets);
                    return;
                }
                _this.renderLayerPreviewFallback(selector, layerId, hasAnyTRMMedia ? "layer-missing" : "no-trm");
            });
        };
        MenuLayout.prototype.createHotspotElement = function (clickArea) {
            var $hotspot = $('<button type="button" class="cms-hotspot"></button>');
            var x = Math.max(0, clickArea.x);
            var y = Math.max(0, clickArea.y);
            var width = Math.max(1, clickArea.width);
            var height = Math.max(1, clickArea.height);
            var label = 'L' + clickArea.sourceLayer + ' -> ' + (clickArea.targetLayer ? 'L' + clickArea.targetLayer : 'none');

            $hotspot.css({
                left: x + 'px',
                top: y + 'px',
                width: width + 'px',
                height: height + 'px'
            });
            $hotspot.attr('title', label);
            $hotspot.attr('aria-label', label);
            $hotspot.attr('data-source-layer', clickArea.sourceLayer);
            if (clickArea.targetLayer) {
                $hotspot.attr('data-target-layer', clickArea.targetLayer);
            } else {
                $hotspot.addClass('is-disabled');
                $hotspot.attr('aria-disabled', 'true');
            }
            $hotspot.append('<span class="cms-hotspot-label">' + label + '</span>');

            return $hotspot;
        };
        MenuLayout.prototype.renderLayerHotspots = function (clickAreas) {
            var _this = this;
            $('.hotspot-layer').empty();

            (Array.isArray(clickAreas) ? clickAreas : []).forEach(function (clickArea) {
                var sourceLayer = _this.toPositiveInt(clickArea.sourceLayer) || 1;
                _this.ensureLayerPage(sourceLayer);
                var $layer = $('#layer_' + sourceLayer + '_hotspots');
                if (!$layer.length) {
                    return;
                }
                $layer.append(_this.createHotspotElement(clickArea));
            });
        };
        MenuLayout.prototype.ensureHotspotDebugBindings = function () {
            var _this = this;
            if (this._hotspotDebugBindingsReady) {
                return;
            }
            this._hotspotDebugBindingsReady = true;

            window.toggleHotspotDebug = function (enabled) {
                if (typeof enabled === 'boolean') {
                    _this._hotspotDebugEnabled = enabled;
                } else {
                    _this._hotspotDebugEnabled = !_this._hotspotDebugEnabled;
                }
                if (_this._hotspotDebugEnabled) {
                    $('body').addClass('show-hotspot-debug');
                } else {
                    $('body').removeClass('show-hotspot-debug');
                }
                return _this._hotspotDebugEnabled;
            };

            $(document).off('keydown.menu-hotspot-debug').on('keydown.menu-hotspot-debug', function (event) {
                if (event.altKey && (event.key === 'h' || event.key === 'H')) {
                    event.preventDefault();
                    window.toggleHotspotDebug();
                }
            });
        };
        MenuLayout.prototype.createTRMMediaElement = function (asset, index) {
            var $media;
            if (asset.fileType === "video") {
                $media = $("<video>");
                $media.attr("src", asset.fullPath);
                $media.attr("muted", "muted");
                $media.attr("playsinline", "playsinline");
                $media.attr("preload", "auto");
            } else if (asset.fileType === "html") {
                $media = $("<div>");
                if (asset.elementId) {
                    $media.attr("id", asset.elementId);
                }
                var $frame = $("<iframe>");
                $frame.attr("src", asset.fullPath);
                $frame.attr("frameborder", "0");
                $frame.attr("scrolling", "no");
                $frame.attr("allowfullscreen", "allowfullscreen");
                $media.append($frame);
            } else {
                $media = $("<img>");
                $media.attr("src", asset.fullPath);
            }

            $media.attr({
                "data-media-item": "true",
                "data-playlist-item": "true",
                "data-order": asset.sequence,
                "data-duration": asset.duration,
                "data-media-index": index,
                "data-media-type": asset.fileType,
                "data-playing": "false"
            });

            return $media;
        };
        MenuLayout.prototype.getPlaylistMediaElements = function ($container) {
            var $items = $container.children("[data-media-item='true']");
            if ($items.length) {
                return $items;
            }
            return $container.children("img, video");
        };
        MenuLayout.prototype.getPlaylistManager = function ($container, createIfMissing) {
            if (typeof window.getPlaylistManager !== "function") {
                return $container.data("playlistManager") || null;
            }

            return window.getPlaylistManager($container, {
                createIfMissing: !!createIfMissing
            });
        };
        MenuLayout.prototype.stopMediaPlaylist = function ($container) {
            if (typeof window.endPlaylist === "function") {
                window.endPlaylist($container, { keepFirstVisible: false });
                return;
            }

            this.getPlaylistMediaElements($container).each(function () {
                $(this).attr("data-playing", "false").removeClass("is-active").hide().css("opacity", 0);
            });
        };
        MenuLayout.prototype.startMediaPlaylist = function ($container) {
            if (!$container.attr("data-playlist-transition")) {
                $container.attr("data-playlist-transition", "crossFade");
            }
            if (!$container.attr("data-playlist-transition-ms")) {
                $container.attr("data-playlist-transition-ms", "360");
            }

            if (typeof window.startPlaylist === "function") {
                window.startPlaylist($container, {
                    duration: 6000,
                    transition: $container.attr("data-playlist-transition") || "crossFade",
                    transitionDurationMs: parseInt($container.attr("data-playlist-transition-ms"), 10) || 360,
                    preloadDelayMs: 500
                });
                return;
            }

            var manager = this.getPlaylistManager($container, true);
            if (manager) {
                manager.refresh();
                manager.start({ reset: true });
            }
        };
        MenuLayout.prototype.injectTRMAssetsIntoContainer = function (containerSelector, assets) {
            var _this = this;
            var $container = $(containerSelector);
            if (!$container.length) {
                return;
            }

            this.stopMediaPlaylist($container);
            $container.empty();

            if (!assets || !assets.length) {
                $container.removeAttr("data-media-injected data-playlist-item-count data-playlist-total-ms data-playlist-playing");
                return;
            }

            $container.attr("data-media-injected", "true");
            assets.forEach(function (asset, index) {
                $container.append(_this.createTRMMediaElement(asset, index));
            });
            this.getPlaylistMediaElements($container).each(function (index) {
                var $item = $(this);
                if (index === 0) {
                    $item.addClass("is-active").show().css("opacity", 1);
                    return;
                }
                $item.removeClass("is-active").hide().css("opacity", 0);
            });
        };
        MenuLayout.prototype.buildTRMInteractiveLayout = function (TRMAssetZones, IMSItems) {
            this.configureHomeIdleContent(TRMAssetZones);
            this.ensureHotspotDebugBindings();

            var clickAreas = this.getClickAreasFromIMSItems(IMSItems);
            var discoveredLayers = this.getDiscoveredLayers(TRMAssetZones, clickAreas);

            this.ensureLayerPages(discoveredLayers);
            this.renderLayerMediaAssets(TRMAssetZones, discoveredLayers);
            this.renderLayerHotspots(clickAreas);

            if (!TRMAssetZones || !TRMAssetZones.length) {
                console.warn("No TRM asset zones provided.");
            }
            if (!clickAreas.length) {
                console.warn("No CMS click areas found in menuItems.");
            }

            if (!this.toPositiveInt(this.currentLayerId)) {
                this.currentLayerId = 1;
            }
            if (this.currentLayerId !== 1 && !$('#' + this.getLayerPageId(this.currentLayerId)).length) {
                this.currentLayerId = 1;
                this.navigateToWelcome();
            }
        };
        MenuLayout.prototype.startMediaPlaylistsForPage = function (pageId) {
            var $page = pageId ? $('#' + pageId) : $('.page:visible');
            if (!$page.length) {
                return;
            }

            var _this = this;
            $page.find("[data-media-injected='true']").each(function () {
                _this.startMediaPlaylist($(this));
            });

            if (typeof InactivityManager === 'undefined') {
                return;
            }

            var totalPlaylistDurationMs = 0;
            $page.find("[data-media-injected='true']").each(function () {
                var durationValue = parseInt($(this).attr("data-playlist-total-ms"), 10);
                if (!isNaN(durationValue) && durationValue > 0) {
                    totalPlaylistDurationMs += durationValue;
                }
            });

            if (totalPlaylistDurationMs > 0) {
                var extensionMs = totalPlaylistDurationMs + 2000;
                if (typeof InactivityManager.extend === 'function') {
                    InactivityManager.extend(extensionMs);
                } else if (typeof InactivityManager.reset === 'function') {
                    InactivityManager.reset();
                }
            }
        };
        MenuLayout.prototype.stopAllMediaPlaylists = function () {
            var _this = this;
            $("[data-media-injected='true']").each(function () {
                _this.stopMediaPlaylist($(this));
            });
        };
        MenuLayout.prototype.handleLayout = function (IMSSettings) {
            var _this = this;
            // Set up navigation buttons
            this.setupNavigationButtons();

            $(document).off('click.cms-hotspot-nav', '.cms-hotspot');
            $(document).on('click.cms-hotspot-nav', '.cms-hotspot', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var targetLayer = parseInt($(this).attr('data-target-layer'), 10);
                if (isNaN(targetLayer) || targetLayer <= 0) {
                    return;
                }
                _this.navigateToLayer(targetLayer);
            });

            return true;
        };
        MenuLayout.prototype.handleProducts = function (IMSProducts) {
            var _this = this;
            if (!IMSProducts || IMSProducts.length === 0) {
                return;
            }
        };
        MenuLayout.prototype.fillDynamic = function (IMSItems, integrationItems) {
            console.log("fillDynamic: Ready for static promotional content");
        };
        MenuLayout.prototype.clearMenuItems = function (zone) {
            var containers = $(zone).get();
            containers.forEach(function (container) {
                while (container.hasChildNodes()) {
                    container.removeChild(container.lastChild);
                }
            });
        };

        MenuLayout.prototype.initInactivityManager = function () {
            var _this = this;

            if (typeof InactivityManager !== 'undefined') {
                InactivityManager.init({
                    warningDelay: 30000,
                    countdownDuration: 10000,
                    nutritionExtension: 30000,
                    activityEvents: ['click', 'touchstart', 'touchmove', 'mousemove'],
                    shouldTrackActivity: function () {
                        return $('.home:visible').length === 0;
                    },
                    onTimeout: function () {
                        _this.returnHome();
                    },
                    onReset: function () {
                        // Timer reset silently
                    },
                    onWarning: function () {
                        // Warning shown silently
                    }
                });

                // Pause immediately since we start on the home screen
                InactivityManager.pause();
                this.startHomeIdleTimer();
            } else {
                console.error('InactivityManager not found');
            }

            // Listen for activity forwarded from embedded assets (e.g. brandManager iframe).
            this.bindFrameActivityBridge();
        };

        // Receives activity/extend messages from child iframes so the single
        // parent InactivityManager stays alive while a user interacts inside an asset.
        MenuLayout.prototype.bindFrameActivityBridge = function () {
            var _this = this;
            if (this._frameBridgeBound) {
                return;
            }
            this._frameBridgeBound = true;

            window.addEventListener('message', function (event) {
                var data = event && event.data;
                if (!data || typeof data !== 'object' || data.source !== 'brandManager') {
                    return;
                }
                if (typeof InactivityManager === 'undefined') {
                    return;
                }

                if (_this.isHomeIdleOverlayActive && (data.type === 'trm:activity' || data.type === 'trm:extend')) {
                    _this.dismissHomeIdleOverlay(true);
                    return;
                }

                // Mirror the manager's own shouldTrackActivity gate: ignore while on home.
                if ($('.home:visible').length > 0) {
                    return;
                }
                if (data.type === 'trm:activity') {
                    if (typeof InactivityManager.reset === 'function') {
                        InactivityManager.reset();
                    }
                } else if (data.type === 'trm:extend') {
                    if (typeof InactivityManager.extend === 'function') {
                        InactivityManager.extend(data.ms);
                    } else if (typeof InactivityManager.reset === 'function') {
                        InactivityManager.reset();
                    }
                }
            });
        };

        // Tell embedded assets to reset their internal views (close modals, go home).
        // Pass a jQuery scope to target only frames within specific pages; omit to reset all.
        MenuLayout.prototype.resetChildFrames = function ($scope) {
            var $frames = ($scope && $scope.length) ? $scope.find('iframe') : $('iframe');
            $frames.each(function () {
                try {
                    this.contentWindow.postMessage({ source: 'touchscreenParent', type: 'trm:reset' }, '*');
                } catch (e) {
                    /* cross-origin or not ready: ignore */
                }
            });
        };

        MenuLayout.prototype.returnHome = function () {
            this.navigateToLayer(1, true);
        };

        MenuLayout.prototype.setupNavigationButtons = function () {
            var _this = this;

            // Home button - returns to welcome screen from weekly menu
            $(document).off('click.menu-layout-home', '.floating-nav-home');
            $(document).on('click.menu-layout-home', '.floating-nav-home', function (e) {
                e.stopPropagation();
                _this.navigateToLayer(1, true);
            });

            // Edge back button - returns to menu selection from brand pages
            $(document).off('click.menu-layout-back', '.edge-nav-back');
            $(document).on('click.menu-layout-back', '.edge-nav-back', function (e) {
                e.stopPropagation();
                _this.navigateBack();
            });

        };

        MenuLayout.prototype.navigateToLayer = function (layerId, resetHistory) {
            if (resetHistory === void 0) { resetHistory = false; }

            var resolvedLayer = this.toPositiveInt(layerId);
            if (!resolvedLayer) {
                return;
            }

            if (resolvedLayer === 1) {
                if (resetHistory) {
                    this.navigationHistory = [];
                }
                this.currentLayerId = 1;
                this.navigateToWelcome();
                return;
            }

            this.ensureLayerPage(resolvedLayer);
            this.currentLayerId = resolvedLayer;
            if (resetHistory) {
                this.navigationHistory = [];
            }
            this.navigateToPage(this.getLayerPageId(resolvedLayer), { replaceHistory: resetHistory });
        };

        MenuLayout.prototype.navigateToPage = function (pageId, options) {
            var opts = options || {};
            var currentPage = $('.page:visible').attr('id');
            var nextLayer = this.getLayerFromPageId(pageId) || this.currentLayerId;

            this.dismissHomeIdleOverlay(false);
            this.clearHomeIdleTimer();

            // Add current page to history if there's one visible
            if (currentPage && !opts.replaceHistory) {
                this.navigationHistory.push(currentPage);
            } else if (!currentPage && !opts.replaceHistory) {
                // Coming from welcome screen
                this.navigationHistory = [];
            }

            // Reset embedded assets on the page(s) we're leaving (not the target).
            this.resetChildFrames($('.page:visible'));

            // Hide all pages and welcome screen
            this.stopAllMediaPlaylists();
            $('.page').hide();
            $('.home').hide();

            // Show the target page
            $('#' + pageId).show();
            this.currentLayerId = nextLayer;

            this.startMediaPlaylistsForPage(pageId);

            // Reset scroll position of the page we're navigating TO
            $('#' + pageId + ' .section-wrapper').scrollTop(0);
            $('#' + pageId + ' .brand-list').scrollTop(0);
            window.scrollTo(0, 0);

            // Update navigation buttons
            this.updateNavigationButtons();

            // Resume inactivity timer when navigating away from home
            if (typeof InactivityManager !== 'undefined') {
                InactivityManager.resume();
            }
        };

        MenuLayout.prototype.navigateBack = function () {
            if (this.navigationHistory.length > 0) {
                // Get previous page
                var previousPage = this.navigationHistory.pop();

                // Reset embedded assets on the page we're leaving.
                this.resetChildFrames($('.page:visible'));

                // Hide current page
                this.stopAllMediaPlaylists();
                $('.page').hide();

                // Show previous page
                $('#' + previousPage).show();
                this.currentLayerId = this.getLayerFromPageId(previousPage) || this.currentLayerId;

                this.startMediaPlaylistsForPage(previousPage);

                // Update navigation buttons
                this.updateNavigationButtons();

                // Scroll to top
                window.scrollTo(0, 0);

                this.clearHomeIdleTimer();
            }
        };

        MenuLayout.prototype.navigateToWelcome = function () {
            // Reset embedded assets before leaving the brand experience.
            this.resetChildFrames();

            // Hide all pages
            this.stopAllMediaPlaylists();
            $('.page').hide();

            this.dismissHomeIdleOverlay(false);

            // Show welcome screen
            $('.home').show();
            this.currentLayerId = 1;

            // Clear navigation history
            this.navigationHistory = [];

            // Update navigation buttons
            this.updateNavigationButtons();

            // Pause inactivity timer when on home screen
            if (typeof InactivityManager !== 'undefined') {
                InactivityManager.pause();
            }

            this.startHomeIdleTimer();

            // Scroll to top
            window.scrollTo(0, 0);
        };

        MenuLayout.prototype.updateNavigationButtons = function () {
            var currentPage = $('.page:visible').attr('id');
            var isOnWelcome = $('.home:visible').length > 0;

            // Hide all floating nav buttons first
            $('.floating-nav-back, .floating-nav-home').hide();

            if (isOnWelcome) {
                // On welcome screen - no navigation buttons
                return;
            }

            if (currentPage) {
                // On any non-home page - show home button
                $('.floating-nav-home').show();
            }
        };

        MenuLayout.prototype.rotateEles = function () {
            if (this.isRotating) { return; }

            //**rotate menu zones*/
            // rotateZones($("#zone_one"), {
            //     delay: 1,
            //     cycle: 8,
            //     fill: 'packed',
            //     transition: 'fade'
            // });

            //**rotate entire menu section - full screen */
            // rotateMenus("#zone_one", {
            //     delay: 1,
            //     cycle: 8,
            //     transition: 'fade'
            // });

            this.isRotating = true;
            return;
        };
        //Date: 02.01.2025 adjusted for new trm playing logic
        MenuLayout.prototype.trmAnimate = function (playing, firstRun) {
            //called with playing each time asset plays in digital client. _this is accessible
            var _this = this;
            //handle first run tasks and non-playlist observer actions
            if (firstRun) {
                //setup observer
                animate();
                $("video").on("ended", animate);
                if (isCF || platform === "windows") {
                    document.reloadAsset = function () { animate(); };
                }
                return;
            }
            //handle playing messages

            if (playing && _this.playlist) {
                //add observer back if removed so video can loop if duration is > video length
                $("video").on("ended", animate)
                animate();
            }
            if (!playing) {
                //clear any observers if asset in a playlist
                $("video").off("ended")
                _this.playlist = true;

                //exiting actions
            }
            //set up aniumation functions
            function clearAllTimeouts() {
                _this.timeOuts.forEach(function (timeout) {
                    clearTimeout(timeout);
                });
            }

            function animate() {
                //simulate video loop
                $('video').each(function () {
                    this.play();
                });

                //playing actions
            }
        };
        MenuLayout.prototype.injectPricing = function (IMSProducts, IMSSettings) {
            var _this = this;
            if (!IMSProducts || IMSProducts.length === 0) {
                return;
            }
            IMSProducts.forEach(function (each) {
                if (each.productId && each.price && each.active) {
                    $(".Cost-" + each.productId).html(each.price);
                    $(".Cost-" + each.productId).attr("title", "PID: " + each.productId);
                    $(".Cost-" + each.productId).addClass(each.ApiSource);
                } else {
                    var error = Mustache.to_html(MenuLayout.error, each);
                    $(".Cost-" + each.productId).html(error);
                    $(".Cost-" + each.productId + " .material-icons").attr("title", "PID: " + each.productId).css("cursor", "wait");
                }
                if (each.productId && each.calorie) {
                    $(".Calories-" + each.productId).html(each.calorie);
                    $(".Calories-" + each.productId).addClass("ims");
                    $(".Calories-" + each.productId).attr("title", "PID: " + each.productId);
                } else {
                    var error = Mustache.to_html(MenuLayout.error, each);
                    $(".Calories-" + each.productId).html(error);
                    $(".Calories-" + each.productId + " .material-icons").attr("title", "PID: " + each.productId).css("cursor", "wait");
                }
                if (each.productId && each.displayName) {
                    $(".Name-" + each.productId).html(each.displayName);
                } else {
                    var error = Mustache.to_html(MenuLayout.error, each);
                    $(".Name-" + each.productId).html(error);
                }
                if (each.productId && each.menuDescription) {
                    $(".Desc-" + each.productId).html(each.menuDescription);
                } else {
                    //do nothing
                }
                if (each.productId && !each.enabled && each.ApiSource) {
                    $(".Cost-" + each.productId).attr("active", "false");
                    $(".Item-" + each.productId).hide();
                } else {
                    $(".Cost-" + each.productId).attr("active", "true");
                    $(".Item-" + each.productId).show();
                }
                if (each.productId && each.outOfStock) {
                    $(".ItemOOS-" + each.productId).css("opacity", "0");
                } else {
                    $(".ItemOOS-" + each.productId).css("opacity", "");
                }
            });
        };
        MenuLayout.COST = '{{dollars}}<span class="cents ">{{cents}}</span>';
        MenuLayout.error = '<span class="material-icons ">error</span>';
        MenuLayout.zoneError = `
        <div title="{{station}} {{message}}" class="menu-item-wrapper inline error-wrapper">
            <div class="item-wrapper">
                <span class="desc"><span class="material-icons" style="margin-right: 5px; vertical-align: top;">error</span>No menu found for {{station}}</span>
            </div>
        </div>`;
        return MenuLayout;
    })();
    IMSintegration.MenuLayout = MenuLayout;
})(IMSintegration || (IMSintegration = {}));
