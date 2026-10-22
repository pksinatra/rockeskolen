import { test, expect } from "@playwright/test";
import { defaults, toUrl } from "../../src/state/model";
test.beforeEach(async ({page})=>{
 await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-ready','true');
});
test('open beta grants all existing features without auth requests',async({page})=>{
 const requests:string[]=[];page.on('request',r=>{if(r.url().includes('access.php'))requests.push(r.url());});
 await page.reload();await expect(page.locator('html')).toHaveAttribute('data-ready','true');
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/noindex/);
 await page.locator('[data-tab="multi"]').click();
 for(let i=3;i<8;i++)await page.locator('#addOscBtn').click();
 await expect(page.locator('.osc-card')).toHaveCount(8);
 await page.locator('[data-tab="sweep"]').click();await page.locator('#sweepLoop').check();await page.locator('#sweepMotion').selectOption('pingpong');
 await expect(page.locator('#sweepLoop')).toBeChecked();await expect(page.locator('#sweepMotion')).toHaveValue('pingpong');
 await page.locator('#savePresetBtn').click();await expect(page.locator('#presetDialog')).toBeVisible();await page.locator('#cancelPreset').click();
 await expect(page.locator('#proDialog')).not.toBeVisible();expect(requests).toEqual([]);
});
for(const volume of ['0','20','37'])test('legacy Tone URL and explicit volume '+volume,async({page})=>{
 await page.goto('/?f=432&wave=triangle&vol='+volume);await expect(page.locator('html')).toHaveAttribute('data-ready','true');
 await expect(page.locator('#masterVolume')).toHaveValue(volume);await expect(page.locator('#toneFreq')).toHaveValue('432.00');
 await page.reload();await expect(page.locator('#masterVolume')).toHaveValue(volume);
});
test('color, timer and editable sequence persist in presets and full Tone share',async({page})=>{
 await page.locator('#colorPanel summary').click();await page.locator('#colorEnabled').check();await page.locator('#color-echo').fill('40');
 await page.locator('#sessionMinutes').fill('10');await page.locator('#sessionMinutes').press('Tab');
 await page.locator('#sequencePanel summary').click();await page.locator('#sequenceTemplate').selectOption('arpeggio');
 await page.getByRole('button',{name:'Remove step 4',exact:true}).click();await page.locator('#sequenceLoop').check();
 await page.locator('#savePresetBtn').click();await page.locator('#presetName').fill('Color session');await page.locator('#presetForm button[type="submit"]').click();
 await page.locator('#colorEnabled').uncheck();await page.locator('[data-tab="presets"]').click();await page.getByRole('button',{name:'Color session',exact:true}).click();
 await expect(page.locator('#colorEnabled')).toBeChecked();await expect(page.locator('#color-echo')).toHaveValue('40');await expect(page.locator('#sequenceSteps > div')).toHaveCount(3);
 await page.addInitScript(()=>{Object.defineProperty(navigator,'share',{value:undefined,configurable:true});Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('fallback');}},configurable:true});});
 await page.reload();await page.locator('#shareBtn').click();await expect(page.locator('#shareDialog')).toBeVisible();
 const saved=JSON.parse(new URL(page.url()).searchParams.get('state')!);expect(saved.color.echo).toBe(.4);expect(saved.session.steps.length).toBe(3);expect(saved.session.seconds).toBe(600);
 await page.locator('#closeShare').click();await page.locator('[data-tab="presets"]').click();await page.getByRole('button',{name:'Delete preset Color session',exact:true}).click();await expect(page.locator('#customPresetsWrap')).toBeHidden();
});
test('sequence advances, loops and stops on mode change',async({page})=>{
 const s=defaults();s.session={seconds:0,fade:.1,sequence:true,loop:true,stepSeconds:.5,steps:[220,330]};
 await page.goto(toUrl('http://127.0.0.1:5174/',s));await expect(page.locator('html')).toHaveAttribute('data-ready','true');
 await page.locator('#tonePlay').click();await expect(page.locator('#toneFreq')).toHaveValue('220.00');
 await expect(page.locator('#toneFreq')).toHaveValue('330');await expect(page.locator('#toneFreq')).toHaveValue('220');
 await page.locator('[data-tab="noise"]').click();await expect(page.locator('#audioStatus')).toHaveText('Audio stopped');
 const f=await page.locator('#toneFreq').inputValue();await page.waitForTimeout(650);await expect(page.locator('#toneFreq')).toHaveValue(f);
});
test('finite sequence ends and empty sequence cannot play',async({page})=>{
 const s=defaults();s.session={seconds:0,fade:.1,sequence:true,loop:false,stepSeconds:.5,steps:[220,330]};
 await page.goto(toUrl('http://127.0.0.1:5174/',s));await expect(page.locator('html')).toHaveAttribute('data-ready','true');
 await page.locator('#tonePlay').click();await expect(page.locator('#audioStatus')).toHaveText('Audio stopped',{timeout:3000});
 await page.locator('#sequencePanel summary').click();await page.locator('#sequenceClear').click();await page.locator('#tonePlay').click();await expect(page.locator('#toast')).toContainText('Add at least one');await expect(page.locator('#audioStatus')).toHaveText('Audio stopped');
});
for(const mode of ['tone','multi','sweep','binaural','noise'] as const)test('timer stops '+mode+' without changing volume',async({page})=>{
 const s=defaults();s.mode=mode;s.volume=.17;s.session.seconds=.8;s.session.fade=.2;
 await page.goto(toUrl('http://127.0.0.1:5174/',s));await expect(page.locator('html')).toHaveAttribute('data-ready','true');
 await page.locator('#'+mode+'Play').click();await expect(page.locator('#audioStatus')).toContainText('Playing');await expect(page.locator('#audioStatus')).toHaveText('Audio stopped',{timeout:4000});await expect(page.locator('#masterVolume')).toHaveValue('17');
});
test('manual fade cancels sequence and preserves stored level',async({page})=>{
 await page.locator('#sessionFadeSeconds').fill('.1');await page.locator('#sessionFadeSeconds').press('Tab');await page.locator('#tonePlay').click();await page.locator('#sessionFade').click();await expect(page.locator('#audioStatus')).toHaveText('Audio stopped');await expect(page.locator('#masterVolume')).toHaveValue('30');
});
for(const width of [1280,1024,768,375])test('responsive controls and footer '+width,async({page},info)=>{
 await page.setViewportSize({width,height:900});await page.locator('#colorPanel summary').click();await page.locator('#sequencePanel summary').click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 for(const name of ['Tools','Pro','Account','Privacy','Terms & refunds'])await expect(page.locator('footer').getByRole('link',{name,exact:true})).toBeVisible();
 await page.screenshot({path:'artifacts/'+info.project.name+'-'+width+'.png',fullPage:true});
});
