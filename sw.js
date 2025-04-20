self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');

//   evt.waitUntil(  
//     caches.open(staticCache).then(cache => {
//         cache.addAll(assets);
//     })
// )
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
});



self.addEventListener('fetch', (event) => { 
  console.log('Service Worker: Fetching', event.request.url);
//   event.respondWith(
//     fetch(event.request)
//       .catch(() => caches.match(event.request))
//   );


// evt.respondWith(
//     caches.match(evt.request).then(cacheRes =>{
//         return cacheRes || fetch(evt.request);
//     })
// )
});