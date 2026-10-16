# ARoL Service – website (luxury 3D edition)

One-page static site (HTML + CSS + vanilla JS, no build step). Live preview: https://contactnasriimen-ctrl.github.io/arol-service/

```
index.html
assets/
  css/style.css       design tokens at the top (ink navy, champagne gold, fonts)
  js/main.js          header, menu, reveals, counters, hero taglines, tilt, card flips, region filter
  js/globe.js         3D hero globe (Three.js, loaded on demand from jsDelivr)
  js/land.js          land mask for the globe (generated from Natural Earth 110m)
  img/
    logo-arol.png        solid logo; also used as a mask for the gold logo
    logo-arol-light.png  outlined logo
    favicon.png
    globe.svg            fallback shown when WebGL is unavailable
```

## Local preview

The globe and the gold logo need the page to be served over HTTP (not opened as `file://`):

```
npx serve .
```

## Editing content

- **Hero headlines**: the three `.tagline` blocks in `index.html` (rotate every 7 s, pause on hover).
- **Patent cards**: each `<li class="pcard">` has `data-region="europe|asia|africa|americas|intl"` (region filter) and statuses with `data-s="force|certificate|filing|publication|maintenance"` (chip colour). Update the counts in the filter buttons if you add or remove a card.
- **Globe markers**: `PATENTS` (lat/lon) at the top of `assets/js/globe.js`; the light trails start from Tunisia (`HUB`).
- **Agreement cards**: `lux-card--black` (EXCLUSIVE) or `lux-card--platinum` (Non-EXCLUSIVE).

## Replace before going live

- Logos were cut from screenshots of the old site; swap in the original files for sharper output.
- Patent office logos are shown as text (abbreviation + office name).
- Remove `<meta name="robots" content="noindex, nofollow">` once the site moves to arolservice.com.

## Themes

- **Light** (ivory, navy ink, deep gold, porcelain globe) is the default.
- **Dark** (ink navy, champagne gold) via the sun/moon button in the header; the visitor's choice is kept in `localStorage` (`arol-theme`).
- Colours are CSS variables: `:root` = light, `:root[data-theme="dark"]` = dark. The globe's palettes are `THEMES` in `assets/js/globe.js`; the agreement cards keep their own black/platinum finish in both themes.

## Notes

- Respects `prefers-reduced-motion` (no intro, no autoplay, static globe).
- External requests: Google Fonts (Cormorant Garamond, Manrope), `flag-icons@7.2.3`, `three@0.160.0` (jsDelivr).
- The previous (classic) design is in the git history: commit `0908709`.
