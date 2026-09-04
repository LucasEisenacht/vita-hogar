# W.todocell Dependency Audit

## Estado

Se intento ejecutar:

```bash
npm.cmd audit --audit-level=low
```

El entorno local bloqueo la consulta externa porque `npm audit` envia metadatos del arbol de dependencias al registry de npm. No se uso `npm audit fix`.

## Dependencias directas observadas localmente

- `next`
- `react`
- `react-dom`
- `@supabase/ssr`
- `@supabase/supabase-js`
- `tailwindcss`
- `typescript`
- `eslint`

## Pendiente recomendado

Ejecutar en CI o terminal autorizada:

```bash
npm.cmd audit --audit-level=low
```

Separar resultados en:

- vulnerabilidades runtime directas;
- vulnerabilidades runtime transitivas;
- vulnerabilidades solo de desarrollo;
- falsos positivos no explotables en este proyecto.

No ejecutar:

```bash
npm audit fix --force
```

sin revisar impacto de versiones mayores.
