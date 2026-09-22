"""Optional browser smoke checks. Requires Python Playwright and a Chromium binary.
External requests are blocked deliberately to exercise unavailable-photo fallbacks.
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
        browser = p.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH', '/usr/bin/chromium'), headless=True, args=['--no-sandbox'])
        context = browser.new_context(reduced_motion='reduce')
        context.route('**/*', lambda route: route.continue_() if route.request.url.startswith(BASE) else route.abort())
        errors = []
        page = context.new_page()
        for width in (320, 390, 768, 1440):
            page.close()
            page = context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.set_viewport_size({'width': width, 'height': 900})
            page.set_content((ROOT / 'index.html').read_text(), wait_until='networkidle')
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Overflow at {width}'
            assert page.locator('h1').is_visible()
            assert not page.locator('#google-live').is_visible()
            if page.locator('.menu-toggle').is_visible():
                page.locator('.menu-toggle').click()
                assert page.locator('.menu-toggle').get_attribute('aria-expanded') == 'true'
                page.locator('#navigation a').first.click()
                assert page.locator('.menu-toggle').get_attribute('aria-expanded') == 'false'
            results.append(f'{width}px: no horizontal overflow; navigation works')
        page.close()
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.set_viewport_size({'width': 1440, 'height': 1000})
        page.set_content((ROOT / 'index.html').read_text(), wait_until='networkidle')
        page.locator('[data-interest="Diamonds & rings"]').first.click()
        assert page.locator('#interest').input_value() == 'Diamonds & rings'
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
        assert any(word in page.locator('#form-status').inner_text() for word in ('copied', 'selected'))
        results.append('Inquiry selection, validation, draft, encoded mailto, and copy/fallback work')
        for name in ('privacy', 'credits'):
            page.locator(f'[data-dialog="{name}"]').click()
            assert page.locator(f'#{name}').is_visible()
            page.keyboard.press('Escape')
            assert not page.locator(f'#{name}').is_visible()
        results.append('Privacy and credits dialogs open and dismiss with Escape')
        assert page.locator('.image-fallback:visible').count() == 2
        results.append('Both unavailable external photos degrade to labeled store fallbacks')
        assert not errors, errors
        results.append('No uncaught browser JavaScript exceptions')
        browser.close()
    print(json.dumps({'passed': len(results), 'results': results, 'limitations': 'DOM rendered with set_content because browser navigation is restricted in this environment. External photography/fonts and real Google credentials are not exercised.'}, indent=2))
finally:
    server.terminate()
    server.wait(timeout=5)
