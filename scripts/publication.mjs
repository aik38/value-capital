// Only reviewed, publishable pages and assets belong in this manifest.
// Do not discover pages by scanning the repository or a private data source.
import {newsPages,newsAssets} from './news-manifest.mjs';
export const origin='https://value-capital.jp';
export const pages=[
 {path:'',indexable:true,redirect:false},
 {path:'deals',indexable:true,redirect:true},
 {path:'valuation',indexable:true,redirect:true},
 {path:'buyer',indexable:true,redirect:true},
 {path:'company',indexable:true,redirect:true},
 {path:'privacy',indexable:false,redirect:true},
 {path:'terms',indexable:false,redirect:true},
 ...newsPages
];
export const pageFile=page=>(page.path?page.path+'/':'')+'index.html';
export const pageUrl=page=>origin+'/'+(page.path?page.path+'/':'');
export const publicFiles=[
 ...pages.map(pageFile),...pages.filter(p=>p.redirect).map(p=>p.path+'.html'),
 'assets/css/style.css','assets/js/config.js','assets/js/deal-renderer.js','assets/js/site.js',
 'assets/img/favicon.svg','assets/img/hero-city.svg','assets/img/ma-office.svg',
 'assets/img/ogp.png','assets/img/realestate.svg','CNAME','robots.txt','sitemap.xml',
 ...newsAssets
];
if(new Set(pages.map(p=>p.path)).size!==pages.length||
 pages.some(p=>!(p.path===''||/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(p.path))||typeof p.indexable!=='boolean'||typeof p.redirect!=='boolean')||
 new Set(publicFiles).size!==publicFiles.length){
 throw new Error('Invalid publication manifest');
}
