/* Nerdeus Meals Label Studio v14.4
   Inline package-form checks: browser-local UX hints, NOT safety approvals.
   Final output still requires the independent LabelPrintLifecycleV14.preflight. */
(function(){
'use strict';
const app=window.__labelStudioTest,M=window.LabelMasterV9,P=window.LabelPackages;
const host=document.getElementById('nlsV14Flow');
if(!app||!M||!host)return;
const state={touched:new Set(),showAll:false,docId:null};
const contentTypes=new Set(['raw_seasoned','raw_marinated','ingredient_combo','raw_meal_kit','dry_baking_mix','seasoning_dry_base']);
const rawTypes=new Set(['raw_plain','raw_seasoned','raw_marinated','raw_meal_kit']);
const measure=/^\s*(?:\d+(?:\.\d+)?|\.\d+)\s*(?:mL|L|g|kg|tsp|tbsp|cups?|fl\s*oz|oz)\s*$/i;
const allowedStorage=new Set(['FROZEN','REFRIGERATED','COOL & DRY','ROOM TEMPERATURE']);
function validDate(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return false;
 const date=new Date(String(value)+'T12:00:00Z');
 return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
function valuesFromForm(){
 const d={...(app.getCurrent()?.data||{})};
 for(const el of host.querySelectorAll('[data-key]'))d['pkg.'+el.dataset.key]=el.value;
 return d;
}
function checkField(key,values=valuesFromForm()){
 const v=k=>String(values['pkg.'+k]??'').trim();
 const type=v('type'),problems=[];
 const mandatory=['food','id','metric','imperial','storage','packaging','actionText'].includes(key)||
   (key==='contents'&&contentTypes.has(type))||
   (M.typeFields?.[type]||[]).some(([k])=>k===key);
 if(mandatory&&!v(key))problems.push('This field is required for the selected label type.');
 if(key==='id'&&v('id')){
  if(!/^[A-Z0-9][A-Z0-9-]{5,19}$/.test(v('id'))||/^(?:DEMO|TEST|SAMPLE|TEMP)[-_]/i.test(v('id')))
   problems.push('Use 6–20 uppercase letters, numbers or hyphens; no demo IDs.');
  const collision=app.getState().templates.some(d=>d.id!==app.getCurrent()?.id&&
   String(d.data?.['pkg.id']||'').trim().toUpperCase()===v('id').toUpperCase());
  if(collision)problems.push('Another saved label already uses this package ID.');
 }
 if((key==='metric'||key==='imperial')&&v('metric')&&v('imperial')){
  try{const err=P?.calculatePair?.(v('metric'),v('imperial'));if(err)problems.push(err);}
  catch(e){problems.push('Cannot compare the two quantities; check their units.');}
 }
 if(key==='storage'&&v(key)&&!allowedStorage.has(v(key)))problems.push('Choose a supported storage condition.');
 if(key==='allergens'&&/\b(?:NONE|NO ALLERGENS|UNKNOWN)\b/i.test(v(key)))
  problems.push('Do not assert allergen-free or unknown; record confirmed allergens or leave this field blank.');
 if(key==='actionText'&&v(key)){
  if(v(key).length>54)problems.push('Heritage footer supports a maximum of 54 characters for this instruction.');
  if(rawTypes.has(type)&&/^(?:COOK|REHEAT)\s+PER\s+(?:VERIFIED\s+)?RECIPE$/i.test(v(key)))
   problems.push('Replace the placeholder with actual verified cooking guidance.');
 }
 if(['waterAddition','oilAddition'].includes(key)&&v(key)){
  if(!measure.test(v(key))||Number.parseFloat(v(key))<=0)
    problems.push('Enter a positive number and a unit, e.g. 300 mL or 1 tbsp.');
 }
 if(['actionText','waterAddition','oilAddition','dilution'].includes(key)){
  const lines=String(M.printableInstruction?.(values)||'').split('\n');
  if(lines.length>2||lines.some(line=>line.length>47))
   problems.push('Printed footer needs at most 2 lines, each no longer than 47 characters.');
 }
 if(['contents','cut','attributes','prepMethod','sourceMeal'].includes(key)){
  const detail=String(M.printDetails?.(values)||'');
  if(detail.length>54)problems.push('Printed descriptor is too long for this layout. Keep full package facts; adjust the print layout or approved summary.');
 }
 const match=/^date([1-4])(Type)?$/.exec(key);
 if(match){
  const n=Number(match[1]),event=v('date'+n+'Type'),date=v('date'+n);
  if(match[2]){
   if(!event&&date)problems.push('Select the event associated with this date.');
   if(event&&!M.dateTypes.includes(event))problems.push('Choose a recognized event type.');
   if(event&&[1,2,3,4].some(k=>k!==n&&v('date'+k+'Type')===event))
    problems.push('This event type already appears in another row.');
  }else{
   if(event&&!date)problems.push('Record the actual date for '+(M.dateNames[event]||event)+'.');
   if(date&&!validDate(date))problems.push('Enter a valid YYYY-MM-DD date.');
   if(event&&date&&validDate(date)){
    const others=[1,2,3,4].filter(k=>k!==n&&v('date'+k+'Type')&&validDate(v('date'+k)));
    if(['use_by','best_quality_by'].includes(event)&&others.some(k=>v('date'+k)>date))
     problems.push('Quality/use-by date cannot precede a recorded processing date.');
    if(event==='packed'&&others.some(k=>['prepared','cooked','seasoned','marinated','assembled','blended'].includes(v('date'+k+'Type'))&&v('date'+k)>date))
     problems.push('The packed date cannot precede that preparation event.');
   }
  }
 }
 return [...new Set(problems)];
}
function dateIssues(values=valuesFromForm()){
 const v=k=>String(values['pkg.'+k]??'').trim();
 const kinds=[1,2,3,4].filter(i=>v('date'+i+'Type')&&validDate(v('date'+i))).map(i=>v('date'+i+'Type'));
 const errors=[];
 const required={
  raw_seasoned:'seasoned',raw_marinated:'marinated',ingredient_prepped:'prepared',
  ingredient_combo:'prepared',raw_meal_kit:'assembled',
  cooked_meal:'cooked',cooked_side:'cooked',cooked_component:'cooked',
  leftovers:'cooked',soup_stew:'cooked',sauce_stock_concentrate:'cooked',
  dry_baking_mix:'blended',seasoning_dry_base:'blended',opened_ready_to_eat:'opened'
 }[v('type')];
 if(required&&!kinds.includes(required))errors.push('Record '+(M.dateNames[required]||required)+' and its actual date.');
 if(!kinds.some(x=>['packed','prepared','seasoned','assembled','marinated','opened','blended'].includes(x)))
  errors.push('Record a packing, preparation, seasoning, blending or opening event.');
 if(!kinds.some(x=>['use_by','best_quality_by'].includes(x)))
  errors.push('Record an explicitly reviewed use-by or best-quality date.');
 return errors;
}
function reset(){
 state.touched.clear();state.showAll=false;state.docId=null;
}
function renderChecks(){
 if(window.NerdeusFlowV14?.getScreen?.()!=='details')return;
 const values=valuesFromForm(),inputs=[...host.querySelectorAll('[data-key]')];
 let errors=0;
 for(const input of inputs){
  const key=input.dataset.key,label=input.closest('label[data-nls-field]'),error=label?.querySelector('.nls14-inline-error');
  if(!label||!error)continue;
  const list=state.showAll||state.touched.has(key)?checkField(key,values):[];
  error.hidden=!list.length;error.textContent=list.join(' ');
  label.dataset.invalid=String(!!list.length);
  input.setAttribute('aria-invalid',String(!!list.length));
  if(list.length)errors++;
 }
 const dates=(state.showAll||[...state.touched].some(k=>k.startsWith('date')))?dateIssues(values):[];
 const dateElement=host.querySelector('#nls14DatesFeedback');
 if(dateElement){dateElement.hidden=!dates.length;dateElement.textContent=dates.join(' ');}
 const summary=host.querySelector('#nls14FieldFeedback');
 if(summary){
  summary.dataset.invalid=String(errors>0||dates.length>0);
  summary.textContent=errors?errors+' field'+(errors===1?' needs':'s need')+' correction. See the messages below each field.':
   state.showAll?'Entered fields look consistent. Final food-safety and print review are still required.':
   'Finish a field to see its validation guidance.';
 }
}
function mount(root=host){
 if(window.NerdeusFlowV14?.getScreen?.()!=='details')return;
 const doc=app.getCurrent();if(!doc)return;
 if(doc.id!==state.docId){state.docId=doc.id;state.touched.clear();state.showAll=false;}
 const progress=root.querySelector('#nls14DetailsProgress');
 if(progress&&!root.querySelector('#nls14FieldFeedback')){
  const notice=document.createElement('p');
  notice.id='nls14FieldFeedback';notice.className='nls14-field-feedback';
  notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
  progress.insertAdjacentElement('afterend',notice);
 }
 for(const el of root.querySelectorAll('[data-key]')){
  const label=el.closest('label');
  if(!label||label.dataset.nlsField==='1')continue;
  label.dataset.nlsField='1';
  const error=document.createElement('small');
  error.className='nls14-inline-error';error.id='nls14-error-'+el.dataset.key;
  error.setAttribute('role','alert');error.hidden=true;
  label.appendChild(error);el.setAttribute('aria-describedby',error.id);
 }
 const events=root.querySelector('.nls14-events');
 if(events&&!root.querySelector('#nls14DatesFeedback')){
  const feedback=document.createElement('p');
  feedback.id='nls14DatesFeedback';feedback.className='nls14-dates-feedback';
  feedback.setAttribute('role','status');feedback.hidden=true;
  events.insertAdjacentElement('afterend',feedback);
 }
 renderChecks();
}
function showAll(){state.showAll=true;renderChecks();}
host.addEventListener('focusout',event=>{
 const field=event.target.closest?.('[data-key]');
 if(field){state.touched.add(field.dataset.key);renderChecks();}
});
host.addEventListener('input',event=>{
 const field=event.target.closest?.('[data-key]');
 if(field&&state.touched.has(field.dataset.key))renderChecks();
});
host.addEventListener('change',event=>{
 const field=event.target.closest?.('[data-key]');
 if(field){state.touched.add(field.dataset.key);renderChecks();}
});
const style=document.createElement('style');
style.textContent='.nls14-field[data-invalid="true"] input,.nls14-field[data-invalid="true"] select,.nls14-field[data-invalid="true"] textarea{border-color:#bd2e2a;outline-offset:2px}.nls14-inline-error{color:#b3261e!important;font-weight:700;font-size:11px!important;line-height:1.4}.nls14-inline-error[hidden]{display:none}.nls14-field-feedback,.nls14-dates-feedback{font-size:11px;line-height:1.55;border:1px solid #b3c6ce;background:rgba(80,135,155,.08);border-radius:7px;padding:9px 11px;margin:9px 0}.nls14-field-feedback[data-invalid="true"],.nls14-dates-feedback{border-color:#d0a5a1;color:#ac2825;background:rgba(195,53,42,.05)}';
document.head.appendChild(style);
window.NerdeusFieldValidation={version:'14.4',mount,reset,showAll,checkField,dateIssues,valuesFromForm};
mount(host);
})();
