const {chromium}=require('/Users/pk/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');const assert=require('assert/strict'),fs=require('fs');
(async()=>{const browser=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});const context=await browser.newContext({permissions:['microphone']});const p=await context.newPage();const errors=[],failed=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)failed.push(r.url());});p.on('dialog',async d=>{errors.push(d.message());await d.dismiss();});const results=[];
for(const app of ['guitar-chords','piano-chords','guitar-scales','piano-scales','fifths','tuner']){
 await p.goto(`https://rockeskolen.com/tools/updated/${app}/?lang=nb`,{waitUntil:'networkidle'});
 if(app==='piano-chords'){await p.selectOption('#qual','maj');await p.click('#play');}
 if(app==='guitar-chords')await p.click('#playBtn');
 if(app==='guitar-scales')await p.click('#playScaleBtn');
 if(app==='piano-scales'){await p.click('#scaleToggle');await p.locator('#scaleMenu details').first().evaluate(e=>e.open=true);await p.locator('#scaleMenu button').filter({hasText:/^Dur$/}).first().click();await p.click('#playScale');}
 if(app==='fifths')await p.click('#playChordBtn');
 if(app==='tuner'){await p.click('#listenMic');await p.waitForTimeout(700);assert(await p.locator('#listenMic').evaluate(e=>e.classList.contains('active')));await p.click('#stop');assert(!(await p.locator('#listenMic').evaluate(e=>e.classList.contains('active'))));await p.click('[data-mode="guitar"]');await p.locator('.string-btn').first().click();await p.click('#play');}
 await p.waitForTimeout(1800);assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);results.push({app,audioControl:'pass',failedRequests:[]});console.log(app,'audio controls OK');}
fs.writeFileSync('/Users/pk/Documents/Codex/rockeskolen/docs/tool-upgrade-2026-09-27/audio-test.json',JSON.stringify({results,microphone:'simulated browser device; no physical microphone or listening test'},null,2));await browser.close();})();
