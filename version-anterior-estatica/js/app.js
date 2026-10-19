/*
 * Shared storefront code: layout (header, footer, menus), product cards, cart and helpers.
 * Classic script (not an ES module) so the site also works when opened straight from disk.
 */
(function () {
  "use strict";

  const config = window.NAVI_CONFIG || {};
  const products = Array.isArray(window.NAVI_PRODUCTS) ? window.NAVI_PRODUCTS : [];
  const categories = Array.isArray(config.categories) ? config.categories : [];
  const CART_STORAGE_KEY = "navi-cart-v1";

  const ATTRIBUTE_LABELS = {
    altura: "Altura",
    forma: "Forma",
    luz: "Tipo de luz",
    color: "Color",
    material: "Material",
    piezas: "Piezas",
    medidas: "Medidas"
  };

  const BADGE_LABELS = {
    nuevo: "Nuevo",
    "mas-vendido": "Más vendido",
    "edicion-limitada": "Edición limitada"
  };

  /* ---------------------------------------------------------------------- */
  /* Icons                                                                   */
  /* ---------------------------------------------------------------------- */
  const ICON_PATHS = {
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    bag: '<path d="M6 7h12l1 13H5L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
    chat: '<path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.6-5.2A8.5 8.5 0 1 1 21 11.5Z"/><path d="M9 10h6M9 13.5h4"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12"/><path d="M12 8S10.5 4 8 4a2 2 0 0 0 0 4h4Zm0 0s1.5-4 4-4a2 2 0 0 1 0 4h-4Z"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    tree: '<path d="M12 3 7 10h3l-4 6h4l-3 4h10l-3-4h4l-4-6h3l-5-7Z"/><path d="M12 20v2"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    instagram: '<rect width="20" height="20" x="2" y="2" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><path d="M17.5 6.5h.01"/>',
    tiktok: '<path d="M9 12a4 4 0 1 0 4 4V3c.5 2.5 2.5 4.5 5 5"/>'
  };

  function icon(name) {
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      (ICON_PATHS[name] || "") +
      "</svg>"
    );
  }

  const LOGO_MARK =
    '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M16 6.5 22 15h-3.2l5.2 7h-3.4L26 29H6l5.4-7H8l5.2-7H10Z" fill="currentColor"/><path d="M16 1.5l1.2 2.6 2.8.3-2.1 1.9.6 2.8L16 7.7l-2.5 1.4.6-2.8-2.1-1.9 2.8-.3Z" fill="#c99a3d"/></svg>';

  /* ---------------------------------------------------------------------- */
  /* Helpers                                                                 */
  /* ---------------------------------------------------------------------- */
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeText(value) {
    return String(value == null ? "" : value)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();
  }

  const priceFormatter = new Intl.NumberFormat(config.locale || "es-MX", {
    style: "currency",
    currency: config.currency || "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  function formatPrice(amount) {
    return priceFormatter.format(Number(amount) || 0);
  }

  function getCategory(id) {
    return categories.find(function (category) {
      return category.id === id;
    });
  }

  function getProduct(id) {
    return products.find(function (product) {
      return product.id === id;
    });
  }

  function isOnSale(product) {
    const sale = Number(product.salePrice);
    return sale > 0 && sale < Number(product.price);
  }

  function effectivePrice(product) {
    return isOnSale(product) ? Number(product.salePrice) : Number(product.price);
  }

  function isAvailable(product) {
    return product.available !== false;
  }

  function placeholderImage(product) {
    const category = getCategory(product.category);
    return (category && category.image) || "img/placeholders/adornos.svg";
  }

  function productImages(product) {
    const images = (product.images || []).filter(Boolean);
    return images.length ? images : [placeholderImage(product)];
  }

  function productUrl(product) {
    return "producto.html?id=" + encodeURIComponent(product.id);
  }

  function catalogUrl(params) {
    const search = new URLSearchParams(params || {}).toString();
    return "catalogo.html" + (search ? "?" + search : "");
  }

  function attributeSummary(product) {
    const attributes = product.attributes || {};
    return ["altura", "luz", "piezas", "medidas"]
      .map(function (key) {
        if (!attributes[key]) return "";
        return key === "piezas" && /^\d+$/.test(attributes[key]) ? attributes[key] + " piezas" : attributes[key];
      })
      .filter(Boolean)
      .slice(0, 2)
      .join(" · ");
  }

  function discountPercent(product) {
    if (!isOnSale(product)) return 0;
    return Math.round((1 - Number(product.salePrice) / Number(product.price)) * 100);
  }

  /* ---------------------------------------------------------------------- */
  /* Product markup                                                          */
  /* ---------------------------------------------------------------------- */
  function renderPrice(product, large) {
    const classes = "price" + (isOnSale(product) ? " price--sale" : "") + (large ? " price--lg" : "");
    if (isOnSale(product)) {
      return (
        '<p class="' + classes + '">' +
        '<span class="price__current"><span class="visually-hidden">Precio de oferta: </span>' + formatPrice(product.salePrice) + "</span>" +
        '<span class="price__old"><span class="visually-hidden">Precio anterior: </span>' + formatPrice(product.price) + "</span>" +
        "</p>"
      );
    }
    return '<p class="' + classes + '"><span class="price__current">' + formatPrice(product.price) + "</span></p>";
  }

  function renderBadges(product) {
    const badges = [];
    if (!isAvailable(product)) badges.push('<span class="badge badge--soldout">Agotado</span>');
    if (isOnSale(product)) badges.push('<span class="badge badge--sale">-' + discountPercent(product) + "%</span>");
    if (product.badge && BADGE_LABELS[product.badge]) {
      const modifier = product.badge === "nuevo" ? " badge--new" : "";
      badges.push('<span class="badge' + modifier + '">' + BADGE_LABELS[product.badge] + "</span>");
    }
    return badges.join("");
  }

  function renderProductCard(product) {
    const images = productImages(product);
    const category = getCategory(product.category);
    const name = escapeHtml(product.name);
    const summary = attributeSummary(product);
    const imageAttrs = ' width="800" height="800" loading="lazy" decoding="async"';
    const media =
      '<img src="' + escapeHtml(images[0]) + '" alt="' + name + '"' + imageAttrs + ">" +
      (images[1] ? '<img class="is-secondary" src="' + escapeHtml(images[1]) + '" alt=""' + imageAttrs + ">" : "");
    const button = isAvailable(product)
      ? '<button type="button" class="btn btn-primary btn-sm btn-block" data-add-to-cart="' + escapeHtml(product.id) + '">Agregar al carrito</button>'
      : '<button type="button" class="btn btn-outline btn-sm btn-block" disabled>Agotado</button>';

    return (
      '<article class="product-card reveal">' +
      '<div class="product-card__media">' +
      '<div class="product-card__badges">' + renderBadges(product) + "</div>" +
      media +
      "</div>" +
      '<div class="product-card__body">' +
      (category ? '<span class="product-card__category">' + escapeHtml(category.shortName || category.name) + "</span>" : "") +
      '<h3 class="product-card__name"><a href="' + productUrl(product) + '">' + name + "</a></h3>" +
      (summary ? '<p class="product-card__meta">' + escapeHtml(summary) + "</p>" : "") +
      '<div class="product-card__footer">' + renderPrice(product, false) + button + "</div>" +
      "</div>" +
      "</article>"
    );
  }

  /* ---------------------------------------------------------------------- */
  /* WhatsApp                                                                */
  /* ---------------------------------------------------------------------- */
  function whatsappUrl(message) {
    const number = String(config.whatsapp || "").replace(/\D/g, "");
    return "https://wa.me/" + number + (message ? "?text=" + encodeURIComponent(message) : "");
  }

  function publicPageUrl(path) {
    if (!/^https?:$/.test(window.location.protocol)) return "";
    return new URL(path, window.location.href).href;
  }

  function productInquiryMessage(product) {
    const link = publicPageUrl(productUrl(product));
    return (
      "¡Hola, " + (config.storeName || "") + "! Me interesa este producto:\n" +
      product.name + " — " + formatPrice(effectivePrice(product)) +
      (link ? "\n" + link : "") +
      "\n\n¿Está disponible?"
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Cart                                                                    */
  /* ---------------------------------------------------------------------- */
  function readCart() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  let cart = readCart().filter(function (line) {
    return getProduct(line.id) && line.quantity > 0;
  });

  function saveCart() {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      // Storage can be unavailable (private mode); the cart still works for this visit.
    }
    updateCartUi();
  }

  function cartLines() {
    return cart
      .map(function (line) {
        const product = getProduct(line.id);
        return product ? { product: product, quantity: line.quantity } : null;
      })
      .filter(Boolean);
  }

  function cartCount() {
    return cart.reduce(function (sum, line) {
      return sum + line.quantity;
    }, 0);
  }

  function cartTotal() {
    return cartLines().reduce(function (sum, line) {
      return sum + effectivePrice(line.product) * line.quantity;
    }, 0);
  }

  function addToCart(id, quantity) {
    const product = getProduct(id);
    if (!product || !isAvailable(product)) return;
    const amount = Math.max(1, Math.min(99, parseInt(quantity, 10) || 1));
    const existing = cart.find(function (line) {
      return line.id === id;
    });
    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + amount);
    } else {
      cart.push({ id: id, quantity: amount });
    }
    saveCart();
    showToast("Agregaste " + product.name + " al carrito");
  }

  function setCartQuantity(id, quantity) {
    const line = cart.find(function (item) {
      return item.id === id;
    });
    if (!line) return;
    line.quantity = Math.max(1, Math.min(99, quantity));
    saveCart();
  }

  function removeFromCart(id) {
    cart = cart.filter(function (line) {
      return line.id !== id;
    });
    saveCart();
  }

  function clearCart() {
    cart = [];
    saveCart();
  }

  function orderMessage() {
    const lines = cartLines().map(function (line) {
      const unit = effectivePrice(line.product);
      return "• " + line.quantity + " × " + line.product.name + " (" + formatPrice(unit) + " c/u) = " + formatPrice(unit * line.quantity);
    });
    return (
      "¡Hola, " + (config.storeName || "") + "! Quiero hacer este pedido:\n\n" +
      lines.join("\n") +
      "\n\nTotal estimado: " + formatPrice(cartTotal()) +
      "\n\n¿Me confirman disponibilidad, entrega y forma de pago? ¡Gracias!"
    );
  }

  function renderCartContents() {
    const body = document.getElementById("cart-body");
    const foot = document.getElementById("cart-foot");
    if (!body || !foot) return;

    const lines = cartLines();
    if (!lines.length) {
      body.innerHTML =
        '<div class="cart-empty">' + icon("tree") +
        "<h3>Tu carrito está vacío</h3>" +
        "<p>Explora nuestros árboles, esferas y luces para empezar tu decoración.</p>" +
        '<a class="btn btn-primary" href="' + catalogUrl() + '">Explorar catálogo</a>' +
        "</div>";
      foot.hidden = true;
      return;
    }

    body.innerHTML =
      '<ul class="cart-items">' +
      lines
        .map(function (line) {
          const product = line.product;
          const id = escapeHtml(product.id);
          const name = escapeHtml(product.name);
          return (
            '<li class="cart-item">' +
            '<img src="' + escapeHtml(productImages(product)[0]) + '" alt="" width="76" height="76" loading="lazy">' +
            "<div>" +
            '<p class="cart-item__name"><a href="' + productUrl(product) + '">' + name + "</a></p>" +
            '<p class="cart-item__price">' + formatPrice(effectivePrice(product)) + " c/u</p>" +
            '<div class="cart-item__actions">' +
            '<div class="qty" role="group" aria-label="Cantidad de ' + name + '">' +
            '<button type="button" data-cart-decrease="' + id + '" aria-label="Quitar uno"' + (line.quantity <= 1 ? " disabled" : "") + ">−</button>" +
            '<output aria-live="polite">' + line.quantity + "</output>" +
            '<button type="button" data-cart-increase="' + id + '" aria-label="Agregar uno"' + (line.quantity >= 99 ? " disabled" : "") + ">+</button>" +
            "</div>" +
            '<button type="button" class="link-btn" data-cart-remove="' + id + '">Eliminar</button>' +
            "</div>" +
            "</div>" +
            "</li>"
          );
        })
        .join("") +
      "</ul>";

    foot.hidden = false;
    foot.querySelector("[data-cart-total]").textContent = formatPrice(cartTotal());
    foot.querySelector("[data-cart-checkout]").href = whatsappUrl(orderMessage());
  }

  function updateCartUi() {
    const count = cartCount();
    document.querySelectorAll("[data-cart-count]").forEach(function (badge) {
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.hidden = count === 0;
    });
    document.querySelectorAll("[data-open-cart]").forEach(function (button) {
      button.setAttribute("aria-label", "Abrir carrito, " + count + (count === 1 ? " producto" : " productos"));
    });
    renderCartContents();
  }

  /* ---------------------------------------------------------------------- */
  /* Overlays (cart drawer + mobile menu): focus trap, Esc, focus restore    */
  /* ---------------------------------------------------------------------- */
  let activeOverlay = null;
  let lastFocused = null;

  function focusableElements(container) {
    return Array.prototype.filter.call(
      container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'),
      function (element) {
        return element.offsetParent !== null;
      }
    );
  }

  function openOverlay(overlay, trigger) {
    if (!overlay) return;
    if (activeOverlay) closeOverlay();
    lastFocused = trigger || document.activeElement;
    activeOverlay = overlay;
    overlay.removeAttribute("inert");
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
    document.querySelectorAll('[aria-controls="' + overlay.id + '"]').forEach(function (button) {
      button.setAttribute("aria-expanded", "true");
    });
    const panel = overlay.querySelector("[data-overlay-panel]");
    window.setTimeout(function () {
      const first = focusableElements(panel)[0];
      (first || panel).focus();
    }, 50);
  }

  function closeOverlay() {
    if (!activeOverlay) return;
    const overlay = activeOverlay;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    overlay.setAttribute("inert", "");
    document.querySelectorAll('[aria-controls="' + overlay.id + '"]').forEach(function (button) {
      button.setAttribute("aria-expanded", "false");
    });
    document.body.classList.remove("is-locked");
    activeOverlay = null;
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  function handleOverlayKeydown(event) {
    if (!activeOverlay) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeOverlay();
      return;
    }
    if (event.key !== "Tab") return;
    const items = focusableElements(activeOverlay);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Toast                                                                   */
  /* ---------------------------------------------------------------------- */
  let toastTimer = null;

  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.querySelector("[data-toast-text]").textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2600);
  }

  /* ---------------------------------------------------------------------- */
  /* Layout                                                                  */
  /* ---------------------------------------------------------------------- */
  function navItems() {
    const items = categories.map(function (category) {
      return { href: catalogUrl({ categoria: category.id }), label: category.shortName || category.name, id: category.id };
    });
    items.push({ href: catalogUrl({ oferta: "1" }), label: "Ofertas", id: "ofertas", sale: true });
    items.push({ href: catalogUrl(), label: "Todo", id: "todo" });
    return items;
  }

  function isNavItemCurrent(item) {
    if (document.body.dataset.page !== "catalog") return false;
    const params = new URLSearchParams(window.location.search);
    if (item.id === "ofertas") return params.get("oferta") === "1";
    if (item.id === "todo") return !params.get("categoria") && !params.get("oferta") && !params.get("q");
    return params.get("categoria") === item.id;
  }

  function renderSearchForm(id) {
    const query = new URLSearchParams(window.location.search).get("q") || "";
    return (
      '<form class="search-form" action="catalogo.html" method="get" role="search">' +
      '<label class="visually-hidden" for="' + id + '">Buscar productos</label>' +
      '<input id="' + id + '" type="search" name="q" placeholder="Buscar árboles, esferas, luces…" value="' + escapeHtml(query) + '" autocomplete="off" enterkeyhint="search">' +
      '<button type="submit" aria-label="Buscar">' + icon("search") + "</button>" +
      "</form>"
    );
  }

  function renderLogo() {
    const name = escapeHtml(config.storeName || "NaviExpoNavidad");
    // Highlights "Navidad" in the wordmark when the store name ends with it.
    const match = name.match(/^(.*?)(Navidad)$/);
    const wordmark = match ? match[1] + '<span class="logo-accent">' + match[2] + "</span>" : name;
    return '<a class="logo" href="index.html" aria-label="' + name + ', ir al inicio">' + LOGO_MARK + "<span>" + wordmark + "</span></a>";
  }

  function renderHeader() {
    const mount = document.getElementById("site-header");
    if (!mount) return;
    const items = navItems();
    const navLinks = items
      .map(function (item) {
        const current = isNavItemCurrent(item) ? ' aria-current="page"' : "";
        return '<li><a href="' + item.href + '"' + current + (item.sale ? ' class="is-sale"' : "") + ">" + escapeHtml(item.label) + "</a></li>";
      })
      .join("");

    mount.outerHTML =
      '<a class="skip-link" href="#main">Saltar al contenido</a>' +
      (config.promoBar ? '<div class="promo-bar">' + escapeHtml(config.promoBar) + "</div>" : "") +
      '<header class="site-header">' +
      '<div class="container">' +
      '<div class="header-row">' +
      '<div class="header-brand">' +
      '<button type="button" class="icon-btn menu-toggle" aria-controls="mobile-menu" aria-expanded="false" aria-label="Abrir menú" data-open-menu>' + icon("menu") + "</button>" +
      renderLogo() +
      "</div>" +
      '<div class="header-search">' + renderSearchForm("search-desktop") + "</div>" +
      '<div class="header-actions">' +
      '<a class="icon-btn" href="' + whatsappUrl() + '" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">' + icon("chat") + "</a>" +
      '<button type="button" class="icon-btn" aria-controls="cart-drawer" aria-expanded="false" data-open-cart>' + icon("bag") + '<span class="cart-count" data-cart-count hidden>0</span></button>' +
      "</div>" +
      "</div>" +
      '<div class="mobile-search">' + renderSearchForm("search-mobile") + "</div>" +
      "</div>" +
      '<nav class="main-nav" aria-label="Categorías"><div class="container"><ul>' + navLinks + "</ul></div></nav>" +
      "</header>";

    const menu = document.createElement("div");
    menu.className = "mobile-menu";
    menu.id = "mobile-menu";
    menu.setAttribute("aria-hidden", "true");
    menu.setAttribute("inert", "");
    menu.innerHTML =
      '<div class="mobile-menu__overlay" data-close-overlay></div>' +
      '<div class="mobile-menu__panel" role="dialog" aria-modal="true" aria-label="Menú" tabindex="-1" data-overlay-panel>' +
      '<div class="mobile-menu__head">' + renderLogo() +
      '<button type="button" class="icon-btn" aria-label="Cerrar menú" data-close-overlay>' + icon("close") + "</button></div>" +
      '<nav aria-label="Categorías"><ul>' +
      '<li><a href="index.html"' + (document.body.dataset.page === "home" ? ' aria-current="page"' : "") + ">Inicio</a></li>" +
      navLinks.replace(/ class="is-sale"/g, "") +
      "</ul></nav>" +
      '<a class="btn btn-whatsapp btn-block" style="margin-top:24px" href="' + whatsappUrl() + '" target="_blank" rel="noopener">' + icon("chat") + "Escríbenos por WhatsApp</a>" +
      "</div>";
    document.body.appendChild(menu);
  }

  function renderFooter() {
    const mount = document.getElementById("site-footer");
    if (!mount) return;
    const social = config.social || {};
    const socialLinks = ["facebook", "instagram", "tiktok"]
      .filter(function (network) {
        return social[network];
      })
      .map(function (network) {
        const label = network.charAt(0).toUpperCase() + network.slice(1);
        return '<a href="' + escapeHtml(social[network]) + '" target="_blank" rel="noopener" aria-label="' + label + '">' + icon(network) + "</a>";
      })
      .join("");

    const contact = [
      '<li><a href="' + whatsappUrl() + '" target="_blank" rel="noopener">WhatsApp</a></li>',
      config.phone ? '<li><a href="tel:' + escapeHtml(String(config.phone).replace(/[^\d+]/g, "")) + '">' + escapeHtml(config.phone) + "</a></li>" : "",
      config.email ? '<li><a href="mailto:' + escapeHtml(config.email) + '">' + escapeHtml(config.email) + "</a></li>" : "",
      config.address ? "<li>" + escapeHtml(config.address) + "</li>" : "",
      config.hours ? "<li>" + escapeHtml(config.hours) + "</li>" : ""
    ].join("");

    const shopLinks = categories
      .map(function (category) {
        return '<li><a href="' + catalogUrl({ categoria: category.id }) + '">' + escapeHtml(category.name) + "</a></li>";
      })
      .join("");

    mount.outerHTML =
      '<footer class="site-footer">' +
      '<div class="container">' +
      '<div class="footer-grid">' +
      "<div>" + renderLogo() +
      '<p style="margin-top:12px;max-width:40ch">' + escapeHtml(config.tagline || "") + "</p>" +
      (socialLinks ? '<div class="social-links">' + socialLinks + "</div>" : "") +
      "</div>" +
      '<div><h2>Comprar</h2><ul>' + shopLinks + '<li><a href="' + catalogUrl({ oferta: "1" }) + '">Ofertas</a></li></ul></div>' +
      "<div><h2>Contacto</h2><ul>" + contact + "</ul></div>" +
      "</div>" +
      '<div class="footer-bottom"><p>© ' + new Date().getFullYear() + " " + escapeHtml(config.storeName || "") + ". Todos los derechos reservados.</p></div>" +
      "</div>" +
      "</footer>";
  }

  function renderCartDrawer() {
    const drawer = document.createElement("div");
    drawer.className = "cart-drawer";
    drawer.id = "cart-drawer";
    drawer.setAttribute("aria-hidden", "true");
    drawer.setAttribute("inert", "");
    drawer.innerHTML =
      '<div class="cart-drawer__overlay" data-close-overlay></div>' +
      '<div class="cart-drawer__panel" role="dialog" aria-modal="true" aria-labelledby="cart-title" tabindex="-1" data-overlay-panel>' +
      '<div class="cart-drawer__head"><h2 id="cart-title">Tu carrito</h2>' +
      '<button type="button" class="icon-btn" aria-label="Cerrar carrito" data-close-overlay>' + icon("close") + "</button></div>" +
      '<div class="cart-drawer__body" id="cart-body"></div>' +
      '<div class="cart-drawer__foot" id="cart-foot" hidden>' +
      '<div class="cart-total"><span>Total estimado</span><span data-cart-total></span></div>' +
      '<p class="cart-note">Al enviar tu pedido confirmamos contigo existencias, costo de entrega y forma de pago.</p>' +
      '<a class="btn btn-whatsapp btn-block" target="_blank" rel="noopener" data-cart-checkout href="#">' + icon("chat") + "Enviar pedido por WhatsApp</a>" +
      '<div style="text-align:center;margin-top:4px"><button type="button" class="link-btn" data-cart-clear>Vaciar carrito</button></div>' +
      "</div>" +
      "</div>";
    document.body.appendChild(drawer);

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.id = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.innerHTML = icon("check") + "<span data-toast-text></span>";
    document.body.appendChild(toast);
  }

  /* ---------------------------------------------------------------------- */
  /* Global events                                                           */
  /* ---------------------------------------------------------------------- */
  function handleDocumentClick(event) {
    const target = event.target.closest(
      "[data-add-to-cart], [data-open-cart], [data-open-menu], [data-close-overlay], [data-cart-increase], [data-cart-decrease], [data-cart-remove], [data-cart-clear]"
    );
    if (!target) return;

    if (target.hasAttribute("data-add-to-cart")) {
      const quantityInput = target.dataset.quantityFrom ? document.querySelector(target.dataset.quantityFrom) : null;
      addToCart(target.getAttribute("data-add-to-cart"), quantityInput ? quantityInput.value : 1);
    } else if (target.hasAttribute("data-open-cart")) {
      openOverlay(document.getElementById("cart-drawer"), target);
    } else if (target.hasAttribute("data-open-menu")) {
      openOverlay(document.getElementById("mobile-menu"), target);
    } else if (target.hasAttribute("data-close-overlay")) {
      closeOverlay();
    } else if (target.hasAttribute("data-cart-increase")) {
      const id = target.getAttribute("data-cart-increase");
      const line = cart.find(function (item) { return item.id === id; });
      if (line) setCartQuantity(id, line.quantity + 1);
      focusAfterRender('[data-cart-increase="' + cssEscape(id) + '"]');
    } else if (target.hasAttribute("data-cart-decrease")) {
      const id = target.getAttribute("data-cart-decrease");
      const line = cart.find(function (item) { return item.id === id; });
      if (line) setCartQuantity(id, line.quantity - 1);
      focusAfterRender('[data-cart-decrease="' + cssEscape(id) + '"]');
    } else if (target.hasAttribute("data-cart-remove")) {
      removeFromCart(target.getAttribute("data-cart-remove"));
      focusAfterRender("#cart-drawer [data-close-overlay].icon-btn");
    } else if (target.hasAttribute("data-cart-clear")) {
      clearCart();
      focusAfterRender("#cart-drawer [data-close-overlay].icon-btn");
    }
  }

  function cssEscape(value) {
    return window.CSS && CSS.escape ? CSS.escape(value) : String(value).replace(/"/g, '\\"');
  }

  // Cart re-renders replace its buttons; keep keyboard focus on the equivalent control.
  function focusAfterRender(selector) {
    const element = document.querySelector(selector);
    if (element && !element.disabled) {
      element.focus();
    } else {
      const panel = document.querySelector("#cart-drawer [data-overlay-panel]");
      if (panel) panel.focus();
    }
  }

  function init() {
    renderHeader();
    renderFooter();
    renderCartDrawer();
    updateCartUi();
    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleOverlayKeydown);
    window.addEventListener("storage", function (event) {
      if (event.key !== CART_STORAGE_KEY) return;
      cart = readCart();
      updateCartUi();
    });
  }

  window.Navi = {
    config: config,
    products: products,
    categories: categories,
    ATTRIBUTE_LABELS: ATTRIBUTE_LABELS,
    BADGE_LABELS: BADGE_LABELS,
    icon: icon,
    escapeHtml: escapeHtml,
    normalizeText: normalizeText,
    formatPrice: formatPrice,
    getCategory: getCategory,
    getProduct: getProduct,
    isOnSale: isOnSale,
    isAvailable: isAvailable,
    effectivePrice: effectivePrice,
    discountPercent: discountPercent,
    productImages: productImages,
    productUrl: productUrl,
    catalogUrl: catalogUrl,
    renderPrice: renderPrice,
    renderBadges: renderBadges,
    renderProductCard: renderProductCard,
    whatsappUrl: whatsappUrl,
    productInquiryMessage: productInquiryMessage
  };

  init();
})();
