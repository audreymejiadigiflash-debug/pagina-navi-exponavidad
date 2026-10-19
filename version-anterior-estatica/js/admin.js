/*
 * Product admin panel. Runs entirely in the browser:
 * - Chrome/Edge: writes js/products.js and img/productos/* directly into the site folder
 *   (File System Access API).
 * - Other browsers: downloads products.js with photos embedded, to copy into js/ by hand.
 */
(function () {
  "use strict";

  const config = window.NAVI_CONFIG || {};
  const categories = Array.isArray(config.categories) ? config.categories : [];
  const DRAFT_STORAGE_KEY = "navi-admin-draft-v1";
  const SAMPLE_ID_PREFIX = "ejemplo-";
  const MAX_IMAGES = 6;
  const MAX_IMAGE_SIDE = 1200;
  const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
  const ATTRIBUTE_KEYS = ["altura", "forma", "luz", "color", "material", "piezas", "medidas"];
  // Attributes that only make sense for some categories; the rest apply to every product.
  const ATTRIBUTE_CATEGORIES = {
    altura: ["arboles"],
    forma: ["arboles"],
    luz: ["arboles", "luces", "coronas"]
  };
  const SUGGESTIONS = {
    altura: ["1.20 m", "1.50 m", "1.80 m", "2.10 m", "2.40 m", "2.70 m", "3.00 m"],
    forma: ["Completo", "Slim", "Lápiz"],
    luz: ["Sin luz", "LED blanco cálido", "LED blanco frío", "LED multicolor", "LED cambio de color"],
    color: ["Verde", "Verde nevado", "Blanco", "Dorado", "Plateado", "Rojo", "Rosa", "Azul", "Natural"],
    material: ["Vidrio", "Plástico irrompible", "Madera", "Metal", "Tela"]
  };
  const BADGE_LABELS = { nuevo: "Nuevo", "mas-vendido": "Más vendido", "edicion-limitada": "Edición limitada" };
  const supportsFolderAccess = typeof window.showDirectoryPicker === "function";

  const productsLoaded = Array.isArray(window.NAVI_PRODUCTS);
  let savedProducts = clone(productsLoaded ? window.NAVI_PRODUCTS : []);
  let products = clone(savedProducts);
  let folderHandle = null;
  let folderPermission = "none";
  let editingId = null;
  let formImages = [];
  let formDirty = false;
  let processingImages = 0;
  let isSaving = false;

  const elements = {
    alerts: document.getElementById("admin-alerts"),
    folderStatus: document.getElementById("folder-status"),
    folderActions: document.getElementById("folder-actions"),
    saveBar: document.getElementById("save-bar"),
    saveButton: document.getElementById("save-changes"),
    discardButton: document.getElementById("discard-changes"),
    list: document.getElementById("admin-list"),
    count: document.getElementById("product-count"),
    search: document.getElementById("admin-search"),
    categoryFilter: document.getElementById("admin-category"),
    dialog: document.getElementById("product-dialog"),
    dialogTitle: document.getElementById("dialog-title"),
    form: document.getElementById("product-form"),
    formError: document.getElementById("form-error"),
    formSubmit: document.getElementById("form-submit"),
    categorySelect: document.getElementById("f-category"),
    imageInput: document.getElementById("f-images"),
    imageList: document.getElementById("image-list"),
    imageStatus: document.getElementById("image-status"),
    imageUrl: document.getElementById("f-image-url"),
    toast: document.getElementById("admin-toast")
  };

  /* ---------------------------------------------------------------------- */
  /* Helpers                                                                 */
  /* ---------------------------------------------------------------------- */
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeText(value) {
    return String(value == null ? "" : value).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
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

  function slugify(text) {
    return normalizeText(text).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "producto";
  }

  function uniqueId(name) {
    const base = slugify(name);
    let id = base;
    let suffix = 2;
    while (products.some(function (product) { return product.id === id; })) {
      id = base + "-" + suffix;
      suffix += 1;
    }
    return id;
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function getCategory(id) {
    return categories.find(function (category) { return category.id === id; });
  }

  function isOnSale(product) {
    const sale = Number(product.salePrice);
    return sale > 0 && sale < Number(product.price);
  }

  function previewImage(product) {
    const first = (product.images || []).filter(Boolean)[0];
    if (first) return first;
    const category = getCategory(product.category);
    return (category && category.image) || "img/placeholders/adornos.svg";
  }

  function hasUnsavedChanges() {
    return JSON.stringify(products) !== JSON.stringify(savedProducts);
  }

  function isModified(product) {
    const saved = savedProducts.find(function (item) { return item.id === product.id; });
    return !saved || JSON.stringify(saved) !== JSON.stringify(product);
  }

  /* ---------------------------------------------------------------------- */
  /* Alerts + toast                                                          */
  /* ---------------------------------------------------------------------- */
  function showAlert(key, type, message, actions) {
    removeAlert(key);
    const alert = document.createElement("div");
    alert.className = "alert alert--" + type;
    alert.dataset.alert = key;
    alert.setAttribute("role", type === "error" ? "alert" : "status");
    const paragraph = document.createElement("p");
    paragraph.textContent = message;
    alert.appendChild(paragraph);

    const actionsWrap = document.createElement("div");
    actionsWrap.className = "alert__actions";
    (actions || []).forEach(function (action) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-sm " + (action.primary ? "btn-primary" : "btn-outline");
      button.textContent = action.label;
      button.addEventListener("click", action.onClick);
      actionsWrap.appendChild(button);
    });
    const close = document.createElement("button");
    close.type = "button";
    close.className = "btn btn-sm btn-outline";
    close.textContent = "Cerrar";
    close.addEventListener("click", function () { removeAlert(key); });
    actionsWrap.appendChild(close);
    alert.appendChild(actionsWrap);
    elements.alerts.appendChild(alert);
  }

  function removeAlert(key) {
    const existing = elements.alerts.querySelector('[data-alert="' + key + '"]');
    if (existing) existing.remove();
  }

  let toastTimer = null;
  function showToast(message) {
    elements.toast.querySelector("[data-toast-text]").textContent = message;
    elements.toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      elements.toast.classList.remove("is-visible");
    }, 3200);
  }

  /* ---------------------------------------------------------------------- */
  /* Draft backup (localStorage)                                             */
  /* ---------------------------------------------------------------------- */
  function saveDraft() {
    try {
      if (hasUnsavedChanges()) {
        window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), products: products }));
      } else {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
      removeAlert("draft-failed");
    } catch (error) {
      showAlert(
        "draft-failed",
        "warning",
        "No pudimos guardar una copia de respaldo en este navegador (las fotos ocupan mucho espacio). Guarda tus cambios pronto para no perderlos."
      );
    }
  }

  function clearDraft() {
    try {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (error) {
      // Nothing to clear if storage is unavailable.
    }
  }

  function offerDraftRecovery() {
    let draft = null;
    try {
      draft = JSON.parse(window.localStorage.getItem(DRAFT_STORAGE_KEY) || "null");
    } catch (error) {
      draft = null;
    }
    if (!draft || !Array.isArray(draft.products)) return;
    if (JSON.stringify(draft.products) === JSON.stringify(savedProducts)) {
      clearDraft();
      return;
    }
    const date = new Date(draft.savedAt).toLocaleString(config.locale || "es-MX", { dateStyle: "medium", timeStyle: "short" });
    showAlert("draft", "warning", "Encontramos cambios que no guardaste (" + date + "). ¿Quieres recuperarlos?", [
      {
        label: "Recuperar cambios",
        primary: true,
        onClick: function () {
          products = draft.products;
          removeAlert("draft");
          renderAll();
          showToast("Cambios recuperados. Recuerda guardarlos.");
        }
      },
      {
        label: "Descartar",
        onClick: function () {
          clearDraft();
          removeAlert("draft");
        }
      }
    ]);
  }

  function markChanged() {
    saveDraft();
    renderAll();
  }

  /* ---------------------------------------------------------------------- */
  /* Folder access (File System Access API + IndexedDB to remember it)       */
  /* ---------------------------------------------------------------------- */
  function withHandleStore(mode, callback) {
    return new Promise(function (resolve, reject) {
      const request = window.indexedDB.open("navi-admin", 1);
      request.onupgradeneeded = function () {
        request.result.createObjectStore("handles");
      };
      request.onerror = function () { reject(request.error); };
      request.onsuccess = function () {
        const database = request.result;
        const transaction = database.transaction("handles", mode);
        const operation = callback(transaction.objectStore("handles"));
        transaction.oncomplete = function () {
          database.close();
          resolve(operation ? operation.result : undefined);
        };
        transaction.onerror = function () {
          database.close();
          reject(transaction.error);
        };
      };
    });
  }

  async function restoreFolder() {
    if (!supportsFolderAccess) return;
    try {
      const handle = await withHandleStore("readonly", function (store) { return store.get("site-folder"); });
      if (!handle) return;
      folderHandle = handle;
      const permission = await handle.queryPermission({ mode: "readwrite" });
      folderPermission = permission === "granted" ? "granted" : "prompt";
    } catch (error) {
      folderHandle = null;
      folderPermission = "none";
    }
  }

  async function connectFolder() {
    let handle;
    try {
      handle = await window.showDirectoryPicker({ id: "navi-site", mode: "readwrite" });
    } catch (error) {
      if (error.name !== "AbortError") {
        showAlert("folder", "error", "No se pudo abrir la carpeta. Intenta de nuevo.");
      }
      return false;
    }
    try {
      await handle.getFileHandle("index.html");
      await handle.getDirectoryHandle("js");
    } catch (error) {
      showAlert("folder", "error", "Esa carpeta no es la del sitio. Elige la carpeta que contiene index.html (por ejemplo, “PAGINA NAVI-EXPONAVIDAD”).");
      return false;
    }
    folderHandle = handle;
    folderPermission = "granted";
    removeAlert("folder");
    try {
      await withHandleStore("readwrite", function (store) { return store.put(handle, "site-folder"); });
    } catch (error) {
      // Not remembering the folder only means asking again next time.
    }
    renderFolderStatus();
    showToast("Carpeta conectada.");
    return true;
  }

  async function ensurePermission() {
    if (!folderHandle) return false;
    if (folderPermission === "granted") return true;
    const permission = await folderHandle.requestPermission({ mode: "readwrite" });
    folderPermission = permission === "granted" ? "granted" : "prompt";
    renderFolderStatus();
    return folderPermission === "granted";
  }

  function renderFolderStatus() {
    const actions = [];
    let html;
    if (!supportsFolderAccess) {
      html =
        '<span class="status-dot status-dot--warn"></span>Este navegador no permite guardar directamente en la carpeta. ' +
        "Al guardar se descargará <strong>products.js</strong> para que lo copies en la carpeta <code>js/</code>. Para la mejor experiencia usa Chrome o Edge en computadora.";
    } else if (!folderHandle) {
      html = '<span class="status-dot status-dot--warn"></span>Sin conectar. Conecta la carpeta del sitio para guardar productos y fotos directamente.';
      actions.push({ label: "Conectar carpeta", primary: true, onClick: connectFolder });
    } else if (folderPermission !== "granted") {
      html = '<span class="status-dot status-dot--warn"></span>Carpeta <strong>' + escapeHtml(folderHandle.name) + "</strong> recordada. Da permiso para poder guardar.";
      actions.push({ label: "Dar permiso", primary: true, onClick: ensurePermission });
      actions.push({ label: "Cambiar carpeta", onClick: connectFolder });
    } else {
      html = '<span class="status-dot status-dot--ok"></span>Conectado a <strong>' + escapeHtml(folderHandle.name) + "</strong>. Al guardar se actualiza <code>js/products.js</code>.";
      actions.push({ label: "Cambiar carpeta", onClick: connectFolder });
    }
    elements.folderStatus.innerHTML = html;
    elements.folderActions.innerHTML = "";
    actions.forEach(function (action) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-sm " + (action.primary ? "btn-primary" : "btn-outline");
      button.textContent = action.label;
      button.addEventListener("click", action.onClick);
      elements.folderActions.appendChild(button);
    });
  }

  async function writeFile(root, pathParts, data) {
    let directory = root;
    for (let index = 0; index < pathParts.length - 1; index += 1) {
      directory = await directory.getDirectoryHandle(pathParts[index], { create: true });
    }
    const fileHandle = await directory.getFileHandle(pathParts[pathParts.length - 1], { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
  }

  function dataUrlToBlob(dataUrl) {
    const parts = dataUrl.split(",");
    const mime = (parts[0].match(/data:([^;]+)/) || [])[1] || "application/octet-stream";
    const binary = window.atob(parts[1]);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type: mime });
  }

  // Photos are kept as data URLs while editing; on save they become real files in img/productos/.
  async function extractEmbeddedImages(list) {
    const output = clone(list);
    const stamp = Date.now().toString(36);
    for (const product of output) {
      const images = product.images || [];
      for (let index = 0; index < images.length; index += 1) {
        if (!/^data:image\//.test(images[index])) continue;
        const blob = dataUrlToBlob(images[index]);
        const extension = blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
        const fileName = product.id + "-" + stamp + "-" + (index + 1) + "." + extension;
        await writeFile(folderHandle, ["img", "productos", fileName], blob);
        images[index] = "img/productos/" + fileName;
      }
    }
    return output;
  }

  function buildProductsFile(list) {
    return (
      "/*\n" +
      " * Catálogo de productos. Este archivo lo genera admin.html al presionar \"Guardar cambios\".\n" +
      " * Puedes editarlo a mano, pero es más fácil y seguro usar el panel.\n" +
      " */\n" +
      "window.NAVI_PRODUCTS = " + JSON.stringify(list, null, 2) + ";\n"
    );
  }

  function downloadFile(fileName, content) {
    const url = URL.createObjectURL(new Blob([content], { type: "text/javascript;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function setSaving(saving) {
    isSaving = saving;
    elements.saveButton.disabled = saving;
    elements.discardButton.disabled = saving;
    elements.saveButton.textContent = saving ? "Guardando…" : "Guardar cambios";
  }

  async function saveChanges() {
    if (isSaving) return;
    setSaving(true);
    removeAlert("save");
    try {
      if (supportsFolderAccess) {
        if (!folderHandle && !(await connectFolder())) return;
        if (!(await ensurePermission())) {
          showAlert("save", "error", "Necesitamos permiso para escribir en la carpeta del sitio. Presiona “Dar permiso” e intenta de nuevo.");
          return;
        }
        const output = await extractEmbeddedImages(products);
        await writeFile(folderHandle, ["js", "products.js"], buildProductsFile(output));
        products = output;
        savedProducts = clone(output);
        clearDraft();
        renderAll();
        showToast("¡Listo! Cambios guardados. Recarga la tienda para verlos.");
      } else {
        downloadFile("products.js", buildProductsFile(products));
        savedProducts = clone(products);
        clearDraft();
        renderAll();
        showAlert("save", "info", "Se descargó products.js. Cópialo dentro de la carpeta js/ del sitio (reemplaza el anterior) y recarga la tienda.");
      }
    } catch (error) {
      showAlert("save", "error", "No se pudieron guardar los cambios. Revisa que la carpeta siga existiendo y vuelve a intentarlo. Tus cambios siguen aquí.");
    } finally {
      setSaving(false);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Product list                                                            */
  /* ---------------------------------------------------------------------- */
  function renderCategoryOptions() {
    elements.categoryFilter.innerHTML =
      '<option value="">Todas</option>' +
      categories.map(function (category) {
        return '<option value="' + escapeHtml(category.id) + '">' + escapeHtml(category.name) + "</option>";
      }).join("");
    elements.categorySelect.innerHTML =
      '<option value="">Elige una categoría</option>' +
      categories.map(function (category) {
        return '<option value="' + escapeHtml(category.id) + '">' + escapeHtml(category.name) + "</option>";
      }).join("");
  }

  function renderList() {
    const query = normalizeText(elements.search.value);
    const category = elements.categoryFilter.value;
    const visible = products.filter(function (product) {
      return (!category || product.category === category) && (!query || normalizeText(product.name).indexOf(query) !== -1);
    });

    elements.count.textContent = "(" + products.length + ")";

    if (!products.length) {
      elements.list.innerHTML =
        '<li class="empty-state"><h3>Aún no tienes productos</h3><p>Crea tu primer producto para que aparezca en la tienda.</p>' +
        '<button type="button" class="btn btn-primary" data-action="new">+ Crear el primero</button></li>';
      return;
    }
    if (!visible.length) {
      elements.list.innerHTML = '<li class="empty-state"><h3>Sin resultados</h3><p>Ningún producto coincide con tu búsqueda.</p></li>';
      return;
    }

    elements.list.innerHTML = visible.map(function (product) {
      const categoryInfo = getCategory(product.category);
      const id = escapeHtml(product.id);
      const tags = [];
      if (product.available === false) tags.push('<span class="tag tag--muted">Agotado</span>');
      if (product.featured) tags.push('<span class="tag">Destacado</span>');
      if (isOnSale(product)) tags.push('<span class="tag tag--sale">Oferta</span>');
      if (BADGE_LABELS[product.badge]) tags.push('<span class="tag">' + BADGE_LABELS[product.badge] + "</span>");
      if (product.id.indexOf(SAMPLE_ID_PREFIX) === 0) tags.push('<span class="tag tag--muted">Ejemplo</span>');
      if (isModified(product)) tags.push('<span class="tag tag--modified">Sin guardar</span>');
      const price = isOnSale(product)
        ? formatPrice(product.salePrice) + " <s>" + formatPrice(product.price) + "</s>"
        : formatPrice(product.price);
      const isSaved = savedProducts.some(function (item) { return item.id === product.id; });

      return (
        '<li class="admin-row">' +
        '<img src="' + escapeHtml(previewImage(product)) + '" alt="" width="64" height="64" loading="lazy">' +
        "<div>" +
        '<p class="admin-row__name">' + escapeHtml(product.name) + "</p>" +
        '<p class="admin-row__meta"><span>' + escapeHtml(categoryInfo ? categoryInfo.name : "Sin categoría") + "</span><span>" + price + "</span></p>" +
        (tags.length ? '<div class="admin-row__tags">' + tags.join("") + "</div>" : "") +
        "</div>" +
        '<div class="admin-row__actions">' +
        (isSaved ? '<a class="btn btn-outline btn-sm" href="producto.html?id=' + encodeURIComponent(product.id) + '" target="_blank" rel="noopener">Ver</a>' : "") +
        '<button type="button" class="btn btn-outline btn-sm" data-action="edit" data-id="' + id + '">Editar</button>' +
        '<button type="button" class="btn btn-outline btn-sm" data-action="duplicate" data-id="' + id + '">Duplicar</button>' +
        '<button type="button" class="btn btn-danger btn-sm" data-action="delete" data-id="' + id + '">Eliminar</button>' +
        "</div>" +
        "</li>"
      );
    }).join("");
  }

  function renderSaveBar() {
    const unsaved = hasUnsavedChanges();
    elements.saveBar.hidden = !unsaved;
    document.getElementById("save-bar-text").textContent = supportsFolderAccess
      ? "Tienes cambios sin guardar. Guárdalos para que aparezcan en la tienda."
      : "Tienes cambios sin guardar. Al guardar se descargará products.js.";
  }

  function renderSampleNotice() {
    const samples = products.filter(function (product) { return product.id.indexOf(SAMPLE_ID_PREFIX) === 0; });
    if (!samples.length) {
      removeAlert("samples");
      return;
    }
    showAlert("samples", "info", "Tienes " + samples.length + " productos de ejemplo. Elimínalos cuando cargues tus propios productos.", [
      {
        label: "Eliminar ejemplos",
        onClick: function () {
          if (!window.confirm("¿Eliminar los " + samples.length + " productos de ejemplo? Podrás deshacerlo con “Descartar” mientras no guardes.")) return;
          products = products.filter(function (product) { return product.id.indexOf(SAMPLE_ID_PREFIX) !== 0; });
          markChanged();
        }
      }
    ]);
  }

  function renderAll() {
    renderList();
    renderSaveBar();
    renderSampleNotice();
  }

  /* ---------------------------------------------------------------------- */
  /* Product form                                                            */
  /* ---------------------------------------------------------------------- */
  function fillSuggestions() {
    Object.keys(SUGGESTIONS).forEach(function (key) {
      const values = new Set(SUGGESTIONS[key]);
      products.forEach(function (product) {
        const value = (product.attributes || {})[key];
        if (value) values.add(value);
      });
      document.getElementById("list-" + key).innerHTML = Array.from(values)
        .map(function (value) { return '<option value="' + escapeHtml(value) + '"></option>'; })
        .join("");
    });
  }

  function updateAttributeVisibility() {
    const category = elements.categorySelect.value;
    document.querySelectorAll("[data-attribute]").forEach(function (field) {
      const allowed = ATTRIBUTE_CATEGORIES[field.dataset.attribute];
      field.hidden = Boolean(allowed && category && allowed.indexOf(category) === -1);
    });
  }

  function clearErrors() {
    elements.formError.hidden = true;
    elements.form.querySelectorAll(".field.has-error").forEach(function (field) {
      field.classList.remove("has-error");
    });
    elements.form.querySelectorAll(".field__error").forEach(function (error) {
      error.hidden = true;
      error.textContent = "";
    });
    elements.form.querySelectorAll("[aria-invalid]").forEach(function (input) {
      input.removeAttribute("aria-invalid");
    });
  }

  function setFieldError(name, message) {
    const input = elements.form.elements[name];
    const field = input.closest(".field");
    const error = field.querySelector(".field__error");
    field.classList.add("has-error");
    input.setAttribute("aria-invalid", "true");
    error.textContent = message;
    error.hidden = false;
  }

  function renderFormImages() {
    elements.imageList.innerHTML = formImages.map(function (src, index) {
      return (
        '<li class="image-item">' +
        '<img src="' + escapeHtml(src) + '" alt="Foto ' + (index + 1) + '">' +
        (index === 0 ? '<span class="image-item__label">Principal</span>' : "") +
        '<div class="image-item__actions">' +
        (index > 0 ? '<button type="button" data-image-main="' + index + '" aria-label="Usar foto ' + (index + 1) + ' como principal">Principal</button>' : "") +
        '<button type="button" data-image-remove="' + index + '" aria-label="Quitar foto ' + (index + 1) + '">Quitar</button>' +
        "</div>" +
        "</li>"
      );
    }).join("");
    const full = formImages.length >= MAX_IMAGES;
    elements.imageInput.disabled = full;
    document.getElementById("upload-label").setAttribute("aria-disabled", String(full));
  }

  function updateSubmitState() {
    const busy = processingImages > 0;
    elements.formSubmit.disabled = busy;
    elements.formSubmit.textContent = busy ? "Procesando fotos…" : "Guardar producto";
    elements.imageStatus.textContent = busy ? "Optimizando fotos…" : "";
  }

  function openForm(product) {
    editingId = product ? product.id : null;
    elements.form.reset();
    clearErrors();
    fillSuggestions();
    elements.dialogTitle.textContent = product ? "Editar producto" : "Nuevo producto";

    const fields = elements.form.elements;
    fields.name.value = product ? product.name : "";
    fields.category.value = product ? product.category : (elements.categoryFilter.value || "");
    fields.badge.value = product ? product.badge || "" : "";
    fields.price.value = product ? product.price : "";
    fields.salePrice.value = product && product.salePrice ? product.salePrice : "";
    fields.description.value = product ? product.description || "" : "";
    fields.available.checked = product ? product.available !== false : true;
    fields.featured.checked = product ? Boolean(product.featured) : false;
    ATTRIBUTE_KEYS.forEach(function (key) {
      fields[key].value = product && product.attributes ? product.attributes[key] || "" : "";
    });

    formImages = product ? (product.images || []).slice() : [];
    elements.imageUrl.value = "";
    renderFormImages();
    updateAttributeVisibility();
    updateSubmitState();
    formDirty = false;
    elements.dialog.showModal();
    fields.name.focus();
  }

  function confirmCloseForm() {
    return !formDirty || window.confirm("¿Cerrar sin guardar este producto? Se perderán los datos que escribiste.");
  }

  function closeForm() {
    formDirty = false;
    elements.dialog.close();
  }

  function readNumber(value) {
    if (String(value).trim() === "") return null;
    const number = Number(value);
    return isNaN(number) ? NaN : Math.round(number * 100) / 100;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (processingImages > 0) return;
    clearErrors();

    const fields = elements.form.elements;
    const name = fields.name.value.trim();
    const category = fields.category.value;
    const price = readNumber(fields.price.value);
    const salePrice = readNumber(fields.salePrice.value);
    const invalid = [];

    if (!name) {
      setFieldError("name", "Escribe el nombre del producto.");
      invalid.push("name");
    }
    if (!getCategory(category)) {
      setFieldError("category", "Elige una categoría.");
      invalid.push("category");
    }
    if (price === null) {
      setFieldError("price", "Escribe el precio.");
      invalid.push("price");
    } else if (isNaN(price) || price <= 0) {
      setFieldError("price", "El precio debe ser un número mayor a 0.");
      invalid.push("price");
    }
    if (salePrice !== null && (isNaN(salePrice) || salePrice <= 0 || (price > 0 && salePrice >= price))) {
      setFieldError("salePrice", "El precio de oferta debe ser mayor a 0 y menor que el precio normal.");
      invalid.push("salePrice");
    }

    if (invalid.length) {
      elements.formError.textContent = invalid.length === 1 ? "Revisa el campo marcado." : "Revisa los " + invalid.length + " campos marcados.";
      elements.formError.hidden = false;
      fields[invalid[0]].focus();
      return;
    }

    const attributes = {};
    ATTRIBUTE_KEYS.forEach(function (key) {
      const field = elements.form.querySelector('[data-attribute="' + key + '"]');
      const value = fields[key].value.trim();
      if (value && !field.hidden) attributes[key] = value;
    });

    const existing = editingId ? products.find(function (product) { return product.id === editingId; }) : null;
    const product = {
      id: existing ? existing.id : uniqueId(name),
      name: name,
      category: category,
      price: price,
      salePrice: salePrice,
      description: fields.description.value.trim(),
      images: formImages.slice(),
      badge: fields.badge.value,
      featured: fields.featured.checked,
      available: fields.available.checked,
      attributes: attributes,
      createdAt: existing ? existing.createdAt : today()
    };

    if (existing) {
      products = products.map(function (item) { return item.id === existing.id ? product : item; });
    } else {
      products = [product].concat(products);
    }
    closeForm();
    markChanged();
    showToast((existing ? "Producto actualizado" : "Producto agregado") + ". Recuerda presionar “Guardar cambios”.");
  }

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = function () {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("decode"));
      };
      image.src = url;
    });
  }

  async function processImageFile(file) {
    const image = await loadImage(file);
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const webp = canvas.toDataURL("image/webp", 0.82);
    // Browsers without WebP encoding silently return PNG; fall back to JPEG to keep files small.
    return webp.indexOf("data:image/webp") === 0 ? webp : canvas.toDataURL("image/jpeg", 0.85);
  }

  async function handleImageFiles(fileList) {
    const files = Array.from(fileList);
    const room = MAX_IMAGES - formImages.length;
    const problems = [];
    if (files.length > room) problems.push("Solo se agregaron " + Math.max(room, 0) + " fotos (máximo " + MAX_IMAGES + ").");

    const accepted = files.slice(0, Math.max(room, 0)).filter(function (file) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
        problems.push("“" + file.name + "” no es JPG, PNG ni WebP.");
        return false;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        problems.push("“" + file.name + "” pesa más de 25 MB.");
        return false;
      }
      return true;
    });

    processingImages += accepted.length;
    updateSubmitState();
    for (const file of accepted) {
      try {
        formImages.push(await processImageFile(file));
        formDirty = true;
        renderFormImages();
      } catch (error) {
        problems.push("No se pudo leer “" + file.name + "”.");
      } finally {
        processingImages -= 1;
        updateSubmitState();
      }
    }
    elements.imageInput.value = "";
    if (problems.length) elements.imageStatus.textContent = problems.join(" ");
  }

  function addImageFromUrl() {
    const value = elements.imageUrl.value.trim();
    if (!value) return;
    if (formImages.length >= MAX_IMAGES) {
      elements.imageStatus.textContent = "Ya tienes el máximo de " + MAX_IMAGES + " fotos.";
      return;
    }
    if (!/^(https?:\/\/|img\/)[^\s"'<>]+$/i.test(value)) {
      elements.imageStatus.textContent = "Usa una ruta que empiece con img/ o un enlace que empiece con https://";
      return;
    }
    formImages.push(value);
    formDirty = true;
    elements.imageUrl.value = "";
    elements.imageStatus.textContent = "";
    renderFormImages();
  }

  /* ---------------------------------------------------------------------- */
  /* Events                                                                  */
  /* ---------------------------------------------------------------------- */
  function findProduct(id) {
    return products.find(function (product) { return product.id === id; });
  }

  function handleListClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const product = findProduct(button.dataset.id);

    if (action === "new") {
      openForm(null);
    } else if (action === "edit" && product) {
      openForm(product);
    } else if (action === "duplicate" && product) {
      const copy = clone(product);
      copy.name = product.name + " (copia)";
      copy.id = uniqueId(copy.name);
      copy.featured = false;
      copy.createdAt = today();
      const index = products.indexOf(product);
      products = products.slice(0, index + 1).concat([copy], products.slice(index + 1));
      markChanged();
      showToast("Producto duplicado. Edítalo y guarda los cambios.");
    } else if (action === "delete" && product) {
      if (!window.confirm("¿Eliminar “" + product.name + "”? Podrás deshacerlo con “Descartar” mientras no guardes.")) return;
      products = products.filter(function (item) { return item.id !== product.id; });
      markChanged();
      showToast("Producto eliminado.");
    }
  }

  function bindEvents() {
    document.getElementById("new-product").addEventListener("click", function () { openForm(null); });
    elements.list.addEventListener("click", handleListClick);
    elements.search.addEventListener("input", renderList);
    elements.categoryFilter.addEventListener("change", renderList);
    elements.saveButton.addEventListener("click", saveChanges);
    elements.discardButton.addEventListener("click", function () {
      if (!window.confirm("¿Descartar todos los cambios sin guardar?")) return;
      products = clone(savedProducts);
      clearDraft();
      renderAll();
      showToast("Cambios descartados.");
    });

    elements.form.addEventListener("submit", handleSubmit);
    elements.form.addEventListener("input", function () { formDirty = true; });
    elements.categorySelect.addEventListener("change", updateAttributeVisibility);
    elements.imageInput.addEventListener("change", function () { handleImageFiles(elements.imageInput.files); });
    document.getElementById("add-image-url").addEventListener("click", addImageFromUrl);
    elements.imageUrl.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        addImageFromUrl();
      }
    });
    elements.imageList.addEventListener("click", function (event) {
      const main = event.target.closest("[data-image-main]");
      const remove = event.target.closest("[data-image-remove]");
      if (main) {
        const index = Number(main.dataset.imageMain);
        formImages.unshift(formImages.splice(index, 1)[0]);
      } else if (remove) {
        formImages.splice(Number(remove.dataset.imageRemove), 1);
      } else {
        return;
      }
      formDirty = true;
      renderFormImages();
      elements.imageInput.focus();
    });

    elements.dialog.querySelectorAll("[data-dialog-close]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (confirmCloseForm()) closeForm();
      });
    });
    elements.dialog.addEventListener("cancel", function (event) {
      if (!confirmCloseForm()) event.preventDefault();
      else formDirty = false;
    });

    window.addEventListener("beforeunload", function (event) {
      if (!hasUnsavedChanges()) return;
      event.preventDefault();
      event.returnValue = "";
    });
  }

  async function init() {
    renderCategoryOptions();
    bindEvents();
    if (!productsLoaded) {
      showAlert("load", "error", "No se pudo leer js/products.js. Revisa que el archivo exista dentro de la carpeta js/. Puedes crear productos nuevos y guardarlos para generarlo otra vez.");
    }
    offerDraftRecovery();
    renderAll();
    await restoreFolder();
    renderFolderStatus();
  }

  init();
})();
