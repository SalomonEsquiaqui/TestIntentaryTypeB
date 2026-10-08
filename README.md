# Tester Invetary B

Inventario de ropa con referencias, fotos, exportación/importación Excel y Supabase (vía backend).

## Estructura
```
tester-invetary-b/
├── frontend/          index.html · css/styles.css · js/app.js · js/config.js
├── backend/           server.js (Express + Supabase)
├── supabase/          schema.sql
├── .env               tus claves (no se sube a git)
└── package.json
```

## Puesta en marcha
1. Supabase: abre **SQL Editor** y ejecuta `supabase/schema.sql`.
2. Edita `.env` con `SUPABASE_URL` y `SUPABASE_ANON_KEY` (Project Settings > API).
3. Instala y ejecuta:
```
npm install
npm run dev
```
4. Abre http://localhost:3000

El navegador solo habla con `/api`; las claves de Supabase viven únicamente en el backend.
