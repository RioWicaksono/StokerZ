
const CACHE_NAME = 'stockerz-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/vite.svg',
  'https://cdn.tailwindcss.com'
];

// Menginstal service worker dan melakukan pre-cache aset aplikasi inti
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Mengaktifkan service worker dan membersihkan cache lama
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Menyajikan aset dari cache terlebih dahulu, dengan fallback ke jaringan (cache-falling-back-to-network)
self.addEventListener('fetch', event => {
    // Kami hanya ingin men-cache permintaan GET
    if (event.request.method !== 'GET') {
        return;
    }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Coba cari respon dari cache
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        // Jika ditemukan di cache, kembalikan
        return cachedResponse;
      }

      // Jika tidak ditemukan, coba ambil dari jaringan
      try {
        const networkResponse = await fetch(event.request);
        // Tambahkan respon baru ke cache untuk penggunaan di masa mendatang
        await cache.put(event.request, networkResponse.clone());
        return networkResponse;
      } catch (error) {
        // Ini akan terpicu jika jaringan tidak tersedia
        console.error('Fetch failed; app is offline.', error);
        throw error;
      }
    })
  );
});