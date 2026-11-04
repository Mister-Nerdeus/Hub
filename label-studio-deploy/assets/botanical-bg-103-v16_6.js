/* Original Nerdeus red-only food botanical engraving · BG-103
   Symmetrical culinary herb corners with generous white central food field.
   Native 540×215 raster. Every final pixel is pure #FF0000 or #FFFFFF. */
(function(){
'use strict';
const presets=window.NerdeusBackgroundPresets;
if(!Array.isArray(presets)||presets.some(a=>a.id==='BG-103'))return;
const W=540,H=215,c=document.createElement('canvas');
c.width=W;c.height=H;
const g=c.getContext('2d',{willReadFrequently:true});
if(!g)throw Error('BG-103 canvas unavailable');
g.fillStyle='#fff';g.fillRect(0,0,W,H);
g.fillStyle='#f00';g.strokeStyle='#f00';g.lineCap='round';g.lineJoin='round';
function vine(x1,y1,c1x,c1y,c2x,c2y,x2,y2,width){
 g.beginPath();g.lineWidth=width;g.moveTo(x1,y1);g.bezierCurveTo(c1x,c1y,c2x,c2y,x2,y2);g.stroke();
}
function leaf(x,y,angle,length,wide,veins){
 g.save();g.translate(x,y);g.rotate(angle);
 g.beginPath();g.moveTo(0,0);g.bezierCurveTo(length*.33,-wide,length*.7,-wide*.7,length,0);
 g.bezierCurveTo(length*.63,wide*.6,length*.26,wide*.77,0,0);
 g.closePath();g.fill();
 if(veins){g.strokeStyle='#fff';g.lineWidth=.68;g.beginPath();g.moveTo(1,0);g.lineTo(length*.88,0);g.stroke();g.strokeStyle='#f00';}
 g.restore();
}
function herb(ox,oy,scale,turn){
 g.save();g.translate(ox,oy);g.scale(scale,scale);g.rotate(turn);
 vine(0,0,17,-18,7,-58,27,-97,1.8);
 for(let i=0;i<8;i++){
  const t=(i+1)/9, y=-t*92, x=3+10*t+7*Math.sin(t*3.2);
  const l=13+(1-t)*7;
  vine(x,y,x-9,y-10,x-17,y-14,x-21,y-25,1);
  vine(x,y,x+7,y-12,x+13,y-18,x+18,y-27,1);
  leaf(x-14,y-14,-2.42,l,4.2,i%3===0);
  leaf(x+14,y-16,-.72,l,4.2,i%4===0);
 }
 leaf(27,-97,-1.05,22,6,true);
 g.restore();
}
function rosemary(ox,oy,scale,rotation){
 g.save();g.translate(ox,oy);g.scale(scale,scale);g.rotate(rotation);
 vine(0,0,4,-35,22,-76,25,-124,1.8);
 for(let i=0;i<14;i++){
  const t=(i+1)/15,x=18*t+4*t*t,y=-118*t,s=i%2?-1:1;
  const angle=s<0?-2.45:-.68;
  leaf(x+s*2,y,angle,10.2+(1-t)*8,2.4,false);
 }
 g.restore();
}
function flourish(ox,oy){
 g.save();g.translate(ox,oy);
 vine(0,0,30,4,48,-17,64,-29,1.6);
 vine(4,-1,30,-27,43,-36,65,-55,1.1);
 g.beginPath();g.lineWidth=1.1;g.arc(67,-29,5,-Math.PI*.5,Math.PI*.55);g.stroke();
 leaf(29,-10,-.82,16,5.4,true);leaf(45,-29,-.7,16,5.1,true);
 leaf(18,-21,-2.2,15,4.8,false);
 for(let j=0;j<5;j++){g.beginPath();g.arc(9+j*11,-15-j*7,1.3,0,Math.PI*2);g.fill();}
 g.restore();
}
function bunch(side){
 g.save();if(side){g.translate(W,0);g.scale(-1,1);}
 // Close-spaced stems form elegant botanical corners, not a repeated grid.
 herb(-19,213,1.52,.14);
 herb(9,224,1.2,-.1);
 rosemary(30,225,1.03,-.1);
 herb(-25,170,.83,-.05);
 herb(-14,112,.55,.23);
 rosemary(5,126,.57,-.2);
 flourish(-8,65);
 flourish(-18,29);
 vine(7,210,24,188,48,178,74,154,1.25);
 for(let j=0;j<5;j++)leaf(22+j*11,195-j*7,-.52,13,3.5,j===2);
 // Some red food-engraving details at the bottom, but never over the hero image.
 for(let i=0;i<9;i++){const x=7+(i%3)*9,y=189+Math.floor(i/3)*8;
  g.beginPath();g.arc(x,y,1.05,0,Math.PI*2);g.fill();}
 g.restore();
}
bunch(false);bunch(true);
// Quantize both the red botanical marks and the white field to exact 1-bit planes.
const p=g.getImageData(0,0,W,H),d=p.data;
for(let i=0;i<d.length;i+=4){const red=d[i+1]<190;d[i]=255;d[i+1]=red?0:255;d[i+2]=red?0:255;d[i+3]=255;}
g.putImageData(p,0,0);
presets.push({id:'BG-103',number:103,name:'Heritage Culinary Herb Corners',category:'Reference Florals',themeId:'engraved-culinary-herbs-v16.6',tags:['reference','food','rosemary','thyme','ornamental','red-white'],source:'original-canvas-v16.6',width:W,height:H,strictColors:['#FF0000','#FFFFFF'],dataUri:c.toDataURL('image/png')});
})();