import http from 'node:http';
import { readFile } from 'node:fs/promises';
import handler from './api/google-reviews.js';
const port = Number(process.env.PORT || 4173);
const page = await readFile(new URL('./index.html', import.meta.url));
http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/api/google-reviews') {
    res.status = code => { res.statusCode = code; return res; };
    res.json = body => res.end(JSON.stringify(body));
    handler(req, res).catch(() => { res.statusCode = 500; res.end('{}'); });
  } else if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'}); res.end(page);
  } else { res.writeHead(404, {'Content-Type':'text/plain'}); res.end('Not found'); }
}).listen(port, '0.0.0.0', () => console.log(`Phuong Jewelry: http://localhost:${port}`));
