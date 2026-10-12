// Read only the explicit news publication manifest. Never discover HTML by scanning.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'scripts/news-publication.json'),'utf8'));
assert.deepEqual(Object.keys(manifest).sort(),['assets','pages','schema_version']);
assert.equal(manifest.schema_version,1);
assert.ok(Array.isArray(manifest.pages)&&Array.isArray(manifest.assets));
assert.equal(manifest.pages.filter(p=>p.path==='ma-news').length,1,'Exactly one news index');
assert.equal(manifest.assets.length,1,'Only the reviewed news stylesheet');

function verifyFile(filename,sha){
 assert.match(sha,/^[a-f0-9]{64}$/,'News content digest');
 const target=path.join(root,filename);
 // Reject symlinks in every path component, including a symlinked directory.
 let current=root;
 for(const part of filename.split('/')){
  current=path.join(current,part);
  assert.ok(!fs.lstatSync(current).isSymbolicLink(),'No symlink in news publication path');
 }
 assert.ok(fs.lstatSync(target).isFile(),'News publication requires a regular file');
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex'),sha,'News file does not match approved digest');
}

export const newsPages=manifest.pages.map(p=>{
 assert.deepEqual(Object.keys(p).sort(),['indexable','path','sha256']);
 assert.match(p.path,/^ma-news(?:\/[0-9]{4}\/vc-[a-f0-9]{16})?$/,'News path must remain inside /ma-news/');
 assert.equal(typeof p.indexable,'boolean');
 verifyFile(p.path+'/index.html',p.sha256);
 return {path:p.path,indexable:p.indexable,redirect:false};
});
export const newsAssets=manifest.assets.map(a=>{
 assert.deepEqual(Object.keys(a).sort(),['path','sha256']);
 assert.equal(a.path,'ma-news/news.css');
 verifyFile(a.path,a.sha256);
 return a.path;
});
assert.equal(new Set(newsPages.map(p=>p.path)).size,newsPages.length,'Duplicate approved news path');
