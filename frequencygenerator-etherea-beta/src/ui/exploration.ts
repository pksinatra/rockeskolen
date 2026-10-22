import type { AppState } from '../state/model';
import { normalizeColor, normalizeSession, sessionTemplates } from '../state/exploration';
import type { AudioController } from '../audio/controller';
export function mountExploration(get:()=>AppState, audio:AudioController, changed:()=>void, frequency:(f:number)=>void, tone:()=>void) {
  const e=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
  const input=(id:string)=>e<HTMLInputElement>(id);
  const quick=document.createElement('section');quick.className='explore-card quick-start';quick.setAttribute('aria-label','Quick start');
  quick.innerHTML='<div><strong>Quick start</strong><p>Load a starting point, then press Play.</p></div><div class="quick-grid">'+[['Pure tone',440],['Low tone',174],['Calm',396],['Focus',528]].map(([name,f])=>`<button type="button" data-quick="${f}">${name}<small>${f} Hz</small></button>`).join('')+'</div>';
  document.querySelector('main')!.prepend(quick);
  quick.querySelectorAll<HTMLButtonElement>('[data-quick]').forEach(b=>b.onclick=()=>{tone();get().color.enabled=false;frequency(Number(b.dataset.quick));render();});
  const color=document.createElement('details');color.className='explore-card';color.id='colorPanel';
  const ranges=[['warmth','Warmth'],['brightness','Brightness'],['space','Space'],['echo','Echo'],['shimmer','Shimmer'],['pulse','Pulse'],['harmonicMix','Harmonic layer']] as const;
  color.innerHTML=`<summary>Sound Color &amp; harmonics <small>Tone</small></summary><p>Optional sound shaping inspired by Frequencer. Switch off for a pure reference tone.</p><label class="toggle-line"><input id="colorEnabled" type="checkbox"> Enable Sound Color</label><div class="explore-grid">${ranges.map(([key,label])=>`<label>${label}<input id="color-${key}" type="range" min="0" max="100" value="0"></label>`).join('')}<label>Harmonic interval<select id="color-harmonicRatio"><option value="0.5">Octave below</option><option value="1.5">Perfect fifth</option><option value="2">Octave</option><option value="3">Twelfth</option><option value="4">Two octaves</option></select></label><label>Pulse rate (Hz)<input id="color-pulseRate" type="number" min="0.05" max="20" step="0.05"></label></div>`;
  e('panel-tone').append(color);
  input('colorEnabled').onchange=()=>{get().color.enabled=input('colorEnabled').checked;changed();};
  for(const [key] of ranges) input('color-'+key).oninput=()=>{get().color[key]=Number(input('color-'+key).value)/100;changed();};
  for(const key of ['harmonicRatio','pulseRate'] as const)input('color-'+key).onchange=()=>{get().color=normalizeColor({...get().color,[key]:input('color-'+key).value});render();changed();};
  const session=document.createElement('section');session.className='explore-card';session.id='sessionPanel';
  session.innerHTML=`<div class="section-title-row"><div><h2>Listening session</h2><p>Timer works in every audio mode. Changing session settings stops playback.</p></div><button id="sessionFade" type="button">Fade out</button></div><div class="explore-grid"><label>Timer (minutes, 0 = off)<input id="sessionMinutes" type="number" min="0" max="120" step="0.5"></label><label>Fade out (seconds)<input id="sessionFadeSeconds" type="number" min="0.1" max="30" step="0.1"></label></div><p id="sessionProgress" role="status">No timer</p><details id="sequencePanel"><summary>Tone sequence</summary><p>Play a series of frequencies using the current waveform and Sound Color. Select Tone and press Play to start.</p><label class="toggle-line"><input id="sequenceEnabled" type="checkbox"> Enable sequence in Tone</label><div class="explore-grid"><label>Seconds per step<input id="sequenceSeconds" type="number" min="0.5" max="600" step="0.5"></label><label class="toggle-line"><input id="sequenceLoop" type="checkbox"> Loop sequence</label><label>Template<select id="sequenceTemplate"><option value="">Choose a template</option><option value="solfeggio">Solfeggio frequencies</option><option value="descending">Descending tones</option><option value="arpeggio">Major arpeggio</option></select></label></div><div id="sequenceSteps" class="sequence-steps"></div><div class="inline-actions"><button id="sequenceAdd" type="button">Add current tone</button><button id="sequenceClear" type="button">Clear sequence</button></div><p id="sequenceHint" role="status"></p></details>`;
  document.querySelector('main')!.append(session);
  const edit=()=>{
    audio.stop();const s=get();s.session=normalizeSession({...s.session,seconds:Number(input('sessionMinutes').value)*60,fade:input('sessionFadeSeconds').value,sequence:input('sequenceEnabled').checked,loop:input('sequenceLoop').checked,stepSeconds:input('sequenceSeconds').value});render();changed();
  };
  for(const id of ['sessionMinutes','sessionFadeSeconds','sequenceEnabled','sequenceLoop','sequenceSeconds'])input(id).onchange=edit;
  e('sessionFade').onclick=()=>audio.fadeOut(get().session.fade);
  input('sequenceTemplate').onchange=()=>{const steps=sessionTemplates[input('sequenceTemplate').value];if(!steps)return;audio.stop();get().session.steps=[...steps];get().session.sequence=true;render();changed();input('sequenceTemplate').value='';};
  e('sequenceAdd').onclick=()=>{audio.stop();if(get().session.steps.length>=64){e('sequenceHint').textContent='Maximum 64 steps';return;}get().session.steps.push(get().tone.frequency);render();changed();};
  e('sequenceClear').onclick=()=>{audio.stop();get().session.steps=[];render();changed();};
  audio.onStep=f=>{get().tone.frequency=f;input('toneFreq').value=String(f);changed();};
  audio.onProgress=()=>{
    const p=audio.progress;
    e('sessionProgress').textContent=p.remaining===null?'No active timer':`${Math.ceil(p.remaining)} seconds remaining${p.step>=0?' · Step '+(p.step+1):''}`;
    if(p.remaining===null&&p.step>=0)e('sessionProgress').textContent=`Step ${p.step+1} · Looping`;
    e<HTMLButtonElement>('sessionFade').disabled=!audio.mode;
    e('sequenceSteps').querySelectorAll<HTMLElement>('[data-step]').forEach(row=>row.classList.toggle('current-step',Number(row.dataset.step)===p.step));
  };
  function render(){
    const s=get();input('colorEnabled').checked=s.color.enabled;
    for(const [key]of ranges)input('color-'+key).value=String(s.color[key]*100);
    for(const key of ['harmonicRatio','pulseRate'] as const)input('color-'+key).value=String(s.color[key]);
    input('sessionMinutes').value=String(s.session.seconds/60);input('sessionFadeSeconds').value=String(s.session.fade);
    input('sequenceEnabled').checked=s.session.sequence;input('sequenceLoop').checked=s.session.loop;input('sequenceSeconds').value=String(s.session.stepSeconds);
    const list=e('sequenceSteps');list.replaceChildren();
    s.session.steps.forEach((f,i)=>{
      const row=document.createElement('div');row.dataset.step=String(i);
      const label=document.createElement('label');label.textContent=`${i+1}. Hz`;
      const field=document.createElement('input');field.type='number';field.min='20';field.max='20000';field.step='0.01';field.value=String(f);field.setAttribute('aria-label',`Sequence step ${i+1} frequency`);
      field.onchange=()=>{audio.stop();s.session.steps[i]=Number(field.value);s.session=normalizeSession(s.session);render();changed();};label.append(field);
      const del=document.createElement('button');del.textContent='Remove';del.setAttribute('aria-label',`Remove step ${i+1}`);del.onclick=()=>{audio.stop();s.session.steps.splice(i,1);render();changed();};
      row.append(label,del);list.append(row);
    });
    e('sequenceHint').textContent=s.session.steps.length?`${s.session.steps.length} steps · ${Math.round(s.session.steps.length*s.session.stepSeconds*10)/10} seconds per cycle`:'Add at least one step to play a sequence.';
    audio.onProgress();
  }
  render();return render;
}
