// 앱 파일을 저장해 두고 인터넷 없이도 열리게 함. 파일을 고치면 VERSION 숫자를 올릴 것.
const VERSION = "v4";
const CACHE = "pocket-ledger-" + VERSION;
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 인터넷이 되면 새 파일을 받고, 안 되면 저장해 둔 파일을 씀
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // 구글 폰트는 한 번 받으면 저장해 두고 계속 씀 (오프라인에서도 같은 글꼴)
  if (/fonts\.(googleapis|gstatic)\.com$/.test(new URL(e.request.url).hostname)) {
    e.respondWith(
      caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      }))
    );
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
