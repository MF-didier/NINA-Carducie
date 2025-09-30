(function($) {
    $.fn.mauGallery = function(options) {
        const settings = $.extend($.fn.mauGallery.defaults, options);
        const tagsCollection = new Set();

        return this.each(function() {
            const $gallery = $(this);
            $.fn.mauGallery.methods.createRowWrapper($gallery);

            if (settings.lightBox) {
                $.fn.mauGallery.methods.createLightBox($gallery, settings.lightboxId, settings.navigation);
            }

            $.fn.mauGallery.listeners(settings);

            $gallery.children(".gallery-item").each(function() {
                const $item = $(this);
                $.fn.mauGallery.methods.responsiveImageItem($item);
                $.fn.mauGallery.methods.moveItemInRowWrapper($item);
                $.fn.mauGallery.methods.wrapItemInColumn($item, settings.columns);

                const tag = $item.data("gallery-tag");
                if (settings.showTags && tag !== undefined) {
                    tagsCollection.add(tag);
                }
            });

            if (settings.showTags) {
                $.fn.mauGallery.methods.showItemTags($gallery, settings.tagsPosition, Array.from(tagsCollection));
            }

            $gallery.fadeIn(500);
        });
    };

    $.fn.mauGallery.defaults = {
        columns: 3,
        lightBox: true,
        lightboxId: null,
        showTags: true,
        tagsPosition: "bottom",
        navigation: true
    };

    $.fn.mauGallery.listeners = function(options) {
        $(".gallery-item").on("click", function() {
            if (options.lightBox && $(this).prop("tagName") === "IMG") {
                $.fn.mauGallery.methods.openLightBox($(this), options.lightboxId);
            }
        });

        $(".gallery").on("click", ".nav-link", $.fn.mauGallery.methods.filterByTag);
        $(".gallery").on("click", ".mg-prev", () => $.fn.mauGallery.methods.prevImage(options.lightboxId));
        $(".gallery").on("click", ".mg-next", () => $.fn.mauGallery.methods.nextImage(options.lightboxId));
    };

    $.fn.mauGallery.methods = {
        createRowWrapper(element) {
            if (!element.children().first().hasClass("row")) {
                element.append('<div class="gallery-items-row row"></div>');
            }
        },
        wrapItemInColumn(element, columns) {
            if (typeof columns === 'number') {
                element.wrap(`<div class='item-column mb-4 col-${Math.ceil(12 / columns)}'></div>`);
            } else if (typeof columns === 'object') {
                let columnClasses = "";
                if (columns.xs) columnClasses += ` col-${Math.ceil(12 / columns.xs)}`;
                if (columns.sm) columnClasses += ` col-sm-${Math.ceil(12 / columns.sm)}`;
                if (columns.md) columnClasses += ` col-md-${Math.ceil(12 / columns.md)}`;
                if (columns.lg) columnClasses += ` col-lg-${Math.ceil(12 / columns.lg)}`;
                if (columns.xl) columnClasses += ` col-xl-${Math.ceil(12 / columns.xl)}`;
                element.wrap(`<div class='item-column mb-4${columnClasses}'></div>`);
            } else {
                console.error(`Columns should be defined as numbers or objects. ${typeof columns} is not supported.`);
            }
        },
        moveItemInRowWrapper(element) {
            element.appendTo(".gallery-items-row");
        },
        responsiveImageItem(element) {
            if (element.prop("tagName") === "IMG") {
                element.addClass("img-fluid");
            }
        },
        openLightBox(element, lightboxId) {
            $(`#${lightboxId}`).find(".lightboxImage").attr("src", element.attr("src"));
            $(`#${lightboxId}`).modal("toggle");
        },
        prevImage(lightboxId) {
            const $activeImage = $("img.gallery-item").filter((_, img) => $(img).attr("src") === $(".lightboxImage").attr("src"));
            const activeTag = $(".tags-bar span.active-tag").data("images-toggle");
            const imagesCollection = [];

            $(".item-column").each(function() {
                const $img = $(this).children("img");
                if (activeTag === "all" || $img.data("gallery-tag") === activeTag) {
                    imagesCollection.push($img);
                }
            });

            const index = imagesCollection.findIndex(img => img.attr("src") === $activeImage.attr("src"));
            const prevImage = imagesCollection[index - 1] || imagesCollection[imagesCollection.length - 1];
            $(".lightboxImage").attr("src", prevImage.attr("src"));
        },
        nextImage(lightboxId) {
            const $activeImage = $("img.gallery-item").filter((_, img) => $(img).attr("src") === $(".lightboxImage").attr("src"));
            const activeTag = $(".tags-bar span.active-tag").data("images-toggle");
            const imagesCollection = [];

            $(".item-column").each(function() {
                const $img = $(this).children("img");
                if (activeTag === "all" || $img.data("gallery-tag") === activeTag) {
                    imagesCollection.push($img);
                }
            });

            const index = imagesCollection.findIndex(img => img.attr("src") === $activeImage.attr("src"));
            const nextImage = imagesCollection[index + 1] || imagesCollection[0];
            $(".lightboxImage").attr("src", nextImage.attr("src"));
        },
        createLightBox(gallery, lightboxId, navigation) {
            gallery.append(`
                <div class="modal fade" id="${lightboxId || "galleryLightbox"}" tabindex="-1" role="dialog" aria-hidden="true">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-body">
                                ${navigation ? '<div class="mg-prev" style="cursor:pointer;position:absolute;top:50%;left:-15px;background:white;"><</div>' : '<span style="display:none;" />'}
                                <img class="lightboxImage img-fluid" alt="Contenu de l'image affichée dans la modale au clique"/>
                                ${navigation ? '<div class="mg-next" style="cursor:pointer;position:absolute;top:50%;right:-15px;background:white;}">></div>' : '<span style="display:none;" />'}
                            </div>
                        </div>
                    </div>
                </div>
            `);
        },
        showItemTags(gallery, position, tags) {
            const tagItems = tags.map(tag => `<li class="nav-item"><span class="nav-link" data-images-toggle="${tag}">${tag}</span></li>`).join('');
            const tagsRow = `<ul class="my-4 tags-bar nav nav-pills"><li class="nav-item"><span class="nav-link active active-tag" data-images-toggle="all">Tous</span></li>${tagItems}</ul>`;

            if (position === "bottom") {
                gallery.append(tagsRow);
            } else if (position === "top") {
                gallery.prepend(tagsRow);
            } else {
                console.error(`Unknown tags position: ${position}`);
            }
        },
        filterByTag() {
            if ($(this).hasClass("active-tag")) return;

            $(".active-tag").removeClass("active active-tag");
            $(this).addClass("active active-tag");
            // $(this).addClass("active-tag"); // Correction du nommage de la classe, ajout de la classe active

            const tag = $(this).data("images-toggle");

            $(".gallery-item").each(function() {
                const $itemColumn = $(this).parents(".item-column");
                $itemColumn.hide();
                if (tag === "all" || $(this).data("gallery-tag") === tag) {
                    $itemColumn.show(300);
                }
            });
        }
    };
})(jQuery);