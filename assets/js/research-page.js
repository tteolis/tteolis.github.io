(async () => {
    const root=document.getElementById('research-content');
    if(!root)return;
    if(!window.d3)throw new Error('The plotting library could not be loaded.');
    const response=await fetch(root.dataset.simulationSrc);
    if(!response.ok)throw new Error('The simulation data could not be loaded.');
    const data=await response.json();
    const unpack=(encoded,n,scale=10000,delta=true)=>{
      const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)),view=new DataView(bytes.buffer);
      const previous=Array.from({length:n},()=>[0,0]);
      return Array.from({length:bytes.length/(4*n)},(_,frame)=>Array.from({length:n},(_,particle)=>[0,1].map(k=>{
        const value=view.getInt16((frame*n+particle)*4+k*2,true)+(delta?previous[particle][k]:0);
        previous[particle][k]=value;return value/scale;
      })));
    };
    Object.values(data.svgdCases).forEach(run=>{['gb','rbf','law','lan'].forEach(key=>{if(run[key+'Packed'])run[key]=unpack(run[key+'Packed'],run.n,key==='lan'?run.lanScale||10000:10000);});});
    data.cs.positions=unpack(data.cs.positionsPacked,data.cs.n,50);
    data.cs.velocities=unpack(data.cs.velocitiesPacked,data.cs.n);
    data.fluid.positions=unpack(data.fluid.positionsPacked,data.fluid.n);
    data.fluid.velocities=unpack(data.fluid.velocitiesPacked,data.fluid.n);
    data.fluid.field=unpack(data.fluid.fieldPacked,36);
    data.smodel.positions=unpack(data.smodel.positionsPacked,data.smodel.n);
    data.smodel.velocities=unpack(data.smodel.velocitiesPacked,data.smodel.n);
    data.smodel.csPositions=unpack(data.smodel.csPositionsPacked,data.smodel.n);
    data.smodel.csVelocities=unpack(data.smodel.csVelocitiesPacked,data.smodel.n);
    data.svgd=data.svgdCases.mode;
    const players={cs:{t:0,playing:false,duration:12},svgd:{t:0,playing:false,duration:24},fluid:{t:0,playing:false,duration:20},smodel:{t:0,playing:false,duration:14}};
    const colors={gb:'var(--gb)',rbf:'var(--rbf)',law:'light-dark(#326eb4,#8ebbf4)',lan:'light-dark(#966214,#e6bb75)',gray:'var(--ghost)',ink:'var(--ink)',rule:'var(--rule)'};
    const methods=()=>data.svgd.law?['gb','rbf','law','lan']:['gb','rbf'];
    const energyKeys={gb:'eg',rbf:'er',law:'el',lan:'en'};
    const methodNames={gb:'GB',rbf:'RBF',law:'LAWGD',lan:'Langevin'};
    let activePlayback='transient';
    const playbackMode=()=>activePlayback;
    const svStart=()=>playbackMode()==='late'?.3:0;
    const svHorizon=()=>Math.min(600,data.svgd.times.at(-1));
    const svEnd=()=>playbackMode()==='transient'?.3:svHorizon();
    const svRate=()=>(svEnd()-svStart())/10;
    const svClock=t=>(t-svStart())/svRate();
    const svTime=s=>svStart()+s*svRate();
    const svSpeed=t=>svRate();
    const formatTime=t=>t===0?'0':t<.01?t.toExponential(2):t<1?t.toFixed(3):t.toFixed(1);
    const snapshots=(run,t,key) => {
      const times=key==='lan'?run.lanTimes:run.times;
      const i=Math.min(times.length-2,Math.max(0,d3.bisectRight(times,t)-1));
      const f=(t-times[i])/(times[i+1]-times[i]);
      return run[key][i].map((p,j)=>p.map((v,k)=>{const x=v+(run[key][i+1][j][k]-v)*f;return x;}));
    };
    const paths={};
    function axis(id,height,xDomain,yDomain,xLabel,yLabel,log=false,square=false,timeLog=false,timeConstant=1){
      const svg=d3.select(root.querySelector('#'+id)),w=svg.node().parentElement.clientWidth;
      const h=square?Math.min(w,280):Math.min(height,180), m={left:w<180?34:w<320?50:64,right:10,top:10,bottom:w<180?32:42};
      svg.attr('viewBox',`0 0 ${w} ${h}`).attr('height',h); svg.selectAll('*').remove();
      let pw=Math.max(20,w-m.left-m.right),ph=Math.max(20,h-m.top-m.bottom);
      if(square){const size=Math.min(pw,ph);pw=ph=size;}
      const x=(timeLog?d3.scaleSymlog().constant(timeConstant):d3.scaleLinear()).domain(xDomain).range([m.left,m.left+pw]);
      const y=(log?d3.scaleLog():d3.scaleLinear()).domain(yDomain).range([m.top+ph,m.top]);
      svg.append('rect').attr('data-chart-frame','').attr('x',m.left).attr('y',m.top).attr('width',pw).attr('height',ph).attr('fill','none').attr('stroke',colors.rule);
      const bottom=d3.axisBottom(x).ticks(w<400?3:5).tickSizeOuter(0);
      if(timeLog)bottom.tickValues([...new Set([...(timeConstant<1?(w<400?[0,.1,10]:[0,.01,1,100]):(w<400?[0,10,100]:[0,1,10,100,1000])).filter(t=>t<xDomain[1]),xDomain[1]])]);
      if(timeLog)bottom.tickFormat(t=>t===0?'0':d3.format('.3~g')(t));
      svg.append('g').attr('transform',`translate(0,${m.top+ph})`).call(bottom);
      const smallEnergy=!log&&d3.max(yDomain,v=>Math.abs(v))<.01;
      svg.append('g').attr('transform',`translate(${m.left},0)`).call(log?d3.axisLeft(y).ticks(3,'.0e').tickSizeOuter(0):d3.axisLeft(y).ticks(w<240?3:4,smallEnergy?'.1e':null).tickSizeOuter(0));
      svg.append('text').attr('class','axis-title').attr('data-axis','x').attr('x',m.left+pw/2).attr('y',m.top+ph+m.bottom-10).attr('text-anchor','middle').text(xLabel);
      svg.append('text').attr('class','axis-title').attr('data-axis','y').attr('transform',`translate(15,${m.top+ph/2}) rotate(-90)`).attr('text-anchor','middle').text(yLabel);
      const clip='clip-'+id;
      svg.append('defs').append('clipPath').attr('id',clip).append('rect').attr('x',m.left).attr('y',m.top).attr('width',pw).attr('height',ph);
      const g=svg.append('g').attr('clip-path',`url(#${clip})`);
      return {svg,g,x,y,m,w,h,pw,ph};
    }
    const flatten=data.cs.positions.flat();
    const ex=d3.extent(flatten,p=>p[0]),ey=d3.extent(flatten,p=>p[1]),span=Math.max(ex[1]-ex[0],ey[1]-ey[0])*1.12,cx=(ex[0]+ex[1])/2,cy=(ey[0]+ey[1])/2,domainX=[cx-span/2,cx+span/2],domainY=[cy-span/2,cy+span/2];
    function makeCs(){
      const p=axis('cs-cloud',0,domainX,domainY,'x₁ (lab frame)','x₂ (lab frame)',false,true);
      p.g.append('circle').attr('class','no-communication').attr('r',Math.abs(p.x(data.cs.radius)-p.x(0))).attr('fill',colors.rbf).attr('fill-opacity',.08).attr('stroke',colors.rbf).attr('stroke-width',1.5).attr('stroke-dasharray','5 3');
      p.g.selectAll('path.bird').data(data.cs.positions[0]).join('path').attr('class','bird').attr('d','M7,0 L-5,3.8 L-5,-3.8 Z').attr('fill',(z,j)=>j===0?colors.rbf:colors.gb).attr('stroke',colors.ink).attr('stroke-width',(z,j)=>j===0?1.2:.4);
      p.g.selectAll('circle.rest').data(data.cs.positions[0]).join('circle').attr('class','rest').attr('r',2.2).attr('fill','none').attr('stroke',colors.gray);
      const s=root.querySelector('#cs-history'),w=s.parentElement.clientWidth,h=p.h;
      d3.select(s).attr('viewBox',`0 0 ${w} ${h}`).attr('height',h).selectAll('*').remove();
      const mid=h*.50, ml=80,mr=18,bottom=h-45,top=14;
      const x=d3.scaleLinear().domain([0,data.cs.times.at(-1)]).range([ml,w-mr]);
      const yd=d3.scaleLinear().domain([0,d3.max(data.cs.diameter)*1.12]).range([mid-26,top]);
      const yv=d3.scaleLog().domain([d3.min(data.cs.variance)*.5,d3.max(data.cs.variance)*1.6]).range([bottom,mid+15]);
      const svg=d3.select(s);
      [[yd,top,mid-26,'Diameter D(t)'],[yv,mid+15,bottom,'Velocity variance']].forEach(([y,y0,y1,label])=>{
        svg.append('rect').attr('data-chart-frame','').attr('x',ml).attr('y',y0).attr('width',w-ml-mr).attr('height',y1-y0).attr('fill','none').attr('stroke',colors.rule);
        svg.append('g').attr('transform',`translate(${ml},0)`).call(d3.axisLeft(y).ticks(3,y===yv?'.0e':null).tickSizeOuter(0));
        svg.append('g').attr('transform',`translate(0,${y1})`).call(d3.axisBottom(x).ticks(3).tickSizeOuter(0));
        svg.append('text').attr('class','axis-title').attr('data-axis','y').attr('transform',`translate(14,${(y0+y1)/2}) rotate(-90)`).attr('text-anchor','middle').text(label);
      });
      svg.append('text').attr('class','axis-title').attr('data-axis','x').attr('x',(ml+w-mr)/2).attr('y',h-5).attr('text-anchor','middle').text('Time t');
      const line=y=>d3.line().x((v,i)=>x(data.cs.times[i])).y(y);
      svg.append('path').attr('d',line(yd)(data.cs.reference)).attr('fill','none').attr('stroke',colors.gray).attr('stroke-width',1.5).attr('stroke-dasharray','4 3');
      const diameter=svg.append('path').attr('fill','none').attr('stroke',colors.gb).attr('stroke-width',2);
      const variance=svg.append('path').attr('fill','none').attr('stroke',colors.gb).attr('stroke-width',2);
      paths.cs={p,diameter,variance,lineD:line(yd),lineV:line(yv)};
      drawCs();
    }
    function drawCs(){
      const {p,diameter,variance,lineD,lineV}=paths.cs,t=players.cs.t;
      const i=Math.min(data.cs.times.length-2,Math.max(0,d3.bisectRight(data.cs.times,t)-1)),dt=data.cs.times[i+1]-data.cs.times[i],s=(t-data.cs.times[i])/dt;
      const positions=data.cs.positions[i].map((z,j)=>z.map((a,k)=>{
        const b=data.cs.positions[i+1][j][k],u=data.cs.velocities[i][j][k],v=data.cs.velocities[i+1][j][k];
        return (2*s*s*s-3*s*s+1)*a+(s*s*s-2*s*s+s)*dt*u+(-2*s*s*s+3*s*s)*b+(s*s*s-s*s)*dt*v;
      }));
      const velocities=snapshots(data.cs,t,'velocities');
      p.g.select('circle.no-communication').attr('cx',p.x(positions[0][0])).attr('cy',p.y(positions[0][1]));
      p.g.selectAll('path.bird').data(positions).attr('opacity',(z,j)=>Math.hypot(...velocities[j])>=1e-5?1:0).attr('transform',(z,j)=>`translate(${p.x(z[0])},${p.y(z[1])}) rotate(${-Math.atan2(velocities[j][1],velocities[j][0])*180/Math.PI})`);
      p.g.selectAll('circle.rest').data(positions).attr('opacity',(z,j)=>Math.hypot(...velocities[j])<1e-5?1:0).attr('cx',z=>p.x(z[0])).attr('cy',z=>p.y(z[1]));
      const end=d3.bisectRight(data.cs.times,t);diameter.attr('d',lineD(data.cs.diameter.slice(0,end)));variance.attr('d',lineV(data.cs.variance.slice(0,end)));
    }
    function makeSv(){
      methods().forEach(key=>{
        const p=axis(key+'-cloud',0,[-1.9,1.9],[-1.9,1.9],'x₁','x₂',false,true);
        const grid=data.svgd.grid,density=data.svgd.density.flat();
        const contour=d3.contours().size([grid.length,grid.length]).thresholds(6)(density);
        const project=d3.geoTransform({point:function(x,y){this.stream.point(p.x(-1.9+x/grid.length*3.8),p.y(-1.9+y/grid.length*3.8));}});
        p.g.selectAll('path.contour').data(contour).join('path').attr('class','contour').attr('d',d3.geoPath(project)).attr('fill','none').attr('stroke',colors.gray).attr('stroke-width',.7).attr('opacity',.65);
        p.g.selectAll('circle').data(data.svgd[key][0]).join('circle').attr('r',2.5).attr('fill',colors[key]).attr('opacity',.85);
        paths[key]=p;
      });
      const historyEnd=d3.bisectRight(data.svgd.historyTimes,svHorizon());
      const all=methods().flatMap(key=>data.svgd[energyKeys[key]].slice(0,historyEnd)),e=d3.extent(all);
      const w=root.querySelector('#sv-history').parentElement.clientWidth;
      const logEnergy=root.querySelector('#energy-scale').value==='log';
      const p=axis('sv-history',280,[0,svHorizon()],logEnergy?[e[0]*.7,e[1]*1.3]:[0,e[1]*1.1],'Flow time t (symlog)',logEnergy?'Energy Eₘ (log)':'Energy Eₘ',logEnergy,false,true,data.svgd.clockScale);
      p.line=d3.line().x((v,i)=>p.x(data.svgd.historyTimes[i])).y(v=>p.y(v));
      methods().forEach(key=>p.g.append('path').attr('d',p.line(data.svgd[energyKeys[key]].slice(0,historyEnd))).attr('fill','none').attr('stroke',colors[key]).attr('stroke-width',1.4).attr('opacity',.3));
      p.g.append('line').attr('x1',p.x(0)).attr('x2',p.x(svHorizon())).attr('y1',p.y(data.svgd.er[0])).attr('y2',p.y(data.svgd.er[0])).attr('stroke',colors.gray).attr('stroke-dasharray','3 3').attr('opacity',.6);
      methods().forEach(key=>{p[energyKeys[key]]=p.g.append('path').attr('fill','none').attr('stroke',colors[key]).attr('stroke-width',2);});
      p.guide=p.g.append('line').attr('stroke',colors.gray).attr('y1',p.m.top).attr('y2',p.m.top+p.ph).attr('opacity',0);
      const tooltip=root.querySelector('.tooltip-dynamics');
      p.svg.append('rect').attr('data-chart-hit','').attr('data-chart-hover-overlay','cross-series').attr('x',p.m.left).attr('y',p.m.top).attr('width',p.pw).attr('height',p.ph).attr('fill','transparent').on('pointermove',function(event){
        const [x]=d3.pointer(event,this),t=Math.max(0,Math.min(svHorizon(),p.x.invert(x))),i=Math.min(data.svgd.historyTimes.length-2,d3.bisectRight(data.svgd.historyTimes,t)-1),f=(t-data.svgd.historyTimes[i])/(data.svgd.historyTimes[i+1]-data.svgd.historyTimes[i]);
        const value=key=>data.svgd[key][i]+f*(data.svgd[key][i+1]-data.svgd[key][i]);
        p.guide.attr('x1',x).attr('x2',x).attr('opacity',.7);
        tooltip.style.display='block';tooltip.style.left='6px';tooltip.style.top='32px';tooltip.textContent=`t = ${formatTime(t)} | `+methods().map(key=>`${methodNames[key]} ${value(energyKeys[key]).toExponential(2)}`).join(' | ');
      }).on('pointerleave',()=>{p.guide.attr('opacity',0);tooltip.style.display='none';});
      paths.sv=p;
      drawSv();
    }
    function drawSv(){
      const t=players.svgd.t;
      methods().forEach(key=>{
        const p=paths[key],cloud=key==='lan'?langevinCloud(data.svgd,t):snapshots(data.svgd,t,key).map(position=>({position,opacity:.85}));
        p.g.selectAll('circle').data(cloud).join('circle').attr('r',2.5).attr('fill',colors[key])
          .attr('cx',d=>p.x(d.position[0])).attr('cy',d=>p.y(d.position[1])).attr('opacity',d=>d.opacity);
      });
      root.querySelector('#langevin-panel-title').textContent='Langevin dynamics';
      const end=d3.bisectRight(data.svgd.historyTimes,t),p=paths.sv;
      methods().forEach(key=>{const ek=energyKeys[key];p[ek].attr('d',p.line(data.svgd[ek].slice(0,end)));});
    }
    function langevinCloud(run,t){
      const steps=run.lanFramesPerWindow-1;
      const progress=(t-svStart())/(svEnd()-svStart());
      const frame=Math.max(0,Math.min(steps,Math.floor(progress*steps+1e-9)));
      const i=(playbackMode()==='late'?steps:0)+frame;
      return run.lan[i].map(position=>({position,opacity:.85}));
    }
    function makeExtras(){
      const r=data.fluid,ex=d3.extent(r.positions.flat().map(z=>z[0])),ey=d3.extent(r.positions.flat().map(z=>z[1]));
      const span=1.15*Math.max(ex[1]-ex[0],ey[1]-ey[0]),cx=(ex[0]+ex[1])/2,cy=(ey[0]+ey[1])/2;
      const xd=[cx-span/2,cx+span/2],yd=[cy-span/2,cy+span/2];
      const f=axis('fluid-cloud',0,xd,yd,'x₁ (continuous)','x₂ (continuous)',false,true);
      f.nodes=[];
      for(let x=Math.ceil((xd[0]-.25)*2)/2+.25;x<xd[1];x+=.5)for(let y=Math.ceil((yd[0]-.25)*2)/2+.25;y<yd[1];y+=.5)f.nodes.push([x,y]);
      f.g.selectAll('path.flow').data(f.nodes).join('path').attr('class','flow').attr('fill','none').attr('stroke',colors.law).attr('stroke-width',1.2).attr('opacity',.7);
      f.g.selectAll('path.particle').data(data.fluid.positions[0]).join('path').attr('class','particle').attr('d','M4,0 L-3,2.3 L-3,-2.3 Z').attr('fill',colors.gb);
      paths.fluid={p:f};drawFluid();
    }
    function fluidState(r,t){
      const i=Math.min(r.times.length-2,Math.max(0,d3.bisectRight(r.times,t)-1));
      const dt=r.times[i+1]-r.times[i],s=(t-r.times[i])/dt;
      const position=r.positions[i].map((z,j)=>z.map((x,k)=>(2*s**3-3*s*s+1)*x+(s**3-2*s*s+s)*dt*r.velocities[i][j][k]+(-2*s**3+3*s*s)*r.positions[i+1][j][k]+(s**3-s*s)*dt*r.velocities[i+1][j][k]));
      const velocity=r.positions[i].map((z,j)=>z.map((x,k)=>(6*s*s-6*s)/dt*x+(3*s*s-4*s+1)*r.velocities[i][j][k]+(-6*s*s+6*s)/dt*r.positions[i+1][j][k]+(3*s*s-2*s)*r.velocities[i+1][j][k]));
      return {position,velocity};
    }
    function drawFluid(){
      const {p}=paths.fluid,t=players.fluid.t,r=data.fluid;
      const {position:pos,velocity}=fluidState(r,t),field=snapshots(r,t,'field');
      p.g.selectAll('path.particle').data(pos).attr('transform',(z,j)=>`translate(${p.x(z[0])},${p.y(z[1])}) rotate(${-Math.atan2(velocity[j][1],velocity[j][0])*180/Math.PI})`);
      const flow=p.nodes.map(z=>{const q=z.map(v=>((v%1+1)%1)*6),ix=q.map(Math.floor),s=q.map((v,k)=>v-ix[k]);return [0,1].map(k=>[0,1].reduce((sum,a)=>sum+[0,1].reduce((part,b)=>part+(a?s[0]:1-s[0])*(b?s[1]:1-s[1])*field[((ix[0]+a)%6)*6+(ix[1]+b)%6][k],0),0));});
      p.g.selectAll('path.flow').data(flow).attr('d',v=>{const l=Math.max(.3,p.pw*.2*Math.hypot(...v)/(p.x.domain()[1]-p.x.domain()[0])),head=Math.min(3,l*.5);return `M0,0 L${l},0 M${l-head},${-head*.65} L${l},0 L${l-head},${head*.65}`;}).attr('transform',(v,j)=>`translate(${p.x(p.nodes[j][0])},${p.y(p.nodes[j][1])}) rotate(${-Math.atan2(v[1],v[0])*180/Math.PI})`);
    }
    function makeSmodel(){
      ['cs','adaptive'].forEach(key=>{
        const p=axis('smodel-'+key,0,[0,1],[0,1],'x₁','x₂',false,true);
        p.g.selectAll('path.agent').data(data.smodel.positions[0]).join('path').attr('class','agent')
          .attr('d','M5,0 L-3.5,2.7 L-2,0 L-3.5,-2.7 Z')
          .attr('fill',(z,j)=>j<data.smodel.nHeavy?colors.ink:'var(--page)')
          .attr('stroke',(z,j)=>j<data.smodel.nHeavy?colors.ink:colors.gb).attr('stroke-width',1.2)
          .attr('opacity',(z,j)=>j<data.smodel.nHeavy?.65:1);
        paths['smodel-'+key]=p;
      });
      drawSmodel();
    }
    function drawSmodel(){
      const r=data.smodel,t=players.smodel.t;
      ['cs','adaptive'].forEach(key=>{
        const p=paths['smodel-'+key];
        const state=fluidState(key==='cs'?{times:r.times,positions:r.csPositions,velocities:r.csVelocities}:r,t);
        p.g.selectAll('path.agent').data(state.position).attr('transform',(z,j)=>`translate(${p.x(z[0])},${p.y(z[1])}) rotate(${-Math.atan2(state.velocity[j][1],state.velocity[j][0])*180/Math.PI})`);
      });
    }
    const draw=key=>({cs:drawCs,svgd:drawSv,fluid:drawFluid,smodel:drawSmodel}[key]());
    const endTime=key=>key==='svgd'?svEnd():data[key].times.at(-1);
    function setCase(){
      data.svgd=data.svgdCases.mode;
      root.querySelector('#energy-scale').value='linear';
      activePlayback='transient';
      const meta=data.svgd.meta;
      root.querySelector('#svgd-methods').innerHTML=meta.methods;
      players.svgd.t=0;players.svgd.playing=false;
      const row=root.querySelector('[data-player="svgd"]');
      row.querySelector('input').max=1;
      icon(row.querySelector('.play'),false);makeSv();update('svgd');
    }
    function icon(button,playing){button.innerHTML='<i class="fa-solid fa-'+(playing?'pause':'play')+'" aria-hidden="true"></i>';button.setAttribute('aria-label',playing?'Pause animation':'Play animation');}
    function update(key){const p=players[key],row=root.querySelector(`[data-player="${key}"]`);row.querySelector('input').value=key==='svgd'?svClock(p.t)/svClock(svEnd()):p.t;row.querySelector('output').textContent=`t = ${formatTime(p.t)}`;draw(key);}
    root.querySelectorAll('[data-player]').forEach(row=>{
      const key=row.dataset.player,p=players[key],input=row.querySelector('input'),button=row.querySelector('.play');
      icon(button,false);
      button.addEventListener('click',()=>{if(p.t>=endTime(key))p.t=key==='svgd'?svStart():0;p.playing=!p.playing;icon(button,p.playing);});
      row.querySelector('.restart').addEventListener('click',()=>{p.t=key==='svgd'?svStart():0;p.playing=false;icon(button,false);update(key);});
      input.addEventListener('input',()=>{p.t=key==='svgd'?svTime(+input.value*svClock(svEnd())):+input.value;p.playing=false;icon(button,false);update(key);});
    });
    let previous=null;
    function frame(now){if(previous!==null){const dt=Math.min(.1,(now-previous)/1000);Object.entries(players).forEach(([key,p])=>{if(p.playing){const max=endTime(key);p.t=key==='svgd'?Math.min(max,svTime(svClock(p.t)+dt)):Math.min(max,p.t+dt*max/p.duration);if(p.t>=max-1e-8){p.t=max;p.playing=false;icon(root.querySelector(`[data-player="${key}"] .play`),false);}update(key);}});}previous=now;requestAnimationFrame(frame);}
    function makeBackgroundPlots(){
      const populations=data.csPopulation;
      const comparison=axis('cs-population',260,[0,d3.max(populations,r=>r.times.at(-1))],[0,d3.max(populations,r=>d3.max(r.diameter))*1.08],'Time t','Diameter Dₙ(t) / r₀');
      populations.forEach((r,i)=>comparison.g.append('path').attr('d',d3.line().x((v,j)=>comparison.x(r.times[j])).y(v=>comparison.y(v))(r.diameter)).attr('fill','none').attr('stroke',[colors.gb,colors.rbf,colors.gray][i]).attr('stroke-width',1.8).attr('stroke-dasharray',[null,'6 3','2 3'][i]));
      const e=data.eigen;
      const density=axis('doublewell-density',190,d3.extent(e.x),[0,d3.max(e.doublewell)*1.12],'x','Density π(x)');
      const eigen=axis('doublewell-eigen',190,d3.extent(e.x),[d3.min(e.phi)*1.15,d3.max(e.phi)*1.15],'x','Eigenfunction φ₁');
      [[density,e.doublewell,colors.gray],[eigen,e.phi,colors.law]].forEach(([p,values,color])=>p.g.append('path').attr('d',d3.line().x((v,i)=>p.x(e.x[i])).y(v=>p.y(v))(values)).attr('fill','none').attr('stroke',color).attr('stroke-width',1.8));
      const relaxation=axis('slow-relaxation',190,[0,30],[0,1.05],'Time t','Relative error');
      const times=d3.range(0,30.001,.1);
      [[e.lambda1,colors.gray,true],[1,colors.law,false]].forEach(([rate,color,dashed])=>relaxation.g.append('path').attr('d',d3.line().x(t=>relaxation.x(t)).y(t=>relaxation.y(Math.exp(-rate*t)))(times)).attr('fill','none').attr('stroke',color).attr('stroke-width',1.8).attr('stroke-dasharray',dashed?'4 3':null));
      const radius=data.cs.radius,range=d3.range(0,3*radius+.1,.1);
      const p=axis('cs-kernels',230,[0,3*radius],[0,.60],'Separation r','Communication φ(r)');
      // Symlog keeps exact zeros while showing the much smaller far-tail scale.
      p.svg.selectAll('*').remove();
      const x=d3.scaleLinear().domain([0,3*radius]).range([p.m.left,p.m.left+p.pw]);
      const y=d3.scaleSymlog().constant(.003).domain([0,.60]).range([p.m.top+p.ph,p.m.top]);
      p.svg.append('rect').attr('x',p.m.left).attr('y',p.m.top).attr('width',p.pw).attr('height',p.ph).attr('fill','none').attr('stroke',colors.rule);
      p.svg.append('g').attr('transform',`translate(0,${p.m.top+p.ph})`).call(d3.axisBottom(x).tickValues([0,radius,2*radius,3*radius]).tickFormat(r=>r===0?'0':r===radius?'r₀':`${r/radius}r₀`));
      p.svg.append('g').attr('transform',`translate(${p.m.left},0)`).call(d3.axisLeft(y).tickValues([0,.01,.1,.55]));
      p.svg.append('text').attr('class','axis-title').attr('data-axis','x').attr('x',p.m.left+p.pw/2).attr('y',p.h-7).attr('text-anchor','middle').text('Separation r');
      p.svg.append('text').attr('class','axis-title').attr('data-axis','y').attr('transform',`translate(16,${p.m.top+p.ph/2}) rotate(-90)`).attr('text-anchor','middle').text('φ(r) (symlog scale)');
      [[.45,false,colors.gray],[.25,false,colors.gb],[.45,true,colors.rbf]].forEach(([beta,degenerate,color])=>{
        const values=range.map(r=>.55*(1+r*r)**(-beta)*(degenerate?-Math.expm1(-((Math.max(0,r-radius)/.35)**2)):1));
        p.svg.append('path').attr('d',d3.line().x((v,i)=>x(range[i])).y(v=>y(v))(values)).attr('fill','none').attr('stroke',color).attr('stroke-width',1.8).attr('stroke-dasharray',beta===.45&&!degenerate?'4 3':null);
      });
      p.svg.append('line').attr('x1',x(radius)).attr('x2',x(radius)).attr('y1',y(0)).attr('y2',y(.6)).attr('stroke',colors.rule).attr('stroke-dasharray','3 3');
      p.svg.append('text').attr('x',x(radius)+5).attr('y',p.m.top+16).text('r₀');
    }
    const observer=new ResizeObserver(()=>{makeCs();makeSv();makeExtras();makeSmodel();makeBackgroundPlots();});observer.observe(root);
    root.addEventListener('toggle',event=>{
      if(event.target.tagName==='DETAILS'&&event.target.open)requestAnimationFrame(()=>{makeCs();makeBackgroundPlots();});
    },true);
    root.querySelector('#energy-scale').addEventListener('change',makeSv);
    function applyPlayback(value){
      if(!['transient','late'].includes(value))return;
      activePlayback=value;
      root.querySelectorAll('[data-playback]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.playback===value)));
      players.svgd.t=svStart();players.svgd.playing=false;
      icon(root.querySelector('[data-player="svgd"] .play'),false);update('svgd');
    }
    root.querySelectorAll('[data-playback]').forEach(button=>button.addEventListener('click',()=>applyPlayback(button.dataset.playback)));
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden)Object.entries(players).forEach(([key,player])=>{
        player.playing=false;icon(root.querySelector('[data-player="'+key+'"] .play'),false);
      });
    });
    makeCs();setCase();makeExtras();makeSmodel();makeBackgroundPlots();requestAnimationFrame(frame);
    root.dataset.ready='true';
  })().catch(error=>{const root=document.getElementById('research-content');root.dataset.error=error.message;const p=document.createElement('p');p.setAttribute('role','alert');p.textContent='The simulations could not initialize: '+error.message;root.prepend(p);});
