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
            this.hotspotItems = [];
            this.hotspotDebugEnabled = false;
            this.layerPageMap = {
                1: "home"
            };
            this.pageLayerMap = {};
        }
        MenuLayout.prototype.init = function (IMSItems, IMSProducts, IMSSettings, integrationItems, API) {
            var _this = this;
            if (!API) {
                return;
            }
            this.buildPageLayerMap();

            try {
                this.configureHomeButtonAsset();
            } catch (e) {
                console.error("Error configuring home button asset: ", e);
            }

            try {
                this.initHotspotDebugState();
                this.bindHotspotDebugToggle();
            } catch (e) {
                console.error("Error setting hotspot debug state: ", e);
            }

            // Optional image-driven content injector. Remove this call if the template does not use imageStoreManager.
            try {
                this.initImageStoreManager();
            } catch (e) {
                console.error("Error initializing image store manager: ", e);
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

            try {
                this.registerLayersFromItems(integrationItems || []);
            } catch (e) {
                console.error("Error in MenuLayout registerLayersFromItems: ", e);
            }

            try {
                this.setupLayerHotspots(integrationItems || []);
            } catch (e) {
                console.error("Error in MenuLayout setupLayerHotspots: ", e);
            }
            //optional starts
            // try {
            //     this.rotateEles();
            // } catch (e) {
            //     console.error("Error in MenuLayout rotateEles: ", e);
            //     IMSintegration.Integration.prototype.showConnect(true, "Red", "rotateEles", e, "error");
            // }

            try {
                setupNutritionOverlayHandlers();
            } catch (e) {
                console.error("Error in MenuLayout setupNutritionOverlayHandlers: ", e);
            }

            try {
                this.initInactivityManager();
            } catch (e) {
                console.error("Error initializing InactivityManager: ", e);
            }
        };
        MenuLayout.prototype.initImageStoreManager = function () {
            if (!window.ImageStoreManager || typeof window.ImageStoreManager.init !== "function") {
                return;
            }
            window.ImageStoreManager.init();
        };
        MenuLayout.prototype.handleLayout = function (IMSSettings) {
            // Set up navigation buttons
            this.setupNavigationButtons();

            return true;
        };
        MenuLayout.prototype.handleProducts = function (IMSProducts) {
            var _this = this;
            if (!IMSProducts || IMSProducts.length === 0) {
                return;
            }
        };

        MenuLayout.prototype.setupLayerHotspots = function (items) {
            var _this = this;
            this.hotspotItems = Array.isArray(items) ? items : [];
            $('.cms-click-area').remove();

            this.hotspotItems.forEach(function (item) {
                var clickArea = item && item.clickArea ? item.clickArea : null;
                if (!clickArea || clickArea.sourceLayer === null || clickArea.sourceLayer === undefined || !clickArea.targetLayer) {
                    return;
                }

                var sourceLayer = parseInt(clickArea.sourceLayer, 10);
                var targetLayer = parseInt(clickArea.targetLayer, 10);
                if (isNaN(sourceLayer) || isNaN(targetLayer)) {
                    return;
                }

                var pageId = sourceLayer === 1 ? 'home' : _this.resolvePageIdForLayer(sourceLayer);
                var $container = sourceLayer === 1 ? $('.home').first() : $('#' + pageId);

                if (!$container.length) {
                    return;
                }

                if ($container.css('position') === 'static') {
                    $container.css('position', 'relative');
                }

                var $hotspot = $('<button type="button" class="cms-click-area" aria-label="Navigate" />');
                $hotspot.css({
                    left: (clickArea.x / 1080 * 100) + '%',
                    top: (clickArea.y / 1920 * 100) + '%',
                    width: (clickArea.width / 1080 * 100) + '%',
                    height: (clickArea.height / 1920 * 100) + '%'
                });

                if (typeof development !== 'undefined' && development) {
                    var label = clickArea.name || item.name || clickArea.id || '';
                    if (label) {
                        $hotspot.attr('title', label);
                    }
                }

                $hotspot.attr('data-source-layer', sourceLayer);
                $hotspot.attr('data-target-layer', targetLayer);
                $hotspot.attr('data-debug-label', 'L' + sourceLayer + ' -> L' + targetLayer);

                $hotspot.on('click touchstart', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    _this.navigateToLayer(targetLayer);
                });

                $container.append($hotspot);
            });
        };

        MenuLayout.prototype.registerLayersFromItems = function (items) {
            var _this = this;
            if (!Array.isArray(items)) {
                return;
            }

            var seenLayers = {};

            items.forEach(function (item) {
                var clickArea = item && item.clickArea ? item.clickArea : null;
                if (!clickArea) {
                    return;
                }

                var layerCandidates = [clickArea.sourceLayer, clickArea.targetLayer];
                layerCandidates.forEach(function (candidate) {
                    var layerId = parseInt(candidate, 10);
                    if (isNaN(layerId) || layerId <= 1 || seenLayers[layerId]) {
                        return;
                    }

                    seenLayers[layerId] = true;

                    var pageId = _this.resolvePageIdForLayer(layerId);
                    if (pageId) {
                        _this.registerLayerPage(layerId, pageId);
                        return;
                    }

                    var createdPageId = _this.ensureCmsLayerPage(layerId);
                    _this.registerLayerPage(layerId, createdPageId);
                });
            });
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
            } else {
                console.error('InactivityManager not found');
            }
        };

        MenuLayout.prototype.returnHome = function () {
            closeNutritionModal();
            this.navigateToLayer(1, true);
        };

        MenuLayout.prototype.setupNavigationButtons = function () {
            var _this = this;

            $('#global-home-btn').off('click').on('click', function (e) {
                e.stopPropagation();
                _this.navigateToLayer(1, true);
            });

            // Home button - returns to welcome screen from weekly menu
            $(document).on('click', '.floating-nav-home', function (e) {
                e.stopPropagation();
                _this.navigateToLayer(1, true);
            });

            // Edge back button - returns to menu selection from brand pages
            $(document).on('click', '.edge-nav-back', function (e) {
                e.stopPropagation();
                _this.navigateBack();
            });

        };

        MenuLayout.prototype.navigateToPage = function (pageId) {
            if (!pageId || !$('#' + pageId).length) {
                return;
            }

            var currentPage = $('.page:visible').attr('id');

            // Add current page to history if there's one visible
            if (currentPage) {
                this.navigationHistory.push(currentPage);
            } else {
                // Coming from welcome screen
                this.navigationHistory = [];
            }

            // Hide all pages and welcome screen
            $('.page').hide();
            $('.home').hide();

            // Show the target page
            $('#' + pageId).show();

            this.currentLayerId = this.pageLayerMap[pageId] || this.currentLayerId;

            // Reset scroll position of the page we're navigating TO
            window.scrollTo(0, 0);

            // Update navigation buttons
            this.updateNavigationButtons();

            // Resume inactivity timer when navigating away from home
            if (typeof InactivityManager !== 'undefined') {
                InactivityManager.resume();
            }
        };

        MenuLayout.prototype.navigateToLayer = function (layerId, clearHistory) {
            layerId = parseInt(layerId, 10);
            if (isNaN(layerId)) {
                return;
            }

            if (layerId === 1) {
                this.navigateToWelcome();
                return;
            }

            var pageId = this.resolvePageIdForLayer(layerId);

            if (!pageId) {
                if (this.shouldShowDevPlaceholder()) {
                    pageId = this.ensureDevPlaceholderPage(layerId);
                    this.registerLayerPage(layerId, pageId);
                } else {
                    return;
                }
            }

            this.currentLayerId = layerId;

            if (clearHistory) {
                this.navigationHistory = [];
            }

            this.navigateToPage(pageId);
        };

        MenuLayout.prototype.navigateBack = function () {
            if (this.navigationHistory.length > 0) {
                // Get previous page
                var previousPage = this.navigationHistory.pop();

                // Hide current page
                $('.page').hide();

                // Show previous page
                $('#' + previousPage).show();

                this.currentLayerId = this.pageLayerMap[previousPage] || this.currentLayerId;

                // Update navigation buttons
                this.updateNavigationButtons();

                // Scroll to top
                window.scrollTo(0, 0);
            }
        };

        MenuLayout.prototype.navigateToWelcome = function () {
            // Hide all pages
            $('.page').hide();

            // Show welcome screen
            $('.home').show();

            // Clear navigation history
            this.navigationHistory = [];
            this.currentLayerId = 1;

            // Update navigation buttons
            this.updateNavigationButtons();

            // Pause inactivity timer when on home screen
            if (typeof InactivityManager !== 'undefined') {
                InactivityManager.pause();
            }

            // Scroll to top
            window.scrollTo(0, 0);
        };

        MenuLayout.prototype.updateNavigationButtons = function () {
            var currentPage = $('.page:visible').attr('id');
            var isOnWelcome = $('.home:visible').length > 0;

            // Hide all floating nav buttons first
            $('.floating-nav-back, .floating-nav-home').hide();
            $('#global-home-btn').hide();

            if (isOnWelcome) {
                // On welcome screen - no navigation buttons
                return;
            }

            if (currentPage) {
                // On any non-home page - show home button
                $('#global-home-btn').show();
            }
        };

        MenuLayout.prototype.registerLayerPage = function (layerId, pageId) {
            layerId = parseInt(layerId, 10);
            if (isNaN(layerId) || !pageId) {
                return;
            }
            this.layerPageMap[layerId] = pageId;
            this.pageLayerMap[pageId] = layerId;
        };

        MenuLayout.prototype.resolvePageIdForLayer = function (layerId) {
            var direct = this.layerPageMap[layerId];
            if (direct && direct !== "home" && $('#' + direct).length) {
                return direct;
            }

            var nestedName = 'layer_' + layerId + '_page';
            if ($('#' + nestedName).length) {
                return nestedName;
            }

            return null;
        };

        MenuLayout.prototype.buildPageLayerMap = function () {
            var _this = this;
            Object.keys(this.layerPageMap).forEach(function (layerKey) {
                var layerId = parseInt(layerKey, 10);
                var pageId = _this.layerPageMap[layerId];
                if (pageId && pageId !== 'home') {
                    _this.pageLayerMap[pageId] = layerId;
                }
            });
        };

        MenuLayout.prototype.shouldShowDevPlaceholder = function () {
            if (typeof development !== 'undefined' && development) {
                return true;
            }
            if (typeof isPreview !== 'undefined' && isPreview) {
                return true;
            }
            return false;
        };

        MenuLayout.prototype.ensureDevPlaceholderPage = function (layerId) {
            var pageId = 'layer_' + layerId + '_page';
            if ($('#' + pageId).length) {
                return pageId;
            }

            var html = [
                '<div id="' + pageId + '" class="page layer-placeholder-page" style="display:none;">',
                '  <div class="layer-placeholder-content">',
                '    <h2>Layer ' + layerId + ' Placeholder</h2>',
                '    <p>No page content is mapped for this layer in the current data.</p>',
                '  </div>',
                '</div>'
            ].join('');

            $('#target.asset-wrapper').append(html);
            return pageId;
        };

        MenuLayout.prototype.ensureCmsLayerPage = function (layerId) {
            var pageId = 'layer_' + layerId + '_page';
            if ($('#' + pageId).length) {
                return pageId;
            }

            var pageHtml = [
                '<div id="' + pageId + '" class="page cms-layer-page" style="display:none;">',
                '  <button class="edge-nav-back" aria-label="Back">',
                '    <div class="edge-nav-chevron">',
                '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">',
                '        <polyline points="15 18 9 12 15 6"></polyline>',
                '      </svg>',
                '    </div>',
                '    <span class="edge-nav-label">Back</span>',
                '  </button>',
                '  <div id="layer_' + layerId + '_content_background" class="cms-image layer-content-image">',
                '    <img src="" alt="Layer ' + layerId + ' content">',
                '  </div>',
                '</div>'
            ].join('');

            $('#target.asset-wrapper').append(pageHtml);
            return pageId;
        };

        MenuLayout.prototype.initHotspotDebugState = function () {
            var saved = null;
            try {
                saved = localStorage.getItem('wandHotspotDebugEnabled');
            } catch (e) {
                saved = null;
            }

            var enableByDefault = false;
            if (typeof development !== 'undefined' && development) {
                enableByDefault = true;
            }
            if (typeof isPreview !== 'undefined' && isPreview) {
                enableByDefault = true;
            }

            if (saved === 'true' || saved === 'false') {
                this.hotspotDebugEnabled = saved === 'true';
            } else {
                this.hotspotDebugEnabled = enableByDefault;
            }

            this.applyHotspotDebugState();
        };

        MenuLayout.prototype.bindHotspotDebugToggle = function () {
            var _this = this;
            if (this.hotspotDebugBound) {
                return;
            }
            this.hotspotDebugBound = true;

            window.addEventListener('windowToggleHotspotDebug', function () {
                _this.setHotspotDebug(!_this.hotspotDebugEnabled);
            });
        };

        MenuLayout.prototype.applyHotspotDebugState = function () {
            if (this.hotspotDebugEnabled) {
                $('body').attr('data-hotspot-debug', 'true');
            } else {
                $('body').removeAttr('data-hotspot-debug');
            }
        };

        MenuLayout.prototype.setHotspotDebug = function (enabled) {
            this.hotspotDebugEnabled = Boolean(enabled);
            try {
                localStorage.setItem('wandHotspotDebugEnabled', this.hotspotDebugEnabled ? 'true' : 'false');
            } catch (e) {
                // ignore storage failures
            }
            this.applyHotspotDebugState();
        };

        MenuLayout.prototype.configureHomeButtonAsset = function () {
            var candidates = [
                window.homeButtonUrl,
                window.homeButtonAssetUrl,
                window.WAND_HOME_BUTTON_URL,
                typeof AssetConfiguration !== 'undefined' && AssetConfiguration ? AssetConfiguration.HomeButtonUrl : null
            ];
            var source = candidates.find(function (each) {
                return typeof each === 'string' && each.trim() !== '';
            });

            if (source) {
                $('#global-home-btn img').attr('src', source);
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
