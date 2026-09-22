import test from "node:test";
import assert from "node:assert/strict";
import { createHandler, normalizePlace } from "../api/google-reviews.js";

// Synthetic fixtures for tests only. Never served to the website.
const fixture = () => ({
  displayName: { text: "Phuong Jewelry" },
  formattedAddress: "808 Franklin St, Oakland, CA 94607, USA",
  nationalPhoneNumber: "(510) 835-8288",
  rating: 4.1,
  userRatingCount: 12,
  googleMapsUri: "https://maps.google.com/example",
  reviews: [
    {
      originalText: {
        text: "A synthetic test review, not a real customer testimonial.",
      },
      authorAttribution: {
        displayName: "Test Author",
        uri: "https://www.google.com/maps/contrib/test",
        photoUri: "https://lh3.googleusercontent.com/test",
      },
      googleMapsUri: "https://www.google.com/maps/reviews/test",
      rating: 4,
      publishTime: "2026-01-01T00:00:00Z",
    },
  ],
});
const config = {
  GOOGLE_PLACES_API_KEY: "test-server-key",
  GOOGLE_PLACE_ID: "test_place_123456",
};
function response() {
  return {
    headers: {},
    code: null,
    body: null,
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}
async function invoke(
  env = {},
  fetcher = () => {
    throw new Error("Unexpected network call");
  },
  url = "/api/google-reviews",
  method = "GET",
) {
  const res = response();
  await createHandler(env, fetcher)({ url, method }, res);
  return res;
}
test("unconfigured Google reviews return no fabricated data", async () => {
  const res = await invoke();
  assert.equal(res.code, 200);
  assert.deepEqual(res.body, { configured: false });
});
test("configuration check makes no paid Google request", async () => {
  const res = await invoke(config);
  assert.deepEqual(res.body, { configured: true });
});
test("a partial configuration stays disabled", async () => {
  const res = await invoke({
    GOOGLE_PLACES_API_KEY: config.GOOGLE_PLACES_API_KEY,
  });
  assert.equal(res.body.configured, false);
});
test("POST is refused and no content is cached", async () => {
  const res = await invoke({}, undefined, "/api/google-reviews", "POST");
  assert.equal(res.code, 405);
  assert.equal(res.headers.Allow, "GET");
  assert.equal(res.headers["Cache-Control"], "no-store");
});
test("invalid place configuration is rejected before contacting Google", async () => {
  const res = await invoke(
    { ...config, GOOGLE_PLACE_ID: "../bad" },
    undefined,
    "/api/google-reviews?load=1",
  );
  assert.equal(res.code, 503);
});
test("a requested live lookup uses a fixed Google host, field mask, timeout, and server-only key", async () => {
  const res = await invoke(
    config,
    async (url, options) => {
      assert.equal(
        url,
        "https://places.googleapis.com/v1/places/test_place_123456",
      );
      assert.equal(options.headers["X-Goog-Api-Key"], "test-server-key");
      assert.match(options.headers["X-Goog-FieldMask"], /reviews/);
      assert.ok(options.signal);
      return { ok: true, json: async () => fixture() };
    },
    "/api/google-reviews?load=1",
  );
  assert.equal(res.code, 200);
  assert.equal(res.body.reviews.length, 1);
  assert.doesNotMatch(JSON.stringify(res.body), /test-server-key/);
});
test("wrong business details fail closed", () => {
  for (const wrong of [
    { displayName: { text: "Different Jewelry" } },
    { formattedAddress: "100 Main Street, Oakland" },
    { formattedAddress: "808 Franklin St, New York" },
    { nationalPhoneNumber: "(212) 555-1234" },
  ]) {
    assert.throws(
      () => normalizePlace({ ...fixture(), ...wrong }),
      /does not match/,
    );
  }
});
test("invalid aggregate ratings are not displayed", () => {
  for (const rating of [0, 6, "invalid", undefined])
    assert.throws(
      () => normalizePlace({ ...fixture(), rating }),
      /Invalid aggregate/,
    );
  for (const userRatingCount of [-1, 1.5, undefined])
    assert.throws(
      () => normalizePlace({ ...fixture(), userRatingCount }),
      /Invalid aggregate/,
    );
});
test("review excerpts preserve attribution, date, and source link", () => {
  const r = normalizePlace(fixture()).reviews[0];
  assert.equal(r.author, "Test Author");
  assert.equal(r.date, "2026-01-01");
  assert.match(r.url, /google\.com/);
});
test("long text is marked as an excerpt", () => {
  const place = fixture();
  place.reviews[0].originalText.text = Array(40).fill("word").join(" ");
  const text = normalizePlace(place).reviews[0].text;
  assert.equal(text.split(/\s+/).length, 24);
  assert.ok(text.endsWith("…"));
});
test("no more than five Google-selected reviews are shown", () => {
  const place = fixture();
  place.reviews = Array(8).fill(place.reviews[0]);
  assert.equal(normalizePlace(place).reviews.length, 5);
});
test("empty or unattributed reviews are skipped, not replaced with fictional copy", () => {
  const place = fixture();
  place.reviews = [
    { rating: 5 },
    { originalText: { text: "Test" }, rating: 2 },
  ];
  assert.deepEqual(normalizePlace(place).reviews, []);
});
test("upstream errors and timeouts do not expose secrets", async () => {
  for (const fetcher of [
    async () => ({ ok: false }),
    async () => {
      throw new Error("test-server-key timeout");
    },
  ]) {
    const res = await invoke(config, fetcher, "/api/google-reviews?load=1");
    assert.equal(res.code, 502);
    assert.doesNotMatch(JSON.stringify(res.body), /test-server-key/);
  }
});

const photoFixture = () => ({
  name: "places/test_place_123456/photos/test-photo",
  googleMapsUri: "https://www.google.com/maps/test-photo",
  authorAttributions: [
    {
      displayName: "Synthetic Photographer",
      uri: "https://www.google.com/maps/contrib/test",
      photoUri: "https://lh3.googleusercontent.com/avatar-test",
    },
  ],
});
test("Google photo loading preserves credits and strips internal references", async () => {
  const calls = [];
  const place = fixture();
  place.photos = [photoFixture()];
  const res = await invoke(
    config,
    async (url, options) => {
      calls.push(url);
      assert.equal(options.headers["X-Goog-Api-Key"], "test-server-key");
      return {
        ok: true,
        json: async () =>
          calls.length === 1
            ? place
            : { photoUri: "https://lh3.googleusercontent.com/test-image" },
      };
    },
    "/api/google-reviews?load=1",
  );
  assert.equal(calls.length, 2);
  assert.match(
    calls[1],
    /photos\/test-photo\/media\?maxWidthPx=900&skipHttpRedirect=true$/,
  );
  assert.equal(res.body.photos[0].authors[0].name, "Synthetic Photographer");
  assert.equal(res.body.photos[0].url, photoFixture().googleMapsUri);
  assert.equal(res.body.photos[0].name, undefined);
  assert.doesNotMatch(JSON.stringify(res.body), /test-server-key/);
});
test("foreign and traversal photo names never initiate media requests", async () => {
  for (const name of [
    "places/other_place/photos/test-photo",
    "places/test_place_123456/photos/../secret",
    "https://evil.example/test",
  ]) {
    let count = 0;
    const place = fixture();
    place.photos = [{ ...photoFixture(), name }];
    const res = await invoke(
      config,
      async () => {
        count++;
        return { ok: true, json: async () => place };
      },
      "/api/google-reviews?load=1",
    );
    assert.equal(count, 1);
    assert.deepEqual(res.body.photos, []);
    assert.equal(res.body.reviews.length, 1);
  }
});
test("photo errors or unsafe hosts do not remove valid reviews or leak credentials", async () => {
  for (const photoUri of [
    "https://evil.example/photo",
    "http://lh3.googleusercontent.com/photo",
    "https://lh3.googleusercontent.com/photo?key=test-server-key",
    "not a url",
  ]) {
    let count = 0;
    const place = fixture();
    place.photos = [photoFixture()];
    const res = await invoke(
      config,
      async () => ({
        ok: true,
        json: async () => (++count === 1 ? place : { photoUri }),
      }),
      "/api/google-reviews?load=1",
    );
    assert.equal(res.code, 200);
    assert.equal(res.body.reviews.length, 1);
    assert.deepEqual(res.body.photos, []);
  }
});
test("unattributed photos are omitted and no more than two photos are requested", () => {
  const place = fixture();
  place.photos = [photoFixture(), photoFixture(), photoFixture()];
  assert.equal(normalizePlace(place).photos.length, 2);
  place.photos = [{ ...photoFixture(), authorAttributions: [] }];
  assert.deepEqual(normalizePlace(place).photos, []);
});
