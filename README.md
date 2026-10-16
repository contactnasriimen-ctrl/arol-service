# ARoL Service – website

One-page static site (HTML + CSS + vanilla JS, no build step). Open `index.html` in a browser, or upload the folder to any static host.

```
index.html
assets/
  css/style.css
  js/main.js
  img/
    logo-arol.png         solid logo (light backgrounds)
    logo-arol-light.png   outlined logo (navy backgrounds)
    favicon.png
    globe.svg             artwork for the "Patent footprint" slide
```

## Replace before going live

| What | Where | Notes |
| --- | --- | --- |
| Hero photos | `assets/img/slide-1.jpg`, `slide-2.jpg`, `slide-3.jpg` | Optional. When a file exists it covers the built-in artwork for that slide; when it's missing the artwork shows. ~1920×700, JPG/WebP. |
| Logos | `assets/img/logo-arol*.png`, `favicon.png` | Cut from screenshots of the old site; swap in the original vector/PNG files for sharper output. |
| Patent office logos | `.patent__office` in `index.html` | Shown as text (abbreviation + office name). Replace with `<img>` tags if you have the official logo files. |

## Editing content

- **Patent status**: each country is a `<li class="patent">`. Statuses use `data-s="force|certificate|filing|publication|maintenance"` (sets the coloured dot).
- **Slider timing**: `INTERVAL` in `assets/js/main.js` (6.5 s). Autoplay pauses on hover/focus and is off for users with reduced-motion enabled.
- **Colours**: CSS variables at the top of `style.css` (sampled from the original site).

External requests: Google Fonts (Poppins, Roboto) and `flag-icons@7.2.3` from jsDelivr.
