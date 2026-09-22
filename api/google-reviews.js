/** Optional Google Places adapter. Disabled until the owner supplies both settings.
 * No form information is read or forwarded. No Google responses are persisted.
 * Source: https://developers.google.com/maps/documentation/places/web-service/place-details
 */
export function normalizePlace(place) {
  const name = place.displayName?.text || '';
  const address = place.formattedAddress || '';
  const phone = String(place.nationalPhoneNumber || '').replace(/\D/g, '').slice(-10);
  if (!/phuong/i.test(name) || !/808\s+Franklin/i.test(address) || !/Oakland/i.test(address) || phone !== '5108358288') {
    throw new Error('Place does not match Phuong Jewelry at 808 Franklin Street.');
  }
  const rating = Number(place.rating);
  const count = Number(place.userRatingCount);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5 || !Number.isInteger(count) || count < 0) {
    throw new Error('Invalid aggregate rating.');
  }
  return {
    configured: true, rating, count,
    reviews: (Array.isArray(place.reviews) ? place.reviews : []).slice(0, 5).filter(r => {
      const value = Number(r.rating);
      return r.originalText?.text && r.authorAttribution?.displayName && Number.isFinite(value) && value >= 1 && value <= 5;
    }).map(r => {
      const words = r.originalText.text.trim().split(/\s+/);
      return {
        text: words.slice(0, 24).join(' ') + (words.length > 24 ? '…' : ''),
        author: r.authorAttribution.displayName,
        authorUrl: r.authorAttribution.uri || '',
        avatarUrl: r.authorAttribution.photoUri || '',
        url: r.googleMapsUri || place.googleMapsUri || '',
        rating: Number(r.rating),
        date: /^\d{4}-\d{2}-\d{2}T/.test(r.publishTime || '') ? r.publishTime.slice(0, 10) : ''
      };
    })
  };
}
export function createHandler(env = process.env, fetcher = globalThis.fetch) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Method not allowed.' });
    }
    const apiKey = env.GOOGLE_PLACES_API_KEY;
    const placeId = env.GOOGLE_PLACE_ID;
    const configured = Boolean(apiKey && placeId);
    const load = new URL(req.url, 'https://example.invalid').searchParams.get('load') === '1';
    if (!configured || !load) return res.status(200).json({ configured });
    if (!/^[A-Za-z0-9_-]{10,256}$/.test(placeId)) return res.status(503).json({ error: 'Invalid configuration.' });
    try {
      const response = await fetcher(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'displayName,formattedAddress,nationalPhoneNumber,googleMapsUri,rating,userRatingCount,reviews'
        }, signal: AbortSignal.timeout(8000)
      });
      if (!response.ok) throw new Error('Google request failed.');
      return res.status(200).json(normalizePlace(await response.json()));
    } catch {
      return res.status(502).json({ error: 'Reviews are temporarily unavailable. Please read them on Google Maps.' });
    }
  };
}
export default createHandler();
