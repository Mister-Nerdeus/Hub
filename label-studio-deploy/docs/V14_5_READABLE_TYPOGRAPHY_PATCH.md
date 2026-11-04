# Nerdeus Label Studio v14.5 — Copy/paste readability patch

Date: November 4, 2026

This is the by-file patch guide for the unreadably heavy text on the 50 × 70 mm B1 Pro labels. The complete, tested files are stored at:

- [index-v14_5.html](../index-v14_5.html) — versioned replacement for index-v14_4.html
- [master-label-v14_5.js](../assets/master-label-v14_5.js) — versioned replacement for master-label-v14_4.js

Older files and immutable print snapshots are retained. Prefer these complete linked files to hand-editing an existing deployment.

## 1. master-label-v14_4.js → master-label-v14_5.js

### Replace default font preset

Old:

~~~js
const txt=(name,text,x,y,w,h,size,color='black',other={})=>l('text',name,x,y,w,h,{text,fontSize:size,fontFamily:'Impact',bold:true,align:'left',lineHeight:1.07,color,autoFit:true,maxLines:2,...other});
~~~

New:

~~~js
const txt=(name,text,x,y,w,h,size,color='black',other={})=>l('text',name,x,y,w,h,{
  text,fontSize:size,fontFamily:'Arial',fontWeight:700,bold:false,
  align:'left',lineHeight:1.14,color,autoFit:true,maxLines:2,...other
});
~~~

### Equal-size two-line headers

In applyHeritage(doc), keep both two-level headers at the **same calculated size**, but change Impact 800 to Arial 700:

~~~js
const size=Math.min(36,Math.max(27,Math.floor(
  36-0.65*Math.max(0,Math.max(line1.length,line2.length)-17)
)));

set('Main product title',{
  text:'{{pkg.heritageLine1}}',x:112,y:13,w:444,h:47,
  fontSize:size,fontFamily:'Arial',fontWeight:700,bold:false,
  autoFit:false,maxLines:1,align:'center',lineHeight:1.14,color:'white'
});
set('Heritage second header',{
  text:'{{pkg.heritageLine2}}',x:24,y:76,w:543,h:43,
  fontSize:size,fontFamily:'Arial',fontWeight:700,bold:false,
  autoFit:false,maxLines:1,align:'center',lineHeight:1.14,color:'white'
});
~~~

### Replace data-text appearance in applyHeritage(doc)

Replace the corresponding named set(...) calls:

~~~js
set('Heritage actual food name',{
  x:31,y:373,w:529,h:38,fontFamily:'Arial',fontWeight:700,bold:false,
  fontSize:31,align:'center',autoFit:true,maxLines:1,lineHeight:1.14
});
set('Extra contents descriptor',{
  x:32,y:416,w:527,h:23,fontFamily:'Arial',fontWeight:500,bold:false,
  fontSize:19,align:'center',maxLines:1,autoFit:true,
  lineHeight:1.15,showWhen:'pkg.displayContents'
});
set('Metric quantity',{
  x:31,y:450,w:245,h:43,fontFamily:'Arial',fontWeight:700,bold:false,
  fontSize:36,align:'center',maxLines:1
});
set('Imperial quantity',{
  x:314,y:450,w:245,h:43,fontFamily:'Arial',fontWeight:700,bold:false,
  fontSize:36,align:'center',maxLines:1
});
set('Packaging material',{
  text:'{{pkg.heritageState}}',x:31,y:497,w:529,h:26,
  fontFamily:'Arial',fontWeight:600,bold:false,
  fontSize:20,align:'center',maxLines:1,autoFit:true,lineHeight:1.14
});
set('Recorded allergen bullets',{
  x:30,y:532,w:531,h:24,fontFamily:'Arial',fontWeight:700,bold:false,
  fontSize:18,align:'center',showWhen:'pkg.allergens',
  maxLines:1,format:'allergenBullets',autoFit:false
});
set('One validated instruction',{
  text:'{{pkg.printInstruction}}',x:31,y:750,w:529,h:64,
  fontFamily:'Arial',fontWeight:700,bold:false,
  fontSize:26,align:'center',maxLines:2,autoFit:true,lineHeight:1.14
});
~~~

Also apply Arial 600 to the QR ID caption (17 px), event names (20 px) and event dates (22 px). Food imagery remains **black only**; red decorative artwork is separate. Quantity units retain equal visual prominence.

### Versioned layout revision

In the canonical master defaults set the version marker to:

~~~js
'pkg.templateRevision':'v14.5'
~~~

For existing saved packages using an older Heritage master revision, the advanced inspector now offers **Apply readable v14.5 typography to this label**. This requires explicit use, keeps food facts and manual geometry, resets visual-review approvals, and leaves archived PNG snapshots byte-for-byte unchanged.

## 2. index-v14_4.html → index-v14_5.html

### Font weight helper

Copy this helper next to setupFont and make setupFont use it:

~~~js
function fontWeightForElement(e){
  const weight=Number(e?.fontWeight);
  return [400,500,600,700].includes(weight)?weight:(e?.bold?700:400);
}
function setupFont(ctx,e){
  ctx.font=fontWeightForElement(e)+' '+
    Math.max(7,Math.round(e.fontSize||18))+'px '+
    (fontMap[e.fontFamily]||fontMap.Arial);
}
~~~

In fontForElement(ctx,e,value), replace **both** occurrences of the previous 800/400 ternary with fontWeightForElement(e). Increase the ordinary minimum size for auto-fit text from 10 to 12 px, retaining 26 px for Main product title.

In validatedDoc, explicitly sanitize any saved or imported weight:

~~~js
o.fontWeight=[400,500,600,700].includes(Number(e.fontWeight))
  ?Number(e.fontWeight):undefined;
~~~

### SVG and bitmap must match

The SVG export text font-weight attribute must use fontWeightForElement(e), not the old hard-coded 800/400 weight. This prevents SVG and PNG from rendering different thicknesses.

### Reduce black-pixel swelling

In quantizeCanvas(canvas), replace exactly:

~~~js
else if(.2126*r+.7152*g+.0722*b<153){nr=ng=nb=0;}
~~~

with:

~~~js
else if(.2126*r+.7152*g+.0722*b<128){nr=ng=nb=0;}
~~~

Keep the existing pure-red detection logic unchanged. The only allowed pixel outputs remain #000000 black, #FF0000 red and #FFFFFF white.

### Preserve exact printhead crop

In makePrinterRaster, immediately before drawImage:

~~~js
ctx.imageSmoothingEnabled=false;
~~~

The editor remains 591 × 827 pixels; B1 Pro print data remain 576 × 827 pixels after a 7-pixel left and 8-pixel right crop.

### Add real native-pixel comparison

The Compare artwork and printer raster dialog now contains a **View 100% pixels** toggle. It switches the two preview canvases to 591 × 827 and 576 × 827 native CSS pixels in a horizontally scrollable dialog. This is for visual inspection; it is not a physical millimeter-size simulator.

## 3. Verification already performed

- New master typography applied consistently across 17/17 label types.
- Both major header lines have the same font size and weight for every label type.
- 17/17 synthetic package-validation tests passed.
- All 12 inline HTML JavaScript blocks compiled.
- Quantization sample checks confirmed exact three-color output: pure red/black/white stay unchanged; neutral gray value 140 is white at the new threshold; gray 110 remains black.
- Representative long headings fit at their allotted print widths with a local Arial-compatible bold font.
- The existing 101 red backgrounds, 123 food-cut illustrations and saved package data were not deleted.

## 4. Acceptance still required

- Visually inspect the new v14.5 preview at 100% pixels in a fresh browser tab.
- For older saved package labels, choose the opt-in typography upgrade, review the label and create a new immutable print snapshot.
- Physically verify B1 Pro two-color registration, 50 × 70 mm stock, QR readability, and freezer/condensation durability. The connected tab/browser cannot be clicked from this chat, and no physical print was performed.

## 5. Rollback

The old versioned HTML/master sources are preserved. Roll back by repinning **both** complete files and their Git blob hashes in the Railway Function, without replacing saved package records or archived PNGs. Do not roll back only one half of the typography/raster pair.
