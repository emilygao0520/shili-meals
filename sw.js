const CACHE='shili-v29';
const SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  /* 跨域请求（如 Supabase API）绝不拦截缓存，永远直连网络 */
  try{if(new URL(e.request.url).origin!==location.origin)return;}catch(err){return;}
  const isNav=e.request.mode==='navigate'||(e.request.headers.get('accept')||'').includes('text/html');
  if(isNav){
    /* 页面请求：网络优先 + 绕过 HTTP 缓存（GitHub Pages 的 CDN 有 10 分钟缓存，否则更新要等很久）；断网回退缓存 */
    e.respondWith(
      fetch(e.request,{cache:'reload'}).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put('./index.html',copy));
        return res;
      }).catch(()=>caches.match('./index.html'))
    );
    return;
  }
  /* 静态资源：缓存优先 */
  e.respondWith(
    caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{
      const copy=res.clone();
      caches.open(CACHE).then(c=>c.put(e.request,copy));
      return res;
    }))
  );
});
