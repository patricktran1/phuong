import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import vm from "node:vm";
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const script = await readFile(
  new URL("../assets/site.js", import.meta.url),
  "utf8",
);

test("client JavaScript parses without dependencies", () => {
  new vm.Script(script);
});
test("structured data describes the real shop, not imaginary inventory", () => {
  const json = JSON.parse(
    html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1],
  );
  assert.equal(json["@type"], "JewelryStore");
  assert.equal(json.telephone.replace(/[^+\d]/g, ""), "+15108358288");
  assert.equal(json.address.streetAddress, "808 Franklin Street");
  assert.equal(json.address.addressLocality, "Oakland");
  assert.equal(json.aggregateRating, undefined);
  assert.equal(json.offers, undefined);
});
test("every internal anchor and dialog references an existing, unique ID", () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const match of html.matchAll(/href="#([^"]+)"/g))
    assert.ok(ids.includes(match[1]), match[1]);
  for (const match of html.matchAll(/data-dialog="([^"]+)"/g))
    assert.ok(ids.includes(match[1]), match[1]);
});
test("external new-tab links protect the opener", () => {
  for (const [tag] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g))
    assert.match(tag, /rel="noopener noreferrer"/);
});
test("all locally served page assets exist", async () => {
  for (const [, source] of html.matchAll(
    /(?:src|href)="(\/assets\/[^"?#]+)"/g,
  )) {
    const info = await stat(new URL(".." + source, import.meta.url));
    assert.ok(info.size > 0, source);
  }
});
test("archive photos and individually verified Yelp ratings keep their source links", async () => {
  const sources = await readFile(
    new URL("../docs/SOURCES.md", import.meta.url),
    "utf8",
  );
  for (const file of [
    "pearls-archive.png",
    "jade-archive.png",
    "jeweler-archive.png",
    "yelp-entrance.jpg",
  ]) {
    assert.ok(html.includes(file));
    assert.ok(sources.includes(file));
  }
  assert.match(html, /The owner who helped us was very warm/);
  assert.match(html, /I always find fun unique items here/);
  assert.equal([...html.matchAll(/aria-label="5 out of 5 stars"/g)].length, 2);
  assert.match(html, /hrid=L5DS4itZ21WC24hvnkQa1Q/);
  assert.match(html, /hrid=W7VK3d51d8-mzR_bK-Iuvg/);
});
test("draft behavior, filtering and optional Google availability stay transparent", () => {
  assert.match(script, /message has not been sent/);
  assert.match(html, /id="google-live"[^>]*hidden/);
  assert.match(html, /name="robots" content="noindex,nofollow"/);
  assert.match(script, /selection is not the overall rating/);
  assert.doesNotMatch(html + script, /\b(?:sk_live_|AIza)[a-zA-Z0-9_-]{20,}/);
  assert.doesNotMatch(script, /\b(?:innerHTML|eval)\s*[=(]/);
});
