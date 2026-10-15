const fs = require('node:fs');
const { JSDOM } = require('jsdom');
async function load() {
 const dom = new JSDOM(fs.readFileSync('tools/utm-builder/index.html','utf8'), { url:'https://local.test/tools/utm-builder/', runScripts:'outside-only', pretendToBeVisual:true });
 const w=dom.window;
 w.confirm=()=>true; w.open=()=>({opener:null});
 w.navigator.clipboard={writeText:async text=>{w.copied=text}};
 w.URL.createObjectURL=blob=>{w.exported=blob;return 'blob:test'}; w.URL.revokeObjectURL=()=>{};
 w.HTMLAnchorElement.prototype.click=function(){w.download=this.download};
 for(const name of ['utm-storage.js','utm-presets.js','utm-builder.js']) w.eval(fs.readFileSync('tools/utm-builder/'+name,'utf8'));
 await new Promise(resolve=>w.addEventListener('load',resolve,{once:true}));
 return dom;
}
module.exports={load};
if(require.main===module) load().then(dom=>{
 const w=dom.window,d=w.document;
 d.getElementById('dest-url').value='https://example.com/?q=a%26b#section';
 d.getElementById('guided-campaign').value='Summer Launch';
 w.updateLiveURL(); console.log('Guided:',d.getElementById('final-url-display').textContent);
 w.switchMode('advanced'); d.getElementById('adv-source').value='google'; d.getElementById('adv-medium').value='cpc'; w.updateLiveURL();
 console.log('Advanced:',w.getValidCurrentUrl());
 w.addBulkRow({destinationUrl:'https://example.com',source:'google',medium:'cpc',campaign:'Summer'});
 console.log('Bulk:',d.getElementById('bulk-summary-counts').textContent);
 console.log('CSV:',JSON.stringify(w.parseCSV('url,content\r\nhttps://example.com,"a,b"')));
 d.getElementById('checker-input').value='https://example.com?utm_source=google&utm_medium=cpc&utm_campaign=summer'; d.getElementById('checker-parse-btn').click();
 console.log('Checker visible:',!d.getElementById('checker-results').classList.contains('hidden'));
 d.getElementById('btn-copy').click(); w.exportBulkCsv();
 console.log('Export:',w.download); dom.window.close();
});
