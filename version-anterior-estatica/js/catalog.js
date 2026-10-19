(function () {
  "use strict";

  const Navi = window.Navi;
  const ATTRIBUTE_FILTERS = ["luz", "altura", "forma", "color"];

  const form = document.getElementById("filters-form");
  const filtersPanel = document.getElementById("filters");
  const filtersToggle = document.getElementById("filters-toggle");
  const attributesMount = document.getElementById("filter-attributes");
  const results = document.getElementById("results");
  const resultsCount = document.getElementById("results-count");
  const sortSelect = document.getElementById("sort");
  const priceError = document.getElementById("price-error");

  const params = new URLSearchParams(window.location.search);
  const state = {
    category: Navi.getCategory(params.get("categoria")) ? params.get("categoria") : "",
    query: (params.get("q") || "").trim(),
    onlySale: params.get("oferta") === "1",
    onlyAvailable: false,
    min: null,
    max: null,
    attributes: {},
    sort: "relevance"
  };

  ATTRIBUTE_FILTERS.forEach(function (key) {
    state.attributes[key] = params.getAll(key).filter(Boolean);
  });

  function searchableText(product) {
    const category = Navi.getCategory(product.category);
    const attributes = product.attributes || {};
    return Navi.normalizeText(
      [product.name, product.description, category ? category.name : ""]
        .concat(Object.keys(attributes).map(function (key) { return attributes[key]; }))
        .join(" ")
    );
  }

  function matchesQuery(product) {
    if (!state.query) return true;
    const haystack = searchableText(product);
    return Navi.normalizeText(state.query)
      .split(/\s+/)
      .every(function (word) {
        return haystack.indexOf(word) !== -1;
      });
  }

  // Products before attribute/price filters: drives which filter options exist.
  function baseProducts() {
    return Navi.products.filter(function (product) {
      return (!state.category || product.category === state.category) && matchesQuery(product);
    });
  }

  function applyFilters(list) {
    return list.filter(function (product) {
      const price = Navi.effectivePrice(product);
      if (state.onlySale && !Navi.isOnSale(product)) return false;
      if (state.onlyAvailable && !Navi.isAvailable(product)) return false;
      if (state.min != null && price < state.min) return false;
      if (state.max != null && price > state.max) return false;
      return ATTRIBUTE_FILTERS.every(function (key) {
        const selected = state.attributes[key];
        if (!selected.length) return true;
        const value = (product.attributes || {})[key];
        return selected.indexOf(value) !== -1;
      });
    });
  }

  function sortProducts(list) {
    const sorted = list.slice();
    const byNewest = function (a, b) {
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    };
    switch (state.sort) {
      case "price-asc":
        return sorted.sort(function (a, b) { return Navi.effectivePrice(a) - Navi.effectivePrice(b); });
      case "price-desc":
        return sorted.sort(function (a, b) { return Navi.effectivePrice(b) - Navi.effectivePrice(a); });
      case "name":
        return sorted.sort(function (a, b) { return a.name.localeCompare(b.name, "es"); });
      case "newest":
        return sorted.sort(byNewest);
      default:
        return sorted.sort(function (a, b) {
          const availability = Number(Navi.isAvailable(b)) - Number(Navi.isAvailable(a));
          if (availability) return availability;
          const featured = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
          return featured || byNewest(a, b);
        });
    }
  }

  function compareOptionValues(a, b) {
    const numberA = parseFloat(a);
    const numberB = parseFloat(b);
    if (!isNaN(numberA) && !isNaN(numberB)) return numberA - numberB;
    return a.localeCompare(b, "es");
  }

  function renderCategoryFilter() {
    const mount = document.getElementById("filter-categories");
    const options = [{ id: "", name: "Todas" }].concat(Navi.categories);
    mount.insertAdjacentHTML(
      "beforeend",
      options
        .map(function (category) {
          const count = Navi.products.filter(function (product) {
            return !category.id || product.category === category.id;
          }).length;
          return (
            '<label class="check"><input type="radio" name="categoria" value="' + Navi.escapeHtml(category.id) + '"' +
            (state.category === category.id ? " checked" : "") + "> " + Navi.escapeHtml(category.name) +
            '<span class="check__count">' + count + "</span></label>"
          );
        })
        .join("")
    );
  }

  function renderAttributeFilters() {
    const base = baseProducts();
    attributesMount.innerHTML = ATTRIBUTE_FILTERS.map(function (key) {
      const counts = {};
      base.forEach(function (product) {
        const value = (product.attributes || {})[key];
        if (value) counts[value] = (counts[value] || 0) + 1;
      });
      const values = Object.keys(counts).sort(compareOptionValues);
      // Drop selections that no longer exist for the current category/search.
      state.attributes[key] = state.attributes[key].filter(function (value) {
        return counts[value];
      });
      if (values.length < 2) return "";
      return (
        '<fieldset class="filter-group"><legend>' + Navi.escapeHtml(Navi.ATTRIBUTE_LABELS[key]) + "</legend>" +
        values
          .map(function (value) {
            const checked = state.attributes[key].indexOf(value) !== -1 ? " checked" : "";
            return (
              '<label class="check"><input type="checkbox" name="attr-' + key + '" value="' + Navi.escapeHtml(value) + '"' + checked + "> " +
              Navi.escapeHtml(value) + '<span class="check__count">' + counts[value] + "</span></label>"
            );
          })
          .join("") +
        "</fieldset>"
      );
    }).join("");
  }

  function renderChips() {
    const chips = [{ id: "", name: "Todo" }].concat(Navi.categories);
    document.getElementById("category-chips").innerHTML = chips
      .map(function (category) {
        const current = state.category === category.id && !state.onlySale ? ' aria-current="page"' : "";
        const href = category.id ? Navi.catalogUrl({ categoria: category.id }) : Navi.catalogUrl();
        return '<a class="chip" href="' + href + '"' + current + ">" + Navi.escapeHtml(category.shortName || category.name) + "</a>";
      })
      .join("");
  }

  function renderHeading() {
    const category = Navi.getCategory(state.category);
    let title = category ? category.name : "Todo el catálogo";
    let description = category ? category.description : "Árboles, esferas, luces, adornos y coronas para tu Navidad.";
    if (state.onlySale && !category) {
      title = "Ofertas";
      description = "Productos de temporada con precio especial.";
    }
    if (state.query) {
      title = "Resultados para “" + state.query + "”";
      description = category ? "Buscando en " + category.name + "." : "Buscando en todo el catálogo.";
    }
    document.getElementById("catalog-title").textContent = title;
    document.getElementById("catalog-description").textContent = description;
    document.getElementById("breadcrumb-current").textContent = title;
    document.title = title + " | " + Navi.config.storeName;
  }

  function renderResults() {
    const list = sortProducts(applyFilters(baseProducts()));
    resultsCount.textContent = list.length === 1 ? "1 producto" : list.length + " productos";
    document.getElementById("filters-apply").textContent = "Ver " + resultsCount.textContent;

    if (!list.length) {
      const noProductsAtAll = !Navi.products.length;
      results.innerHTML =
        '<div class="empty-state" style="grid-column:1/-1">' + Navi.icon("tree") +
        "<h2>" + (noProductsAtAll ? "Muy pronto tendremos productos" : "No encontramos productos") + "</h2>" +
        "<p>" + (noProductsAtAll ? "Estamos preparando el catálogo de esta temporada." : "Prueba con otros filtros o busca con otras palabras.") + "</p>" +
        (noProductsAtAll ? "" : '<button type="button" class="btn btn-primary" data-clear-filters>Limpiar filtros</button>') +
        "</div>";
      return;
    }
    results.innerHTML = list.map(Navi.renderProductCard).join("");
  }

  function syncUrl() {
    const next = new URLSearchParams();
    if (state.category) next.set("categoria", state.category);
    if (state.query) next.set("q", state.query);
    if (state.onlySale) next.set("oferta", "1");
    ATTRIBUTE_FILTERS.forEach(function (key) {
      state.attributes[key].forEach(function (value) {
        next.append(key, value);
      });
    });
    const search = next.toString();
    try {
      window.history.replaceState(null, "", window.location.pathname + (search ? "?" + search : ""));
    } catch (error) {
      // Some browsers block history changes on file:// pages; filtering still works.
    }
  }

  function readPrice(input) {
    if (input.value === "") return null;
    const value = Number(input.value);
    return isNaN(value) || value < 0 ? null : value;
  }

  function readForm() {
    const data = new FormData(form);
    state.category = data.get("categoria") || "";
    state.onlySale = data.get("oferta") === "1";
    state.onlyAvailable = data.get("disponible") === "1";
    ATTRIBUTE_FILTERS.forEach(function (key) {
      state.attributes[key] = data.getAll("attr-" + key);
    });

    const min = readPrice(form.elements.min);
    const max = readPrice(form.elements.max);
    const invalidRange = min != null && max != null && min > max;
    priceError.hidden = !invalidRange;
    form.elements.min.setAttribute("aria-invalid", String(invalidRange));
    form.elements.max.setAttribute("aria-invalid", String(invalidRange));
    if (!invalidRange) {
      state.min = min;
      state.max = max;
    }
  }

  function update(options) {
    readForm();
    if (options && options.rebuildAttributes) renderAttributeFilters();
    renderHeading();
    renderChips();
    renderResults();
    syncUrl();
  }

  function clearFilters() {
    // Not form.reset(): it would restore the options preselected from the URL.
    form.querySelectorAll('input[type="checkbox"]').forEach(function (input) {
      input.checked = false;
    });
    form.elements.min.value = "";
    form.elements.max.value = "";
    state.query = "";
    document.querySelectorAll('input[name="q"]').forEach(function (input) {
      input.value = "";
    });
    const allOption = form.querySelector('input[name="categoria"][value=""]');
    if (allOption) allOption.checked = true;
    ATTRIBUTE_FILTERS.forEach(function (key) {
      state.attributes[key] = [];
    });
    update({ rebuildAttributes: true });
  }

  function setFiltersOpen(open) {
    filtersPanel.classList.toggle("is-open", open);
    filtersToggle.setAttribute("aria-expanded", String(open));
  }

  form.addEventListener("change", function (event) {
    update({ rebuildAttributes: event.target.name === "categoria" });
  });

  form.addEventListener("input", function (event) {
    if (event.target.type === "number") update();
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
  });

  sortSelect.addEventListener("change", function () {
    state.sort = sortSelect.value;
    renderResults();
  });

  filtersToggle.addEventListener("click", function () {
    setFiltersOpen(!filtersPanel.classList.contains("is-open"));
  });

  document.getElementById("filters-apply").addEventListener("click", function () {
    setFiltersOpen(false);
    filtersToggle.focus();
    results.scrollIntoView({ block: "start" });
  });

  document.getElementById("filters-clear").addEventListener("click", clearFilters);

  results.addEventListener("click", function (event) {
    if (event.target.closest("[data-clear-filters]")) clearFilters();
  });

  form.elements.oferta.checked = state.onlySale;
  renderCategoryFilter();
  renderAttributeFilters();
  renderHeading();
  renderChips();
  renderResults();
})();
