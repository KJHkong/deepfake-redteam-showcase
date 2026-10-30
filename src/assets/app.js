import {findSample,findVariant,assetPath} from './catalog.js';
const $=id=>document.getElementById(id);
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
const pretty=v=>typeof v==='object'?JSON.stringify(v,null,2):String(v??'Not evaluated');
const names={inswapper:'InSwapper',simswap:'SimSwap',blendface:'BlendFace',liveportrait_static:'LivePortrait'};
const actions={mouth_closed_to_open:'Mouth Closed → Open',mouth_open_to_closed:'Mouth Open → Closed',eyes_open_to_closed:'Eyes Open → Closed',frontal_to_left:'Frontal → Left',frontal_to_right:'Frontal → Right'};
const nav=[['swapping','Swapping'],['source-analyzer','Source Analyzer'],['editing','Editing'],['modifier','Modifier'],['detector','Detector']];
for(const box of document.querySelectorAll('[data-navigation]'))for(const [route,label] of nav){const a=el('a','',label);a.href='/'+route+'/';if(document.body.dataset.page===route)a.setAttribute('aria-current','page');box.append(a);}

function photo(panel,label){
 const f=el('figure','image-panel');
 if(!panel)f.append(el('div','withheld-panel','Not evaluated / No image for this stage'));
 else{
  const b=el('button');b.type='button';b.setAttribute('aria-label','放大 '+label);
  const image=el('img');image.src=assetPath(panel.src);image.alt=label;image.loading='lazy';image.decoding='async';b.append(image);
  b.addEventListener('click',()=>{$('dialog-title').textContent=label;$('dialog-image').src=assetPath(panel.src);$('dialog-image').alt=label;$('image-dialog').showModal();});f.append(b);
 }
 const caption=el('figcaption');caption.append(el('strong','',label));if(panel)caption.append(el('span','',`${panel.width} × ${panel.height} · ${panel.format}`));f.append(caption);return f;
}
const dialog=$('image-dialog');
if(dialog){$('close-dialog').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});dialog.addEventListener('close',()=>$('dialog-image').removeAttribute('src'));}
function facts(items){const box=el('div','result-facts');for(const [label,value] of Object.entries(items))box.append(el('span','',label+' = '+pretty(value)));return box;}
function table(headers,rows){const box=el('div','table-scroll'),t=el('table'),head=el('thead'),hr=el('tr'),body=el('tbody');for(const h of headers)hr.append(el('th','',h));head.append(hr);for(const row of rows){const tr=el('tr');for(const c of row)tr.append(el('td','',pretty(c)));body.append(tr);}t.append(head,body);box.append(t);return box;}
function assessment(result,gate){return facts({Gate1:gate,'Historical fake score':result?.fake_score??'Not evaluated',Prediction:result?.prediction??'Not evaluated'});}
function referenceCard(ref){
 const card=el('section','reference-card');card.append(el('h3','',ref.name),el('p','',ref.title),el('p','context-note',ref.authors+' · '+ref.venue),el('p','',ref.idea));
 for(const [field,label] of [['paper','Paper'],['repo','Official Repo'],['project','Official Project']])if(ref[field]){const a=el('a','record-link',label+' ↗');a.href=ref[field];a.target='_blank';a.rel='noopener noreferrer';card.append(a);}return card;
}
function historicalCard(c,title,{mode='normal'}={}){
 const card=el('article','evidence-card');card.dataset.sample=c.sample_id;card.append(el('span','badge','Offline-generated Sample'),el('h2','',title),el('p','case-provenance',c.sample_id+' · Historical evaluation · precomputed'));
 const pictures=el('div','result-images');
 if(mode==='modifier')pictures.append(photo(c.generated_image,'Original Generator Output'),photo(c.modified_image,'Modified Output'));
 else if(mode==='analyzer')pictures.append(photo(c.source_image,'Original Source'));
 else{pictures.append(photo(c.source_image,'Source'));if(c.target_image)pictures.append(photo(c.target_image,'Target'));pictures.append(photo(c.generated_image,'Generator Output'),photo(c.final_image,'Historical Final Candidate'));}
 card.append(pictures);
 if(mode==='analyzer'){
  card.append(table(['Observation','Recorded value'],Object.entries({...c.observations.measurements,HOG_face_count:c.observations.hog_face_count,LP_face_count:c.observations.lp_face_count,NISP_class_scores:c.observations.nisp_scores})));
  card.append(el('p','context-note','Measurements and class scores are estimates, not ground truth or calibrated probabilities.'));
 }else{
  card.append(facts({Generator:names[c.generator],'Worker wall time (s)':c.worker_seconds?.toFixed(3)}),assessment(c.detector_result,c.gate1));
  if(c.profile)card.append(el('pre','json-block',pretty(c.profile)),el('p','context-note','Text is semantic metadata. Numeric controls drive the model.'));
  if(c.modifier)card.append(el('pre','json-block',pretty(c.modifier)));
 }
 return card;
}
function plot(rows){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 800 260');svg.classList.add('threshold-chart');svg.setAttribute('role','img');svg.setAttribute('aria-label','Historical threshold versus predicted Fake fraction');
 function line(tag,attrs,text){const n=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text)n.textContent=text;svg.append(n);}
 line('path',{d:'M55 20V215H770',fill:'none',stroke:'#7697a8'});
 for(const p of [0,25,50,75,100]){const y=215-p*1.8;line('path',{d:`M55 ${y}H770`,stroke:'#293d4a'});line('text',{x:8,y:y+4,fill:'#a2b0bf','font-size':12},p+'%');}
 line('polyline',{points:rows.map((r,i)=>`${65+i*86},${215-180*r.fake/r.n_scored}`).join(' '),fill:'none',stroke:'#75cfe2','stroke-width':3});
 for(const [i,r]of rows.entries())line('text',{x:55+i*86,y:241,fill:'#a2b0bf','font-size':12},r.threshold.toFixed(1));
 return svg;
}
function choose(select,values){select.replaceChildren();for(const [value,label]of values){const o=el('option','',label);o.value=value;select.append(o);}}
function demo(data,branch){
 const form=document.querySelector(`[data-demo-form="${branch}"]`),result=document.querySelector(`[data-result="${branch}"]`),rows=data.samples.filter(s=>s.section===branch);
 const source=form.elements.source,target=form.elements.target,generator=form.elements.generator,action=form.elements.action,modifier=form.elements.modifier;
 choose(source,rows.map(c=>[c.source_id,c.source_id]));
 if(branch==='swapping'){choose(target,rows.map(c=>[c.target_id,c.target_id]));choose(generator,['inswapper','simswap','blendface'].map(x=>[x,names[x]]));}
 else choose(action,Object.entries(actions));
 const selection=()=>({branch,source_id:source.value,target_id:target?.value,generator:branch==='swapping'?generator.value:'liveportrait_static',action:action?.value});
 const matching=()=>findSample(data,selection());
 function configureModifiers(){const c=matching();choose(modifier,(c?.variants||[{id:'no_modifier',label:'No Modifier'}]).map(v=>[v.id,v.label]));const preview=form.querySelector('[data-selected-inputs]');preview.replaceChildren();const s=rows.find(r=>r.source_id===source.value);if(s)preview.append(photo(s.source_image,'Preset Source'));if(target){const t=rows.find(r=>r.target_id===target.value);if(t)preview.append(photo(t.target_image,'Preset Target'));}}
 function align(){const c=branch==='swapping'?rows.find(r=>r.generator===generator.value):rows.find(r=>r.action===action.value);if(c){source.value=c.source_id;if(target)target.value=c.target_id;}configureModifiers();}
 (generator||action).addEventListener('change',align);source.addEventListener('change',configureModifiers);target?.addEventListener('change',configureModifiers);
 for(const control of form.querySelectorAll('select'))control.addEventListener('change',()=>{form.querySelector('.form-message').textContent='Selection changed. Click View Result to inspect the exact stored combination.';});
 form.addEventListener('submit',event=>{
  event.preventDefault();result.replaceChildren();const c=matching(),variant=findVariant(c,modifier.value);
  if(!c||!variant){result.append(el('span','badge','Precomputed Demo'),el('h3','','No precomputed sample available'),el('p','context-note','This exact input / generator / action / Modifier combination has no stored result. No other output was substituted.'));return;}
  result.append(el('span','badge','Precomputed Demo'),el('h3','',names[c.generator]+' · '+(actions[c.action]||'Face Swapping')),el('p','case-provenance',c.sample_id+' · '+variant.description));
  const images=el('div','result-images');images.append(photo(c.source_image,'Source'));if(c.target_image)images.append(photo(c.target_image,'Target'));images.append(photo(c.generated_image,'Generator Output'));if(variant.modified_image)images.append(photo(variant.modified_image,'Modifier Output'));images.append(photo(variant.final_image,variant.id==='no_modifier'&&c.modifier?'Generator-only display':'Final Candidate'));result.append(images,assessment(variant.detector_result,variant.gate1));
  if(c.profile)result.append(el('pre','json-block',pretty(c.profile)));if(variant.parameters)result.append(el('pre','json-block',pretty(variant.parameters)));
  result.append(el('p','run-note','Offline-generated Sample. Detector prediction is not equivalent to attack success.'));
  form.querySelector('.form-message').textContent='Showing a stored sample. No model, upload, or inference request was made.';
 });
 align();
}
async function main(){
 const responses=await Promise.all([fetch('/data/showcase.json'),fetch('/data/references.json')]);if(responses.some(r=>!r.ok))throw new Error('Static catalogue unavailable');
 const [data,refs]=await Promise.all(responses.map(r=>r.json()));const page=document.body.dataset.page;
 if(page==='overview'){
  const s=data.summary;$('scale-summary').textContent=`Historical evaluation · ${s.tasks} tasks · ${s.generated} generated · ${s.gate1_pass} Gate1 passed · ${s.scored} scored · predicted Real/Fake ${s.detector_real}/${s.detector_fake}`;
  for(const node of document.querySelectorAll('[data-hotspot]'))for(const event of ['mouseenter','focus'])node.addEventListener(event,()=>$('hotspot-status').textContent=node.getAttribute('aria-label'));
  $('expand-framework').addEventListener('click',event=>{const box=document.querySelector('.framework-viewport');box.classList.toggle('expanded');event.currentTarget.setAttribute('aria-expanded',String(box.classList.contains('expanded')));});
  demo(data,'swapping');demo(data,'editing');for(const r of refs)$('references').append(referenceCard(r));
 }else{
  const target=$('detail-content');const samples=data.sections[page].map(id=>data.samples.find(s=>s.sample_id===id));
  if(page==='swapping'){
   const tabs=el('div','tool-tabs');target.append(tabs);const cards=[];
   samples.forEach((c,i)=>{const button=el('button','',names[c.generator]);button.type='button';button.setAttribute('aria-selected',String(!i));tabs.append(button);const card=historicalCard(c,names[c.generator]);card.append(referenceCard(refs.find(r=>r.method===c.generator)));card.hidden=!!i;cards.push(card);target.append(card);button.addEventListener('click',()=>{cards.forEach((n,index)=>n.hidden=index!==i);[...tabs.children].forEach((n,index)=>n.setAttribute('aria-selected',String(index===i)));});});
  }else if(page==='source-analyzer')for(const c of samples)target.append(historicalCard(c,'Source observation · '+c.sample_id,{mode:'analyzer'}));
  else if(page==='editing'){for(const c of samples)target.append(historicalCard(c,actions[c.action]));target.append(referenceCard(refs.find(r=>r.method==='liveportrait_static')));}
  else if(page==='modifier')for(const c of samples){const card=historicalCard(c,c.modifier.tool_name,{mode:'modifier'});card.insertBefore(el('p','',c.operator_description),card.children[2]);target.append(card);}
  else if(page==='detector'){
   const section=el('section','evidence-card');section.append(el('h2','','Historical offline threshold sweep'),el('p','context-note',data.threshold_source));const select=el('select','threshold-select');select.setAttribute('aria-label','Historical benchmark generator');choose(select,[...new Set(data.thresholds.map(r=>r.generator))].map(x=>[x,names[x]||x]));const chart=el('div');section.append(select,chart);const draw=()=>{const rows=data.thresholds.filter(r=>r.generator===select.value);chart.replaceChildren(plot(rows),table(['Threshold','Scored n','Predicted Real','Predicted Fake'],rows.map(r=>[r.threshold,r.n_scored,r.real,r.fake])));};select.addEventListener('change',draw);draw();target.append(section);for(const c of samples)target.append(historicalCard(c,names[c.generator]+' · Historical prediction'));
  }
  $('detail-status').textContent='Precomputed Demo · original historical samples · no model execution';
 }
 document.body.dataset.ready='true';
}
main().catch(error=>{const n=el('p','status-error','Unavailable · '+error.message);$('main').prepend(n);document.body.dataset.ready='error';});
