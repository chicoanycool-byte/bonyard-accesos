// Bitácora de Accesos Bonyard - permite instalarla como app y guarda en el celular lo que no cambia
const CACHE = 'accesos-v1';
const BASE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const guardar = (req, res) => { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); return res; };

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // El backend (Google) siempre va directo
  if (url.hostname.endsWith('google.com') || url.hostname.endsWith('googleusercontent.com')) return;
  // Modelos de rostro, librería y fuentes: primero lo guardado
  if (url.hostname === 'cdn.jsdelivr.net' || url.hostname.startsWith('fonts.')) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => guardar(req, res))));
    return;
  }
  // La app: primero internet para recibir actualizaciones; si no hay, lo guardado
  e.respondWith(
    fetch(req).then(res => guardar(req, res))
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
