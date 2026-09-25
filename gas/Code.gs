const PUBLIC_SHEET = '公開用案件データ';
const VALUATION_SHEET = '査定依頼';
const BUYER_SHEET = '買手登録';
const NOTIFY_EMAIL = 'info@value-capital.jp';
const FROM_EMAIL = 'info@value-capital.jp';

function getBook_(){
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if(!id) throw new Error('SPREADSHEET_ID is not configured');
  return SpreadsheetApp.openById(id);
}
function json_(obj){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function doGet(e){
  if((e.parameter.action||'') !== 'deals') return json_({ok:true,service:'VALUE CAPITAL'});
  const sh=getBook_().getSheetByName(PUBLIC_SHEET); if(!sh) return json_({deals:[]});
  const values=sh.getDataRange().getDisplayValues(); if(values.length<2) return json_({deals:[]});
  const h=values.shift(); const rows=values.map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]]))).filter(x=>x['公開可否']==='TRUE'||x['公開可否']==='公開ON'||x['公開可否']==='1');
  const deals=rows.map(x=>({id:x['案件ID'],kind:x['種別キー'],category:x['案件種別'],region:x['公開地域'],title:x['公開タイトル'],headline:x['公開見出し'],feature:x['公開用特徴'],top:(x['トップ掲載可否']==='TRUE'||x['トップ掲載可否']==='トップON'||x['トップ掲載可否']==='1'),status:x['ステータス'],fields:buildFields_(x)}));
  return json_({deals});
}
function buildFields_(x){
  const pairs=[['売上',x['公開売上レンジ']],['利益状況',x['公開利益情報']],['譲渡理由',x['公開用譲渡理由']],['希望スキーム',x['希望スキーム']],['客室規模',x['公開客室規模レンジ']],['不動産',x['公開不動産所有形態']],['物件種別',x['公開物件種別']],['土地面積',x['公開土地面積レンジ']],['建物',x['公開建物有無']],['現況',x['公開現況']],['想定用途',x['公開想定用途']],['売却時期',x['公開売却時期']],['希望条件',x['希望条件']]];
  return pairs.filter(p=>p[1]);
}
function verifyTurnstile_(token){
  const secret=PropertiesService.getScriptProperties().getProperty('TURNSTILE_SECRET');
  if(!secret) return true;
  if(!token) return false;
  const r=UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'post',payload:{secret,response:token},muteHttpExceptions:true});
  try{return JSON.parse(r.getContentText()).success===true}catch(e){return false}
}
function doPost(e){
  try{
    const data=JSON.parse(e.postData.contents||'{}');
    if(!verifyTurnstile_(data.turnstileToken)) return json_({ok:false,message:'spam check failed'});
    const book=getBook_(); const now=new Date();
    if(data.formType==='valuation'){
      const sh=book.getSheetByName(VALUATION_SHEET); sh.appendRow([now,data['会社名']||'',data['氏名']||'',data['メールアドレス']||'',data['電話番号']||'',data['相談内容']||'',data['売上規模']||'',data['不動産所在地']||'',data['希望時期']||'',data['自由記入']||'',data.pageUrl||'',data.userAgent||'']);
      MailApp.sendEmail({to:NOTIFY_EMAIL,replyTo:data['メールアドレス']||'',name:'VALUE CAPITAL',subject:'[VALUE CAPITAL] 査定依頼',htmlBody:mailBody_(data)});
      const receiptSent=sendReceipt_(data,'valuation');
      return json_({ok:true,receiptSent});
    }
    if(data.formType==='buyer'){
      const cats=Array.isArray(data['取得希望カテゴリー'])?data['取得希望カテゴリー'].join(' / '):(data['取得希望カテゴリー']||'');
      const sh=book.getSheetByName(BUYER_SHEET); sh.appendRow([now,data['対象案件ID']||'',data['会社名']||'',data['担当者名']||'',data['メールアドレス']||'',data['電話番号']||'',cats,data['希望地域']||'',data['希望規模']||'',data['その他条件']||'',data.pageUrl||'',data.userAgent||'']);
      MailApp.sendEmail({to:NOTIFY_EMAIL,replyTo:data['メールアドレス']||'',name:'VALUE CAPITAL',subject:'[VALUE CAPITAL] 買手登録'+(data['対象案件ID']?' '+data['対象案件ID']:''),htmlBody:mailBody_(data)});
      const receiptSent=sendReceipt_(data,'buyer');
      return json_({ok:true,receiptSent});
    }
    return json_({ok:false,message:'unknown form'});
  }catch(err){ return json_({ok:false,message:String(err)}); }
}

function checkAliases(){ console.log(GmailApp.getAliases()); }

function sendReceipt_(data,type){
  const to=(data['メールアドレス']||'').trim();
  if(!to) return false;

  const aliases=GmailApp.getAliases();
  if(!aliases.includes(FROM_EMAIL)){
    console.error('FROM_EMAIL alias is not configured for this Google account: '+FROM_EMAIL);
    return false;
  }

  const isValuation=type==='valuation';
  const subject=isValuation
    ? '[VALUE CAPITAL] 査定・ご相談を受け付けました'
    : '[VALUE CAPITAL] 買手登録を受け付けました';

  const name=isValuation ? (data['氏名']||'ご担当者様') : (data['担当者名']||'ご担当者様');
  const rows=isValuation ? [
    ['会社名',data['会社名']],
    ['氏名',data['氏名']],
    ['相談内容',data['相談内容']],
    ['売上規模',data['売上規模']],
    ['不動産所在地',data['不動産所在地']],
    ['希望時期',data['希望時期']],
    ['自由記入',data['自由記入']]
  ] : [
    ['対象案件ID',data['対象案件ID']],
    ['会社名',data['会社名']],
    ['担当者名',data['担当者名']],
    ['取得希望カテゴリー',Array.isArray(data['取得希望カテゴリー'])?data['取得希望カテゴリー'].join(' / '):data['取得希望カテゴリー']],
    ['希望地域',data['希望地域']],
    ['希望規模',data['希望規模']],
    ['その他条件',data['その他条件']]
  ];

  const visibleRows=rows.filter(r=>r[1]);
  const plainRows=visibleRows.map(r=>r[0]+': '+String(r[1])).join('\n');
  const htmlRows=visibleRows.map(r=>'<tr><th style="text-align:left;vertical-align:top;padding:6px 12px 6px 0;color:#555;font-weight:600;">'+escapeHtml_(r[0])+'</th><td style="padding:6px 0;">'+escapeHtml_(r[1])+'</td></tr>').join('');

  const intro=isValuation
    ? '査定・ご相談のお申し込みを受け付けました。'
    : '買手登録のお申し込みを受け付けました。';

  const plain=name+' 様\n\nVALUE CAPITALです。\n'+intro+'\n内容を確認のうえ、必要に応じてご連絡いたします。\n\n【受付内容】\n'+plainRows+'\n\nこのメールは受付確認の自動送信です。ご返信いただく場合は、そのままこのメールへご返信ください。\n\nVALUE CAPITAL\n'+FROM_EMAIL;

  const html='<div style="font-family:Arial,\'Noto Sans JP\',sans-serif;line-height:1.7;color:#17212b;">'
    +'<p>'+escapeHtml_(name)+' 様</p>'
    +'<p>VALUE CAPITALです。<br>'+escapeHtml_(intro)+'<br>内容を確認のうえ、必要に応じてご連絡いたします。</p>'
    +'<p style="font-weight:700;margin-top:24px;">【受付内容】</p>'
    +'<table style="border-collapse:collapse;">'+htmlRows+'</table>'
    +'<p style="margin-top:24px;color:#666;font-size:13px;">このメールは受付確認の自動送信です。ご返信いただく場合は、そのままこのメールへご返信ください。</p>'
    +'<p>VALUE CAPITAL<br><a href="mailto:'+FROM_EMAIL+'">'+FROM_EMAIL+'</a></p>'
    +'</div>';

  GmailApp.sendEmail(to,subject,plain,{
    htmlBody:html,
    from:FROM_EMAIL,
    name:'VALUE CAPITAL',
    replyTo:FROM_EMAIL
  });
  return true;
}

function mailBody_(d){return Object.keys(d).filter(k=>!['turnstileToken','userAgent'].includes(k)).map(k=>'<b>'+escapeHtml_(k)+'</b>: '+escapeHtml_(Array.isArray(d[k])?d[k].join(' / '):d[k])+'<br>').join('');}
function escapeHtml_(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
