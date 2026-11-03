/* Nerdeus Label Studio: mock-document startup regression for browser-facing scripts.
 * Evaluates the same source order as production with a minimal DOM shim.
 * This catches synchronous boot failures, but not real pixel rendering.
 */
function bootHarness(files, opts={}){
 const logs=[],nodes=new Map(),storage=new Map();
 const imageData=(w,h)=>({data:new Uint8ClampedArray(Math.min(2500000,Math.max(1,w*h*4))),width:w,height:h});
 const ctx={font:"18px Arial",getImageData(x,y,w,h){return imageData(w,h)},
   createImageData(w,h){return imageData(w,h)},putImageData(){},measureText(t){return{width:String(t).length*10}},
   save(){},restore(){},beginPath(){},rect(){},roundRect(){},fill(){},stroke(){},clip(){},fillRect(){},clearRect(){},
   strokeRect(){},drawImage(){},arc(){},ellipse(){},moveTo(){},lineTo(){},bezierCurveTo(){},quadraticCurveTo(){},
   translate(){},scale(){},rotate(){},setLineDash(){},fillText(){},createPattern(){return{}},
   createLinearGradient(){return{addColorStop(){}}}
 };
 const png="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ZxKoAAAAASUVORK5CYII=";
 const dom=tag=>{
   const e={tagName:tag.toUpperCase(),style:{},dataset:{},value:"",id:"",checked:false,disabled:false,
     innerHTML:"",textContent:"",parentElement:{appendChild(){}},width:591,height:827,clientWidth:591,clientHeight:827,offsetWidth:350,offsetHeight:150,
     classList:{add(){},remove(){},toggle(){},contains(){return false}},options:[],setAttribute(){},getAttribute(){return null},
     appendChild(){},prepend(){},click(){},focus(){},addEventListener(){},removeEventListener(){},querySelector(){return dom("div")},
     querySelectorAll(){return []},getContext(){return ctx},
     getBoundingClientRect(){return{left:0,top:0,right:591,bottom:827,width:591,height:827}},
     scrollIntoView(){},showModal(){},close(){},cloneNode(){return dom("canvas")},
     toDataURL(){return png},setPointerCapture(){},releasePointerCapture(){}};
   return e;
 };
 const eventNodes=new Map();
 function buttons(query){
   const parts=query==='#templateChoices [data-template]'?['template','#templateChoices'] :
      query==='#backgroundGrid [data-pattern]'?['pattern','#backgroundGrid']:null;
   if(!parts)return[];
   const [attr,id]=parts;
   return [...(nodes.get(id)?.innerHTML||'').matchAll(new RegExp('data-'+attr+'="([^"]+)"','g'))].map(match=>{
     const key=id+'|'+match[1];
     if(!eventNodes.has(key)){
       const b=dom("button");b.dataset[attr]=match[1];b.isConnected=true;eventNodes.set(key,b);
     }
     return eventNodes.get(key);
   });
 }
 const doc={head:dom("head"),body:dom("body"),documentElement:dom("html"),activeElement:dom("body"),
   get hidden(){return false},getElementById(k){return this.querySelector("#"+k)},
   querySelector(k){if(!nodes.has(k))nodes.set(k,dom("div"));return nodes.get(k)},
   querySelectorAll(sel){return buttons(sel)},createElement(tag){return dom(tag)},addEventListener(){}};
 const local={getItem(k){return storage.get(k)||null},setItem(k,v){storage.set(k,v)}};
 const env={window:null,document:doc,console:{log(...x){logs.push("LOG "+x.join(" ").slice(0,150))},
   warn(...x){logs.push("WARN "+x.join(" ").slice(0,150))},error(...x){logs.push("ERROR "+x.join(" ").slice(0,150))}},
   navigator:{},localStorage:local,location:{search:"?template=master-cooked_meal&view=data",
    href:"https://label.invalid/?template=master-cooked_meal&view=data"},
   history:{replaceState(){}},innerWidth:1920,innerHeight:1080,addEventListener(){},removeEventListener(){},
   matchMedia(){return{matches:false}},URLSearchParams:class{
     constructor(str){this.m=new Map((str||"").replace(/^\?/,"").split("&").filter(Boolean).map(x=>x.split("=").map(decodeURIComponent)))}
     get(k){return this.m.get(k)||null}set(k,v){this.m.set(k,String(v))}
   },
   Image:class{constructor(){this.width=540;this.height=215;this.naturalWidth=540;this.naturalHeight=215}
      set src(v){if(this.onload)this.onload()}},Uint8Array,Uint16Array,Uint8ClampedArray,
   Blob:class{constructor(){this.size=100}},URL:class{constructor(v){this.href=v;this.searchParams={get(){return"data"},set(){}}}
      static createObjectURL(){return"blob:test"}static revokeObjectURL(){}},
   setTimeout(){return 1},clearTimeout(){},requestAnimationFrame(){},
   crypto:{randomUUID(){return"stub-uuid-"+String(Math.random()).slice(2)},subtle:{digest:async()=>new Uint8Array(32)}},
   CSS:{escape(x){return x}},atob(){return""},TextEncoder:class{
    encode(t){return new Uint8Array([...unescape(encodeURIComponent(String(t)))].map(c=>c.charCodeAt(0)))}
   },createImageBitmap:async()=>({width:540,height:215,close(){}})
 };
 env.window=env;
 env.NerdeusBackgroundPresets=Array.from({length:101},(_,i)=>({id:"BG-"+String(i+1).padStart(3,"0"),
   name:"BG "+i,category:"Botanical",width:540,height:215,dataUri:png}));
 const scripts=[...files.html.matchAll(/<script(?:[^>]*src="([^"]+)")?[^>]*>([\s\S]*?)<\/script>/g)];
 const results=[];const run=(file,code,index)=>{
   try{new Function("env","with(env){"+code+"\n}")(env);
      results.push({index,file,status:"ok",master:!!env.LabelMasterV9,ui:!!env.__labelStudioTest});return true}
   catch(e){results.push({index,file,status:"error",message:String(e),stack:e.stack?.slice(0,800)});return false}
 };
 for(const [i,m] of scripts.entries()){
   const f=m[1]?m[1].split("/").at(-1):"inline";
   if(f==="backgrounds-approved-v7.js")continue;
   if(f==="master-label-v9.js"){
     if(!run("heritage-art-v12.js",files.art,i-0.1))break;
     if(!run("master",files.master,i))break;
     if(files.seedLegacyMaster){
       const legacy=env.LabelMasterV9.make(env.LabelMasterV9.byId.get('cooked_meal'));
       legacy.data['pkg.layoutStyle']='standard-v9';
       legacy.data['pkg.food']='Saved Family Lasagna';
       legacy.data['pkg.recipeRef']='MY-ORIGINAL-RECIPE';
       legacy.elements=legacy.elements.filter(e=>e.name!=='Heritage second header');
       storage.set('nerdeus-label-studio-v2',JSON.stringify({
        templates:[legacy],activeId:'master-cooked_meal'}));
     }
     continue;
   }
   if(f==="heritage-bg-101-v12.js")continue;
   const src=m[1]?files[f]||"":m[2];
   if(!src)continue;
   if(!run(f,src,i))break;
 }
 const selection={
  cutArtCount:env.LabelCuts?.catalog?.length||0,
  cutStarterCount:env.LabelCuts?.initialTemplates?.().length||0,
  templateButtons:buttons('#templateChoices [data-template]').length,
  backgroundButtons:buttons('#backgroundGrid [data-pattern]').length,
  started:!!env.__labelStudioTest
 };
 if(env.__labelStudioTest){
   const app=env.__labelStudioTest;
   selection.before=app.getState().activeId;
   const selectTemplate=buttons('#templateChoices [data-template]').find(b=>b.dataset.template==='master-raw_plain');
   selection.templateHasClickHandler=typeof selectTemplate?.onclick==='function';
   if(selectTemplate?.onclick)selectTemplate.onclick();
   selection.afterTemplate=app.getState().activeId;
   const selectBg=buttons('#backgroundGrid [data-pattern]').find(b=>b.dataset.pattern==='BG-013');
   selection.backgroundHasClickHandler=typeof selectBg?.onclick==='function';
   if(selectBg?.onclick)selectBg.onclick();
   selection.afterBackground=app.getCurrent().elements.find(e=>e.type==='background')?.assetId||null;
   const candidate=env.LabelCuts?.catalog?.find(x=>x.source==='nerdeus.123cuts.2026-11-01');
   try{
     const doc=env.LabelCuts.makeTemplate(candidate);
     selection.newCutTemplateCreated=!!doc;
     selection.newCutBackground=doc?.elements?.find(e=>e.type==='background')?.assetId||null;
     selection.newCutCookNote=doc?.data?.['cut.cookTarget'];
   }catch(e){selection.newCutError=String(e)}
 }
 const templates=env.__labelStudioTest?.getState?.().templates||[];
 const restored=templates.find(x=>x.id==='master-cooked_meal');
 const archived=templates.filter(x=>x.data?.['pkg.recordRole']==='legacy');
 const backup=storage.get('nerdeus-label-studio-v2');
 const migration={currentLayout:restored?.data?.['pkg.layoutStyle'],
   currentHasSplitHeader:restored?.elements?.some(e=>e.name==='Heritage second header')||false,
   archivedCount:archived.length,
   archivedFoods:archived.map(x=>x.data?.['pkg.food']),
   archivedRecipeRefs:archived.map(x=>x.data?.['pkg.recipeRef']),
   backupPersisted:!!backup&&backup.includes('Saved Family Lasagna'),
   currentBackground:restored?.elements?.find(e=>e.type==='background')?.assetId,
   onScreenVersion:nodes.get('#nlsBootStatus')?.textContent||'',
   backgroundDisplay:nodes.get('#nlsSelectedBackground')?.textContent||''};
 return {migration,selection,results,logs:logs.slice(-20),ui:!!env.__labelStudioTest,
   templateCount:env.__labelStudioTest?.getState?.().templates?.length||0,
   selected:env.__labelStudioTest?.getState?.().activeId||null,
   status:{templateTitle:nodes.get("#templateTitle")?.textContent,
     templateListLength:nodes.get("#templateChoices")?.innerHTML?.length||0,
     layers:nodes.get("#layerCount")?.textContent,
     inspectorLength:nodes.get("#inspectorBody")?.innerHTML?.length||0}};
}
return bootHarness(files);