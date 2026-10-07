import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'dist');
const context={window:{}};
vm.runInNewContext(await fs.readFile(path.join(root,'assets/js/config.js'),'utf8'),context);
vm.runInNewContext(await fs.readFile(path.join(root,'assets/js/deal-renderer.js'),'utf8'),context);
const endpoint=new URL(context.window.VC_CONFIG.GAS_ENDPOINT);
endpoint.searchParams.set('action','deals');
// The same public endpoint used by the browser is the only data source.
// Never read a Sheet, credentials, seed fixture, feature, or private detail.
let payload;
for(let attempt=0;attempt<3;attempt++){
 try {
  const response=await fetch(endpoint,{signal:AbortSignal.timeout(45000),cache:'no-store'});
  if(!response.ok)throw new Error(`Public API HTTP ${response.status}`);
  payload=await response.json();
  if(payload?.ok===false)throw new Error('Public API reported failure');
  break;
 }catch(error){if(attempt===2)throw error;}
}
const source=Array.isArray(payload)?payload:payload?.deals;
if(!Array.isArray(source))throw new Error('Invalid public deals response; deployment aborted');
const text=value=>{if(typeof value!=='string')throw new Error('Invalid public display field');return value;};
const ids=new Set();
const deals=source.map(d=>{
 if(!d||!['ma','realestate'].includes(d.kind)||!Array.isArray(d.fields)||typeof d.top!=='boolean')throw new Error('Invalid public deal');
 const id=text(d.id);if(!/^[A-Za-z0-9_-]+$/.test(id)||ids.has(id))throw new Error('Invalid/duplicate public deal ID');ids.add(id);
 const allowed=d.kind==='ma'?['売上','譲渡理由','客室規模','不動産']:['土地面積','建物','現況','想定用途','希望条件','売却時期','不動産'];
 return {id,kind:d.kind,category:text(d.category),region:text(d.region),title:text(d.title),headline:text(d.headline),top:d.top,
  fields:d.fields.filter(p=>Array.isArray(p)&&allowed.includes(p[0])).map(([k,v])=>[k,text(v)])};
});
// Validate everything before creating output; a failed build never replaces Pages.
await fs.mkdir(output,{recursive:true});
const entries=['index.html','deals','valuation','buyer','company','privacy','terms','assets','CNAME','robots.txt','sitemap.xml',...['deals','valuation','buyer','company','privacy','terms'].map(p=>p+'.html')];
for(const entry of entries)await fs.cp(path.join(root,entry),path.join(output,entry),{recursive:true});
await fs.writeFile(path.join(output,'.nojekyll'),'');
for(const [page,id,compact] of [['','home-deals',true],['deals/','all-deals',false]]){
 const file=path.join(output,page,'index.html');let html=await fs.readFile(file,'utf8');
 const list=compact?deals.filter(d=>d.top).slice(0,6):deals;
 const cards=list.length?list.map(d=>context.window.VC_DEALS.card(d,compact)).join(''):(compact?'<p class="empty">公開中の案件情報を準備しています。</p>':'<p class="empty">該当する公開案件はありません。</p>');
 const placeholder=new RegExp(`<div id="${id}" class="[^"]+">\\s*</div>`);
 if(!placeholder.test(html))throw new Error('Missing source deal placeholder');
 html=html.replace(placeholder,match=>match.replace('</div>',cards+'</div>'));
 const url='https://value-capital.jp/'+page;
 const schema={'@context':'https://schema.org','@type':'ItemList','@id':url+'#deals',numberOfItems:list.length,itemListElement:list.map((d,i)=>({'@type':'ListItem',position:i+1,url:'https://value-capital.jp/deals/#'+encodeURIComponent(d.id),name:d.title}))};
 html=html.replace('</head>',`<script id="deal-list-schema" type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script></head>`);
 await fs.writeFile(file,html);
}
console.log(`Built public HTML: ${deals.length} deals; ${deals.filter(d=>d.top).slice(0,6).length} home cards. No raw API response published.`);
