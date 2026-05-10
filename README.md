# BaseApp

Aplicacion base estatica para agrupar varias aplicaciones:

- `/` abre la portada de BaseApp.
- `/tonicapp/` abre TonicApp.
- `/appoclock/` abre AppOclock.

## Estructura

```text
BaseApp/
  index.html
  styles.css
  _redirects
  tonicapp/
    index.html
    styles.css
    app.js
    words.json
  appoclock/
    index.html
    styles.css
    app.js
```

Para anadir una app nueva, crea una carpeta en la raiz, por ejemplo `nuevaapp/`, copia dentro su `index.html` y sus assets, y anade un enlace en `index.html`.

## Probar en local

```bash
npm start
```

Luego abre:

- `http://localhost:4173/`
- `http://localhost:4173/tonicapp/`
- `http://localhost:4173/appoclock/`

## Subir a Cloudflare Pages

1. Sube este proyecto a un repositorio de GitHub, GitLab o Bitbucket.
2. Entra en Cloudflare Dashboard.
3. Ve a `Workers & Pages`.
4. Pulsa `Create application`.
5. Elige `Pages`.
6. Conecta el repositorio donde este `BaseApp`.
7. Configura el proyecto:
   - `Framework preset`: `None`
   - `Build command`: dejar vacio
   - `Build output directory`: `/`
   - `Root directory`: dejar vacio si el repo solo contiene BaseApp. Si el repo contiene varias carpetas y BaseApp esta dentro, usa `BaseApp`.
8. Pulsa `Save and Deploy`.

Cloudflare Pages publicara la portada y las aplicaciones con estas rutas:

- `https://tu-dominio.pages.dev/`
- `https://tu-dominio.pages.dev/tonicapp/`
- `https://tu-dominio.pages.dev/appoclock/`

## Dominio personalizado

Para usar un dominio como `baseapp.url.com`:

1. Abre el proyecto en Cloudflare Pages.
2. Entra en `Custom domains`.
3. Pulsa `Set up a custom domain`.
4. Escribe `baseapp.url.com`.
5. Sigue el asistente de Cloudflare para crear o validar el registro DNS.

Cuando termine la propagacion DNS, las rutas seran:

- `https://baseapp.url.com/`
- `https://baseapp.url.com/tonicapp/`
- `https://baseapp.url.com/appoclock/`
