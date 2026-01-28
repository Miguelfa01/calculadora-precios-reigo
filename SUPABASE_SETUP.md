# Configuración de Supabase para la calculadora

Sigue estos pasos en el panel de Supabase (proyecto **Calculadora-reigo**).

---

## Paso 1: Crear la tabla en la base de datos

1. En el menú izquierdo, abre **SQL Editor**.
2. Pulsa **New query**.
3. Copia y pega **todo** el contenido del archivo `supabase/schema.sql` de este proyecto.
4. Pulsa **Run** (o Ctrl+Enter).
5. Debe aparecer “Success” o mensajes indicando que la tabla y políticas se crearon.

---

## Paso 2: Obtener la URL y la clave anon (API)

1. En el menú izquierdo, ve a **Project Settings** (icono de engranaje, abajo).
2. Entra en **API** o en **API Keys**.
3. Copia:
   - **Project URL** (ej: `https://xxxxx.supabase.co`)
   - **Clave anon en formato JWT** (empieza por `eyJhbGciOiJIUzI1NiIs...`).  
     Si solo ves **Publishable API Key** (`sb_publishable_...`) y obtienes **401 Unauthorized**, usa la pestaña **Legacy API Keys** y copia la clave **anon** (JWT). Esa es la que debe ir en `VITE_SUPABASE_ANON_KEY`.

Guárdalos para el paso siguiente (variables de entorno).

---

## Paso 3: Variables de entorno en tu proyecto

En la raíz del proyecto crea un archivo `.env.local` (si no existe) con:

```env
VITE_SUPABASE_URL=https://tu-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Sustituye por tu **Project URL** y tu **anon public** del Paso 2.

- Para **Vercel**: en el dashboard del proyecto → Settings → Environment Variables → añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (mismo valor que en `.env.local`).

---

## Paso 4: Probar la app

- Local: `npm run dev`
- Al abrir **Configurar**, cambiar algún valor y cerrar el modal, la config se guarda en Supabase y seguirá ahí aunque cierres el navegador (mismo dispositivo/navegador).

---

## Resumen de pasos en el dashboard

| Paso | Dónde | Qué hacer |
|------|--------|-----------|
| 1 | SQL Editor | New query → pegar `supabase/schema.sql` → Run |
| 2 | Project Settings → API | Copiar Project URL y anon public |
| 3 | Proyecto local / Vercel | Crear `.env.local` y/o variables con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` |

**Lista de productos (opcional):** Para usar la vista **Productos** e importar CSV, ejecuta además el archivo `supabase/products_schema.sql` en el SQL Editor (mismo proyecto). Crea la tabla `products` y sus políticas.
Si algo falla, revisa que la tabla `app_config` aparezca en **Table Editor** y que las variables de entorno empiecen por `VITE_` para que Vite las exponga al frontend.
