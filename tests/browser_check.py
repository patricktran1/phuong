"""Optional browser smoke checks. Requires Python Playwright and a Chromium binary.
Uses the real HTTP server and local photos; later checks isolate failed assets and synthetic Google responses.
No customer data, real reviews, or payment requests are submitted.
"""
import json
import os
import subprocess
import time
import urllib.request
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PORT = 4174
BASE = f'http://127.0.0.1:{PORT}'
server = subprocess.Popen(['node', 'server.mjs'], cwd=ROOT, env={**os.environ, 'PORT': str(PORT)}, stdout=subprocess.DEVNULL)
results = []
try:
    for _ in range(50):
        try:
            urllib.request.urlopen(BASE, timeout=1).close()
            break
        except OSError:
            time.sleep(.1)
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH'), headless=True, args=['--no-sandbox'])
        context = browser.new_context(reduced_motion='reduce')
        # Local assets must load over HTTP. External fonts use their normal browser behavior.
        errors = []
        page = context.new_page()
        for width in (320, 390, 768, 1024, 1440, 1920):
            page.close()
            page = context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.set_viewport_size({'width': width, 'height': 900})
            page.goto(BASE, wait_until='networkidle')
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Overflow at {width}'
            assert page.locator('h1').is_visible()
            for img in page.locator('img[data-source]').all():
                img.scroll_into_view_if_needed()
                assert img.evaluate('(img) => img.decode().then(() => img.naturalWidth > 0)'), img.get_attribute('src')
            assert page.locator('.image-fallback:visible').count() == 0
            page.evaluate('scrollTo(0,0)')
            assert not page.locator('#google-live').is_visible()
            if page.locator('.menu-toggle').is_visible():
                page.locator('.menu-toggle').click()
                assert page.locator('.menu-toggle').get_attribute('aria-expanded') == 'true'
                page.keyboard.press('Escape')
                assert page.locator('.menu-toggle').evaluate('(el) => el === document.activeElement')
                page.locator('.menu-toggle').click()
                page.locator('#navigation a').first.click()
                assert page.locator('.menu-toggle').get_attribute('aria-expanded') == 'false'
            page.evaluate('scrollTo(0,0)')
            if os.getenv('SCREENSHOT_DIR') and width in (390, 1440):
                out = Path(os.environ['SCREENSHOT_DIR']); out.mkdir(parents=True, exist_ok=True)
                page.screenshot(path=str(out / f'phuong-{width}.png'), full_page=True)
            results.append(f'{width}px: no horizontal overflow; all four photos load; navigation works')
        page.close()
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.set_viewport_size({'width': 1440, 'height': 1000})
        page.goto(BASE, wait_until='networkidle')
        page.locator('[data-interest="Diamonds & rings"]').first.click()
        assert page.locator('#interest').input_value() == 'Diamonds & rings'
        page.locator('#inquiry-form button[type="submit"]').click()
        assert not page.locator('#form-result').is_visible()
        page.locator('#name').fill('Preview Visitor')
        page.locator('#email').fill('visitor@example.com')
        page.locator('#message').fill('Please tell me about a ring. <img src=x onerror=alert(1)>')
        page.locator('#inquiry-form button[type="submit"]').click()
        assert page.locator('#form-result').is_visible()
        assert 'has not been sent' in page.locator('#form-status').inner_text()
        draft = page.locator('#email-draft').input_value()
        link = urlparse(page.locator('#email-link').get_attribute('href'))
        assert link.scheme == 'mailto' and link.path == 'phuongjewelry@gmail.com'
        assert parse_qs(link.query)['body'][0] == draft
        assert 'visitor@example.com' in draft
        assert page.locator('#form-result img').count() == 0
        page.locator('#copy-draft').click()
        page.wait_for_function('/copied|selected/.test(document.querySelector("#form-status").textContent)')
        results.append('Inquiry selection, validation, draft, encoded mailto, and copy/fallback work')
        for name in ('privacy', 'credits'):
            page.locator(f'[data-dialog="{name}"]').click()
            assert page.locator(f'#{name}').is_visible()
            page.keyboard.press('Escape')
            assert not page.locator(f'#{name}').is_visible()
        results.append('Privacy and credits dialogs open and dismiss with Escape')
        # Verify failures without relying on unavailable third-party networks.
        context.route('**/assets/*.png', lambda route: route.abort())
        context.route('**/assets/*.jpg', lambda route: route.abort())
        page.reload(wait_until='networkidle')
        for image in page.locator('img[data-source]').all():
            image.evaluate('(img) => img.loading = "eager"')
        page.wait_for_function('document.querySelectorAll("img[data-source][hidden]").length === 4')
        assert page.locator('.image-fallback:visible').count() == 4
        results.append('All four failed-photo states retain labeled fallbacks')
        context.unroute('**/assets/*.png'); context.unroute('**/assets/*.jpg')

        # These fixtures are explicitly synthetic, never production customer content.
        source = 'https://www.google.com/maps/reviews/synthetic-test'
        payload = {'configured': True, 'rating': 4.2, 'count': 12, 'reviews': [
            {'text': 'Synthetic five-star test text.', 'author': 'Synthetic Author A', 'rating': 5, 'date': '2026-01-01', 'url': source, 'authorUrl': source, 'avatarUrl': ''},
            {'text': '<img src=x onerror=alert(1)> Synthetic lower-rating test.', 'author': 'Synthetic Author B', 'rating': 2, 'date': '2026-01-02', 'url': source, 'authorUrl': 'javascript:alert(1)', 'avatarUrl': ''}
        ], 'photos': [{'imageUrl': 'https://lh3.googleusercontent.com/synthetic-photo', 'url': source, 'authors': [{'name': 'Synthetic Photographer', 'url': source, 'avatarUrl': ''}]}]}
        calls = []
        def google_reply(route):
            calls.append(route.request.url)
            route.fulfill(json=payload if 'load=1' in route.request.url else {'configured': True})
        context.route('**/api/google-reviews*', google_reply)
        context.route('https://lh3.googleusercontent.com/synthetic-photo', lambda route: route.fulfill(path=str(ROOT / 'assets/jade-archive.png'), content_type='image/png'))
        page.reload(wait_until='networkidle')
        assert page.locator('#load-google').is_visible()
        assert not any('load=1' in url for url in calls)
        page.locator('#load-google').click()
        page.wait_for_selector('#google-reviews .review-card')
        assert page.locator('#google-reviews .review-card').count() == 2
        assert page.locator('#google-reviews img').count() == 0
        assert page.locator('a[href^="javascript:"]').count() == 0
        assert '4.2/5 from 12' in page.locator('#google-status').inner_text()
        assert page.locator('#google-photos figure').count() == 1
        assert 'Synthetic Photographer' in page.locator('#google-photos').inner_text()
        page.locator('#five-star-only').check()
        assert page.locator('#google-reviews .review-card').count() == 1
        assert 'not the overall rating' in page.locator('#google-filter-note').inner_text()
        page.locator('#five-star-only').uncheck()
        assert page.locator('#google-reviews .review-card').count() == 2
        payload['reviews'] = [payload['reviews'][1]]
        page.reload(wait_until='networkidle'); page.locator('#load-google').click()
        page.wait_for_selector('#google-reviews .review-card'); page.locator('#five-star-only').check()
        assert 'No five-star text reviews' in page.locator('#google-reviews').inner_text()
        results.append('Synthetic Google data: click-only request, attributed photos, safe text, honest five-star filter and empty state')
        context.unroute('**/api/google-reviews*')
        def google_failure(route):
            if 'load=1' in route.request.url: route.fulfill(status=502, json={'error': 'Synthetic failure'})
            else: route.fulfill(json={'configured': True})
        context.route('**/api/google-reviews*', google_failure)
        page.reload(wait_until='networkidle'); page.locator('#load-google').click()
        page.wait_for_function('document.querySelector("#google-status").textContent.includes("could not be loaded")')
        assert page.locator('#load-google').is_enabled()
        results.append('Google failure preserves retry and source links')
        assert not errors, errors
        results.append('No uncaught browser JavaScript exceptions')
        browser.close()
    print(json.dumps({'passed': len(results), 'results': results, 'limitations': 'Real HTTP navigation and local photos tested in Chromium. Google responses are synthetic fixtures; no live credentials or hosted Vercel deployment tested.'}, indent=2))
finally:
    server.terminate()
    server.wait(timeout=5)
