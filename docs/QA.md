# QA record

Tested September 22, 2026 in the build environment.

## Passed

- `npm test`: 19 tests passed, 0 failed.
- `node --check api/google-reviews.js`: parses successfully.
- `python tests/browser_check.py`: 8 reported check groups passed.
- Viewports: 320, 390, 768, and 1440 pixels. No horizontal overflow found.
- Mobile menu opens, closes after navigation, and updates `aria-expanded`.
- Jewelry-interest controls populate the inquiry selector.
- Required form fields and email format use native validation.
- Email-draft content is encoded in a `mailto:` URL to the listed business inbox. It is not submitted to a server.
- Submitted markup is retained as literal text, not executed as HTML.
- Copy operation has a manual selection fallback.
- Privacy and photo-credit dialogs open and dismiss with Escape.
- External-photo failure handling preserves a labeled location fallback.
- No uncaught browser JavaScript exceptions occurred in the recorded smoke checks.

## Limitations

Browser navigation to both local HTTP and external URLs was restricted in this environment. DOM checks used Playwright `set_content`. Third-party photo and font requests were intentionally blocked for those checks. The external photo URLs were visually verified through web retrieval, but normal browser delivery from a deployed site was not tested.

No live Google API call, inbox delivery, public deployment, custom domain, checkout, payment, stock synchronization, or owner approval has been tested. The Google adapter's tests use explicitly labeled synthetic data and cover disabled state, configuration checks, fixed upstream URL, identity verification, rating validation, attribution, excerpt bounds, and safe error responses.

No Lighthouse score or WCAG conformance level is claimed. Conduct hosted accessibility and cross-browser testing before launch.
