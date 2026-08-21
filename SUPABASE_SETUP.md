# Configuración de Supabase para el Portfolio CMS

## 1. Crear o seleccionar un proyecto

En Supabase, crea un proyecto para el portafolio. Guarda estos dos valores desde **Project Settings → API** o desde el diálogo **Connect**:

- Project URL
- Publishable key

No uses ni expongas la `service_role` key. El sitio funciona con la publishable key y Row Level Security.

## 2. Aplicar la migración

Abre **SQL Editor** en Supabase, copia el contenido completo de:

`supabase/migrations/20260821000000_portfolio_cms.sql`

Ejecuta el script una vez. Este crea:

- `profiles`
- `projects`
- `project_blocks`
- funciones y triggers
- políticas RLS
- bucket público `portfolio-media`
- políticas privadas de escritura para Storage
- los once proyectos actuales como contenido inicial editable

## 3. Crear el administrador inicial

En **Authentication → Users**, crea un usuario con tu email y una contraseña segura. Después ejecuta en SQL Editor:

```sql
update public.profiles
set role = 'admin', active = true
where id = (
  select id from auth.users where email = 'TU_EMAIL'
);
```

La cuenta no podrá acceder al CMS hasta que esté marcada como `admin` y `active = true`.

## 4. Variables locales

Copia `.env.example` como `.env.local` y completa:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_TU_KEY
```

Reinicia el servidor de desarrollo después de modificar variables.

## 5. Variables en Vercel

En el proyecto de Vercel abre **Settings → Environment Variables** y añade las mismas dos variables para Production, Preview y Development. Después crea un nuevo deployment.

## 6. Uso diario

1. Abre `/admin/login`.
2. Inicia sesión con el usuario administrador.
3. Pulsa **New project**.
4. Completa título, slug, descripción, fecha, categoría y cover.
5. Agrega y ordena bloques de texto Markdown, sección, imagen, galería o video.
6. Usa **Save draft** para mantenerlo privado o **Publish** para hacerlo público.
7. Desde el listado puedes editar, publicar, despublicar o borrar.

Los cambios públicos invalidan automáticamente la portada, las páginas de proyecto, el sitemap y `llms.txt`.

## Decisiones de arquitectura

- Los bloques tienen una fila relacional y un payload `JSONB` tipado. Así se conserva orden, RLS y cascada, pero es fácil añadir nuevos tipos de bloque.
- El bucket es público solo para lectura. Subir, reemplazar y borrar requiere una sesión de administrador validada mediante RLS.
- Las páginas públicas consultan únicamente filas `published`; borradores no son visibles con la publishable key.
- El guardado de metadata y bloques usa la función transaccional `save_project_with_blocks`, de modo que un proyecto no queda guardado parcialmente.
- Las imágenes se limitan a 10 MB y los videos a 100 MB. Las cargas van directamente del navegador a Supabase Storage, sin atravesar Vercel.
