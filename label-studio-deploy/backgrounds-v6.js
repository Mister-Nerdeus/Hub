/* Nerdeus Meals · Culinary backgrounds v6: original programmatic artwork, 100 distinct IDs. */
(function(){
'use strict';
const W=540,H=215,R='#ff0000',B='#ffffff';
const specs=[
['Comfort Kitchen',[
['Sunday supper','pot','spoon'],["Grandma's apron",'apron','mitt'],['Hearthside bowls','bowl','spoon'],['Cozy casserole','casserole','herb'],['Family table','plate','cutlery'],['Warm oven','oven','bread'],['Kitchen memories','mitt','whisk'],['Supper club','skillet','fork'],['Home cooking','rollingpin','pot'],['Gather around','teapot','mug']]],
['Herb Garden',[
['Rosemary sprigs','rosemary','herb'],['Basil harvest','basil','sprig'],['Thyme trails','thyme','sprig'],['Sage leaves','sage','herb'],['Parsley bouquet','parsley','sprig'],['Dill meadow','dill','herb'],['Bay leaf garland','bay','sprig'],['Mint leaves','mint','sprig'],['Oregano harvest','oregano','sprig'],['Garden herbs','herb','rosemary']]],
['Fresh Produce',[
['Tomato harvest','tomato','leaf'],['Market peppers','pepper','tomato'],['Carrot patch','carrot','leaf'],['Onion strings','onion','garlic'],['Garden garlic','garlic','herb'],['Sweet corn','corn','leaf'],['Summer squash','zucchini','tomato'],['Farm broccoli','broccoli','carrot'],['Green peas','peas','leaf'],['Autumn pumpkins','pumpkin','leaf']]],
["Baker's Pantry",[
['Artisan loaf','bread','wheat'],['Croissant morning','croissant','mug'],['Golden baguette','baguette','wheat'],['Rolling pin craft','rollingpin','wheat'],['Whisk and batter','whisk','bowl'],['Pie day','pie','rollingpin'],['Wheat sheaves','wheat','bread'],['Flour sack','floursack','wheat'],['Muffin kitchen','muffin','whisk'],['Rustic bread board','bread','cuttingboard']]],
['Pasta & Grains',[
['Spaghetti supper','spaghetti','fork'],['Penne pasta','penne','tomato'],['Fusilli twist','fusilli','herb'],['Bow tie pasta','farfalle','herb'],['Rigatoni night','rigatoni','tomato'],['Ravioli squares','ravioli','fork'],['Lasagna layers','lasagna','tomato'],['Rice bowl','rice','bowl'],['Barley harvest','wheat','rice'],['Noodle kitchen','noodles','bowl']]],
['Spice Market',[
['Cinnamon sticks','cinnamon','mug'],['Star anise pods','anise','spicejar'],['Peppercorn market','peppercorn','spicejar'],['Whole cloves','clove','spicejar'],['Chili strings','chili','herb'],['Paprika spoon','spoon','pepper'],['Cumin seeds','cumin','spicejar'],['Pepper mill','mill','peppercorn'],['Salt cellar','salt','spoon'],['Seasoning shelf','spicejar','herb']]],
['Country Table',[
['Farmhouse linen','cloth','spoon'],['Wooden spoons','spoon','fork'],['Market basket','basket','apple'],['Mason pantry','jar','herb'],['Egg collection','eggs','basket'],['Country farmhouse','barn','wheat'],['Harvest wagon','basket','pumpkin'],['Apple orchard','apple','leaf'],['Rustic tableware','plate','spoon'],['Sunday picnic','cloth','basket']]],
['Soup & Supper',[
['Steaming soup','bowl','spoon'],['Beef stew pot','pot','carrot'],['Stockpot kitchen','stockpot','herb'],['Ladle and broth','ladle','bowl'],['Onion soup','onion','bowl'],['Creamy chowder','bowl','corn'],['Chili night','chili','pot'],['Ramen bowl','noodles','bowl'],['Comfort broth','teapot','bowl'],['Casserole supper','casserole','spoon']]],
['Fruit & Citrus',[
['Lemon grove','lemon','leaf'],['Orange orchard','orange','leaf'],['Berry basket','berries','basket'],['Apple season','apple','leaf'],['Peach kitchen','peach','leaf'],['Summer cherries','cherries','leaf'],['Lime and mint','lime','mint'],['Strawberry patch','strawberry','leaf'],['Pear orchard','pear','leaf'],['Grape harvest','grapes','leaf']]],
['Coffee & Cocoa',[
['Coffee beans','beans','mug'],['Cocoa hearts','chocolate','mug'],['Cafe morning','mug','croissant'],['Warm teapot','teapot','cup'],['Cookie afternoon','cookie','mug'],['Chocolate curls','chocolate','spoon'],['Espresso kitchen','espresso','beans'],['Tea biscuits','cup','cookie'],['Cocoa mug','mug','chocolate'],['Morning pastry','muffin','mug']]]
];
function drawSymbol(ctx,what,x,y,size,turn=0){
ctx.save();ctx.translate(x,y);ctx.rotate(turn);ctx.scale(size/60,size/60);ctx.strokeStyle=R;ctx.fillStyle=R;ctx.lineWidth=2.7;ctx.lineCap='round';ctx.lineJoin='round';
const p=(pts,close=false)=>{ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));if(close)ctx.closePath();ctx.stroke();};
const ell=(x,y,rx,ry,a=0)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,a,0,Math.PI*2);ctx.stroke();};
const curve=(a,b,c,d,e,f,g,h)=>{ctx.beginPath();ctx.moveTo(a,b);ctx.bezierCurveTo(c,d,e,f,g,h);ctx.stroke();};
const rect=(x,y,w,h)=>ctx.strokeRect(x,y,w,h);
const sprig=()=>{p([[0,28],[0,-26]]);for(let k=0;k<5;k++){const v=-22+k*10;curve(0,v+6,-9,v-5,-19,v-6,-19,v-13);curve(0,v+6,9,v-5,19,v-6,19,v-13);}};
const fruit=()=>{ell(0,2,23,23);p([[0,-20],[4,-30]]);ell(13,-25,11,5,-.4);};
switch(what){
case 'sprig':case 'herb':case 'rosemary':case 'thyme':case 'sage':case 'basil':case 'parsley':case 'dill':case 'bay':case 'mint':case 'oregano':{
 p([[0,29],[0,-29]]);const count=what==='dill'?7:5;
 for(let k=0;k<count;k++){let v=-23+k*(46/(count-1));for(let d of [-1,1]){
 ctx.beginPath();ctx.moveTo(0,v+8);ctx.quadraticCurveTo(d*(what==='basil'?28:19),v-13,d*(what==='dill'?9:21),v-12);
 ctx.quadraticCurveTo(d*9,v-14,0,v+8);ctx.stroke();}}
 break;}
case 'leaf':{p([[-25,20],[-7,-14],[28,-24],[13,13],[-25,20]],true);p([[-25,20],[24,-19]]);break;}
case 'tomato':{ell(0,2,26,23);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;p([[0,-18],[Math.sin(a)*12,-18+Math.cos(a)*8]]);}p([[0,-18],[4,-29]]);break;}
case 'pepper':case 'chili':{curve(-10,-22,-40,-13,-22,28,0,28);curve(0,28,28,7,25,-16,5,-25);p([[3,-24],[10,-31]]);break;}
case 'onion':{curve(0,-29,-35,-8,-27,25,0,27);curve(0,27,27,25,35,-8,0,-29);p([[-14,-30],[-4,-22],[3,-33]]);p([[0,-23],[0,21]]);break;}
case 'garlic':{for(let k=-2;k<=2;k++){curve(0,-27,-5+k*9,-10,k*12,18,k*8,25);}p([[-23,25],[23,25]]);break;}
case 'carrot':{p([[-16,-18],[16,-15],[0,30]],true);p([[0,-17],[-15,-32]]);p([[0,-17],[0,-33]]);p([[0,-17],[16,-30]]);p([[-8,0],[7,4]]);p([[-5,12],[4,15]]);break;}
case 'corn':{ell(0,5,15,27);for(let i=-10;i<=10;i+=10)for(let j=-16;j<=20;j+=10)ell(i,j+4,3.5,4);p([[-16,-23],[-22,28],[-4,15]]);p([[16,-23],[22,28],[4,15]]);break;}
case 'zucchini':{ell(0,2,13,27,.25);p([[0,-23],[7,-33]]);p([[-4,-18],[6,20]]);break;}
case 'broccoli':{p([[-5,28],[-6,8],[-26,0],[-17,-17],[-5,-21],[5,-28],[21,-18],[29,-4],[13,7],[5,28]],true);p([[0,27],[0,1]]);break;}
case 'peas':{curve(-27,4,-12,-27,12,-29,27,0);curve(-27,4,-10,30,12,29,27,0);for(let i=-15;i<=15;i+=10)ell(i,2,4,4);break;}
case 'pumpkin':{ell(0,5,25,23);ell(0,5,12,23);p([[0,-18],[1,-31],[9,-32]]);break;}
case 'bread':{curve(-27,23,-33,-24,-18,-25,0,-24);curve(0,-24,20,-29,34,-10,26,23);p([[-27,23],[26,23]]);p([[-13,-11],[-4,-3]]);p([[7,-14],[16,-6]]);break;}
case 'baguette':{ctx.rotate(-.5);ell(0,0,15,31);p([[-11,-16],[11,-8]]);p([[-11,0],[11,8]]);p([[-11,16],[10,22]]);break;}
case 'croissant':{curve(-28,16,-34,-21,-13,-30,0,-12);curve(0,-12,14,-31,34,-18,28,15);curve(28,15,9,24,-9,26,-28,16);p([[-17,-11],[-12,19]]);p([[14,-12],[11,21]]);break;}
case 'rollingpin':{ctx.rotate(-.4);rect(-18,-12,36,24);p([[-32,0],[-18,0]]);p([[18,0],[32,0]]);break;}
case 'whisk':{p([[0,30],[0,-2]]);for(let k=-2;k<=2;k++){curve(0,-2,k*12,-11,k*10,-35,0,-29);}break;}
case 'wheat':{p([[0,30],[0,-30]]);for(let k=0;k<6;k++)for(let d of [-1,1])ell(d*8,-25+k*9,6,3,d*.5);break;}
case 'floursack':{p([[-23,-23],[23,-23],[19,27],[-19,27]],true);p([[-20,-24],[-7,-29],[8,-29],[22,-24]]);p([[-13,5],[13,5]]);break;}
case 'pie':{p([[-27,4],[27,4],[20,22],[-20,22]],true);curve(-28,3,-24,-19,24,-19,28,3);for(let i=-16;i<=16;i+=8)p([[i,-10],[i+4,0]]);break;}
case 'muffin':{p([[-24,-6],[24,-6],[16,25],[-16,25]],true);curve(-25,-6,-34,-31,-8,-33,0,-23);curve(0,-23,16,-34,36,-23,25,-6);break;}
case 'spaghetti':case 'noodles':{p([[-27,-20],[27,-20],[17,24],[-17,24]],true);for(let i=-20;i<=20;i+=10)curve(i,-19,i-10,-31,i+12,-33,i,-3);break;}
case 'penne':case 'rigatoni':case 'lasagna':{for(let i=-1;i<=1;i++){ctx.save();ctx.translate(i*18,i%2?3:0);p([[-8,-24],[8,-19],[8,23],[-8,18]],true);p([[-8,-24],[8,-19]]);ctx.restore();}break;}
case 'fusilli':{for(let k=-25;k<25;k+=12)curve(-12,k,16,k-9,16,k+13,-12,k+10);break;}
case 'farfalle':{p([[-27,-19],[-6,-9],[0,-4],[6,-9],[27,-19],[27,19],[6,9],[0,4],[-6,9],[-27,19]],true);p([[-5,-10],[5,10]]);break;}
case 'ravioli':{rect(-22,-22,44,44);rect(-14,-14,28,28);for(let i=-15;i<=15;i+=10){p([[i,-25],[i,-20]]);p([[i,20],[i,25]]);p([[-25,i],[-20,i]]);p([[20,i],[25,i]]);}break;}
case 'rice':{ell(0,7,27,18);for(let i=-20;i<=20;i+=10)for(let j=-8;j<=15;j+=10)ell(i,j,5,2.5,.5);break;}
case 'cinnamon':{for(let i=-1;i<=1;i++){ctx.save();ctx.translate(i*13,0);ctx.rotate(.3);rect(-5,-25,10,50);ell(0,-25,5,3);ctx.restore();}break;}
case 'anise':{for(let i=0;i<7;i++){ctx.save();ctx.rotate(i*Math.PI*2/7);p([[0,0],[-5,-20],[0,-29],[5,-20]],true);ctx.restore();}break;}
case 'peppercorn':case 'cumin':{for(let i=0;i<14;i++){const a=i*2.4,d=7+Math.sqrt(i)*6;ell(Math.cos(a)*d,Math.sin(a)*d,what==='cumin'?2:4,what==='cumin'?5:4,.4);}break;}
case 'clove':{for(let i=-1;i<=1;i++){ctx.save();ctx.translate(i*16,0);p([[0,-20],[0,24]]);ell(0,-21,6,5);ctx.restore();}break;}
case 'spicejar':case 'jar':case 'salt':{rect(-21,-20,42,48);rect(-24,-28,48,9);rect(-15,-5,30,17);p([[-12,5],[12,5]]);break;}
case 'mill':{p([[-18,-12],[18,-12],[14,27],[-14,27]],true);ell(0,-18,19,8);p([[0,-25],[0,-32]]);break;}
case 'cloth':{rect(-29,-24,58,48);for(let i=-20;i<=20;i+=10){p([[i,-24],[i,24]]);p([[-29,i],[29,i]]);}break;}
case 'basket':{p([[-28,-7],[-22,26],[22,26],[28,-7]],true);curve(-20,-6,-17,-29,18,-29,20,-6);for(let i=-15;i<=15;i+=10)p([[i,-7],[i*0.7,26]]);p([[-25,9],[25,9]]);break;}
case 'eggs':{for(let i=-1;i<=1;i++)ell(i*17,4,10,15,-.1);break;}
case 'barn':{p([[-28,28],[-28,-6],[0,-30],[28,-6],[28,28]],true);p([[-28,-6],[28,-6]]);rect(-10,1,20,27);p([[-10,1],[10,28]]);break;}
case 'plate':{ell(0,0,27,27);ell(0,0,18,18);break;}
case 'cutlery':{p([[-19,-30],[-19,27]]);p([[-28,-30],[-28,-11],[-10,-11],[-10,-30]]);p([[16,-30],[13,-8],[13,28]]);break;}
case 'skillet':{ell(-6,4,22,17);p([[15,-7],[32,-16]]);p([[15,-1],[34,-10]]);break;}
case 'pot':case 'stockpot':{rect(-25,-12,50,37);p([[-30,-24],[30,-24]]);p([[0,-24],[0,-31]]);p([[-25,-1],[-34,-1],[-34,12],[-25,12]]);p([[25,-1],[34,-1],[34,12],[25,12]]);break;}
case 'casserole':{p([[-28,1],[28,1],[23,23],[-23,23]],true);p([[-32,1],[32,1]]);curve(-19,-3,-14,-21,5,-15,9,-26);break;}
case 'bowl':{ell(0,-2,28,9);curve(-28,-2,-25,35,25,35,28,-2);p([[-25,23],[25,23]]);break;}
case 'ladle':{p([[-14,-30],[13,-6],[15,8]]);ell(15,16,10,8);break;}
case 'spoon':{p([[0,28],[0,-1]]);ell(0,-17,10,15);break;}
case 'fork':{p([[0,28],[0,-8]]);p([[-12,-30],[-12,-13],[12,-13],[12,-30]]);p([[0,-30],[0,-13]]);break;}
case 'oven':{rect(-28,-25,56,51);rect(-20,-9,40,27);p([[-28,-14],[28,-14]]);ell(-17,-20,2,2);ell(-4,-20,2,2);ell(9,-20,2,2);break;}
case 'apron':{p([[-13,-28],[13,-28],[20,-1],[24,29],[-24,29],[-20,-1]],true);p([[-13,-28],[0,-10],[13,-28]]);p([[-20,0],[-31,-9]]);p([[20,0],[31,-9]]);rect(-10,9,20,11);break;}
case 'mitt':{curve(-12,27,-25,15,-19,-10,-9,-9);curve(-9,-9,-14,-28,-2,-29,4,-8);curve(4,-8,17,-31,23,-15,17,2);curve(17,2,24,18,12,27,-12,27);break;}
case 'cuttingboard':{rect(-22,-28,44,56);ell(0,-20,3,3);break;}
case 'teapot':{ell(0,5,23,17);p([[-14,-9],[14,-9],[9,-17],[-9,-17]],true);p([[0,-17],[0,-25]]);curve(18,-2,36,-20,39,9,22,10);curve(-20,0,-33,-9,-34,6,-21,9);break;}
case 'mug':case 'cup':case 'espresso':{rect(-22,-14,36,39);curve(14,-11,33,-17,31,7,14,12);p([[-20,25],[16,25]]);for(let i=-1;i<=1;i++)curve(i*10,-18,i*10-5,-26,i*10+6,-28,i*10,-36);break;}
case 'beans':{for(let i=-1;i<=1;i++){ctx.save();ctx.translate(i*19,0);ell(0,0,9,16,.35);curve(-4,-12,6,-3,-6,7,3,13);ctx.restore();}break;}
case 'cookie':{ell(0,0,25,25);for(let i=0;i<8;i++){const a=i*2.39;ell(Math.cos(a)*17,Math.sin(a)*17,2.5,2.5);}break;}
case 'chocolate':{rect(-26,-24,52,48);for(let y=-12;y<=12;y+=24)p([[-26,y],[26,y]]);for(let i=-9;i<=9;i+=18)p([[i,-24],[i,24]]);break;}
case 'apple':{fruit();break;}
case 'lemon':case 'lime':case 'orange':{ell(0,0,25,20);ell(0,0,18,14);if(what==='orange'){for(let i=0;i<5;i++){let a=i*Math.PI/2.5;p([[0,0],[Math.cos(a)*18,Math.sin(a)*14]]);}}else{p([[-25,0],[-31,0]]);p([[25,0],[31,0]]);}break;}
case 'peach':{fruit();p([[0,-22],[0,10]]);break;}
case 'berries':case 'grapes':{for(let row=0;row<4;row++)for(let j=0;j<4-row;j++)ell(-18+row*5+j*12,-18+row*13,7,7);p([[0,-22],[6,-33]]);break;}
case 'cherries':{ell(-12,14,11,11);ell(13,14,11,11);curve(-12,5,-12,-20,6,-27,7,-32);curve(13,5,18,-20,7,-29,7,-32);break;}
case 'strawberry':{curve(-22,-13,-30,5,-9,29,0,29);curve(0,29,12,25,30,3,22,-13);p([[-22,-13],[22,-13],[8,-22],[-8,-22]],true);for(let i=-12;i<=12;i+=12)ell(i,5,1.5,3);break;}
case 'pear':{curve(0,-29,-17,-27,-10,-8,-24,6);curve(-24,6,-32,30,32,32,24,6);curve(24,6,10,-8,17,-26,0,-29);p([[0,-29],[3,-35]]);break;}
default:{sprig();}
}
ctx.restore();
}
function pick(seed){let x=seed+0x9e3779b9;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
function render(spec,g,i){
const seed=1+g*10+i,rand=pick(seed*8191),c=document.createElement('canvas');c.width=W;c.height=H;
const x=c.getContext('2d',{willReadFrequently:true});x.fillStyle=B;x.fillRect(0,0,W,H);
let [name,main,secondary]=spec;
const place=(type,px,py,sz,turn=0)=>drawSymbol(x,type,px,py,sz,turn);
const small=(count,anchors)=>{for(let k=0;k<count;k++){const q=anchors[k%anchors.length];place(k%3===0?secondary:main,q[0]+(rand()-.5)*26,q[1]+(rand()-.5)*22,21+rand()*12,(rand()-.5)*.8);}};
const style=(i+g*3)%10;
if(style===0){place(main,104,108,164,-.14);place(secondary,406,112,112,.25);small(5,[[260,26],[304,192],[480,27]]);}
if(style===1){place(main,437,107,170,.13);place(secondary,112,126,95,-.22);small(7,[[40,32],[165,23],[300,200],[275,45]]);}
if(style===2){for(let k=0;k<7;k++)place(k%3===0?secondary:main,26+k*81,100+(k%2)*21,76+(k%3)*12,(k%2?.21:-.16));}
if(style===3){place(main,100,112,156,-.28);place(main,443,112,156,.22);small(7,[[240,18],[300,191],[270,42]]);}
if(style===4){place(main,272,125,167,-.12);small(10,[[43,26],[492,25],[45,185],[492,182]]);}
if(style===5){place(main,104,127,123,-.3);place(secondary,264,95,130,.14);place(main,435,95,125,.28);small(4,[[24,25],[518,184]]);}
if(style===6){for(let k=0;k<10;k++){let a=40+(k%5)*116,b=47+Math.floor(k/5)*122;place((k+g)%3===0?secondary:main,a,b,52+(k%2)*9,(k%2?.26:-.26));}}
if(style===7){for(let k=0;k<8;k++){place(k%2?main:secondary,24+k*71,k%2?185:30,62,(k%2?.4:-.3));}place(main,280,107,100);}
if(style===8){place(main,80,96,145,.16);place(secondary,235,139,130,-.23);place(main,420,110,132,.27);small(4,[[170,30],[388,177]]);}
if(style===9){place(main,134,106,181,-.2);place(secondary,437,112,144,.11);small(6,[[280,32],[270,188],[525,33]]);}
x.strokeStyle=R;x.lineWidth=2.2;
if(style===3||style===7){x.beginPath();x.moveTo(5,7);x.lineTo(535,7);x.moveTo(5,208);x.lineTo(535,208);x.stroke();}
if(style===2||style===6){x.beginPath();x.moveTo(6,19);x.lineTo(6,196);x.moveTo(534,19);x.lineTo(534,196);x.stroke();}
const im=x.getImageData(0,0,W,H),d=im.data;
for(let k=0;k<d.length;k+=4){const red=d[k+1]<235;d[k]=255;d[k+1]=red?0:255;d[k+2]=red?0:255;d[k+3]=255;}
x.putImageData(im,0,0);
return {id:'BG-'+String(seed).padStart(3,'0'),number:seed,name,category:specs[g][0],themeId:'food-v6-'+g,tags:[main,secondary,name.toLowerCase(),'culinary','food'],source:'original-food-artwork-v6',width:W,height:H,strictColors:['#FF0000','#FFFFFF'],dataUri:c.toDataURL('image/png')};
}
window.NerdeusBackgroundPresets=specs.flatMap((group,g)=>group[1].map((spec,i)=>render(spec,g,i)));
window.NerdeusBackgroundBuild={version:'6.0',count:window.NerdeusBackgroundPresets.length,groups:specs.length,names:specs.map(g=>g[0]),size:[W,H]};
})();