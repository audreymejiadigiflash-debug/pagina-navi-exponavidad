# NaviExpoNavidad — tienda en línea

Tienda de decoración navideña con carrito, pago en línea con **Mercado Pago**, inventario y un
panel de administración en `/admin`.

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · Supabase
(base de datos, inicio de sesión y fotos) · Mercado Pago Checkout Pro.

Sin configurar nada, la tienda funciona en **modo demostración**: muestra el catálogo de ejemplo
y desactiva el pago y el panel.

---

## 1. Ejecutar en tu computadora

```bash
npm install
npm run dev
```

Abre http://localhost:3000.

## 2. Crear la base de datos (Supabase, gratis)

1. Crea un proyecto en https://supabase.com.
2. Ve a **SQL Editor → New query**, pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y presiona **Run**.
3. En **Authentication → Users → Add user**, crea tu usuario de administrador (correo y contraseña).
4. En **Project Settings → API** copia la URL, la `anon key` y la `service_role key`.

## 3. Conectar Mercado Pago

1. Entra a https://www.mercadopago.com.mx/developers → **Tus integraciones → Crear aplicación** (Checkout Pro).
2. Copia el **Access Token** (usa primero las credenciales de prueba).
3. En **Webhooks**, configura la URL `https://TU-DOMINIO/api/webhooks/mercadopago`, marca el evento
   **Pagos** y copia la **clave secreta**.

## 4. Variables de entorno

Copia `.env.example` como `.env.local` y llena los valores. En producción (Vercel), agrégalas en
**Project → Settings → Environment Variables**.

| Variable | Para qué sirve |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Dirección pública de la tienda (`https://…`). Necesaria para que Mercado Pago regrese al cliente y envíe notificaciones. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Lectura pública del catálogo. |
| `SUPABASE_SERVICE_ROLE_KEY` | Pedidos y panel (solo servidor, **secreta**). |
| `ADMIN_EMAILS` | Correos que pueden entrar a `/admin`, separados por coma. |
| `MERCADOPAGO_ACCESS_TOKEN` | Cobros (secreta). |
| `MERCADOPAGO_WEBHOOK_SECRET` | Verifica que las notificaciones vengan de Mercado Pago. |

## 5. Primer uso del panel

1. Entra a `/admin` con tu usuario.
2. En **Resumen**, presiona **Cargar catálogo de ejemplo** (crea las categorías y 13 productos de muestra).
3. En **Configuración**, define el costo de envío, el envío gratis y tus datos de contacto.
4. En **Productos**, crea tus productos con fotos, precio, oferta e inventario. Luego borra los de ejemplo.
5. Revisa los textos de **Aviso de privacidad**, **Términos** y **Envíos y devoluciones** con tu asesor legal.

## 6. Publicar (Vercel)

1. Sube el proyecto a GitHub y crea un proyecto en https://vercel.com importándolo.
2. Agrega las variables de entorno y despliega.
3. Conecta tu dominio y actualiza `NEXT_PUBLIC_SITE_URL` y la URL del webhook de Mercado Pago.

## Cómo funciona un pedido

1. El cliente llena su carrito (se guarda en su navegador) y sus datos de envío.
2. El servidor **recalcula precios y existencias** desde la base de datos, guarda el pedido como
   *Pendiente de pago* y crea el cobro en Mercado Pago.
3. Mercado Pago avisa al webhook; el servidor verifica la firma, consulta el pago y, si está
   aprobado, marca el pedido como *Pagado* y **descuenta el inventario** una sola vez.
4. Tú lo ves en **Panel → Pedidos**, cambias su estado y agregas la guía de rastreo.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run lint` | Revisión de código |
| `npx tsc --noEmit` | Revisión de tipos |
| `npm run build` | Compilación de producción |
