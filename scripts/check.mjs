import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','dist');
const pages=['','deals','valuation','buyer','company','privacy','terms'];
const titles=new Set(),descriptions=new Set();let checked=0;
for(const page of pages){
 const filename=(page?page+'/':'')+'index.html',html=await fs.readFile(path.join(root,filename),'utf8');
 const url='https://value-capital.jp/'+(page?page+'/':'');
 assert.ok(html.includes('<html lang="ja">'),filename+' language');
 assert.equal(html.match(/rel="canonical" href="([^"]+)"/)[1],url);
 assert.equal(html.match(/property="og:url" content="([^"]+)"/)[1],url);
 const title=html.match(/<title>(.*?)<\/title>/s)[1],description=html.match(/name="description" content="([^"]+)"/)[1];
 assert.ok(!titles.has(title)&&!descriptions.has(description),'Duplicate metadata');titles.add(title);descriptions.add(description);
 assert.equal(html.match(/<h1\b/g)?.length,1,'One primary heading');
 assert.equal(html.includes('content="noindex'),['privacy','terms'].includes(page),'Index policy');
 const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'Duplicate IDs');
 for(const match of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)){
  const data=JSON.parse(match[1]);assert.equal(data['@context'],'https://schema.org');
  const graph=data['@graph']||[data];for(const node of graph){assert.ok(node['@id']?.startsWith('https://value-capital.jp/'));assert.ok(node['@type']);}
  if(data['@type']==='ItemList')assert.equal(data.numberOfItems,html.match(/<article id=/g)?.length||0);
 }
 for(const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
  if(!m[1].startsWith('/'))continue;
  const target=new URL(m[1],'https://value-capital.jp');let file=decodeURIComponent(target.pathname).slice(1);if(!file||file.endsWith('/'))file+='index.html';
  await fs.access(path.join(root,file));checked++;
  if(target.hash){const dest=await fs.readFile(path.join(root,file),'utf8');assert.ok(dest.includes(`id="${decodeURIComponent(target.hash.slice(1))}"`),'Broken fragment '+m[1]);}
 }
}
const sitemap=await fs.readFile(path.join(root,'sitemap.xml'),'utf8');
assert.equal(sitemap.match(/<loc>/g).length,5);assert.ok(!sitemap.includes('.html')&&!sitemap.includes('privacy/')&&!sitemap.includes('terms/'));
for(const loc of sitemap.matchAll(/<loc>(.*?)<\/loc>/g))assert.ok(loc[1].startsWith('https://value-capital.jp/'));
assert.ok(!sitemap.includes('<lastmod>'),'Do not fabricate modification dates');
assert.equal((await fs.readFile(path.join(root,'robots.txt'),'utf8')).trim().replace(/\r/g,''),'User-agent: *\nAllow: /\n\nSitemap: https://value-capital.jp/sitemap.xml');
assert.ok((await fs.readFile(path.join(root,'assets/js/config.js'),'utf8')).includes('G-E0MGH1P7MW'));
for(const page of pages.filter(Boolean)){const html=await fs.readFile(path.join(root,page+'.html'),'utf8');assert.ok(html.includes('noindex,follow'));assert.ok(html.includes(`content="0;url=/${page}/"`));}
for(const privatePath of ['gas','data','scripts','.github']){await assert.rejects(fs.access(path.join(root,privatePath)));}
console.log(`PASS: ${pages.length} pages, ${checked} internal links/assets, metadata, JSON-LD, sitemap, robots, redirect stubs and publication allowlist.`);
