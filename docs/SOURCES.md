# Sources and publishing decisions

Checked September 22, 2026. This record documents provenance, not a grant of commercial photo rights. No inventory, price, customer identity, or integration result is invented.

## Business identity

- [Shop Oakland Now](https://shopoaklandnow.org/listing/phuong-jewelry/) identifies the family business at 808 Franklin Street, Oakland, (510) 835-8288, and describes jewelry, custom designs, repairs and watch service.
- [Roadtrippers](https://maps.roadtrippers.com/us/oakland-ca/shopping/phuong-jewelry) supplies the same address and phone and lists phuongjewelry@gmail.com. The inbox has not been confirmed with the owners.
- [Google Maps business listing](https://www.google.com/maps?cid=11681540897637741024) was opened in a browser and independently matched the name, address and phone. Its limited public view showed an overall 3.9-star rating, **not** a five-star aggregate. That changing score is not hardcoded on the site. Individual Google review text was not accessible in that view.
- [Yelp](https://www.yelp.com/biz/phuong-jewelry-oakland) and [Giftly](https://www.giftly.com/gift-card/phuong-jewelry-oakland) identify the same business. Direct Yelp access encountered device verification; it was not bypassed.

Hours and founding-year references conflict, so the site asks visitors to call for hours and does not assert an exact founding year. The old domain has not been verified and is not linked.

## Archive photographs in the repository

Images were visually inspected and copied unaltered from the sources below. Original borders and lettering are retained; `object-fit: contain` keeps the complete product/portrait images visible. Local hosting fixes the unreliable third-party delivery observed in the previous hero. All four archive files are historical reference photography, not evidence of current stock or an offer for sale.

| Local asset | Subject / dimensions | Direct source |
| --- | --- | --- |
| `assets/pearls-archive.png` | Pearl strands, 1684 × 1110 | https://shopoaklandnow.org/wp-content/uploads/2018/04/Pearls_11.15.18_edit.png |
| `assets/jade-archive.png` | Jade bangles, 842 × 555 | https://shopoaklandnow.org/wp-content/uploads/2018/04/JadeBracelet_11.15.18_edit.png |
| `assets/jeweler-archive.png` | Jeweler using a loupe, 842 × 555 | https://shopoaklandnow.org/wp-content/uploads/2018/04/PhuongJewelry_11.15.18_edit.png |
| `assets/yelp-entrance.jpg` | Entrance, 250 × 250 | https://s3-media0.fl.yelpcdn.com/bphoto/qVqaVhHk0KNsyc2DnNZirA/ls.jpg |

The three Shop Oakland Now images appear together on its [Phuong Jewelry feature](https://shopoaklandnow.org/listing/phuong-jewelry/). Their filenames contain `11.15.18`; the website labels them as 2018 archive images, without claiming an exact capture date or naming an unverified photographer.

The Yelp entrance image was also accessible on Giftly. Its [source permalink](https://www.yelp.com/biz_photos/phuong-jewelry-oakland?select=qVqaVhHk0KNsyc2DnNZirA) is retained beside the photograph. The contributor name and reuse permission were not supplied by the accessible listing.

Copyright remains with each rights holder. Owner/rights-holder permission has **not** been verified; confirm it before public promotion or replace these with approved originals. No stock or AI-generated jewelry imagery is used.

### Retired image

The previous hero used the [2024 community fundraiser storefront photo](https://www.gofundme.com/f/please-help-phuong-jewelry-rebuild). It failed to load during real HTTP browser verification in this session. It is no longer requested by the page. This change does not imply a change to the physical storefront.

## Verified five-star Yelp excerpts

Both existing excerpts were rechecked against Roadtrippers' embedded Yelp feed. In the retrieved HTML, each review's own `.yelp-review` block contains `rt-yelp-rating-stars rt-yelp-rating-5`, its author, date, text, and matching Yelp `hrid`. This verifies **individual** ratings through the syndicated feed; it is not direct access to Yelp or an aggregate rating.

| Reviewer | Published | Rating | Exact short excerpt | Source |
| --- | --- | --- | --- | --- |
| S W. | June 30, 2026 | 5/5 | The owner who helped us was very warm. | https://www.yelp.com/biz/phuong-jewelry-oakland?hrid=L5DS4itZ21WC24hvnkQa1Q |
| Cristal B. | April 1, 2026 | 5/5 | I always find fun unique items here. | https://www.yelp.com/biz/phuong-jewelry-oakland?hrid=W7VK3d51d8-mzR_bK-Iuvg |

Evidence page: https://maps.roadtrippers.com/us/oakland-ca/shopping/phuong-jewelry . Verification date and the selection disclosure appear beside the review cards. The page links to all Yelp and Google reviews so visitors can read the full range of feedback. Only 15 words of customer review text are reproduced in total. Review text remains with its authors/platforms.

## Optional Google reviews and photos

No Google review text, photograph, or five-star claim is hardcoded. The live feature remains disabled without both server settings. The public Maps link and gallery link work independently of this feature.

The existing official Places adapter now requests up to two photographs in addition to reviews, only after a visitor explicitly clicks “Show Google reviews & photos.” Business name, address and phone are matched before content is displayed. Photo media is resolved only for API-returned names belonging to the configured business, through Google's fixed API host. Keys stay server-side. Photo failures do not suppress valid reviews. Responses use `Cache-Control: no-store`; no Google content is written to disk.

Google content keeps contributor names, profile links, available avatars, source links and Google Maps attribution. The default displays Google's relevance-selected reviews. An optional “Show only five-star reviews” control clearly states the filter, keeps the true overall rating unchanged, and shows an honest empty state when no returned review qualifies. This is a subset of up to five reviews Google returns, not all reviews ever posted. Review excerpts contain up to 24 words and mark truncation.

Sources checked for implementation:

- [Place Details (New)](https://developers.google.com/maps/documentation/places/web-service/place-details)
- [Place Photos (New)](https://developers.google.com/maps/documentation/places/web-service/place-photos)
- [Places attribution and review policies](https://developers.google.com/maps/documentation/places/web-service/policies)
- [Google Maps terms](https://maps.google.com/help/terms_maps/) and [privacy policy](https://policies.google.com/privacy)

The implementation has synthetic tests, not a verified live API connection. Confirm the exact place ID, billing/quotas, attribution and real responses on the owner's account before enabling it publicly. No API keys were added, no paid requests were made, and no Google photos were scraped or committed.

## Other references and remaining launch items

- [Vercel Node.js functions](https://vercel.com/docs/functions/runtimes/node-js). The repository remains a no-build static site with one optional server function.
- Italiana and DM Sans are requested through Google Fonts. No font binaries are redistributed.

Before launch: owner-approved copy and photo rights, current business contact details and hours, real inventory/prices if commerce is added, Google configuration if desired, hosted testing, verified domain, and removal of staging `noindex,nofollow` only after approval. The site remains inquiry-only; the email form prepares a draft and does not send or book anything.
