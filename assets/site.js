/* おうちはじめ site.js — 動きは tanica.jp を手本に（GSAP+ScrollTrigger+Lenis があれば使い、無ければ素の JS で動く） */
(function(){
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce) document.documentElement.classList.add('reduce');
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  if(hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- GA4 events (only when GA_ID is set) ---------- */
  function track(n,p){try{if(window.gtag)gtag('event',n,p||{});}catch(e){}}
  document.querySelectorAll('[data-ev]').forEach(function(a){a.addEventListener('click',function(){track(a.getAttribute('data-ev'),{where:a.getAttribute('data-where')||'',lane:a.getAttribute('data-lane')||'',id:a.getAttribute('data-id')||''});});});
  var hv=document.querySelector('[data-house]'); if(hv) track('view_house',{lane:hv.getAttribute('data-lane'),id:hv.getAttribute('data-house')});

  /* ---------- smooth scroll (Lenis) ---------- */
  var lenis=null;
  if(!reduce && window.Lenis){
    try{
      lenis=new Lenis({lerp:0.1,smoothWheel:true});
      if(hasGsap){ lenis.on('scroll',ScrollTrigger.update); gsap.ticker.add(function(t){lenis.raf(t*1000);}); gsap.ticker.lagSmoothing(0); }
      else { (function raf(t){lenis.raf(t);requestAnimationFrame(raf);})(0); }
    }catch(e){lenis=null;}
  }
  function scrollToHash(hash){
    var el=hash&&document.querySelector(hash); if(!el) return false;
    if(lenis) lenis.scrollTo(el,{offset:-70,duration:1.4}); else el.scrollIntoView({behavior:'smooth'});
    return true;
  }

  /* ---------- transition mask ---------- */
  var tm=document.getElementById('tm'), opened=false;
  function buildGrid(){
    var g=document.getElementById('tmgrid'); if(!g||g.children.length) return;
    var cols=Math.max(8,Math.round(innerWidth/72)), rows=Math.max(6,Math.round(innerHeight/72));
    g.style.setProperty('--cols',cols); g.style.setProperty('--rows',rows);
    var frag=document.createDocumentFragment();
    for(var r=0;r<rows;r++)for(var c=0;c<cols;c++){var i=document.createElement('i');i.style.setProperty('--d',((c*0.55+r*0.35)/(cols+rows)*0.5).toFixed(3)+'s');frag.appendChild(i);}
    g.appendChild(frag);
  }
  function openMask(){
    if(opened) return; opened=true;
    if(!tm){ document.documentElement.classList.add('ready'); return; }
    var first=false; try{first=!sessionStorage.getItem('oh_seen');sessionStorage.setItem('oh_seen','1');}catch(e){}
    buildGrid();
    if(first) tm.classList.add('logo');
    setTimeout(function(){ tm.classList.remove('logo'); tm.classList.add('open'); document.documentElement.classList.add('ready'); setTimeout(function(){tm.classList.add('done');},1100); }, first?900:120);
  }
  if(reduce){ if(tm) tm.classList.add('open','done'); document.documentElement.classList.add('ready'); opened=true; }
  else { if(document.fonts&&document.fonts.ready){ document.fonts.ready.then(openMask); } setTimeout(openMask,1500); }
  window.addEventListener('pageshow',function(e){ if(e.persisted&&tm){ tm.classList.remove('closing'); tm.classList.add('open','done'); } });
  /* internal link click → close mask → go */
  document.addEventListener('click',function(e){
    var a=e.target.closest('a'); if(!a) return;
    var href=a.getAttribute('href')||''; if(!href) return;
    if(href.charAt(0)==='#'){ if(scrollToHash(href)) e.preventDefault(); return; }
    if(a.target==='_blank'||/^(tel:|mailto:)/.test(href)) return;
    var url; try{url=new URL(a.href,location.href);}catch(x){return;}
    if(url.origin!==location.origin) return;
    if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0) return;
    if(url.pathname===location.pathname&&url.hash){ e.preventDefault(); scrollToHash(url.hash); return; }
    if(reduce||!tm) return;
    e.preventDefault();
    tm.classList.remove('done','open'); tm.classList.add('closing');
    setTimeout(function(){ location.href=a.href; },480);
  });

  /* ---------- header hide / show ---------- */
  var hd=document.querySelector('.hd'), lastY=0, acc=0;
  window.addEventListener('scroll',function(){
    var y=window.scrollY||0, dy=y-lastY; lastY=y;
    if(!hd) return;
    if(y<80){hd.classList.remove('hide');acc=0;return;}
    acc = ((dy>0)===(acc>0)) ? acc+dy : dy;
    if(acc>24) hd.classList.add('hide'); else if(acc<-24) hd.classList.remove('hide');
  },{passive:true});

  /* ---------- mobile menu ---------- */
  var ham=document.querySelector('.ham'), nav=document.querySelector('.nav');
  if(ham&&nav) ham.addEventListener('click',function(){nav.classList.toggle('open');});

  /* ---------- reveal on scroll ---------- */
  var rvs=[].slice.call(document.querySelectorAll('.rv,.rv-img'));
  if(reduce||!('IntersectionObserver' in window)){ rvs.forEach(function(el){el.classList.add('in');}); }
  else{
    rvs.forEach(function(el){
      var p=el.parentElement, sibs=p?[].filter.call(p.children,function(c){return c.classList.contains('rv')||c.classList.contains('rv-img');}):[];
      var idx=sibs.indexOf(el); if(idx>0&&!el.style.getPropertyValue('--d')) el.style.setProperty('--d',(Math.min(idx,7)*0.09).toFixed(2)+'s');
    });
    var onIn=function(io){return function(es){es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); if(en.target.classList.contains('ba')) en.target.classList.add('nudge'); } });};};
    var io=new IntersectionObserver(function(es){onIn(io)(es);},{threshold:0.12,rootMargin:'0px 0px -6% 0px'});
    /* 画像は clip-path で 1px しか見えていないので、しきい値 0 で別に見張る */
    var ioImg=new IntersectionObserver(function(es){onIn(ioImg)(es);},{threshold:0,rootMargin:'0px 0px -6% 0px'});
    rvs.forEach(function(el){ (el.classList.contains('rv-img')?ioImg:io).observe(el); });
    document.querySelectorAll('.ba').forEach(function(el){io.observe(el);});
    /* 保険：画面内にあるのに .in が付いていない要素を、スクロール時と読み込み後に拾う */
    var pending=rvs.slice();
    var sweep=function(){ if(!pending.length) return; var vh=innerHeight*0.96; pending=pending.filter(function(el){ if(el.classList.contains('in')) return false; var r=el.getBoundingClientRect(); if(r.bottom>0&&r.top<vh&&r.height>0){ el.classList.add('in'); return false; } return true; }); };
    window.addEventListener('scroll',sweep,{passive:true}); window.addEventListener('resize',sweep);
    setTimeout(sweep,300); setTimeout(sweep,1200); setTimeout(sweep,2500);
  }
  /* hero copy: letters appear once the mask opens */
  var h1=document.querySelector('.h1c');
  if(h1){ var start=function(){ setTimeout(function(){h1.classList.add('in');},reduce?0:150); };
    if(document.documentElement.classList.contains('ready')) start(); else { var tt=setInterval(function(){ if(document.documentElement.classList.contains('ready')){clearInterval(tt);start();} },60); } }

  /* ---------- parallax images ---------- */
  var pr=document.querySelectorAll('.prlx');
  if(!reduce && pr.length){
    if(hasGsap){
      pr.forEach(function(w){var t=w.querySelector('.prlx-t'); if(!t) return;
        gsap.fromTo(t,{'--py':'-8%'},{'--py':'8%',ease:'none',scrollTrigger:{trigger:w,start:'top bottom',end:'bottom top',scrub:true}});});
    } else {
      var upd=function(){ pr.forEach(function(w){var t=w.querySelector('.prlx-t'); if(!t) return; var r=w.getBoundingClientRect(); var p=(r.top+r.height/2-innerHeight/2)/(innerHeight+r.height); t.style.setProperty('--py',(-p*16).toFixed(2)+'%');}); };
      window.addEventListener('scroll',upd,{passive:true}); upd();
    }
  }

  /* ---------- count up ---------- */
  var nums=document.querySelectorAll('[data-n]');
  if(nums.length){
    var fmt=function(v,dec){ return dec?v.toFixed(dec):Math.round(v).toLocaleString('ja-JP'); };
    var run=function(el){ var raw=el.getAttribute('data-n'), n=parseFloat(raw), suf=el.getAttribute('data-suf')||'', dec=(raw.split('.')[1]||'').length, t0=null, dur=1400;
      if(reduce){el.textContent=fmt(n,dec)+suf;return;}
      var step=function(ts){ if(!t0)t0=ts; var k=Math.min(1,(ts-t0)/dur); k=1-Math.pow(1-k,4); el.textContent=fmt(n*k,dec)+suf; if(k<1) requestAnimationFrame(step); }; requestAnimationFrame(step); };
    if('IntersectionObserver' in window && !reduce){ var io2=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){run(en.target);io2.unobserve(en.target);}});},{threshold:.5}); nums.forEach(function(el){io2.observe(el);}); }
    else nums.forEach(run);
  }

  /* ---------- reactive dot band ---------- */
  document.querySelectorAll('.dots').forEach(function(band){
    if(reduce){band.classList.add('fallback');return;}
    var cv=document.createElement('canvas'), ctx=cv.getContext('2d'); band.appendChild(cv);
    var W,H,dpr=Math.min(2,window.devicePixelRatio||1), gap=22, mx=-9999, my=-9999, cur=[], raf=null;
    function draw(){ ctx.clearRect(0,0,W,H); var cols=Math.ceil(W/gap)+1, rows=Math.ceil(H/gap); var ox=(W-(cols-1)*gap)/2, oy=(H-(rows-1)*gap)/2; var moving=false;
      for(var r=0;r<rows;r++)for(var c=0;c<cols;c++){ var i=r*cols+c, x=ox+c*gap, y=oy+r*gap; var d=Math.hypot(x-mx,y-my); var t=2.2+Math.max(0,1-d/140)*5; cur[i]=cur[i]==null?2.2:cur[i]+(t-cur[i])*0.18; if(Math.abs(t-cur[i])>0.05) moving=true;
        ctx.beginPath(); ctx.arc(x,y,cur[i],0,Math.PI*2); ctx.fillStyle=cur[i]>2.6?'#d9c89a':'#f1e8d3'; ctx.fill(); }
      raf = moving ? requestAnimationFrame(draw) : null; }
    function size(){ W=band.clientWidth; H=band.clientHeight; cv.width=W*dpr; cv.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); cur=[]; draw(); }
    band.addEventListener('pointermove',function(e){var r=band.getBoundingClientRect(); mx=e.clientX-r.left; my=e.clientY-r.top; if(!raf) raf=requestAnimationFrame(draw);});
    band.addEventListener('pointerleave',function(){mx=my=-9999; if(!raf) raf=requestAnimationFrame(draw);});
    window.addEventListener('resize',size); size();
  });

  /* ---------- before/after sliders ---------- */
  document.querySelectorAll('.ba input').forEach(function(r){ r.addEventListener('input',function(){ r.parentNode.classList.remove('nudge'); r.parentNode.style.setProperty('--p',r.value+'%'); }); });

  /* ---------- filters (list / works): any data-f key; items = #rows .fi ---------- */
  var list=document.querySelector('#rows'); if(!list) return;
  var rows=[].slice.call(list.querySelectorAll('.fi'));
  var state={};
  function active(k){return Object.keys(state[k]||{}).filter(function(x){return state[k][x];});}
  function apply(){
    var n=0, keys=Object.keys(state);
    rows.forEach(function(r){ var ok=true; keys.forEach(function(k){var a=active(k); if(!a.length) return; var vals=(r.getAttribute('data-'+k)||'').split(' '); if(!a.some(function(v){return vals.indexOf(v)>=0})) ok=false;}); r.hidden=!ok; if(ok){n++; r.classList.add('in');} });
    var e=document.querySelector('#empty'); if(e) e.classList.toggle('show',n===0);
    document.querySelectorAll('[data-f]').forEach(function(b){var k=b.getAttribute('data-f'),v=b.getAttribute('data-v'); var a=active(k); b.classList.toggle('off',a.length>0&&!(state[k]&&state[k][v]));});
    if(hasGsap) ScrollTrigger.refresh();
  }
  document.querySelectorAll('[data-f]').forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-f'),v=b.getAttribute('data-v'); state[k]=state[k]||{}; state[k][v]=!state[k][v]; apply();});});
  var all=document.querySelector('#all'); if(all) all.addEventListener('click',function(){state={}; apply();});
  var m=location.hash.match(/(lane|part|stage)=([^&]+)/); if(m){state[m[1]]={}; state[m[1]][decodeURIComponent(m[2])]=true; apply();}
})();

/* 事例ページの「この事例のように直したい」から来たとき（/contact/?case=W07）、番号を見えるところに出す */
(function(){
  var box=document.getElementById('casebox'); if(!box) return;
  var m=location.search.match(/[?&]case=(W\d{2,3})(?:&|$)/); if(!m) return;
  var p=document.createElement('p'); p.style.margin='0';
  p.textContent='事例「'+m[1]+'」を見てのお問い合わせですね。電話・LINE・フォームのどれでも、「'+m[1]+'の事例を見た」とお伝えください。';
  box.appendChild(p); box.hidden=false;
})();
