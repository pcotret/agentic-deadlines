const $ = (s) => document.querySelector(s);
let conferences = [];
const fmt = (iso) => new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short",timeZone:"UTC"}).format(new Date(iso+"Z"));
const allDeadlines = () => conferences.flatMap(c => c.editions.flatMap(e => e.deadlines.map(d => ({...d,conf:c,edition:e})))).sort((a,b)=>a.deadline.localeCompare(b.deadline));
function daysUntil(value){
  const [year,month,day]=value.slice(0,10).split("-").map(Number), now=new Date();
  return Math.round((Date.UTC(year,month-1,day)-Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()))/86400000);
}
function initFilters(){
  const tags=[...new Set(conferences.flatMap(c=>c.tags))].sort();
  tags.forEach(t=>$("#tag").add(new Option(t,t)));
  [...new Set(conferences.flatMap(c=>c.editions.map(e=>e.year)))].sort().forEach(y=>$("#year").add(new Option(y,y)));
}
function render(){
  const q=$("#search").value.toLowerCase(), tag=$("#tag").value, year=$("#year").value, status=$("#status").value;
  const rows=allDeadlines().filter(x=>{
    const c=x.conf, e=x.edition, past=daysUntil(x.deadline)<0;
    return (!q||[e.name,e.description,e.location,c.acronym,...c.tags].join(" ").toLowerCase().includes(q))
      &&(!tag||c.tags.includes(tag))&&(!year||String(e.year)===year)
      &&(status==="all"||(status==="past"?past:!past));
  });
  $("#heading").textContent=status==="past"?"Past deadlines":status==="all"?"All deadlines":"Upcoming deadlines";
  $("#count").textContent=`${rows.length} deadline${rows.length===1?"":"s"}`;
  $("#list").innerHTML=rows.length?rows.map(x=>{
    const c=x.conf, e=x.edition, days=daysUntil(x.deadline), past=days<0;
    const left=past?`${Math.abs(days)} days ago`:days===0?"Due today":`in ${days} days`;
    const name=e.website?`<a class="name" href="${esc(e.website)}" target="_blank" rel="noopener">${esc(e.name)} ↗</a>`:`<span class="name">${esc(e.name)}</span>`;
    return `<article class="card ${past?"past":""}">
      <div>${name}
      <p class="description">${esc(e.description)}</p>
      <div class="meta"><span>${esc(e.conference_dates)}</span><span>·</span><span>${esc(e.location)}</span>${c.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div></div>
      <div class="deadline"><div class="date">${fmt(x.deadline)} (${esc(x.timezone)})</div><div class="countdown">${left} · Round ${x.round}${x.kind==="submission"?"":` · ${esc(x.kind)}`}</div></div>
    </article>`;
  }).join(""):`<div class="empty">No matching deadlines. Try another filter.</div>`;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
fetch("data/conferences.json").then(r=>r.json()).then(data=>{
  conferences=data.conferences; initFilters();
  const count=allDeadlines().length;
  $("#stats").innerHTML=`<div class="stat"><strong>${conferences.length}</strong><span>conferences</span></div><div class="stat"><strong>${count}</strong><span>submission rounds</span></div><div class="stat"><strong>${new Set(conferences.flatMap(c=>c.tags)).size}</strong><span>topics</span></div>`;
  ["search","tag","year","status"].forEach(id=>$("#"+id).addEventListener("input",render));
  render();
}).catch(()=>{$("#list").innerHTML='<div class="empty">Could not load data/conferences.json.</div>';});
