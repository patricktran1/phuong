import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('inline JavaScript parses without dependencies', () => {
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x => x[0]);
  for (const script of scripts.filter(s => !s.includes('application/ld+json'))) {
    new vm.Script(script.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, ''));
  }
});
test('structured data describes the real shop, not imaginary inventory', () => {
  const json = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(json['@type'], 'JewelryStore');
  assert.equal(json.telephone.replace(/[^+\d]/g, ''), '+15108358288');
  assert.equal(json.address.streetAddress, '808 Franklin Street');
  assert.equal(json.address.addressLocality, 'Oakland');
  assert.equal(json.aggregateRating, undefined);
  assert.equal(json.offers, undefined);
});
test('every internal anchor and dialog references an existing, unique ID', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(match[1]), match[1]);
  for (const match of html.matchAll(/data-dialog="([^"]+)"/g)) assert.ok(ids.includes(match[1]), match[1]);
});
test('external new-tab links protect the opener', () => {
  for (const [tag] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    assert.match(tag, /rel="noopener noreferrer"/);
  }
});
test('real source photography and attributed review excerpts are present', () => {
  assert.match(html, /s3-media0\.fl\.yelpcdn\.com\/bphoto\/qVqaVhHk0KNsyc2DnNZirA\/ls\.jpg/);
  assert.match(html, /images\.gofundme\.com/);
  assert.match(html, /The owner who helped us was very warm/);
  assert.match(html, /I always find fun unique items here/);
  assert.match(html, /S W\./);
  assert.match(html, /Cristal B\./);
});
test('draft behavior and review availability are transparent', () => {
  assert.match(html, /message has not been sent/);
  assert.match(html, /id="google-live"[^>]*hidden/);
  assert.match(html, /name="robots" content="noindex,nofollow"/);
  assert.doesNotMatch(html, /\b(?:sk_live_|AIza)[a-zA-Z0-9_-]{20,}/);
  assert.doesNotMatch(html, /\b(?:innerHTML|eval)\s*[=(]/);
});
