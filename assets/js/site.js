(() => {
  const cfg = window.VC_CONFIG || {};
  const $ = (s,ctx=document)=>ctx.querySelector(s);
  const $$ = (s,ctx=document)=>[...ctx.querySelectorAll(s)];
  let deals=[];
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function track(name, params={}) { if (typeof window.gtag==='function') window.gtag('event', name, params); }
  function loadGA(){ if(!cfg.GA_MEASUREMENT_ID) return; const s=document.createElement('script'); s.async=true; s.src=`https://www.googletagmanager.com/gtag/js?id=${cfg.GA_MEASUREMENT_ID}`; document.head.appendChild(s); window.dataLayer=window.dataLayer||[]; window.gtag=function(){dataLayer.push(arguments)}; gtag('js',new Date()); gtag('config',cfg.GA_MEASUREMENT_ID); }

  async function fetchDeals(){
    if(deals.length) return deals;
    try {
      if(cfg.GAS_ENDPOINT){ const u=new URL(cfg.GAS_ENDPOINT); u.searchParams.set('action','deals'); const r=await fetch(u,{cache:'no-store'}); if(!r.ok) throw new Error('deal api'); const j=await r.json(); deals=Array.isArray(j)?j:(j.deals||[]); return deals; }
      if(cfg.USE_SEED_DATA){ const r=await fetch('/data/public-deals.seed.json',{cache:'no-store'}); deals=await r.json(); return deals; }
    } catch(e){ console.warn(e); }
    return [];
  }

  function card(d, compact=false){
    const fields=(d.fields||[]).slice(0,compact?2:6).map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
    return `<article class="deal-card ${compact?'compact':''}" data-kind="${esc(d.kind)}"><div class="deal-top"><span class="deal-type">${esc(d.category)}</span><span class="deal-id">${esc(d.id)}</span></div><p class="deal-region">${esc(d.region)}</p><h3>${esc(d.title)}</h3><p class="deal-headline">${esc(d.headline)}</p>${compact?'':`<dl class="deal-fields">${fields}</dl><p class="deal-feature">${esc(d.feature||'')}</p>`}<a class="deal-cta" data-deal-cta data-id="${esc(d.id)}" href="/buyer/?deal=${encodeURIComponent(d.id)}">この案仰c��詳細情報を希望する <span>→</span></a></article>`;
  }

  async function renderHome(type='all'){
    const el=$('#home-deals'); if(!el) return; const all=await fetchDeals(); const list=all.filter(d=>d.top && (type==='all'||d.kind===type)).slice(0,6); el.innerHTML=list.length?list.map(d=>card(d,true)).join(''):'<p class="empty">公開中の案件情報を準備しています。</p>';
  }
  async function renderAll(type='all'){
    const el=$('#all-deals'); if(!el) return; const all=await fetchDeals(); const list=all.filter(d=>type==='all'||d.kind===type); el.innerHTML=list.length?list.map(d=>card(d,false)).join(''):'<p class="empty">該当する公開案仰c��ありません。</p>';
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
    catch(e){ console.error(e); status.textContent='送信できませんでした。時間をおいて再度お試しいただくか、contact@valuecapital.co.jp へご連絡ください。'; status.className='form-status error'; }
    finally{btn.disabled=false;}
  }
  function forms(){ $$('.js-gas-form').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();submitForm(f)})); }
  function eventTracking(){ document.addEventListener('click',e=>{ const a=e.target.closest('[data-deal-cta]'); if(a) track('deal_detail_request_click',{deal_id:a.dataset.id||''}); const t=e.target.closest('[data-track]'); if(t){ track(t.dataset.track); return; } if(e.target.closest('a[href="/valuation/"]'))track('valuation_cta_click'); if(e.target.closest('a[href="/deals/"]'))track('deals_click'); }); }

  window.VC={init(page){loadGA();nav();loadTurnstile();forms();initBuyerId();eventTracking();if(page==='home'){renderHome();tabs('home')}if(page==='deals'){renderAll();tabs('deals')}}};
})();
