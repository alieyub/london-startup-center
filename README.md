# London Startup Center — website

Single-page site for [londonstartupcenter.com](https://londonstartupcenter.com).
Built with [Vite](https://vite.dev), [GSAP](https://gsap.com) (ScrollTrigger), [Lenis](https://lenis.darkroom.engineering) smooth scrolling and a small raw-WebGL shader for the hero background.

## Requirements

- Node.js 22 or later

## Local development

```bash
npm install
npm run dev
```

Opens on http://localhost:5173.

## Production build

```bash
npm run build
```

Outputs a fully static site to `dist/`.

## Deploying

Pick either option.

**Static hosting** (Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3, …)
- Build command: `npm run build`
- Output / publish directory: `dist`

**Node hosting** (Render, Fly.io, a VPS, …)
- Build command: `npm run build`
- Start command: `npm start`
- `server.js` serves `dist/` on `$PORT` (default 8080), with brotli/gzip compression, long-lived caching for hashed assets, real 404s and basic security headers.

## Project structure

```
index.html          All page markup and content
src/main.js         Interactions, scroll animations, smooth scroll, member logos list
src/hero-gl.js      Hero background shader (WebGL)
src/style.css       Styles and brand tokens (colours, fonts, spacing)
src/fonts.css       Self-hosted font faces (Poppins, Antonio)
public/img          Photos, logo, favicon, social share image (og.jpg)
public/logos        Member company logos
public/fonts        Font files
server.js           Optional Node static server for production
```

## Common edits

- **Text and sections** — edit `index.html`.
- **Member logos** — add the file to `public/logos/` and add the name and width to the `members` / `logoWidths` lists in `src/main.js`.
- **Brand colours** — CSS variables at the top of `src/style.css` (`--navy`, `--red`, `--blush`, …).
- **Domain** — if the site moves to a domain other than `londonstartupcenter.com`, update the `og:image` URL in `index.html`, `public/robots.txt` and `public/sitemap.xml`.
