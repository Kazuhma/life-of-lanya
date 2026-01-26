# Life of Lanya

A graphic novel following Lanya's journey through life in New York.

## Quick Start

This is a static site with no build step required. Just open `index.html` in a browser or deploy to any static host.

### Local Development

```bash
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js
npx serve

# Option 3: PHP
php -S localhost:8000
```

Then open http://localhost:8000

## Project Structure

```
life-of-lanya/
├── index.html          # Main HTML file
├── styles.css          # Styles
├── script.js           # SPA routing + reader logic
├── chapters.json       # Content manifest
└── assets/
    ├── covers/
    │   └── cover.jpg   # Main cover image
    └── pages/
        └── chapter-01/
            ├── 001.jpg
            ├── 002.jpg
            └── ...
```

## Adding Content

### Adding a New Page

1. Add the image to `assets/pages/chapter-XX/` with naming: `001.jpg`, `002.jpg`, etc.
2. Update `chapters.json` to increment the page count for that chapter

### Adding a New Chapter

1. Create folder: `assets/pages/chapter-02/`
2. Add page images: `001.jpg`, `002.jpg`, etc.
3. Update `chapters.json`:

```json
{
  "chapters": [
    { "number": 1, "title": "This Is Lanya", "pages": 3 },
    { "number": 2, "title": "New Chapter", "pages": 5 }
  ]
}
```

### Adding Concept Art

Add to the `artwork` array in `chapters.json`:

```json
{
  "artwork": [
    {
      "src": "assets/artwork/sketch.jpg",
      "title": "Character Sketch",
      "featured": false
    }
  ]
}
```

Set `featured: true` to display at full width.

## Deployment

### GitHub Pages

1. Go to repo Settings → Pages
2. Source: Deploy from branch
3. Branch: `main`, folder: `/ (root)`
4. Save

Site will be live at `https://username.github.io/life-of-lanya/`

### Cloudflare Pages

1. Connect GitHub repo
2. Build command: (leave empty)
3. Output directory: `/`

### Netlify

1. Connect GitHub repo
2. Build command: (leave empty)
3. Publish directory: `.`

## Analytics

Add before `</head>` in `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXX');
</script>
```

## Custom Domain

To use `lifeoflanya.com`:

1. Add a `CNAME` file with content: `lifeoflanya.com`
2. Configure DNS at your registrar:
   - For GitHub Pages: CNAME record pointing to `username.github.io`
   - For Cloudflare/Netlify: Follow their custom domain instructions

## License

All artwork and content © 2026. All rights reserved.
