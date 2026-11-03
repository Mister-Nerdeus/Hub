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
     innerHTML:"",textContent:"",width:591,height:827,clientWidth:591,clientHeight:827,offsetWidth:350,offsetHeight:150,
     classList:{add(){},remove(){},toggle(){},contains(){return false}},options:[],setAttribute(){},getAttribute(){return null},
     appendChild(){},prepend(){},addEventListener(){},removeEventListener(){},querySelector(){return dom("div")},
     querySelectorAll(){return []},getContext(){return ctx},
     getBoundingClientRect(){return{left:0,top:0,right:591,bottom:827,width:591,height:827}},
     scrollIntoView(){},showModal(){},close(){},cloneNode(){return dom("canvas")},
     toDataURL(){return png},setPointerCapture(){},releasePointerCapture(){}};
   return e;
 };
 const doc={head:dom("head"),body:dom("body"),documentElement:dom("html"),activeElement:dom("body"),
   get hidden(){return false},getElementById(k){return this.querySelector("#"+k)},
   querySelector(k){if(!nodes.has(k))nodes.set(k,dom("div"));return nodes.get(k)},
   querySelectorAll(){return[]},createElement(tag){return dom(tag)},addEventListener(){}};
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
   if(f==="backgrounds-approved-v7.js"||f==="cuts-123-extended.js")continue;
   if(f==="master-label-v9.js"){
     if(!run("heritage-art-v12.js",files.art,i-0.1))break;
     if(!run("master",files.master,i))break;
     continue;
   }
   if(f==="heritage-bg-101-v12.js")continue;
   const src=m[1]?files[f]||"":m[2];
   if(!src)continue;
   if(!run(f,src,i))break;
 }
 return {results,logs:logs.slice(-20),ui:!!env.__labelStudioTest,
   templateCount:env.__labelStudioTest?.getState?.().templates?.length||0,
   selected:env.__labelStudioTest?.getState?.().activeId||null,
   status:{templateTitle:nodes.get("#templateTitle")?.textContent,
     templateListLength:nodes.get("#templateChoices")?.innerHTML?.length||0,
     layers:nodes.get("#layerCount")?.textContent,
     inspectorLength:nodes.get("#inspectorBody")?.innerHTML?.length||0}};
}
return bootHarness(files);