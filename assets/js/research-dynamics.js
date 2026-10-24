/* Standard finite-particle updates used by the homepage demonstrations. */
(() => {
  'use strict';
  const gaussian = random => Math.sqrt(-2 * Math.log(Math.max(random(), 1e-12))) * Math.cos(2 * Math.PI * random());
  function samplingInitial(random, n = 64) {
    return Array.from({length:n}, () => ({x:.65*gaussian(random), y:.65*gaussian(random)}));
  }
  function samplingStep(particles, step = .035) {
    // Equal mixture N((-1.7,0), .55² I) + N((1.7,0), .55² I).
    // phi(x_i) = mean_j [k(x_j,x_i) score(x_j) + grad_{x_j} k(x_j,x_i)].
    const variance=.55**2, n=particles.length;
    const scores=particles.map(p => {
      const a=-((p.x+1.7)**2+p.y*p.y)/(2*variance);
      const b=-((p.x-1.7)**2+p.y*p.y)/(2*variance);
      const m=Math.max(a,b), left=Math.exp(a-m)/(Math.exp(a-m)+Math.exp(b-m));
      return {x:(-1.7*left+1.7*(1-left)-p.x)/variance,y:-p.y/variance};
    });
    const distances=[];
    for(let i=0;i<n;i++) for(let j=i+1;j<n;j++) distances.push((particles[i].x-particles[j].x)**2+(particles[i].y-particles[j].y)**2);
    distances.sort((a,b)=>a-b);
    // RBF k=exp(-distance² / h), with the usual median heuristic.
    const h=Math.max(distances[Math.floor(distances.length/2)]/Math.log(n+1), .05);
    const velocities=particles.map(p=>{
      let x=0,y=0;
      particles.forEach((q,j)=>{const dx=p.x-q.x,dy=p.y-q.y,k=Math.exp(-(dx*dx+dy*dy)/h);x+=k*(scores[j].x+2*dx/h);y+=k*(scores[j].y+2*dy/h);});
      return {x:x/n,y:y/n};
    });
    let speed=0;
    particles.forEach((p,i)=>{p.x+=step*velocities[i].x;p.y+=step*velocities[i].y;speed=Math.max(speed,Math.hypot(velocities[i].x,velocities[i].y));});
    return speed;
  }
  function flockInitial(random, n = 24) {
    const ps=Array.from({length:n},()=>({x:.20+random()*.34,y:.25+random()*.5,vx:(random()-.5)*.3,vy:(random()-.5)*.3}));
    const mx=ps.reduce((s,p)=>s+p.vx,0)/n,my=ps.reduce((s,p)=>s+p.vy,0)/n;
    ps.forEach(p=>{p.vx+=.075-mx;p.vy-=my;});return ps;
  }
  function flockStep(ps,dt) {
    const forces=ps.map(p=>{let x=0,y=0;ps.forEach(q=>{const a=1.8/Math.sqrt(1+(p.x-q.x)**2+(p.y-q.y)**2);x+=a*(q.vx-p.vx);y+=a*(q.vy-p.vy);});return {x:x/ps.length,y:y/ps.length};});
    ps.forEach((p,i)=>{p.vx+=forces[i].x*dt;p.vy+=forces[i].y*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;});
  }
  const api={samplingInitial,samplingStep,flockInitial,flockStep};
  if(typeof module!=='undefined') module.exports=api;
  else window.ResearchDynamics=api;
})();
