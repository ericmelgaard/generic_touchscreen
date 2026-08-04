"use strict";

(function (window) {
    const ImageStoreManager = {
        // Template developers can edit this function to map imageStore data into the DOM.
        imageInjector() {
            this.applyImageByName("calendar", "#card-happening", "#happening_page .cms-image img");
            this.applyImageByName("connect", "#card-connectwithus", "#connectwithus_page .cms-image img");
            this.applyImageByName("vote", "#card-vote", "#vote_page .cms-image img");
            this.applyImageByName("ambassador", "#card-ambassador", "#ambassador_page .cms-image img");
            this.applyImageByName("upcycled", "#card-foodwithpurpose", "#foodwithpurpose_page .cms-image img");
        },

        init() {
            if (!self.frameElement) {
                return "not in client";
            }

            if (this.isInitialized) {
                return;
            }

            const parentEle = $(self.frameElement).parent();
            const parentContainer = parentEle && parentEle[0] ? parentEle[0].parentElement : null;

            this.isInitialized = true;
            this.parentEle = parentEle;
            this.parentContainer = parentContainer;
            this.QUIET_WINDOW_MS = 240;
            this.rebuildTimer = null;
            this.rebuildInProgress = false;
            this.hasPendingChanges = false;
            this.lastMutationAt = 0;

            if (!parentContainer) {
                this.rebuildImageStore();
                this.runImageInjector();
                return;
            }

            this.rebuildImageStore();
            this.runImageInjector();
            this.observe();
        },

        runImageInjector() {
            if (typeof this.imageInjector === "function") {
                this.imageInjector();
            }
        },

        applyImageByName(nameFragment, cardSelector, imageSelector) {
            const matchedImages = imageStore.filter((item) => {
                return item.fileName.toLowerCase().indexOf(nameFragment.toLowerCase()) >= 0 && item.fileType === "image";
            });

            if (matchedImages.length > 0) {
                $(cardSelector).show();
                $(imageSelector).attr("src", matchedImages[0].fullPath);
                console.log("Set", imageSelector, "to:", matchedImages[0].fullPath);
                return;
            }

            $(cardSelector).hide();
        },

        observe() {
            const observerConfig = {
                childList: true,
                subtree: false
            };

            this.imageStoreObserver = new MutationObserver((mutationsList) => {
                const hasStructuralChange = mutationsList.some((mutation) => {
                    return mutation.type === "childList" && (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0);
                });

                if (!hasStructuralChange) {
                    return;
                }

                this.lastMutationAt = Date.now();
                this.hasPendingChanges = true;
                this.scheduleStableRebuild();
            });

            this.imageStoreObserver.observe(this.parentContainer, observerConfig);
        },

        platformPath(url) {
            let path = "";
            for (let i = 0; i < url.length - 2; i++) {
                path = path + url[i] + "/";
            }
            // console.log(path);
            return path;
        },

        normalizeImageURL(imageURL) {
            if (!imageURL) {
                return "";
            }
            if (!isUsingIndexedDB) {
                imageURL = imageURL.replace("..", "/CMSClient");
            }
            if (imageURL.indexOf("/content") > -1) {
                imageURL = imageURL.replace("./", "/media/developer/apps/usr/palm/applications/com.lg.app.signage/");
            }
            return imageURL;
        },

        getAssetIdFromURL(imageURL) {
            if (!imageURL) {
                return "";
            }
            const imageParts = imageURL.split("/").filter(Boolean);
            return imageParts.length >= 2 ? imageParts[imageParts.length - 2] : "";
        },

        getAssetZoneId() {
            if (typeof AssetConfiguration !== "undefined" && AssetConfiguration && AssetConfiguration.AZid) {
                return AssetConfiguration.AZid;
            }
            return null;
        },

        collectSiblingImages() {
            const siblingImages = [];
            const siblingEles = $(this.parentEle).siblings().get();

            siblingEles.forEach((each) => {
                if ($(each).children().length !== 1) {
                    return;
                }

                const childSrc = $(each).children(false).attr("src");
                const imageURL = this.normalizeImageURL(childSrc);
                if (!imageURL) {
                    return;
                }

                siblingImages.push({
                    imageURL: imageURL,
                    imageLayer: $(each).css("z-index"),
                    duration: $(each).attr("trm-duration")
                });
            });

            return siblingImages;
        },

        rebuildImageStore() {
            const images = this.collectSiblingImages();
            if (!Array.isArray(imageStore)) {
                imageStore = [];
            }
            imageStore.length = 0;

            images.forEach((each) => {
                const imageParts = each.imageURL.split("/");
                const lastSegment = imageParts[imageParts.length - 1] || "";
                const extensionParts = lastSegment.split(".");
                const fileExtension = extensionParts.length > 1 ? extensionParts[extensionParts.length - 1] : "";
                const videoExtensions = ["mp4", "webm", "ogg", "avi", "mov", "wmv", "flv", "m4v"];
                const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "tiff"];

                let fileType = "unknown";
                if (videoExtensions.includes(fileExtension.toLowerCase())) {
                    fileType = "video";
                } else if (imageExtensions.includes(fileExtension.toLowerCase())) {
                    fileType = "image";
                }

                const assetId = this.getAssetIdFromURL(each.imageURL);
                const imgObj = {
                    fullPath: each.imageURL,
                    assetId: assetId,
                    imagePath: assetId && lastSegment ? assetId + "/" + lastSegment : lastSegment,
                    platformPath: this.platformPath(imageParts),
                    fileName: lastSegment.split(".")[0],
                    fileExtension: fileExtension,
                    fileType: fileType,
                    imageLayer: each.imageLayer,
                    duration: each.duration
                };

                imageStore.push(imgObj);
            });

            console.log("image store populated with", imageStore.length, "images", imageStore);
            return imageStore;
        },

        dispatchImageStoreUpdated() {
            window.dispatchEvent(new CustomEvent("wand:imageStoreUpdated", {
                detail: {
                    assetZoneId: this.getAssetZoneId(),
                    imageStoreCount: imageStore.length,
                    updatedAt: Date.now()
                }
            }));
        },

        scheduleStableRebuild() {
            clearTimeout(this.rebuildTimer);
            this.rebuildTimer = setTimeout(() => {
                this.performStableRebuild();
            }, this.QUIET_WINDOW_MS);
        },

        performStableRebuild() {
            if (this.rebuildInProgress) {
                this.hasPendingChanges = true;
                return;
            }
            this.rebuildInProgress = true;

            const defer = window.requestAnimationFrame || function (cb) {
                setTimeout(cb, 0);
            };

            defer(() => {
                this.rebuildImageStore();
                this.rebuildInProgress = false;

                const quietFor = Date.now() - this.lastMutationAt;
                if (this.hasPendingChanges || quietFor < this.QUIET_WINDOW_MS) {
                    this.hasPendingChanges = false;
                    this.scheduleStableRebuild();
                    return;
                }

                this.runImageInjector();
                this.dispatchImageStoreUpdated();
            });
        }
    };

    window.ImageStoreManager = ImageStoreManager;
})(window);
