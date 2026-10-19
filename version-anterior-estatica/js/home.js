(function () {
  "use strict";

  const Navi = window.Navi;
  const config = Navi.config;
  const FEATURED_LIMIT = 8;

  function renderCategories() {
    const mount = document.getElementById("home-categories");
    mount.innerHTML = Navi.categories
      .map(function (category) {
        const count = Navi.products.filter(function (product) {
          return product.category === category.id;
        }).length;
        return (
          '<a class="category-tile reveal" href="' + Navi.catalogUrl({ categoria: category.id }) + '">' +
          '<span class="category-tile__media"><img src="' + Navi.escapeHtml(category.image) + '" alt="" width="800" height="800" loading="lazy" decoding="async"></span>' +
          '<span class="category-tile__body">' +
          '<span class="category-tile__name">' + Navi.escapeHtml(category.name) + "</span>" +
          '<span class="category-tile__count">' + count + (count === 1 ? " producto" : " productos") + "</span>" +
          "</span>" +
          "</a>"
        );
      })
      .join("");
  }

  function renderProductSection(mountId, list, emptyMessage) {
    const mount = document.getElementById(mountId);
    if (!list.length) {
      mount.outerHTML =
        '<div class="empty-state">' + Navi.icon("tree") +
        "<h2>Muy pronto</h2><p>" + Navi.escapeHtml(emptyMessage) + "</p>" +
        '<a class="btn btn-primary" href="catalogo.html">Ver catálogo</a></div>';
      return;
    }
    mount.innerHTML = list.map(Navi.renderProductCard).join("");
  }

  function renderFeatured() {
    const available = Navi.products.filter(Navi.isAvailable);
    let featured = available.filter(function (product) {
      return product.featured;
    });
    if (!featured.length) featured = available;
    renderProductSection("home-featured", featured.slice(0, FEATURED_LIMIT), "Estamos preparando los productos de esta temporada.");
  }

  function renderSale() {
    const onSale = Navi.products.filter(function (product) {
      return Navi.isOnSale(product) && Navi.isAvailable(product);
    });
    if (!onSale.length) return;
    document.getElementById("home-sale-section").hidden = false;
    renderProductSection("home-sale", onSale.slice(0, FEATURED_LIMIT), "");
  }

  function renderBenefits() {
    document.getElementById("home-benefits").innerHTML = (config.benefits || [])
      .map(function (benefit) {
        return (
          '<div class="benefit reveal">' +
          '<span class="benefit__icon">' + Navi.icon(benefit.icon) + "</span>" +
          "<div><h3>" + Navi.escapeHtml(benefit.title) + "</h3><p>" + Navi.escapeHtml(benefit.text) + "</p></div>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderTestimonials() {
    const testimonials = config.testimonials || [];
    if (!testimonials.length) return;
    document.getElementById("home-testimonials-section").hidden = false;
    document.getElementById("home-testimonials").innerHTML = testimonials
      .map(function (testimonial) {
        return (
          '<figure class="testimonial reveal">' +
          "<blockquote>“" + Navi.escapeHtml(testimonial.text) + "”</blockquote>" +
          "<figcaption><strong>" + Navi.escapeHtml(testimonial.name) + "</strong>" +
          (testimonial.city ? " · " + Navi.escapeHtml(testimonial.city) : "") +
          "</figcaption></figure>"
        );
      })
      .join("");
  }

  function renderFaq() {
    document.getElementById("home-faq").innerHTML = (config.faq || [])
      .map(function (item) {
        return (
          '<details class="faq-item">' +
          "<summary>" + Navi.escapeHtml(item.question) + "</summary>" +
          "<p>" + Navi.escapeHtml(item.answer) + "</p>" +
          "</details>"
        );
      })
      .join("");
  }

  renderCategories();
  renderFeatured();
  renderSale();
  renderBenefits();
  renderTestimonials();
  renderFaq();
  document.getElementById("home-cta-whatsapp").href = Navi.whatsappUrl(
    "¡Hola, " + config.storeName + "! Me gustaría recibir asesoría para decorar."
  );
})();
