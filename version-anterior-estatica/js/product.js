(function () {
  "use strict";

  const Navi = window.Navi;
  const RELATED_LIMIT = 4;
  const root = document.getElementById("product-root");
  const id = new URLSearchParams(window.location.search).get("id");
  const product = id ? Navi.getProduct(id) : null;

  function setMeta(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.setAttribute("content", value);
  }

  function renderNotFound() {
    document.title = "Producto no encontrado | " + Navi.config.storeName;
    root.innerHTML =
      '<div class="empty-state" style="margin-block:48px">' + Navi.icon("tree") +
      "<h1>No encontramos este producto</h1>" +
      "<p>Es posible que ya no esté disponible o que el enlace esté incompleto.</p>" +
      '<a class="btn btn-primary" href="catalogo.html">Ver catálogo</a>' +
      "</div>";
  }

  function renderSpecs() {
    const attributes = product.attributes || {};
    const rows = Object.keys(Navi.ATTRIBUTE_LABELS)
      .filter(function (key) {
        return attributes[key];
      })
      .map(function (key) {
        return "<div><dt>" + Navi.ATTRIBUTE_LABELS[key] + "</dt><dd>" + Navi.escapeHtml(attributes[key]) + "</dd></div>";
      });
    if (!rows.length) return "";
    return '<h2 style="font-size:1.25rem;margin-top:32px">Características</h2><dl class="spec-list">' + rows.join("") + "</dl>";
  }

  function renderProduct() {
    const category = Navi.getCategory(product.category);
    const images = Navi.productImages(product);
    const name = Navi.escapeHtml(product.name);
    const available = Navi.isAvailable(product);
    const saving = Navi.isOnSale(product) ? Number(product.price) - Number(product.salePrice) : 0;

    document.title = product.name + " | " + Navi.config.storeName;
    const description = (product.description || product.name).slice(0, 155);
    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', product.name);
    setMeta('meta[property="og:description"]', description);
    if (!/^data:/.test(images[0])) setMeta('meta[property="og:image"]', images[0]);

    const thumbs =
      images.length > 1
        ? '<div class="gallery__thumbs" role="group" aria-label="Fotos del producto">' +
          images
            .map(function (src, index) {
              return (
                '<button type="button" data-thumb="' + index + '" aria-pressed="' + (index === 0) + '" aria-label="Ver foto ' + (index + 1) + ' de ' + images.length + '">' +
                '<img src="' + Navi.escapeHtml(src) + '" alt="" width="72" height="72" loading="lazy"></button>'
              );
            })
            .join("") +
          "</div>"
        : "";

    const buyBox = available
      ? '<div class="buy-box">' +
        '<div class="buy-box__row">' +
        '<div class="qty qty--lg" role="group" aria-label="Cantidad">' +
        '<button type="button" data-qty-step="-1" aria-label="Quitar uno">−</button>' +
        '<input id="product-qty" type="number" inputmode="numeric" min="1" max="99" value="1" aria-label="Cantidad">' +
        '<button type="button" data-qty-step="1" aria-label="Agregar uno">+</button>' +
        "</div>" +
        '<button type="button" class="btn btn-primary" data-add-to-cart="' + Navi.escapeHtml(product.id) + '" data-quantity-from="#product-qty">' + Navi.icon("bag") + "Agregar al carrito</button>" +
        "</div>" +
        '<a class="btn btn-whatsapp btn-block" href="' + Navi.escapeHtml(Navi.whatsappUrl(Navi.productInquiryMessage(product))) + '" target="_blank" rel="noopener">' + Navi.icon("chat") + "Preguntar por WhatsApp</a>" +
        "</div>"
      : '<div class="buy-box">' +
        '<button type="button" class="btn btn-outline btn-block" disabled>Agotado</button>' +
        '<a class="btn btn-whatsapp btn-block" href="' + Navi.escapeHtml(Navi.whatsappUrl(Navi.productInquiryMessage(product))) + '" target="_blank" rel="noopener">' + Navi.icon("chat") + "Avísame cuando vuelva</a>" +
        "</div>";

    root.innerHTML =
      '<nav class="breadcrumbs" aria-label="Ruta de navegación" style="padding-top:24px"><ol>' +
      '<li><a href="index.html">Inicio</a></li>' +
      (category ? '<li><a href="' + Navi.catalogUrl({ categoria: category.id }) + '">' + Navi.escapeHtml(category.name) + "</a></li>" : "") +
      '<li aria-current="page">' + name + "</li>" +
      "</ol></nav>" +
      '<div class="product-detail">' +
      '<div class="gallery">' +
      '<div class="gallery__main"><img id="gallery-main" src="' + Navi.escapeHtml(images[0]) + '" alt="' + name + '" width="800" height="800"></div>' +
      thumbs +
      "</div>" +
      '<div class="product-info">' +
      '<div class="product-info__badges">' + Navi.renderBadges(product) + "</div>" +
      "<h1>" + name + "</h1>" +
      '<div class="product-info__price">' + Navi.renderPrice(product, true) + "</div>" +
      (saving ? '<p class="saving">Ahorras ' + Navi.formatPrice(saving) + " (" + Navi.discountPercent(product) + "%)</p>" : "") +
      '<p class="stock' + (available ? "" : " stock--out") + '">' + (available ? "Disponible" : "Agotado por ahora") + "</p>" +
      (product.description ? '<p class="product-info__description">' + Navi.escapeHtml(product.description) + "</p>" : "") +
      buyBox +
      renderSpecs() +
      "</div>" +
      "</div>";
  }

  function bindInteractions() {
    const mainImage = document.getElementById("gallery-main");
    const quantity = document.getElementById("product-qty");

    root.addEventListener("click", function (event) {
      const thumb = event.target.closest("[data-thumb]");
      if (thumb) {
        const images = Navi.productImages(product);
        mainImage.src = images[Number(thumb.dataset.thumb)];
        root.querySelectorAll("[data-thumb]").forEach(function (button) {
          button.setAttribute("aria-pressed", String(button === thumb));
        });
        return;
      }
      const step = event.target.closest("[data-qty-step]");
      if (step && quantity) {
        const next = (parseInt(quantity.value, 10) || 1) + Number(step.dataset.qtyStep);
        quantity.value = String(Math.max(1, Math.min(99, next)));
      }
    });

    if (quantity) {
      quantity.addEventListener("change", function () {
        const value = parseInt(quantity.value, 10);
        quantity.value = String(Math.max(1, Math.min(99, isNaN(value) ? 1 : value)));
      });
    }
  }

  function renderRelated() {
    const related = Navi.products
      .filter(function (item) {
        return item.id !== product.id && Navi.isAvailable(item);
      })
      .sort(function (a, b) {
        // Same category first, then other categories to suggest complementary items.
        return Number(b.category === product.category) - Number(a.category === product.category) || Number(Boolean(b.featured)) - Number(Boolean(a.featured));
      })
      .slice(0, RELATED_LIMIT);
    if (!related.length) return;
    document.getElementById("related-section").hidden = false;
    document.getElementById("related").innerHTML = related.map(Navi.renderProductCard).join("");
  }

  if (!product) {
    renderNotFound();
    return;
  }

  renderProduct();
  bindInteractions();
  renderRelated();
})();
