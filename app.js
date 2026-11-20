const $ = (s) => document.querySelector(s);
let conferences = [];
const fmt = (iso) => new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short",timeZone:"UTC"}).format(new Date(iso+"Z"));
const allDeadlines = () => conferences.flatMap(c => c.deadlines.map(d => ({...d,conf:c}))).sort((a,b)=>a.deadline.localeCompare(b.deadline));
function daysUntil(date){return Math.ceil((new Date(date+"Z")-new Date())/86400000)}
function initFilters(){
  const tags=[...new Set(conferences.flatMap(c=>c.tags))].sort();
  tags.forEach(t=>$("#tag").add(new Option(t,t)));
  [...new Set(conferences.map(c=>c.year))].sort().forEach(y=>$("#year").add(new Option(y,y)));
}
function render(){
  const q=$("#search").value.toLowerCase(), tag=$("#tag").value, year=$("#year").value, status=$("#status").value;
  const now=new Date().toISOString().slice(0,16);
  const rows=allDeadlines().filter(x=>{
    const c=x.conf, past=x.deadline<now;
    return (!q||[c.name,c.description,c.location,c.acronym,...c.tags].join(" ").toLowerCase().includes(q))
      &&(!tag||c.tags.includes(tag))&&(!year||String(c.year)===year)
      &&(status==="all"||(status==="past"?past:!past));
  });
  $("#heading").textContent=status==="past"?"Past deadlines":status==="all"?"All deadlines":"Upcoming deadlines";
  $("#count").textContent=`${rows.length} deadline${rows.length===1?"":"s"}`;
  $("#list").innerHTML=rows.length?rows.map(x=>{
    const c=x.conf, days=daysUntil(x.deadline), past=days<0;
    const left=past?`${Math.abs(days)} days ago`:days===0?"Due today":`in ${days} days`;
    return `<article class="card ${past?"past":""}">
      <div><a class="name" href="${c.url}" target="_blank" rel="noopener">${esc(c.name)} ↗</a>
      <p class="description">${esc(c.description)}</p>
      <div class="meta"><span>${esc(c.conference_dates)}</span><span>·</span><span>${esc(c.location)}</span>${c.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div></div>
      <div class="deadline"><div class="date">${fmt(x.deadline)}</div><div class="countdown">${left} · Round ${x.round}</div></div>
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
