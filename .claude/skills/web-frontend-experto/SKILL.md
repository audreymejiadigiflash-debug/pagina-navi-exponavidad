---
name: web-frontend-experto
description: Diseño y construcción de interfaces web profesionales (landing pages, sitios de negocio, tiendas, portafolios, dashboards, componentes React/Next.js/Astro/HTML). Úsala SIEMPRE que haya que crear o modificar cualquier página, sección, componente, estilo, layout, navegación, formulario visual, animación o diseño responsivo, aunque el usuario no diga "frontend" (ej. "hazme la página de mi negocio", "arregla cómo se ve en celular", "agrega una sección de precios").
---

# Frontend web experto

Objetivo: interfaces que se vean profesionales, carguen rápido y funcionen perfecto en celular, sin parecer plantilla genérica.

## 1. Antes de diseñar
- Identifica: ¿qué vende o comunica la página?, ¿quién la usa?, ¿cuál es la acción principal (comprar, llamar, WhatsApp, registrarse)?
- Toda página tiene UNA llamada a la acción principal, visible sin hacer scroll en móvil.
- Si el proyecto ya tiene sistema de diseño (colores, fuentes, componentes), úsalo. No inventes otro.

## 2. Sistema de diseño (define tokens antes de maquetar)
Declara variables CSS o config de Tailwind al inicio:
- **Color:** 1 primario, 1 acento, neutrales (fondo, superficie, borde, texto, texto secundario), y estados (éxito, error, aviso). Contraste mínimo 4.5:1 para texto.
- **Tipografía:** máximo 2 familias. Escala consistente (ej. 14/16/18/24/32/48). Cuerpo de texto ≥ 16px, interlineado 1.5–1.7, líneas de 60–75 caracteres.
- **Espaciado:** escala de 4px u 8px (4, 8, 12, 16, 24, 32, 48, 64, 96). Nunca valores aleatorios.
- **Radios y sombras:** 2–3 niveles como máximo, usados con consistencia.
- **Modo oscuro:** si se pide, redefine tokens con `prefers-color-scheme`, no dupliques estilos.

## 3. Estructura típica de landing que convierte
1. Header con logo, navegación corta y CTA.
2. Hero: titular claro (qué haces + para quién), subtítulo, CTA, imagen o prueba visual.
3. Prueba social (logos, testimonios, cifras).
4. Beneficios (3–6, en lenguaje del cliente, no técnico).
5. Cómo funciona / productos / servicios.
6. Precios o catálogo si aplica.
7. Preguntas frecuentes.
8. CTA final.
9. Footer: contacto, redes, dirección, aviso de privacidad.
Para negocios locales: botón de WhatsApp (`https://wa.me/52XXXXXXXXXX`), mapa, horarios y teléfono con `tel:`.

## 4. Responsivo
- Mobile-first: estilos base para móvil, `min-width` para crecer.
- Layout con Flexbox/Grid; nada de anchos fijos en px para contenedores.
- `max-width` en contenedores de texto (~1200px página, ~70ch párrafos).
- Áreas táctiles ≥ 44×44px. Menú hamburguesa accesible en móvil (botón con `aria-expanded`).
- Imágenes: `max-width: 100%; height: auto;`, `srcset`/`sizes` o `next/image`.
- Prueba en 360, 390, 768, 1024 y 1440px. Nada debe hacer scroll horizontal.

## 5. Componentes
- Un componente = una responsabilidad. Props tipadas.
- Botones: variantes (primario, secundario, fantasma), tamaños, estados hover/focus/active/disabled/loading.
- Formularios: label visible, placeholder solo como ejemplo, error debajo del campo, `autocomplete` correcto, `inputmode` en teléfonos y números.
- Modales: atrapan el foco, cierran con Esc, devuelven el foco al cerrar.
- Listas con datos: estados de carga (skeleton), vacío (mensaje + acción), error (mensaje + reintentar).

## 6. Interacción y animación
- Transiciones de 150–300ms, `ease-out`. Anima `transform` y `opacity`, no `width/height/top`.
- Respeta `prefers-reduced-motion`.
- La animación apoya, no distrae. Nada de animaciones que retrasen ver el contenido.

## 7. Accesibilidad (obligatorio)
- HTML semántico: `header`, `nav`, `main`, `section`, `footer`, `button` para acciones, `a` para navegación.
- Un `h1` por página, jerarquía de encabezados sin saltos.
- `alt` descriptivo (vacío `alt=""` si es decorativa).
- Foco visible siempre (`:focus-visible`). Todo usable solo con teclado.
- `lang="es"` en `<html>` si el sitio es en español.

## 8. Rendimiento en el frontend
- Imágenes en WebP/AVIF, con dimensiones definidas para evitar saltos (CLS).
- Fuentes: `font-display: swap`, máximo 2–3 pesos, precarga la principal.
- Carga diferida de lo que está debajo del pliegue.
- En React/Next: componentes de servidor por defecto, `"use client"` solo donde hay interacción. Evita `useEffect` para cosas que se pueden calcular en render.

## 9. Checklist antes de entregar
- [ ] Se ve bien en móvil y escritorio, sin scroll horizontal.
- [ ] CTA principal visible y funcionando.
- [ ] Sin errores ni warnings en consola.
- [ ] Todos los links y botones hacen algo real (nada de `href="#"` olvidados).
- [ ] Textos sin "Lorem ipsum" salvo que el usuario lo acepte; si faltan textos reales, márcalos claramente.
- [ ] Navegable con teclado, contraste correcto.
- [ ] Imágenes optimizadas y con `alt`.
