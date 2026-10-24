(() => {
  const nav=document.querySelector('.research-topic-nav');
  const links=[...nav.querySelectorAll('a')];
  const topics=links.map(link=>document.getElementById(link.hash.slice(1)));
  let queued=false;
  function update(){
    queued=false;
    const threshold=Math.max(nav.getBoundingClientRect().height+20,parseFloat(getComputedStyle(topics[0]).scrollMarginTop)+8);
    let current=0;
    topics.forEach((topic,i)=>{if(topic.getBoundingClientRect().top<=threshold)current=i;});
    links.forEach((link,i)=>{if(i===current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  }
  addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update);}},{passive:true});
  addEventListener('resize',update);
  addEventListener('hashchange',update);
  update();
})();
