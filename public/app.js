let lastCount = null;
async function sync(){
  try{
    const r=await fetch('/api/state?ts='+Date.now(),{cache:'no-store'});
    const s=await r.json();
    const n=Math.max(0,Math.min(400,Number(s.count)||0));
    const left=Math.max(400-n,0),p=Math.min(n/400*100,100);
    if(lastCount!==null && n!==lastCount){
      current.classList.remove('counter-flash'); void current.offsetWidth; current.classList.add('counter-flash');
    }
    lastCount=n;
    current.textContent=n;
    remaining.textContent=left+' SUBS LEFT';
    percent.textContent=p.toFixed(2)+'%';
    progress.style.width=p+'%';
    status.textContent=n>=400?'COMPLETE':'IN PROGRESS';
    updated.textContent='['+new Date().toLocaleTimeString()+'] LIVE SIGNAL';
    if(n>=400) celebrate.classList.remove('hidden'); else celebrate.classList.add('hidden');
  }catch(e){status.textContent='SIGNAL LOST'}
}
setInterval(()=>clock.textContent=new Date().toISOString().slice(11,19)+' UTC',1000);
sync();
setInterval(sync,1000);
