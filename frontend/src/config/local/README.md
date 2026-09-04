# Configuracion local

`home-content.json` se conserva como configuracion inicial, fallback de emergencia y fuente del seed de la migracion de Home.

No debe usarse como mecanismo de persistencia en produccion: el contenido administrable del inicio se guarda en Supabase mediante `public.home_content`.
