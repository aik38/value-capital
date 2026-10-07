(() => {
  const cfg = window.VC_CONFIG || {};
  const $ = (s,ctx=document)=>ctx.querySelector(s);
  const $$ = (s,ctx=document)=>[...ctx.querySelectorAll(s)];
  let deals=[];

  function track(name, params={}) { if (typeof window.gtag==='function') window.gtag('event', name, params); }
  function loadGA(){ if(!cfg.GA_MEASUREMENT_ID) return; const s=document.createElement('script'); s.async=true; s.src=`https://www.googletagmanager.com/gtag/js?id=${cfg.GA_MEASUREMENT_ID}`; document.head.appendChild(s); window.dataLayer=window.dataLayer||[]; window.gtag=function(){dataLayer.push(arguments)}; gtag('js',new Date()); gtag('config',cfg.GA_MEASUREMENT_ID); }

  async function fetchDeals(){
    if(deals.length) return deals;

    if(cfg.GAS_ENDPOINT){
      try {
        const u=new URL(cfg.GAS_ENDPOINT);
        u.searchParams.set('action','deals');
        const r=await fetch(u,{cache:'no-store'});
        if(!r.ok) throw new Error('deal api');
        const j=await r.json();
        if(j && j.ok===false) throw new Error(j.message||'deal api');
        deals=Array.isArray(j)?j:(j.deals||[]);
        return deals;
      } catch(e){
        console.warn('GAS deal API unavailable; falling back to seed data.',e);
      }
    }

    if(cfg.USE_SEED_DATA){
      try {
        const r=await fetch('/data/public-deals.seed.json',{cache:'no-store'});
        if(!r.ok) throw new Error('seed data');
        deals=await r.json();
        return deals;
      } catch(e){
        console.warn('Seed deal data unavailable.',e);
      }
    }

    return null;
  }

  const card=(d,compact=false)=>window.VC_DEALS.card(d,compact);

  async function renderHome(type='all'){
    const el=$('#home-deals'); if(!el) return; const all=await fetchDeals(); if(all===null)return; const list=all.filter(d=>d.top && (type==='all'||d.kind===type)).slice(0,6); el.innerHTML=list.length?list.map(d=>card(d,true)).join(''):'<p class="empty">公開中の案件情報を準備しています。</p>'; updateDealSchema(el);
  }
  async function renderAll(type='all'){
    const el=$('#all-deals'); if(!el) return; const all=await fetchDeals(); if(all===null)return; const list=all.filter(d=>type==='all'||d.kind===type); el.innerHTML=list.length?list.map(d=>card(d,false)).join(''):'<p class="empty">該当する公開案件はありません。</p>'; updateDealSchema(el);
    if(location.hash){
      const id=decodeURIComponent(location.hash.slice(1));
      requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView({block:'start'}));
    }
  }

  function updateDealSchema(el){
    const script=$('#deal-list-schema'); if(!script)return;
    script.textContent=JSON.stringify({'@context':'https://schema.org','@type':'ItemList','@id':location.origin+location.pathname+'#deals',numberOfItems:el.querySelectorAll('article').length,itemListElement:[...el.querySelectorAll('article')].map((a,i)=>({'@type':'ListItem',position:i+1,url:'https://value-capital.jp/deals/#'+encodeURIComponent(a.id),name:$('h3',a).textContent}))});
  }
  function tabs(page){ $$('.tab').forEach(b=>b.addEventListener('click',()=>{ $$('.tab').forEach(x=>x.classList.remove('active')); b.classList.add('active'); const t=b.dataset.type; page==='home'?renderHome(t):renderAll(t); })); }
  function nav(){ const b=$('.menu-button'), m=$('.mobile-nav'); if(!b||!m)return; b.addEventListener('click',()=>{ const open=b.getAttribute('aria-expanded')==='true'; b.setAttribute('aria-expanded',String(!open)); m.hidden=open; document.body.classList.toggle('nav-open',!open); }); }

  function initBuyerId(){ const i=$('[data-deal-id]'); if(!i)return; const id=new URLSearchParams(location.search).get('deal'); if(id) i.value=id; }
  function checkboxRequired(form){ const group=$$('input[name="取得希望カテゴリー"]',form); if(!group.length)return true; const ok=group.some(x=>x.checked); group.forEach(x=>x.setCustomValidity(ok?'':'1つ以上選択してください')); return ok; }

  function loadTurnstile(){ if(!cfg.TURNSTILE_SITE_KEY)return; const s=document.createElement('script'); s.src='https://challenges.cloudflare.com/turnstile/v0/api.js'; s.async=true; s.defer=true; document.head.appendChild(s); $$('[data-turnstile]').forEach(el=>{ el.className+=' cf-turnstile'; el.dataset.sitekey=cfg.TURNSTILE_SITE_KEY; }); }

  async function submitForm(form){
    const status=$('.form-status',form); if(!checkboxRequired(form)){form.reportValidity();return;}
    if(!cfg.GAS_ENDPOINT){ status.textContent='送信先のGoogle Apps Scriptは公開前設定中です。'; status.className='form-status error'; return; }
    const fd=new FormData(form); const data={}; for(const [k,v] of fd.entries()){ if(k==='取得希望カテゴリー'){ data[k]=data[k]?[].concat(data[k],v):v; } else data[k]=v; }
    data.formType=form.dataset.formType; data.pageUrl=location.href; data.userAgent=navigator.userAgent;
    const turn=$('[name="cf-turnstile-response"]',form); if(turn) data.turnstileToken=turn.value;
    const btn=$('button[type="submit"]',form); btn.disabled=true; status.textContent='送信しています…'; status.className='form-status';
    try { const r=await fetch(cfg.GAS_ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(data)}); const text=await r.text(); let j={}; try{j=JSON.parse(text)}catch{} if(!r.ok||j.ok===false) throw new Error(j.message||'送信エラー'); status.textContent='送信しました。担当者よりご連絡します。'; status.className='form-status success'; track(form.dataset.formType==='valuation'?'valuation_submit':'buyer_register',{deal_id:data['対象案件ID']||''}); form.reset(); initBuyerId(); if(window.turnstile) window.turnstile.reset(); }
    catch(e){ console.error(e); status.textContent='送信できませんでした。時間をおいて再度お試しいただくか、info@value-capital.jp へご連絡ください。'; status.className='form-status error'; }
    finally{btn.disabled=false;}
  }
  function forms(){ $$('.js-gas-form').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();submitForm(f)})); }
  function eventTracking(){ document.addEventListener('click',e=>{ const a=e.target.closest('[data-deal-cta]'); if(a) track('deal_detail_request_click',{deal_id:a.dataset.id||''}); const t=e.target.closest('[data-track]'); if(t){ track(t.dataset.track); return; } if(e.target.closest('a[href="/valuation/"]'))track('valuation_cta_click'); if(e.target.closest('a[href="/deals/"]'))track('deals_click'); }); }

  window.VC={init(page){loadGA();nav();loadTurnstile();forms();initBuyerId();eventTracking();if(page==='home'){renderHome();tabs('home')}if(page==='deals'){renderAll();tabs('deals')}}};
})();
