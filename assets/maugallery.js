(function($) {
  $.fn.mauGallery = function(options) {
    var options = $.extend({}, $.fn.mauGallery.defaults, options);
    var tagsCollection = [];
    return this.each(function() {
      var $gallery = $(this);
      $.fn.mauGallery.methods.createRowWrapper($gallery);

      if (options.lightBox) {
        $.fn.mauGallery.methods.createLightBox($gallery, options.lightboxId, options.navigation);
      }
      $.fn.mauGallery.listeners($gallery, options);

      $gallery.children(".gallery-item").each(function() {
        var $item = $(this);
        $.fn.mauGallery.methods.responsiveImageItem($item);
        $.fn.mauGallery.methods.moveItemInRowWrapper($item, $gallery);
        $.fn.mauGallery.methods.wrapItemInColumn($item, options.columns);
        var theTag = $item.data("gallery-tag");
        if (options.showTags && theTag !== undefined && tagsCollection.indexOf(theTag) === -1) {
          tagsCollection.push(theTag);
        }
      });

      if (options.showTags) {
        $.fn.mauGallery.methods.showItemTags($gallery, options.tagsPosition, tagsCollection);
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

  // On attache les events sur la galerie courante seulement (pas globalement)
  $.fn.mauGallery.listeners = function($gallery, options) {
    $gallery.off(".mauGalleryEvents"); // Nettoyage pour éviter les doublons

    // Event delegation pour les items et navigation
    $gallery.on("click.mauGalleryEvents", ".gallery-item", function() {
      if (options.lightBox && $(this).is("img")) {
        $.fn.mauGallery.methods.openLightBox($(this), options.lightboxId, $gallery);
      }
    });
    $gallery.on("click.mauGalleryEvents", ".nav-link", $.fn.mauGallery.methods.filterByTag);
    $gallery.on("click.mauGalleryEvents", ".mg-prev", function() {
      $.fn.mauGallery.methods.prevImage(options.lightboxId, $gallery);
    });
    $gallery.on("click.mauGalleryEvents", ".mg-next", function() {
      $.fn.mauGallery.methods.nextImage(options.lightboxId, $gallery);
    });
  };

  // Cache pour les images filtrées (améliore la navigation)
  function getImagesCollection($gallery, tag) {
    var imagesCollection = [];
    if (tag === "all") {
      $gallery.find(".item-column img.gallery-item").each(function() {
        imagesCollection.push($(this));
      });
    } else {
      $gallery.find(".item-column img.gallery-item").each(function() {
        if ($(this).data("gallery-tag") === tag) {
          imagesCollection.push($(this));
        }
      });
    }
    return imagesCollection;
  }

  $.fn.mauGallery.methods = {
    createRowWrapper($element) {
      if (!$element.children().first().hasClass("row")) {
        $element.append('<div class="gallery-items-row row"></div>');
      }
    },
    wrapItemInColumn($element, columns) {
      // Empêche le double wrap
      if ($element.parent().hasClass('item-column')) return;

      if (typeof columns === "number") {
        $element.wrap(
          `<div class='item-column mb-4 col-${Math.ceil(12 / columns)}'></div>`
        );
      } else if (typeof columns === "object") {
        var columnClasses = "";
        if (columns.xs) columnClasses += ` col-${Math.ceil(12 / columns.xs)}`;
        if (columns.sm) columnClasses += ` col-sm-${Math.ceil(12 / columns.sm)}`;
        if (columns.md) columnClasses += ` col-md-${Math.ceil(12 / columns.md)}`;
        if (columns.lg) columnClasses += ` col-lg-${Math.ceil(12 / columns.lg)}`;
        if (columns.xl) columnClasses += ` col-xl-${Math.ceil(12 / columns.xl)}`;
        $element.wrap(`<div class='item-column mb-4${columnClasses}'></div>`);
      } else {
        console.error(
          `Columns should be defined as numbers or objects. ${typeof columns} is not supported.`
        );
      }
    },
    moveItemInRowWrapper($element, $gallery) {
      // Évite de déplacer inutilement si déjà dans le conteneur
      var $row = $gallery.find(".gallery-items-row");
      if ($element.parent()[0] !== $row[0]) {
        $element.appendTo($row);
      }
    },
    responsiveImageItem($element) {
      if ($element.is("img")) {
        $element.addClass("img-fluid");
      }
    },
    openLightBox($element, lightboxId, $gallery) {
      var id = lightboxId || "galleryLightbox";
      var $modal = $gallery.find(`#${id}`);
      $modal.find(".lightboxImage").attr("src", $element.attr("src"));
      $modal.modal("toggle");
    },
    prevImage(lightboxId, $gallery) {
      var id = lightboxId || "galleryLightbox";
      var $modal = $gallery.find(`#${id}`);
      var activeSrc = $modal.find(".lightboxImage").attr("src");
      var activeTag = $gallery.find(".tags-bar .active-tag").data("images-toggle");
      var imagesCollection = getImagesCollection($gallery, activeTag);
      var index = imagesCollection.findIndex(img => img.attr("src") === activeSrc);
      var prev = imagesCollection[(index - 1 + imagesCollection.length) % imagesCollection.length];
      $modal.find(".lightboxImage").attr("src", prev.attr("src"));
    },
    nextImage(lightboxId, $gallery) {
      var id = lightboxId || "galleryLightbox";
      var $modal = $gallery.find(`#${id}`);
      var activeSrc = $modal.find(".lightboxImage").attr("src");
      var activeTag = $gallery.find(".tags-bar .active-tag").data("images-toggle");
      var imagesCollection = getImagesCollection($gallery, activeTag);
      var index = imagesCollection.findIndex(img => img.attr("src") === activeSrc);
      var next = imagesCollection[(index + 1) % imagesCollection.length];
      $modal.find(".lightboxImage").attr("src", next.attr("src"));
    },
    createLightBox($gallery, lightboxId, navigation) {
      var id = lightboxId || "galleryLightbox";
      // Vérifie si le modal existe déjà
      if ($gallery.find(`#${id}`).length) return;
      $gallery.append(`<div class="modal fade" id="${id}" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-body">
                            ${
                              navigation
                                ? '<div class="mg-prev" style="cursor:pointer;position:absolute;top:50%;left:-15px;background:white;"><</div>'
                                : '<span style="display:none;" />'
                            }
                            <img class="lightboxImage img-fluid" alt="Contenu de l'image affichée dans la modale au clique"/>
                            ${
                              navigation
                                ? '<div class="mg-next" style="cursor:pointer;position:absolute;top:50%;right:-15px;background:white;">></div>'
                                : '<span style="display:none;" />'
                            }
                        </div>
                    </div>
                </div>
            </div>`);
    },
    showItemTags($gallery, position, tags) {
      var tagItems =
        '<li class="nav-item"><span class="nav-link active active-tag"  data-images-toggle="all">Tous</span></li>';
      $.each(tags, function(index, value) {
        tagItems += `<li class="nav-item active">
                <span class="nav-link"  data-images-toggle="${value}">${value}</span></li>`;
      });
      var tagsRow = `<ul class="my-4 tags-bar nav nav-pills">${tagItems}</ul>`;

      if (position === "bottom") {
        $gallery.append(tagsRow);
      } else if (position === "top") {
        $gallery.prepend(tagsRow);
      } else {
        console.error(`Unknown tags position: ${position}`);
      }
    },
    filterByTag() {
      if ($(this).hasClass("active-tag")) return;
      var $tagsBar = $(this).closest('.tags-bar');
      $tagsBar.find(".active-tag").removeClass("active active-tag");
      $(this).addClass("active active-tag");
      var tag = $(this).data("images-toggle");
      var $gallery = $(this).closest('.gallery');
      $gallery.find(".gallery-item").each(function() {
        var $column = $(this).closest(".item-column");
        $column.hide();
        if (tag === "all" || $(this).data("gallery-tag") === tag) {
          $column.show(300);
        }
      });
    }
  };
})(jQuery);