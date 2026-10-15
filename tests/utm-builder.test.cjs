const {test}=require('node:test');
const assert=require('node:assert/strict');
const {load}=require('./utm-harness.cjs');
const plain=x=>JSON.parse(JSON.stringify(x));
async function setup(t){const dom=await load();t.after(()=>dom.window.close());return dom.window;}
test('URL encoding, protocols, conflicts and unrelated parameters',async t=>{
 const w=await setup(t), build=w.buildCanonicalURL;
 const input='https://example.com/a%20b?x=a%26b&x=two&utm_source=old&UTM_SOURCE=second&utm_term=stale#part';
 let r=build(input,{utm_source:'new & 雪',utm_campaign:'a b'},[], 'replace');
 let u=new URL(r.url);assert.equal(u.pathname,'/a%20b');assert.deepEqual(u.searchParams.getAll('x'),['a&b','two']);assert.equal(u.hash,'#part');assert.equal(u.searchParams.get('utm_source'),'new & 雪');assert.equal(u.searchParams.has('utm_term'),false);assert.equal(u.searchParams.has('UTM_SOURCE'),false);assert.equal(r.warnings.length,2);
 u=new URL(build(input,{utm_source:'new',utm_medium:'email'},[], 'keep').url);assert.equal(u.searchParams.get('utm_source'),'old');assert.equal(u.searchParams.get('utm_medium'),'email');assert.equal(u.searchParams.get('utm_term'),'stale');
 for(const raw of ['ftp://example.com','javascript:alert(1)','mailto:a@example.com','https://','not a url','https://example.com/%zz','https://example.com/\nhello']) assert.ok(build(raw,{}).error,raw);
 assert.ok(build('example.com',{}).url.startsWith('https://'));
});
test('presets persist, migrate, update, delete, validate data and report storage failure',async t=>{
 const w=await setup(t),store=w.eval('UTMStorage');
 w.localStorage.setItem('groniq_utm_templates',JSON.stringify([{id:'old',name:'Legacy',source:'google'}]));assert.equal(store.getTemplates().length,1);
 assert.ok(store.saveTemplate('Launch',{source:'newsletter',medium:'email',campaign:'winter',term:'雪',content:'a&b'}));
 const snapshot=w.localStorage.getItem(store.presetKey);assert.equal(JSON.parse(snapshot).version,1);
 const reload=await setup(t),again=reload.eval('UTMStorage');reload.localStorage.setItem(again.presetKey,snapshot);assert.equal(again.getTemplates()[0].term,'雪');
 const id=again.getTemplates()[0].id;again.updateTemplate(id,{source:'updated'});assert.equal(again.getTemplates()[0].source,'updated');again.deleteTemplate(id);assert.equal(again.getTemplates().length,1);
 reload.localStorage.setItem(again.presetKey,'{"version":9}');assert.deepEqual(plain(again.getTemplates()),[]);assert.match(reload.document.getElementById('preset-storage-feedback').textContent,/could not be read/);
 w.Storage.prototype.setItem=()=>{throw Error('quota')};assert.equal(store.saveTemplate('Fail',{}),null);assert.match(w.document.getElementById('toast-msg').textContent,/not saved/);
});
test('preset load cancel, preserve destination and extra fields, update and bulk reuse',async t=>{
 const w=await setup(t),d=w.document,store=w.eval('UTMStorage');
 w.switchMode('advanced');d.getElementById('adv-url').value='https://current.test/?x=1#keep';d.getElementById('adv-campaign').value='unsaved';d.getElementById('adv-id').value='extra';
 store.saveTemplate('Reusable',{source:'google',medium:'cpc',campaign:'winter'});w.openSavedModal('templates');
 w.confirm=()=>false;d.querySelector('.btn-template-use').click();assert.equal(d.getElementById('adv-campaign').value,'unsaved');
 w.confirm=()=>true;d.querySelector('.btn-template-use').click();assert.equal(d.getElementById('adv-url').value,'https://current.test/?x=1#keep');assert.equal(d.getElementById('adv-id').value,'extra');assert.equal(d.getElementById('adv-campaign').value,'winter');
 d.getElementById('adv-campaign').value='updated';w.openSavedModal('templates');d.querySelector('.btn-template-update').click();assert.equal(store.getTemplates()[0].campaign,'updated');
 w.bulkRows[0].source='preserved';d.querySelector('.btn-template-bulk').click();assert.equal(w.bulkRows[0].source,'preserved');assert.equal(w.bulkRows[0].campaign,'updated');
});
test('bulk preview, keep policy, CSV round trip and export include invalid rows',async t=>{
 const w=await setup(t),d=w.document;w.switchMode('bulk');
 Object.assign(w.bulkRows[0],{destinationUrl:'https://example.com?utm_source=old&utm_source=other',source:'new',medium:'email',campaign:'A, "B"\n雪'});
 w.addBulkRow();Object.assign(w.bulkRows[1],{destinationUrl:'ftp://example.com',source:'g',medium:'cpc',campaign:'c'});w.refreshBulkUrls();
 assert.equal(w.bulkRows[0].isValid,true);assert.equal(w.bulkRows[1].isValid,false);assert.match(d.getElementById('bulk-summary-counts').textContent,/Copy excludes rows: 2/);assert.match(d.getElementById('bulk-table-body').textContent,/Warning/);
 d.getElementById('bulk-conflict-policy').value='keep';d.getElementById('bulk-conflict-policy').dispatchEvent(new w.Event('change'));assert.equal(new URL(w.bulkRows[0].generatedUrl).searchParams.get('utm_source'),'old');
 w.copyAllBulkRows();await Promise.resolve();assert.equal(w.copied,w.bulkRows[0].generatedUrl);
 w.exportBulkCsv();const text=await new Promise(resolve=>{const r=new w.FileReader();r.onload=()=>resolve(r.result);r.readAsText(w.exported)});const csv=w.parseCSV(text);assert.equal(csv.length,3);assert.match(csv[1][11],/Warning/);assert.match(csv[2][11],/Invalid/);assert.equal(csv[2][10],'');
 assert.deepEqual(plain(w.parseCSV('a,b\r\n"comma,quote""","line\nbreak"')), [['a','b'],['comma,quote"','line\nbreak']]);assert.throws(()=>w.parseCSV('a,"open'),/unclosed/);
});
test('single modes, naming, copy failure, checker, reset and QR context',async t=>{
 const w=await setup(t),d=w.document;
 d.getElementById('dest-url').value='https://example.com?keep=a%26b#part';d.getElementById('guided-campaign').value='Snow 雪 & Sun';w.updateLiveURL();assert.equal(new URL(w.getValidCurrentUrl()).searchParams.get('utm_campaign'),'snow_雪_&_sun');
 w.switchMode('advanced');d.getElementById('adv-source').value='google';d.getElementById('adv-medium').value='cpc';d.getElementById('adv-content').value='already%20encoded';w.updateLiveURL();assert.equal(new URL(w.getValidCurrentUrl()).searchParams.get('utm_content'),'already_encoded');
 d.getElementById('btn-copy').click();await Promise.resolve();assert.equal(w.copied,w.getValidCurrentUrl());
 w.navigator.clipboard.writeText=async()=>{throw Error('blocked')};d.execCommand=()=>false;w.bulkRows[0].generatedUrl=w.getValidCurrentUrl();w.bulkRows[0].isValid=true;w.copyBulkRow(w.bulkRows[0].id);await new Promise(r=>setTimeout(r,0));assert.match(d.getElementById('toast-msg').textContent,/Could not copy/);
 d.getElementById('checker-input').value='https://example.com?utm_source=a+b&utm_source=c&utm_medium=email&utm_campaign=snow';d.getElementById('checker-parse-btn').click();assert.equal(d.getElementById('checker-results').classList.contains('hidden'),false);
 w.openQrModal({url:w.getValidCurrentUrl(),label:'Test'});assert.ok(w.getActiveQrContext());w.closeQrModal();d.getElementById('btn-reset').click();assert.equal(w.getValidCurrentUrl(),null);
});
test('CSV file import and spreadsheet paste retain supported formats',async t=>{
 const w=await setup(t),d=w.document;w.switchMode('bulk');
 const file=new w.File(['destination_url,utm_source,utm_medium,utm_campaign,utm_content\r\nhttps://example.com,google,cpc,launch,"comma, quote"" and\nnewline"'], 'links.csv',{type:'text/csv'});
 const input=d.getElementById('bulk-csv-file-input');Object.defineProperty(input,'files',{value:[file]});input.dispatchEvent(new w.Event('change'));
 for(let i=0;i<30&&d.getElementById('bulk-csv-modal').classList.contains('hidden');i++)await new Promise(r=>setTimeout(r,10));
 assert.equal(d.getElementById('bulk-csv-modal').classList.contains('hidden'),false);d.getElementById('btn-confirm-bulk-csv').click();assert.equal(w.bulkRows.length,1);assert.equal(w.bulkRows[0].content,'comma, quote" and\nnewline');assert.equal(w.bulkRows[0].isValid,true);
 d.getElementById('btn-bulk-paste').click();d.getElementById('bulk-paste-textarea').value='destination_url\tutm_source\tutm_medium\tutm_campaign\nhttps://second.test\tnews\temail\tlaunch';d.getElementById('btn-confirm-bulk-paste').click();assert.equal(w.bulkRows.length,2);assert.equal(w.bulkRows[1].isValid,true);
});
test('bundled QR SVG export, sharing payloads and keyboard Escape',async t=>{
 const w=await setup(t),d=w.document;
 w.eval(require('node:fs').readFileSync('tools/utm-builder/qrcode.min.js','utf8'));
 const url='https://example.com/?utm_source=qr&utm_campaign=snow';
 const svg=await w.QRCode.toString(url,{type:'svg'});assert.match(svg,/<svg/);assert.match(svg,/<path/);
 // Context is retained even when jsdom cannot draw a canvas.
 w.openQrModal({url,label:'Snow'});w.downloadQrSvg();await new Promise(r=>setTimeout(r,20));assert.match(w.download,/\.svg$/);
 let opened;w.open=(...args)=>{opened=args;return {opener:null}};w.shareQrWhatsApp();assert.ok(opened[0].startsWith('https://api.whatsapp.com/send'));assert.ok(decodeURIComponent(opened[0]).includes(url));
 let shared;w.navigator.share=async payload=>{shared=payload};w.shareQrNative();await Promise.resolve();assert.equal(shared.url,url);
 d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(d.getElementById('qr-modal').classList.contains('hidden'),true);
});

