/* Nerdeus Meals · BG-101 Heritage Herb Engraving · additive art preset.
   540 × 215 true red/white pixels; no gradient or pre-cut center.
   300-DPI labels are rasterized downstream by LabelCore. */
(function(){
'use strict';
const originals=window.NerdeusBackgroundPresets;
if(!Array.isArray(originals)||originals.length<100)throw Error('BG-101 requires the existing approved collection.');
if(originals.some(a=>a.id==='BG-101'))return;
const W=540,H=215,c=document.createElement('canvas');c.width=W;c.height=H;
const ctx=c.getContext('2d',{willReadFrequently:true});
if(!ctx)throw Error('Canvas required for BG-101');
ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
ctx.strokeStyle='#ff0000';ctx.fillStyle='#ff0000';ctx.lineCap='round';ctx.lineJoin='round';
let seed=1019;
const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const rand=(a,b)=>a+(b-a)*rnd();
function line(a,b,d,e,w=1){ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(a,b);ctx.lineTo(d,e);ctx.stroke();}
function leaf(x,y,ang,len,wide){
 const dx=Math.cos(ang)*len,dy=Math.sin(ang)*len,px=Math.cos(ang+Math.PI/2)*wide,py=Math.sin(ang+Math.PI/2)*wide;
 ctx.lineWidth=.95;ctx.beginPath();ctx.moveTo(x,y);
 ctx.quadraticCurveTo(x+dx*.34+px,y+dy*.34+py,x+dx,y+dy);
 ctx.quadraticCurveTo(x+dx*.34-px,y+dy*.34-py,x,y);ctx.stroke();
 line(x,y,x+dx*.94,y+dy*.94,.55);
}
for(const [y,amp,phase] of [[15,9,0],[51,13,30],[107,11,80],[168,12,145],[204,7,200]]){
 ctx.lineWidth=1.15;ctx.beginPath();ctx.moveTo(-24,y);
 for(let x=-24;x<568;x+=28){
  const yy=y+amp*Math.sin((x+phase)*.022);
  ctx.quadraticCurveTo(x+14,yy+amp*.3,x+28,y+amp*Math.sin((x+28+phase)*.022));
 }ctx.stroke();
}
for(let k=0;k<42;k++){
 const x=rand(-25,562),y=rand(-12,227),ang=rand(-2.7,2.7),len=rand(22,58);
 const ex=x+Math.cos(ang)*len,ey=y+Math.sin(ang)*len,bend=rand(-8,8);
 ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(x,y);
 ctx.quadraticCurveTo(x+(ex-x)*.55-bend,y+(ey-y)*.55+bend,ex,ey);ctx.stroke();
 for(let j=1;j<6;j++){
  const t=j/6,s=(j%2?1:-1);
  leaf(x+(ex-x)*t,y+(ey-y)*t,ang+s*1.12,rand(7,14),rand(2,4.4));
 }
}
for(let k=0;k<95;k++){
 const x=rand(0,W),y=rand(0,H),r=[.7,.9,1.2,1.6,2.2][Math.floor(rand(0,5))];
 ctx.lineWidth=.8;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
}
for(const [x,y,w,h,r,lw] of [[3.5,3.5,533,208,6,1.3],[8.5,8.5,523,198,5,.55]]){
 ctx.lineWidth=lw;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.stroke();
}
const pixels=ctx.getImageData(0,0,W,H);
for(let i=0;i<pixels.data.length;i+=4){
 const red=pixels.data[i+1]<220;
 pixels.data[i]=255;pixels.data[i+1]=red?0:255;
 pixels.data[i+2]=red?0:255;pixels.data[i+3]=255;
}
ctx.putImageData(pixels,0,0);
originals.push({id:'BG-101',number:101,name:'Heritage Herb Engraving',category:'Original Engraving 1',themeId:'heritage-food-art',tags:['heritage','herbs','botanical','engraving','culinary'],source:'original-vector-v12',width:W,height:H,strictColors:['#FF0000','#FFFFFF'],dataUri:c.toDataURL('image/png')});
window.NerdeusBackgroundBuild={...(window.NerdeusBackgroundBuild||{}),count:originals.length};
})();