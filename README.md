# Life of Lanya

A graphic novel about ambition, restraint, and what slowly comes undone.

## Quick Start

Static site — no build step required. Serve with any local server:

```bash
# Python
python -m http.server 8000

# Node.js
npx serve

# PHP
php -S localhost:8000
```

Then open http://localhost:8000

## Project Structure

```
life-of-lanya/
├── index.html          # Single-page app shell
├── styles.css          # All styles (design system + responsive)
├── script.js           # Routing, reader, concept art, zoom
├── data.json           # Content manifest (volumes + concept art)
├── robots.txt          # Search engine directives
└── assets/
    ├── hero.webp               # Landing page background
    ├── pages/
    │   └── vol-01/
    │       ├── 000-cover.webp  # Volume cover (Page 00)
    │       ├── 001.webp        # Story pages
    │       ├── 002.webp
    │       └── ...
    └── concept-art/
        ├── Lanya-001.webp
        ├── Lanya-002.webp
        └── ...
```

## Features

- **Hash-based routing** with deep links (`#/read/1/3`, `#/art/0`)
- **Lightbox reader** with cover page (Page 00), page navigation, and zoom with drag-to-pan
- **Concept art viewer** with navigation, captions, and zoom
- **Keyboard shortcuts**: Arrow keys / A/D to navigate, Spacebar to toggle zoom, Escape to close
- **Reading progress** saved to localStorage
- **Image preloading** for next page/artwork
- **Responsive** layout with mobile support
- **Google Analytics** (GA4) integration

## Adding Content

All content is managed through `data.json` and the `assets/` folder.

### Adding a New Page

1. Add the WebP image to `assets/pages/vol-XX/` with zero-padded naming: `001.webp`, `002.webp`, etc.
2. Update the `pages` count for that volume in `data.json`

### Adding a New Volume

1. Create folder: `assets/pages/vol-02/`
2. Add cover: `000-cover.webp`
3. Add pages: `001.webp`, `002.webp`, etc.
4. Update `data.json`:

```json
{
  "volumes": [
    { "number": 1, "title": "This Is Lanya", "subtitle": "", "pages": 3 },
    { "number": 2, "title": "New Volume", "subtitle": "", "pages": 5 }
  ]
}
```

### Adding Concept Art

1. Add the WebP image to `assets/concept-art/`
2. Add an entry to the `conceptArt` array in `data.json`:

```json
{
  "conceptArt": [
    {
      "src": "assets/concept-art/Lanya-001.webp",
      "title": "Lanya",
      "note": "Lanya Voss character concept."
    }
  ]
}
```

## Deployment

### GitHub Pages

1. Go to repo Settings > Pages
2. Source: Deploy from branch
3. Branch: `main`, folder: `/ (root)`
4. Save

### Custom Domain

1. Add a `CNAME` file with your domain (e.g. `lifeoflanya.com`)
2. Configure DNS: CNAME record pointing to `username.github.io`

## License

All artwork and content are the property of their respective creators. All rights reserved.
