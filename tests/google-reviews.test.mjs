import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, normalizePlace } from '../api/google-reviews.js';

// Synthetic fixtures for tests only. Never served to the website.
const fixture = () => ({
  displayName: { text: 'Phuong Jewelry' },
  formattedAddress: '808 Franklin St, Oakland, CA 94607, USA',
  nationalPhoneNumber: '(510) 835-8288',
  rating: 4.1, userRatingCount: 12,
  googleMapsUri: 'https://maps.google.com/example',
  reviews: [{ originalText: { text: 'A synthetic test review, not a real customer testimonial.' }, authorAttribution: { displayName: 'Test Author', uri: 'https://www.google.com/maps/contrib/test', photoUri: 'https://lh3.googleusercontent.com/test' }, googleMapsUri: 'https://www.google.com/maps/reviews/test', rating: 4, publishTime: '2026-01-01T00:00:00Z' }]
});
const config = { GOOGLE_PLACES_API_KEY: 'test-server-key', GOOGLE_PLACE_ID: 'test_place_123456' };
function response() {
  return { headers: {}, code: null, body: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; }
  };
}
async function invoke(env = {}, fetcher = () => { throw new Error('Unexpected network call'); }, url = '/api/google-reviews', method = 'GET') {
  const res = response(); await createHandler(env, fetcher)({ url, method }, res); return res;
}
test('unconfigured Google reviews return no fabricated data', async () => {
  const res = await invoke(); assert.equal(res.code, 200); assert.deepEqual(res.body, { configured: false });
});
test('configuration check makes no paid Google request', async () => {
  const res = await invoke(config); assert.deepEqual(res.body, { configured: true });
});
test('a partial configuration stays disabled', async () => {
  const res = await invoke({ GOOGLE_PLACES_API_KEY: config.GOOGLE_PLACES_API_KEY }); assert.equal(res.body.configured, false);
});
test('POST is refused and no content is cached', async () => {
  const res = await invoke({}, undefined, '/api/google-reviews', 'POST');
  assert.equal(res.code, 405); assert.equal(res.headers.Allow, 'GET'); assert.equal(res.headers['Cache-Control'], 'no-store');
});
test('invalid place configuration is rejected before contacting Google', async () => {
  const res = await invoke({ ...config, GOOGLE_PLACE_ID: '../bad' }, undefined, '/api/google-reviews?load=1'); assert.equal(res.code, 503);
});
test('a requested live lookup uses a fixed Google host, field mask, timeout, and server-only key', async () => {
  const res = await invoke(config, async (url, options) => {
    assert.equal(url, 'https://places.googleapis.com/v1/places/test_place_123456');
    assert.equal(options.headers['X-Goog-Api-Key'], 'test-server-key');
    assert.match(options.headers['X-Goog-FieldMask'], /reviews/); assert.ok(options.signal);
    return { ok: true, json: async () => fixture() };
  }, '/api/google-reviews?load=1');
  assert.equal(res.code, 200); assert.equal(res.body.reviews.length, 1);
  assert.doesNotMatch(JSON.stringify(res.body), /test-server-key/);
});
test('wrong business details fail closed', () => {
  for (const wrong of [ { displayName: { text: 'Different Jewelry' } }, { formattedAddress: '100 Main Street, Oakland' }, { formattedAddress: '808 Franklin St, New York' }, { nationalPhoneNumber: '(212) 555-1234' } ]) {
    assert.throws(() => normalizePlace({ ...fixture(), ...wrong }), /does not match/);
  }
});
test('invalid aggregate ratings are not displayed', () => {
  for (const rating of [0, 6, 'invalid', undefined]) assert.throws(() => normalizePlace({ ...fixture(), rating }), /Invalid aggregate/);
  for (const userRatingCount of [-1, 1.5, undefined]) assert.throws(() => normalizePlace({ ...fixture(), userRatingCount }), /Invalid aggregate/);
});
test('review excerpts preserve attribution, date, and source link', () => {
  const r = normalizePlace(fixture()).reviews[0];
  assert.equal(r.author, 'Test Author'); assert.equal(r.date, '2026-01-01'); assert.match(r.url, /google\.com/);
});
test('long text is marked as an excerpt', () => {
  const place = fixture(); place.reviews[0].originalText.text = Array(40).fill('word').join(' ');
  const text = normalizePlace(place).reviews[0].text; assert.equal(text.split(/\s+/).length, 24); assert.ok(text.endsWith('…'));
});
test('no more than five Google-selected reviews are shown', () => {
  const place = fixture(); place.reviews = Array(8).fill(place.reviews[0]); assert.equal(normalizePlace(place).reviews.length, 5);
});
test('empty or unattributed reviews are skipped, not replaced with fictional copy', () => {
  const place = fixture(); place.reviews = [{ rating: 5 }, { originalText: { text: 'Test' }, rating: 2 }]; assert.deepEqual(normalizePlace(place).reviews, []);
});
test('upstream errors and timeouts do not expose secrets', async () => {
  for (const fetcher of [async () => ({ ok: false }), async () => { throw new Error('test-server-key timeout'); }]) {
    const res = await invoke(config, fetcher, '/api/google-reviews?load=1'); assert.equal(res.code, 502); assert.doesNotMatch(JSON.stringify(res.body), /test-server-key/);
  }
});
