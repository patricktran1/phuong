# Phuong Jewelry

A photo-led, responsive website rebuild for Phuong Jewelry in Oakland Chinatown. Built directly for this repository, replacing the earlier illustrated mockup.

## Run

Node.js 22 or later. No npm packages or build step are required.

```sh
npm start
# Open http://localhost:4173
npm test
```

You can also open `index.html` directly. The optional server-side Google reviews feature is unavailable in file previews and on static-only hosting.

## What is implemented

- Cream, burgundy, and brass editorial layout with responsive navigation.
- Two authentic, externally hosted business photographs: a Yelp entrance photo and a larger historical storefront photo from the community fundraiser.
- Links to the shop's full Yelp photo gallery. No stock or illustrated jewelry is presented as the shop's inventory.
- Two short, attributed Yelp review excerpts, with dates and source links. No star score is invented or attached to either excerpt.
- Jewelry interests, services, directions, tap-to-call contact, and an inquiry email-draft tool.
- Accessible labels, keyboard controls, dialogs, reduced-motion support, and graceful external-image fallbacks.
- An optional Google Places review adapter, disabled until configured. It validates the business name, street address, city, and phone before displaying data.

## Current status

This is a review-stage implementation, not a launched online store. `noindex,nofollow` is intentionally set. No public deployment, domain change, payment setup, owner approval, or live Google API connection has been performed.

The inquiry form prepares an email to the publicly listed `phuongjewelry@gmail.com`. It does not send messages, store submissions, or confirm appointments. The visitor must send the draft using their own email application. Confirm the shop monitors this inbox before launch.

Yelp blocked direct access to its full photo gallery. One Yelp entrance photo was independently accessible through Giftly. Google review text and a current Google rating could not be independently retrieved, so no Google testimonials or rating were hardcoded. Google and Yelp links remain available.

## Google reviews, optional

The Vercel-style function is `api/google-reviews.js`. The local server also supports this endpoint.

Configure these **server-side** environment variables only:

```text
GOOGLE_PLACES_API_KEY=
GOOGLE_PLACE_ID=
```

Use the verified place ID for **Phuong Jewelry, 808 Franklin Street, Oakland, (510) 835-8288**. Enable Places API (New) on the owner's Google Cloud project. Restrict the key to the required API, set billing alerts and request quotas, and enable host-level rate limiting before public activation. Never put the key in HTML or GitHub.

An availability check does not call Google. A visitor's explicit click on “Show Google reviews” initiates the Places lookup. Responses use `Cache-Control: no-store`; no review data is written to disk. Google-selected reviews retain original-language excerpts, author attribution, profile links, available avatar images, source links, and dates. Current Google display requirements are linked in `docs/SOURCES.md`; review them before enabling the feature publicly.

This adapter has synthetic-fixture tests, not a verified live connection. API charges, billing limits, live business matching, attribution rendering, and real Google data must be checked on the owner's account before launch.

## Hosting

The static site can be served by a conventional static host. To retain the optional Google endpoint, import this repository into Vercel with framework preset “Other” and Node.js 22 or later. The included `vercel.json` supplies baseline response headers. Deployment has not been performed or tested here.

## Before public launch

1. Have the owners approve copy, services, contact details, and photography. Source attribution does not establish permission to reuse a photograph commercially.
2. Replace external photo URLs with approved, locally hosted originals. Obtain actual product photos with verified availability, metal, stone, dimensions, and prices.
3. Verify current hours, the email inbox, and any domain before use. Do not restore or link the old domain without checking its ownership and destination.
4. Test the hosted site with real photos and mobile devices, then remove the staging `noindex,nofollow` tag and add the approved domain's canonical URL, sitemap, and social preview.
5. Add real commerce only after the owners choose a payment processor and confirm inventory, pickup/shipping, tax, returns, resizing, and fulfillment arrangements. No simulated cart or checkout is included.

## Tests

`npm test` runs 19 dependency-free Node tests covering metadata, source assets, links, JavaScript parsing, unavailable reviews, business matching, response safety, and attribution.

`python tests/browser_check.py` runs optional Playwright DOM checks with Chromium. It requires Python Playwright and a browser binary; set `CHROMIUM_PATH` when needed. The recorded run checks 320, 390, 768, and 1440 pixel layouts, the inquiry flow, dialogs, and image failure behavior. Browser navigation was restricted in the build environment, so the checks used `set_content`; external photos and fonts were intentionally blocked. See `docs/QA.md` for exact limitations.

## Source record

See `docs/SOURCES.md`. Third-party photographs, trademarks, and customer text remain with their respective rights holders. No blanket license is granted for them by this repository.
