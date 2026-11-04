/* Nerdeus reference-sheet QA fixtures v16.7.
   Synthetic demonstration data, never saved to actual packages, shelf-life, inventory or print snapshots. */
(function(){
'use strict';
const ORDER=['raw_plain','raw_seasoned','raw_marinated','raw_meal_kit','cooked_meal','cooked_side','ingredient_single','ingredient_prepped','ingredient_combo','sauce_stock_concentrate','dry_baking_mix','seasoning_dry_base','cooked_component','leftovers','soup_stew','pantry_ingredient','opened_ready_to_eat'];
const fixtures={
 raw_plain:{food:'Ribeye Steak',protein:'Beef',cut:'1 steak',attributes:'Boneless',contents:'',metric:'450 g',imperial:'15.9 oz',storage:'FROZEN',packaging:'VACUUM BAG',proofIcon:'cattle',proofStatus:'BEEF · RAW · FROZEN',actionText:'COOK TO 145°F / 63°C\nREST 3 MIN'},
 raw_seasoned:{food:'Garlic Herb Chicken',protein:'Chicken',contents:'Garlic · herbs · sea salt',metric:'500 g',imperial:'17.6 oz',storage:'FROZEN',packaging:'VACUUM BAG',proofIcon:'chicken',proofStatus:'RAW · DRY SEASONED · FROZEN',actionText:'COOK TO · INTERNAL\n165°F / 74°C'},
 raw_marinated:{food:'Teriyaki Pork Chops',protein:'Pork',contents:'Soy · ginger · garlic',allergens:'WHEAT, SOY',metric:'550 g',imperial:'19.4 oz',storage:'FROZEN',packaging:'VACUUM BAG',proofIcon:'pig',proofStatus:'RAW · MARINATED · FROZEN',actionText:'COOK TO 145°F / 63°C\nREST 3 MIN'},
 raw_meal_kit:{food:'Chicken Fajita Kit',contents:'Chicken · peppers · onion',metric:'800 g',imperial:'28.2 oz',storage:'FROZEN',packaging:'VACUUM BAG',proofIcon:'meal',proofStatus:'RAW · ASSEMBLED · FROZEN',actionText:'COOK TO · INTERNAL\n165°F / 74°C'},
 cooked_meal:{food:'Beef Lasagna',contents:'Beef · pasta · tomato · cheese',allergens:'WHEAT, MILK, EGG',metric:'700 g',imperial:'24.7 oz',storage:'FROZEN',packaging:'SEALED TRAY',proofIcon:'lasagna',proofStatus:'COOKED · FROZEN',actionText:'REHEAT · INTERNAL\n165°F / 74°C'},
 cooked_side:{food:'Mashed Potatoes',contents:'Potato · butter · milk',allergens:'MILK',metric:'400 g',imperial:'14.1 oz',storage:'FROZEN',packaging:'SEALED TUB',proofIcon:'bowl',proofStatus:'COOKED · FROZEN',actionText:'REHEAT · INTERNAL\n165°F / 74°C'},
 ingredient_single:{food:'Broccoli Florets',contents:'Trimmed · blanched · drained',prepMethod:'Blanched',metric:'300 g',imperial:'10.6 oz',storage:'FROZEN',packaging:'VACUUM BAG',proofIcon:'broccoli',proofStatus:'BLANCHED · FROZEN',actionText:'BEST QUALITY BY\nMM/DD/YY',art:'broccoli'},
 ingredient_prepped:{food:'Diced Yellow Onion',contents:'Peeled · 6 mm dice',prepMethod:'Diced',metric:'250 g',imperial:'8.8 oz',storage:'FROZEN',packaging:'VACUUM BAG',proofIcon:'onion',proofStatus:'RAW · FROZEN',actionText:'BEST QUALITY BY\nMM/DD/YY'},
 ingredient_combo:{food:'Sliced Peppers',contents:'Sweet peppers · strips',prepMethod:'Sliced',metric:'300 g',imperial:'10.6 oz',storage:'FROZEN',packaging:'VACUUM BAG',proofIcon:'pepper',proofStatus:'RAW · FROZEN',actionText:'BEST QUALITY BY\nMM/DD/YY',art:'peppers'},
 sauce_stock_concentrate:{food:'Chicken Stock Concentrate',contents:'Reduced chicken stock',metric:'250 mL',imperial:'8.5 US fl oz',storage:'FROZEN',packaging:'SEALED TUB',proofIcon:'stock',proofStatus:'COOKED · FROZEN',actionText:'REHEAT / BRING TO A BOIL'},
 dry_baking_mix:{food:'White Bread Mix',contents:'Flour · dairy powders · yeast',allergens:'WHEAT, MILK',metric:'500 g',imperial:'17.6 oz',storage:'COOL & DRY',packaging:'VACUUM BAG',proofIcon:'bread',proofStatus:'DRY MIX · YEAST INCLUDED',actionText:'BEST QUALITY BY\nMM/DD/YY'},
 seasoning_dry_base:{food:'Taco Seasoning',contents:'Chile · cumin · garlic · salt',metric:'60 g',imperial:'2.1 oz',storage:'COOL & DRY',packaging:'SEALED PACKET',proofIcon:'spice',proofStatus:'DRY BLEND',actionText:'BEST QUALITY BY\nMM/DD/YY'}
};
function ellipse(ctx,x,y,rx,ry){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.stroke();}
function engraving(which){
 const c=document.createElement('canvas');c.width=540;c.height=215;
 const g=c.getContext('2d',{willReadFrequently:true});g.clearRect(0,0,540,215);g.strokeStyle='#000';g.lineJoin='round';g.lineCap='round';
 let seed=1776;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 if(which==='broccoli'){
  for(let i=0;i<4;i++){
   const x=160+i*78+(i%2)*14,y=139+(i%3)*6;
   g.lineWidth=3;g.beginPath();g.moveTo(x-14,y+38);g.lineTo(x+15,y+38);g.lineTo(x+24,y+4);g.lineTo(x-22,y+4);g.closePath();g.stroke();
   for(const [dx,dy,r] of [[-24,-27,21],[-4,-40,23],[24,-33,22],[-34,-10,20],[30,-12,20],[2,-12,27]]){
    g.lineWidth=2;g.beginPath();g.arc(x+dx,y+dy,r,0,Math.PI*2);g.stroke();
    for(let k=0;k<15;k++){let a=rnd()*Math.PI*2,rr=(.35+rnd()*.6)*r;g.fillStyle='#000';g.beginPath();g.arc(x+dx+rr*Math.cos(a),y+dy+rr*Math.sin(a),.7+rnd()*.8,0,Math.PI*2);g.fill();}
   }
   g.lineWidth=1;for(let k=0;k<9;k++){const xx=x-9+k*2.5;g.beginPath();g.moveTo(xx,y+8);g.lineTo(xx-2,y+34);g.stroke();}
  }
 }else if(which==='peppers'){
  for(let i=0;i<17;i++){
   const x=125+(i%6)*49+rnd()*12,y=90+Math.floor(i/6)*26,turn=(i%2?-1:1)*(.4+rnd()*.5);
   g.save();g.translate(x,y);g.rotate(turn);
   g.lineWidth=3;g.beginPath();g.moveTo(-22,13);g.bezierCurveTo(-29,-9,3,-38,30,-11);g.bezierCurveTo(37,10,11,34,-22,13);g.stroke();
   g.lineWidth=1.3;g.beginPath();g.moveTo(-19,9);g.quadraticCurveTo(1,-25,26,-8);g.stroke();
   for(let k=0;k<8;k++){g.fillStyle='#000';g.fillRect(-12+k*4,4+Math.sin(k)*3,1,1);}
   g.restore();
  }
 }
 const p=g.getImageData(0,0,540,215),v=p.data;
 for(let i=0;i<v.length;i+=4){const black=v[i+3]>50&&v[i]<180;v[i]=v[i+1]=v[i+2]=0;v[i+3]=black?255:0;}
 g.putImageData(p,0,0);return c.toDataURL('image/png');
}
function prepare(doc,id){
 if(doc?.data?.['pkg.recordRole']!=='example')return doc;
 const fix=fixtures[id];if(!fix)return doc;
 for(const [k,v] of Object.entries(fix))if(k!=='art')doc.data['pkg.'+k]=String(v);
 if(fix.art){
  const key='reference-demo-'+fix.art,dataUri=engraving(fix.art);
  doc.assets=doc.assets||{};doc.assets[key]={id:key,name:'Synthetic '+fix.art+' engraving',width:540,height:215,origin:'demo-only-v16.7',dataUri};
  const art=doc.elements.find(e=>e.name==='Hero food illustration');
  if(art)art.assetId=key;
  doc.data['pkg.artStatus']='candidate';doc.data['pkg.artworkReviewed']='0';
 }
 if(['ingredient_single','ingredient_prepped','ingredient_combo'].includes(id)){
  doc.data['pkg.date1Type']='prepared';
 }
 return doc;
}
function finalize(doc){
 if(doc?.data?.['pkg.recordRole']!=='example')return doc;
 const id=doc.data['pkg.type'],fix=fixtures[id];if(!fix)return doc;
 // A blank quality date stays unassigned in package data; render MM/DD/YY only as a proof placeholder.
 for(let n=1;n<=4;n++)if(['best_quality_by','use_by'].includes(doc.data['pkg.date'+n+'Type'])){
  doc.data['pkg.date'+n]='';
  doc.data['pkg.date'+n+'Display']='MM/DD/YY';
  doc.data['pkg.date'+n+'Label']='QUALITY BY';
 }
 if(['ingredient_single','ingredient_prepped','ingredient_combo','dry_baking_mix','seasoning_dry_base'].includes(id))
   doc.data['pkg.referenceFooter']=fix.actionText;
 return doc;
}
window.NerdeusReferenceFixturesV167={version:'16.7',order:ORDER,fixtures,prepare,finalize};
})();