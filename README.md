# Hector Heredia — Portfolio & CMS

Portafolio personal construido con Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui y Supabase.

La interfaz pública conserva el diseño original. Supabase proporciona autenticación, base de datos, almacenamiento y un panel privado en `/admin` para administrar proyectos y casos de estudio sin editar código.

## Desarrollo local

```bash
pnpm install
pnpm dev
```

Después abre [http://localhost:3000](http://localhost:3000).

## Configuración del CMS

Consulta [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) para crear el proyecto, aplicar la migración, configurar el usuario administrador y añadir las variables a Vercel.

## Rutas principales

- `/` — portafolio público con proyectos publicados.
- `/work/[slug]` — caso de estudio dinámico.
- `/admin/login` — acceso privado.
- `/admin/projects` — listado y publicación de proyectos.
- `/admin/projects/new` — editor de proyectos y bloques.

Si las variables de Supabase todavía no existen, el sitio público usa los proyectos originales como respaldo seguro y el panel muestra que la conexión está pendiente.
