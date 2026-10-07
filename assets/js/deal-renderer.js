(() => {
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  function card(d, compact=false){
    const fieldMap=new Map(d.fields||[]);
    const keys=d.kind==='ma'
      ? ['売上','譲渡理由','客室規模','不動産']
      : ['土地面積','建物','現況','想定用途','希望条件','売却時期','不動産'];
    const labelMap={不動産:'所有形態'};
    const fields=compact?'':keys
      .filter(k=>fieldMap.get(k))
      .slice(0,8)
      .map(k=>`<div><dt>${esc(labelMap[k]||k)}</dt><dd>${esc(fieldMap.get(k))}</dd></div>`)
      .join('');
    const category=d.kind==='realestate'?'事業用不動産':d.category;
    const headline=String(d.headline||'').replace(/[｜|]/g,'、');
    const href=compact?`/deals/#${encodeURIComponent(d.id)}`:`/buyer/?deal=${encodeURIComponent(d.id)}`;
    const label=compact?'この案件を見る':'この案件の詳細情報を希望する';
    return `<article id="${esc(d.id)}" class="deal-card ${compact?'compact':''}" data-kind="${esc(d.kind)}"><div class="deal-top"><span class="deal-type">${esc(category)}</span><span class="deal-id">${esc(d.id)}</span></div><p class="deal-region">${esc(d.region)}</p><h3>${esc(d.title)}</h3><p class="deal-headline">${esc(headline)}</p>${compact?'':`<dl class="deal-fields">${fields}</dl>`}<a class="deal-cta" data-deal-cta data-id="${esc(d.id)}" href="${href}">${label} <span>→</span></a></article>`;
  }

  window.VC_DEALS = {card};
})();
