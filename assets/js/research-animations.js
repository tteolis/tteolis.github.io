/* Lightweight illustrative dynamics; no external dependencies. */
(() => {
  'use strict';
  const canvases = [...document.querySelectorAll('canvas[data-research]')];
  if (!canvases.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches, elapsed = 0, last = 0, frame = null;
  let seed = 17;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const D = window.ResearchDynamics;
  const acoustic = new Image();
  acoustic.src = new URL('../acoustic-wavebench-10hz.png', document.currentScript.src).href;
  acoustic.addEventListener('load',()=>{if(paused)scenes.forEach(scene=>paint(scene,0));});
  const scenes = canvases.map(canvas => ({canvas, ctx:canvas.getContext('2d'), particles:Array.from({length:48}, () => ({x:rand(),y:rand(),vx:(rand()-.5)*.3,vy:(rand()-.5)*.3}))}));
  scenes.forEach(scene => {
    scene.sampling = D.samplingInitial(rand);
    scene.flock = D.flockInitial(rand);
    scene.lastSpeed = Infinity; scene.iteration = 0; scene.samplingClock = 0; scene.hold = 0; scene.settled = false; scene.flockClock = 0;
  });
  function dot(ctx,x,y,r=2,color='#327f78') { ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill(); }
  function label(ctx,text,x,y) { ctx.fillStyle='#5b7060';ctx.font='10px sans-serif';ctx.fillText(text,x,y); }
  function paint(scene,dt) {
    const {canvas,ctx,particles:ps}=scene;
    const w=canvas.clientWidth,h=180,dpr=Math.min(devicePixelRatio||1,2);
    if(!w || !ctx) return;
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==h*dpr){canvas.width=Math.round(w*dpr);canvas.height=h*dpr;}
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,w,h);
    ctx.fillStyle='#e7eee7';ctx.fillRect(0,0,w,h);
    const t=elapsed, type=canvas.dataset.research;
    if(type==='sampling') {
      const sx=x=>(x+3.6)/7.2*w, sy=y=>76+y/4.8*140;
      for(const cx of [-1.7,1.7]) for(let k=3;k>=1;k--){ctx.strokeStyle=`rgba(71,128,110,${.13+k*.02})`;ctx.beginPath();ctx.ellipse(sx(cx),sy(0),k*.55/7.2*w,k*.55/4.8*140,0,0,Math.PI*2);ctx.stroke();}
      if(!scene.settled) {
        // Keep the visible transient slow; finish the nearly stationary numerical tail quickly.
        scene.samplingClock += dt*(scene.lastSpeed<.06 ? 160 : 25);
        while(scene.samplingClock>=1) {
          const speed=D.samplingStep(scene.sampling);
          scene.lastSpeed=speed;
          scene.iteration++;scene.samplingClock--;
          if(scene.iteration>300 && speed<.007) {scene.settled=true;scene.hold=0;break;}
        }
      } else {
        scene.hold+=dt;
        if(scene.hold>.6) {scene.sampling=D.samplingInitial(rand);scene.iteration=0;scene.lastSpeed=Infinity;scene.samplingClock=0;scene.settled=false;}
      }
      scene.sampling.forEach(p=>dot(ctx,sx(p.x),sy(p.y),2.2));
      label(ctx,'SVGD · two-Gaussian target',10,164);
    } else if(type==='operators') {
      // Real pressure fields from the same WaveBench 10 Hz held-out example.
      // These source rectangles are the target and model panels in the saved evaluation figure.
      const size=Math.min((w-28)/2,120), x0=(w-2*size-8)/2, y0=29;
      label(ctx,'Reference',x0,20);label(ctx,'Prediction',x0+size+8,20);
      if(acoustic.complete && acoustic.naturalWidth) {
        ctx.drawImage(acoustic,0,0,388,388,x0,y0,size,size);
        ctx.drawImage(acoustic,388,0,388,388,x0+size+8,y0,size,size);
      }
      label(ctx,'Acoustic Helmholtz',10,164);
    } else {
      // Two independent toy systems: softmax attention attraction and Cucker–Smale alignment.
      const token=ps.slice(0,24);
      if(Math.floor(t/12)!==Math.floor((t-dt)/12)) token.forEach(p=>{p.x=rand();p.y=rand();});
      const updates=token.map(p=>{let sx=0,sy=0,z=0;token.forEach(q=>{const a=Math.exp(5*((p.x-.5)*(q.x-.5)+(p.y-.5)*(q.y-.5)));sx+=a*q.x;sy+=a*q.y;z+=a;});return {x:(sx/z-p.x)*.45,y:(sy/z-p.y)*.45};});
      token.forEach((p,i)=>{p.x+=updates[i].x*dt;p.y+=updates[i].y*dt;dot(ctx,12+p.x*(w-24),12+p.y*49,2.2);});
      label(ctx,'Transformer token dynamics',10,79);
      ctx.strokeStyle='#cad6cc';ctx.beginPath();ctx.moveTo(10,88);ctx.lineTo(w-10,88);ctx.stroke();
      const flockDt=dt*.35;
      scene.flockClock+=flockDt;
      // Open domain: never wrap or reflect particles. Restart while every arrow is still inside.
      if(scene.flockClock>4.5 || scene.flock.some(p=>p.x+p.vx*flockDt<.06 || p.x+p.vx*flockDt>.94 || p.y+p.vy*flockDt<.07 || p.y+p.vy*flockDt>.93)) {
        scene.flock=D.flockInitial(rand);scene.flockClock=0;
      }
      D.flockStep(scene.flock,flockDt);
      scene.flock.forEach(p=>{const x=12+p.x*(w-24),y=99+p.y*45;const a=Math.atan2(p.vy,p.vx);ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle='#b3854d';ctx.beginPath();ctx.moveTo(4,0);ctx.lineTo(-3,-2);ctx.lineTo(-3,2);ctx.closePath();ctx.fill();ctx.restore();});
      label(ctx,'Cucker–Smale alignment',10,167);
    }
  }
  function render(now) {frame=null;const dt=last?Math.min((now-last)/1000,.04):0;last=now;if(!paused)elapsed+=dt;scenes.forEach(s=>paint(s,paused?0:dt));if(!paused&&!document.hidden)frame=requestAnimationFrame(render);}
  function sync(){last=0;if(frame!==null)cancelAnimationFrame(frame);frame=requestAnimationFrame(render);}
  reduced.addEventListener('change',()=>{paused=reduced.matches;sync();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame!==null)cancelAnimationFrame(frame);frame=null;}else sync();});
  new ResizeObserver(()=>{if(paused)scenes.forEach(s=>paint(s,0));}).observe(document.querySelector('.research-cards'));
  sync();
})();
