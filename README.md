# House of Ketty website

Home-cooked tiffin service in Jamia Nagar: **https://houseofketty.store**

A plain static site (no build step) hosted on GitHub Pages.

| File | What it is |
| --- | --- |
| `content.json` | All menu text, prices and photo paths. Edited through the admin site. |
| `index.html`, `styles.css`, `app.js` | Page layout, styling and rendering. |
| `images/` | Photos. New uploads from the admin go to `images/uploads/`. |
| `CNAME` | Custom domain for GitHub Pages. |

Run locally: `python3 -m http.server` in this folder, then open http://localhost:8000.

Orders go to WhatsApp: customers build an order on the page and it opens WhatsApp with the order text filled in.
