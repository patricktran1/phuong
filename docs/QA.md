# QA record

Tested September 22, 2026 against the real local HTTP server, not HTML injected into a browser.

## Passed

- `npm test`: 24 tests passed, 0 failed.
- `python3 tests/browser_check.py`: 12 check groups passed in Chromium 148.
- Layout widths: 320, 390, 768, 1024, 1440 and 1920 pixels. No horizontal overflow; all four locally served photos decoded successfully at each width.
- Desktop and mobile rendered screenshots visually inspected, including the complete desktop page and mobile hero/review section. Typography, preserved photo lettering, review stars, source captions, spacing and mobile contact bar were checked.
- Initial dev-server check with `agent-browser`: meaningful content, expected controls, no error overlay and no uncaught JavaScript exceptions.
- Mobile menu opens/closes after navigation; Escape restores focus to its toggle. Desktop breakpoint changes reset it.
- Jewelry-interest controls populate and focus the inquiry selector.
- Required form fields block an empty draft. A filled form prepares an encoded `mailto:` URL, displays a draft and states that nothing was sent. Customer-provided markup is retained as text, not executed. Clipboard copy/manual fallback is handled.
- Privacy and photo-credit dialogs open and dismiss with Escape.
- Four blocked local image requests expose labeled fallbacks without broken images.
- Google disabled state hides the load button; configuration detection makes no Google request.
- Synthetic Google success: explicit-click loading, review source/author attribution, photo/contributor attribution, unchanged overall rating, five-star-only filter, lower-rated review retained when the filter is off, and honest empty filter result.
- Synthetic Google failure retains a working retry button and platform links.
- API tests cover wrong-business rejection, fixed upstream host, key isolation, no-store responses, limits, unavailable attribution, traversal/foreign photo references and unsafe photo URLs.
- `git diff --check`: passed.

## Visual and source decisions

The previous external community-fundraiser hero failed in the initial browser run. It was replaced with a real pearl photograph from Shop Oakland Now, served locally. The jade and jeweler photographs are from the same feature; the small entrance photo remains traceable to Yelp. Original image borders and lettering are retained. Image failure fallbacks were tested separately from normal successful loads.

Two existing Yelp excerpts now show individual five-star ratings verified in the syndicated feed. Google Maps displayed a limited public view; no Google review text was manually imported. The optional live feature was exercised only with synthetic data, explicitly kept out of production content.

## Limitations

No live Google API connection, paid request, Vercel deployment, inbox delivery, physical-device/browser matrix, domain, payment, checkout, stock synchronization, owner approval or photo license was verified. Local HTTP tests do not prove a hosted deployment is working.

The browser suite used Chromium on macOS. Font delivery was exercised normally in the visual checks; offline image behavior was tested separately. No Lighthouse score or formal WCAG conformance level is claimed. Staging `noindex,nofollow` remains until launch is approved.
