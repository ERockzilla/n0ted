
var sw_interval;
var sw_x = 10;
var sw_dx = 0;
var sw_t = 10;
var sw_cursor = 1;

var sw_v;
var sw_w;
var sw_numItems;
var sw_first;
var sw_last;
var sw_clipRight;
var sw_ref;

function moveSWBlueBox(n)
{
 if(sw_interval == null) {
  if(n > 0) {
   moveLeft(n*swItemsInSet);
  }
  else {
    moveRight(-n*swItemsInSet);
  }
  var idx = getSWBlueBoxIdx();
  var box;
  box = document.getElementById("sw_box"+idx);
  box.src = swWhiteBox;
  idx += n;
  if(idx < 1) {
   idx = numSWBoxes + idx;
  }
  else if(idx > numSWBoxes) {
   idx = idx - numSWBoxes;
  }
  box = document.getElementById("sw_box"+idx);
  box.src = swBlueBox;
  swBlueBoxIdx = idx;
 }
}

function moveToSWBox(i)
{
 if(sw_interval == null) {
  var idx = getSWBlueBoxIdx();
  var diff = i-idx;
  if(diff != 0) {
    moveSWBlueBox(diff);
  }
 }
}

function getSWBlueBoxIdx()
{
 return swBlueBoxIdx;
}

function moveLeft(n)
{
 if(sw_interval == null) {
  var id = "widget_item"+sw_cursor;
  sw_ref = document.getElementById(id);
  
  // calibrate to sw_ref
  var last_wi = sw_ref;
  for(var i=sw_cursor+1; i<=sw_numItems; i++) {
   id = "widget_item"+i;
   wi = document.getElementById(id);
   wi.style.left = (parseInt(last_wi.style.left) + sw_w) + "px";
   last_wi = wi;
  }
  for(var i=1; i<sw_cursor; i++) {
   id = "widget_item"+i;
   wi = document.getElementById(id);
   wi.style.left = (parseInt(last_wi.style.left) + sw_w) + "px";
   last_wi = wi;
  }

  sw_cursor += n;
  if(sw_cursor > sw_numItems) sw_cursor = 1;
  sw_interval = setInterval("move("+(-1*n)+")",sw_t);
 }
}

function moveRight(n)
{
 if(sw_interval == null) {
  var id = "widget_item"+sw_cursor;
  sw_ref = document.getElementById(id);

  // calibrate to sw_ref
  var last_wi = sw_ref;
  for(var i=sw_cursor-1; i>=1; i--) {
   id = "widget_item"+i;
   wi = document.getElementById(id);
   wi.style.left = (parseInt(last_wi.style.left) - sw_w) + "px";
   last_wi = wi;
  }
  for(var i=sw_numItems; i>=sw_cursor+swItemsInSet; i--) {
   id = "widget_item"+i;
   wi = document.getElementById(id);
   wi.style.left = (parseInt(last_wi.style.left) - sw_w) + "px";
   last_wi = wi;
  }

  sw_cursor -= n;
  if(sw_cursor < 1) sw_cursor = sw_numItems + sw_cursor;
  sw_interval = setInterval("move("+n+")",sw_t);
 }
}

function move(n)
{
 var id;
 var wi;
 var m = Math.abs(n*sw_w);
 var f = 36;

 sw_dx = Math.floor(f*Math.sin(sw_x*Math.PI/m));
 if(sw_dx < 1) sw_dx = 1;
 sw_x += sw_dx;

 if(n<0) {
    sw_dx *= -1;
    if(parseInt(sw_ref.style.left) <= sw_w*n) {
       clearInterval(sw_interval);
       sw_interval = null;
       sw_x = 10;
       return;
    }
 }
 else {
    if(parseInt(sw_ref.style.left) >= sw_w*n) {
       clearInterval(sw_interval);
       sw_interval = null;
       sw_x = 10;
       return;
    }
 }

 for(var i=1; i<=sw_numItems; i++) {
  id = "widget_item"+i;
  wi = document.getElementById(id);
  wi.style.left = (parseInt(wi.style.left) + sw_dx) + "px";
  display(wi);
 }

}

function initScrollWidget()
{
 var id;
 var wi;

 sw_v = document.getElementById("widget_items");
 if(sw_v != null) {
  sw_numItems = sw_v.childNodes.length;
  sw_first = sw_v.firstChild;
  sw_last = sw_v.lastChild;
  sw_w = parseInt(getStyle(sw_first).width);
  sw_clipRight = parseInt(getStyle(sw_first.parentNode).width);  // Assume clip at width of div.

  for(var i=1; i<=sw_numItems; i++) {
   id = "widget_item"+i;
   wi = document.getElementById(id);
   wi.style.left = (i-1)*sw_w + "px";
   display(wi);
  }
}

 if(onloadScrollWidget) onloadScrollWidget();
}

function display(wi) {
  // Display as needed to avoid window scroll bar.
  if(parseInt(wi.style.left) < -sw_w || parseInt(wi.style.left) > sw_clipRight) {
   wi.style.display = "none";
  }
  else {
   wi.style.display = "block";
  }
}

function getStyle(o){ 
var s;
if (o.currentStyle != null){ 
 s = o.currentStyle;
} else{ 
 s = document.defaultView.getComputedStyle(o, null);
} 
return s;
} 

onloadScrollWidget=window.onload;
window.onload=initScrollWidget;


