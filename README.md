# Phuong Jewelry

A responsive, photo-led website for the family jeweler in Oakland Chinatown. This continues the existing cream, burgundy and brass implementation, with authentic archive photography, attributed customer reviews and an inquiry flow. It is not an online inventory or checkout system.

## Run

Node.js 22 or later. No npm dependencies or build step are required.

```sh
npm start
# http://localhost:4173
npm test
```

Use the HTTP server instead of opening the HTML directly: styles, scripts and photography are served from `/assets/`.

## What is implemented

- Responsive editorial layout with a pearl-photo hero, jade gallery, jeweler portrait, Yelp entrance photo and prominent call/directions links.
- Four locally served archive photographs, source links, descriptive alternative text and failure fallbacks. Original image lettering/borders are retained. Photos do not imply current availability.
- Two short five-star Yelp excerpts with author, date, review permalink, verification date and selection disclosure. Individual stars were verified in Roadtrippers' syndicated Yelp feed; no five-star aggregate is claimed.
- Direct links to the shop's Yelp and Google Maps photos/reviews.
- Jewelry-interest controls, services and an accessible email-draft form. Nothing is sent, stored or booked by the form.
- Mobile navigation with keyboard/Escape support, reduced motion, source/privacy dialogs and mobile contact controls.
- Optional server-side Google reviews **and photos**, with business-identity verification, contributor attribution, source links, safe errors and an explicit five-star filter that leaves the true overall rating unchanged.

The source, styles and interaction code are in `index.html`, `assets/site.css` and `assets/site.js`. `server.mjs` serves the same assets locally and exposes the optional function for testing. `docs/SOURCES.md` records factual and visual provenance; `docs/QA.md` records testing.

## Google reviews and photos — optional, not yet connected

The Vercel function is `api/google-reviews.js`. Configure these **server-side** Vercel environment variables:

```text
GOOGLE_PLACES_API_KEY=
GOOGLE_PLACE_ID=
```

Use the verified place ID for **Phuong Jewelry, 808 Franklin Street, Oakland, (510) 835-8288**. The public Google Maps listing uses CID `11681540897637741024`; a CID is **not** a Places API place ID. Enable Places API (New) on the owner's Google Cloud project and restrict the key to the necessary API. Set request quotas, billing alerts and host-level rate limiting before public activation. Never put keys in HTML or GitHub.

The initial availability check makes no Google request. A visitor's explicit click on “Show Google reviews & photos” requests business details and up to two photo-media lookups. No form information is included. Google responses use `Cache-Control: no-store`; no review/photo content is persisted. A photo failure does not prevent reviews from displaying.

Default review order is Google's relevance order, with up to five returned excerpts. A visitor may choose “Show only five-star reviews.” The UI discloses this selection and gives an empty state if no returned review qualifies. It does not relabel the overall rating or fabricate positive reviews. Authors, available profile pictures, profile links, review/photo source links and Google Maps attribution accompany the content.

The API has synthetic unit and browser tests, **not a verified live connection**. No credentials were added and no paid Google requests were made. Check real responses, business matching, attribution, billing and quotas on the owner's account before activation.

## Vercel deployment

Import this repository with framework preset **Other**, repository root as the root directory, no install/build command, and no output-directory override. The static page/assets and `/api/google-reviews` are compatible with Vercel's static hosting and Node.js functions. `vercel.json` supplies baseline security response headers.

A Vercel deployment was not created or validated during this update. If the repository is already linked, a push to its configured production branch may trigger deployment. Verify the resulting site and `/api/google-reviews` on Vercel; without environment variables the endpoint should return `{"configured":false}` and the Google load button should remain hidden.

## Current status and launch checklist

The site remains in review status with `noindex,nofollow`. No deployment status, payment integration, stock synchronization, live Google connection, owner approval or photo license is claimed.

1. Confirm owner-approved copy, services, contact details and photo reuse rights. Attribution does not grant commercial permission; replace archive images with approved originals where needed.
2. Confirm that the shop monitors `phuongjewelry@gmail.com`. The form only prepares a draft for the visitor's own email app.
3. Verify current hours and any domain. Hours and founding-year sources disagree, so neither is asserted precisely.
4. Check the hosted site on real devices, then remove the staging robots tag and add the approved canonical domain/social metadata when launch is approved.
5. Add commerce only after inventory, specifications, prices, payments, taxes, fulfillment and store policies are confirmed.

## Tests

```sh
npm test
# Optional browser suite:
python3 -m pip install playwright
python3 -m playwright install chromium
python3 tests/browser_check.py
```

`npm test` runs 24 dependency-free tests for content/source integrity, attribution, configuration, business matching, Google response safety and photo resolution. The browser suite uses real HTTP navigation at 320, 390, 768, 1024, 1440 and 1920 pixels; it checks local images, navigation, email drafts, dialogs, failed photos and synthetic Google success/filter/empty/error states.

Optional `CHROMIUM_PATH` overrides the browser binary. Optional `SCREENSHOT_DIR` saves full-page 390px and 1440px screenshots. No customer message or review is submitted by tests.

Third-party photographs, trademarks and review text remain with their respective rights holders; this repository grants no blanket license for them.
