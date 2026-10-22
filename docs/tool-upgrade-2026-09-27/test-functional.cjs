const {chromium}=require('/Users/pk/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});const report=[];
for(const lang of ['nb','en']) for(const role of ['guest','free','pro','vip','admin']){
 const context=await browser.newContext();const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const open=async app=>{const response=await page.goto(`http://127.0.0.1:8794/tools/updated/${app}/?lang=${lang}&test_role=${role}`,{waitUntil:'networkidle'});assert.equal(response.status(),200);assert(!/Fatal error|Warning:/.test(await page.locator('body').innerText()));};
 const choose=async(selector,value)=>page.locator(selector).evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));},value);
 const premium=['pro','vip','admin'].includes(role);
 await open('guitar-chords');assert.equal(await page.evaluate(()=>window.CL_IS_PRO),premium);assert(await page.locator('#fretboard svg').count());await choose('#root','E');assert.equal(await page.inputValue('#root'),role==='guest'?'C':'E');await choose('#extension','maj7');assert.equal(await page.inputValue('#extension'),role==='guest'?'maj':'maj7');await choose('#root','B');assert.equal(await page.inputValue('#root'),premium?'B':'C');
 await open('piano-chords');await choose('#qual','add9');assert.equal(await page.inputValue('#qual'),role==='guest'?'':'add9');await choose('#qual','13');assert.equal((await page.inputValue('#qual'))==='13',premium);await choose('#qual','maj');await page.click('#invertUp');assert(await page.locator('#piano').innerHTML());
 await open('guitar-scales');await choose('#scaleSelect','dorian');assert.equal((await page.locator('#guitarboard .msg').count())>0,!premium);await choose('#scaleSelect','major');await page.click('#toggleLabelsBtn');
 await open('piano-scales');await page.click('#scaleToggle');await page.locator('#scaleMenu details').first().evaluate(e=>e.open=true);const major=page.locator('#scaleMenu button').filter({hasText:lang==='nb'?/^Dur$/:/^Major$/}).first();await major.click();assert((await page.locator('#noteBadges').innerText()).includes('C'));
 await open('fifths');await page.click('[data-quality="min"]');assert((await page.locator('#infoPanel').innerText()).includes(lang==='nb'?'moll':'minor'));
 await open('tuner');await page.click('[data-mode="guitar"]');assert.equal(await page.locator('.string-btn').count(),6);await page.click('#play');await page.click('#stop');assert.match(await page.locator('#statusText').innerText(),/Stopped|Stoppet/);
 assert.deepEqual(errors,[]);report.push({lang,role,result:'pass'});console.log(lang,role,'passed');await context.close();
}
const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();for(const app of ['guitar-chords','piano-chords','guitar-scales','piano-scales','fifths','tuner']){await page.goto(`http://127.0.0.1:8794/tools/updated/${app}/?lang=nb`,{waitUntil:'networkidle'});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);report.push({app,mobileOverflow:overflow});await page.screenshot({path:`/private/tmp/rs-mobile-${app}.png`,fullPage:true});}
fs.writeFileSync('/Users/pk/Documents/Codex/rockeskolen/docs/tool-upgrade-2026-09-27/functional-test.json',JSON.stringify(report,null,2));await browser.close();})();
