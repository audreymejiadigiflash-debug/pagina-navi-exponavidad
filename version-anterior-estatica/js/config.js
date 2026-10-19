/*
 * Configuración general de la tienda.
 * Edita los textos y datos de contacto aquí; los cambios se ven al recargar la página.
 */
window.NAVI_CONFIG = {
  storeName: "NaviExpoNavidad",
  tagline: "Árboles, esferas, luces y adornos para una Navidad inolvidable",

  // Número de WhatsApp que recibe los pedidos: código de país + número, solo dígitos.
  // Ejemplo México: "52" + 10 dígitos → "5215512345678". Reemplaza este número de prueba.
  whatsapp: "520000000000",

  // Datos de contacto que se muestran en el pie de página (deja "" para ocultarlos).
  phone: "",
  email: "",
  address: "",
  hours: "",

  social: {
    facebook: "",
    instagram: "",
    tiktok: ""
  },

  currency: "MXN",
  locale: "es-MX",

  promoBar: "Temporada navideña 2026 · Haz tu pedido por WhatsApp",

  categories: [
    {
      id: "arboles",
      name: "Árboles de Navidad",
      shortName: "Árboles",
      description: "Abetos, pinos y árboles nevados en todas las alturas, con o sin luces.",
      image: "img/placeholders/arboles.svg"
    },
    {
      id: "esferas",
      name: "Esferas",
      shortName: "Esferas",
      description: "Sets de esferas en vidrio y acabados mate, brillante y glitter.",
      image: "img/placeholders/esferas.svg"
    },
    {
      id: "adornos",
      name: "Adornos",
      shortName: "Adornos",
      description: "Estrellas, figuras, moños y detalles para personalizar tu árbol.",
      image: "img/placeholders/adornos.svg"
    },
    {
      id: "luces",
      name: "Luces",
      shortName: "Luces",
      description: "Series LED, cortinas y luces decorativas para interior y exterior.",
      image: "img/placeholders/luces.svg"
    },
    {
      id: "coronas",
      name: "Coronas y guirnaldas",
      shortName: "Coronas",
      description: "Coronas para puerta y guirnaldas para chimeneas, escaleras y mesas.",
      image: "img/placeholders/coronas.svg"
    }
  ],

  benefits: [
    {
      icon: "chat",
      title: "Pedidos por WhatsApp",
      text: "Arma tu carrito y envíanos tu pedido en un mensaje. Te respondemos personalmente."
    },
    {
      icon: "spark",
      title: "Asesoría para decorar",
      text: "Te ayudamos a elegir la altura del árbol y combinar esferas, luces y adornos."
    },
    {
      icon: "gift",
      title: "Todo para tu Navidad",
      text: "Árboles, esferas, luces y coronas en un solo lugar, con estilos para cada hogar."
    }
  ],

  // Agrega testimonios reales de tus clientes; la sección solo aparece si hay al menos uno.
  // Formato: { name: "Nombre", city: "Ciudad", text: "Comentario" }
  testimonials: [],

  faq: [
    {
      question: "¿Cómo hago un pedido?",
      answer: "Agrega los productos a tu carrito y presiona \"Enviar pedido por WhatsApp\". Se abrirá un mensaje con tu lista para que nos lo envíes y confirmemos existencias, entrega y forma de pago."
    },
    {
      question: "¿Qué altura de árbol necesito?",
      answer: "Mide la altura de tu techo y resta entre 20 y 30 cm para la estrella o punta. Por ejemplo, con un techo de 2.40 m te recomendamos un árbol de 2.10 m."
    },
    {
      question: "¿Los precios incluyen envío?",
      answer: "Los precios publicados son por producto. El costo de entrega depende de tu zona; te lo confirmamos por WhatsApp antes de cerrar tu pedido."
    },
    {
      question: "¿Puedo apartar productos?",
      answer: "Escríbenos por WhatsApp y te explicamos las opciones disponibles para apartar tus productos de temporada."
    }
  ]
};
